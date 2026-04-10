import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { sendWelcomeEmail } from '@/lib/email/sendWelcomeEmail'
import { markParentBillingState } from '@/lib/subscriptionState'

export const runtime = 'nodejs'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

function extractSubscriptionPlanCode(subscription: Stripe.Subscription): 'monthly' | 'yearly' {
  const interval = subscription.items.data[0]?.price?.recurring?.interval
  return interval === 'year' ? 'yearly' : 'monthly'
}


async function upsertBillingCustomer(parentId: string, customerId: string, email?: string | null, countryCode?: string | null) {
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('billing_customers')
    .upsert(
      {
        parent_id: parentId,
        provider: 'stripe',
        provider_customer_id: customerId,
        email_snapshot: email || null,
        country_code: countryCode || null,
      },
      { onConflict: 'parent_id,provider' }
    )
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to upsert billing customer: ${error.message}`)
  }

  return data?.id || null
}

async function upsertSubscription(parentId: string, billingCustomerId: number | null, subscription: Stripe.Subscription, countryCode?: string | null) {
  const planCode = extractSubscriptionPlanCode(subscription)
  const amount = (subscription.items.data[0]?.price?.unit_amount || 0) / 100
  const currency = (subscription.currency || 'usd').toUpperCase()
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(
      {
        parent_id: parentId,
        billing_customer_id: billingCustomerId,
        plan_code: planCode,
        provider: 'stripe',
        provider_subscription_id: subscription.id,
        status: subscription.status,
        country_code: countryCode || null,
        currency_code: currency,
        amount,
        current_period_start: subscription.items.data[0]?.current_period_start
          ? new Date(subscription.items.data[0].current_period_start * 1000).toISOString()
          : null,
        current_period_end: subscription.items.data[0]?.current_period_end
          ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      },
      { onConflict: 'provider,provider_subscription_id' }
    )
    .select('id,status')
    .single()

  if (error) {
    throw new Error(`Failed to upsert subscription: ${error.message}`)
  }

  if (data?.id) {
    const canceledAt = subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null

    const { error: parentUpdateError } = await supabaseAdmin
      .from('parents')
      .update({
        active_subscription_id: data.id,
        subscription_status: data.status,
        unsubscribed_at: canceledAt,
      })
      .eq('id', parentId)

    if (parentUpdateError) {
      throw new Error(`Failed to update parent active subscription: ${parentUpdateError.message}`)
    }
  }

  return data?.id || null
}

function logWebhookDebug(stage: string, payload: Record<string, unknown>) {
  console.log('[billing-webhook]', stage, {
    timestamp: new Date().toISOString(),
    ...payload,
  })
}

function isMissingOrInaccessibleWebhookEventsTableError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err || '')
  return (
    message.includes('relation "webhook_events" does not exist') ||
    message.includes('permission denied for table webhook_events')
  )
}

async function handleEvent(event: Stripe.Event) {
  const supabaseAdmin = getSupabaseAdmin()

  logWebhookDebug('event.received', {
    eventId: event.id,
    eventType: event.type,
  })

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const parentId = session.client_reference_id || session.metadata?.parent_id
      if (!parentId) {
        logWebhookDebug('checkout.session.completed.skipped', {
          reason: 'missing_parent_id',
          eventId: event.id,
        })
        return
      }

      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
      if (!customerId) {
        logWebhookDebug('checkout.session.completed.skipped', {
          reason: 'missing_customer_id',
          eventId: event.id,
          parentId,
        })
        return
      }

      logWebhookDebug('checkout.session.completed.start', {
        eventId: event.id,
        parentId,
        customerId,
        subscriptionId:
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null,
      })

      const checkoutEmail = session.customer_details?.email || null
      const billingCustomerId = await upsertBillingCustomer(
        parentId,
        customerId,
        checkoutEmail,
        session.customer_details?.address?.country || null
      )

      if (session.subscription) {
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
        const stripe = getStripe()
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        await upsertSubscription(parentId, billingCustomerId, subscription, session.customer_details?.address?.country || null)
        await markParentBillingState(parentId, subscription.status, session.customer_details?.address?.country || undefined)

        logWebhookDebug('checkout.session.completed.parent_updated', {
          eventId: event.id,
          parentId,
          subscriptionId,
          subscriptionStatus: subscription.status,
          countryCode: session.customer_details?.address?.country || null,
        })

        // Paid signup should only send the welcome email here.
        // Newsletter issues are sent later via the admin workflow.
        if (checkoutEmail) {
          try {
            await sendWelcomeEmail(checkoutEmail)
            logWebhookDebug('checkout.session.completed.welcome_email_sent', {
              eventId: event.id,
              parentId,
              email: checkoutEmail,
            })
          } catch (welcomeErr: any) {
            // Don't fail webhook processing for ancillary email failure.
            logWebhookDebug('checkout.session.completed.welcome_email_send_failed', {
              eventId: event.id,
              parentId,
              email: checkoutEmail,
              error: welcomeErr?.message || 'unknown_error',
            })
          }
        } else {
          logWebhookDebug('checkout.session.completed.welcome_email_skipped', {
            eventId: event.id,
            parentId,
            reason: 'missing_checkout_email',
          })
        }
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
      if (!customerId) {
        logWebhookDebug('customer.subscription.skipped', {
          reason: 'missing_customer_id',
          eventId: event.id,
          eventType: event.type,
          subscriptionId: subscription.id,
        })
        return
      }

      const { data: billingCustomer } = await supabaseAdmin
        .from('billing_customers')
        .select('id,parent_id,country_code')
        .eq('provider', 'stripe')
        .eq('provider_customer_id', customerId)
        .maybeSingle()

      // Fallback for out-of-order webhook delivery where billing_customers row isn't there yet
      // but checkout already attached parent_id into subscription metadata.
      const metadataParentId = subscription.metadata?.parent_id || null
      const parentId = billingCustomer?.parent_id || metadataParentId
      if (!parentId) {
        logWebhookDebug('customer.subscription.skipped', {
          reason: 'missing_parent_mapping',
          eventId: event.id,
          eventType: event.type,
          subscriptionId: subscription.id,
          customerId,
          hasBillingCustomer: !!billingCustomer,
          metadataParentId,
        })
        return
      }

      logWebhookDebug('customer.subscription.mapping', {
        eventId: event.id,
        eventType: event.type,
        subscriptionId: subscription.id,
        customerId,
        parentId,
        parentIdSource: billingCustomer?.parent_id ? 'billing_customers' : 'subscription.metadata.parent_id',
        billingCustomerId: billingCustomer?.id || null,
      })

      let billingCustomerId = billingCustomer?.id || null
      let countryCode = billingCustomer?.country_code || null

      if (!billingCustomerId) {
        const stripe = getStripe()
        const customer = await stripe.customers.retrieve(customerId)
        logWebhookDebug('customer.subscription.billing_customer_fallback', {
          eventId: event.id,
          subscriptionId: subscription.id,
          customerId,
          parentId,
          usedFallback: true,
        })
        const customerEmail = customer && !('deleted' in customer) ? customer.email : null
        const customerCountry =
          customer && !('deleted' in customer) ? customer.address?.country || null : null

        billingCustomerId = await upsertBillingCustomer(parentId, customerId, customerEmail, customerCountry)
        countryCode = customerCountry
      }

      await upsertSubscription(parentId, billingCustomerId, subscription, countryCode)
      await markParentBillingState(parentId, subscription.status, countryCode || undefined)

      logWebhookDebug('customer.subscription.parent_updated', {
        eventId: event.id,
        eventType: event.type,
        parentId,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        countryCode,
      })
      break
    }

    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const invoiceSubscription = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null })
        .subscription
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
      if (!customerId) {
        logWebhookDebug('invoice.skipped', {
          reason: 'missing_customer_id',
          eventId: event.id,
          eventType: event.type,
          invoiceId: invoice.id,
        })
        return
      }

      const { data: billingCustomer } = await supabaseAdmin
        .from('billing_customers')
        .select('id,parent_id,country_code')
        .eq('provider', 'stripe')
        .eq('provider_customer_id', customerId)
        .maybeSingle()

      let parentId = billingCustomer?.parent_id || null
      let parentIdSource: 'billing_customers' | 'subscription.metadata.parent_id' | 'none' =
        billingCustomer?.parent_id ? 'billing_customers' : 'none'
      let countryCode = billingCustomer?.country_code || null

      let subscriptionId: string | null = null
      if (invoiceSubscription) {
        subscriptionId =
          typeof invoiceSubscription === 'string' ? invoiceSubscription : invoiceSubscription.id
      }

      // Fallback for out-of-order webhook delivery where billing_customers row isn't there yet.
      if (!parentId && subscriptionId) {
        const stripe = getStripe()
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const metadataParentId = subscription.metadata?.parent_id || null

        if (metadataParentId) {
          parentId = metadataParentId
          parentIdSource = 'subscription.metadata.parent_id'
          countryCode = countryCode || invoice.customer_address?.country || null

          if (!billingCustomer?.id) {
            await upsertBillingCustomer(
              parentId,
              customerId,
              invoice.customer_email || null,
              countryCode
            )
          }
        }
      }

      const { error: paymentInsertError } = await supabaseAdmin.from('payment_transactions').insert({
        parent_id: parentId,
        provider: 'stripe',
        provider_payment_id: null,
        provider_invoice_id: invoice.id,
        type: 'invoice',
        status: event.type === 'invoice.paid' ? 'paid' : 'failed',
        amount: (invoice.amount_paid || invoice.amount_due || 0) / 100,
        currency_code: (invoice.currency || 'usd').toUpperCase(),
        raw_metadata: invoice as unknown as Record<string, unknown>,
      })

      if (paymentInsertError) {
        throw new Error(`Failed to insert payment transaction: ${paymentInsertError.message}`)
      }

      logWebhookDebug('invoice.recorded', {
        eventId: event.id,
        eventType: event.type,
        invoiceId: invoice.id,
        customerId,
        parentId,
        parentIdSource,
        hasSubscription: !!invoiceSubscription,
      })

      // Safety net: keep parent access/status in sync even if subscription events arrived out of order.
      if (parentId && subscriptionId) {
        const stripe = getStripe()
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        await markParentBillingState(parentId, subscription.status, countryCode || undefined)

        logWebhookDebug('invoice.parent_updated_via_subscription', {
          eventId: event.id,
          eventType: event.type,
          invoiceId: invoice.id,
          parentId,
          subscriptionId,
          subscriptionStatus: subscription.status,
        })
      }
      break
    }

    default:
      break
  }
}

export async function POST(req: NextRequest) {
  let eventId: string | null = null

  try {
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET' }, { status: 500 })
    }

    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
    }

    const body = await req.text()
    const stripe = getStripe()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    eventId = event.id

    const supabaseAdmin = getSupabaseAdmin()

    let canPersistWebhookEvents = true
    let existing: { id: number; processing_status: string } | null = null

    const lookupResult = await supabaseAdmin
      .from('webhook_events')
      .select('id,processing_status')
      .eq('provider', 'stripe')
      .eq('provider_event_id', event.id)
      .maybeSingle()

    if (lookupResult.error) {
      if (isMissingOrInaccessibleWebhookEventsTableError(lookupResult.error)) {
        canPersistWebhookEvents = false
        logWebhookDebug('webhook_events.disabled', {
          eventId: event.id,
          reason: lookupResult.error.message,
        })
      } else {
        throw new Error(`Failed to lookup webhook_events row: ${lookupResult.error.message}`)
      }
    } else {
      existing = lookupResult.data as { id: number; processing_status: string } | null
    }

    if (existing?.id && existing.processing_status === 'processed') {
      return NextResponse.json({ received: true, duplicate: true })
    }

    if (canPersistWebhookEvents) {
      const upsertReceivedResult = await supabaseAdmin.from('webhook_events').upsert(
        {
          provider: 'stripe',
          provider_event_id: event.id,
          event_type: event.type,
          payload: event as unknown as Record<string, unknown>,
          processing_status: existing?.processing_status === 'failed' ? 'retrying' : 'received',
        },
        { onConflict: 'provider,provider_event_id' }
      )

      if (upsertReceivedResult.error) {
        if (isMissingOrInaccessibleWebhookEventsTableError(upsertReceivedResult.error)) {
          canPersistWebhookEvents = false
          logWebhookDebug('webhook_events.disabled', {
            eventId: event.id,
            reason: upsertReceivedResult.error.message,
          })
        } else {
          throw new Error(`Failed to upsert webhook_events row: ${upsertReceivedResult.error.message}`)
        }
      }
    }

    await handleEvent(event)

    if (canPersistWebhookEvents) {
      const updateResult = await supabaseAdmin
        .from('webhook_events')
        .update({ processing_status: 'processed', processed_at: new Date().toISOString(), error_message: null })
        .eq('provider', 'stripe')
        .eq('provider_event_id', event.id)

      if (updateResult.error) {
        if (isMissingOrInaccessibleWebhookEventsTableError(updateResult.error)) {
          logWebhookDebug('webhook_events.processed_update_skipped', {
            eventId: event.id,
            reason: updateResult.error.message,
          })
        } else {
          throw new Error(`Failed to mark webhook_events as processed: ${updateResult.error.message}`)
        }
      }
    }

    return NextResponse.json({ received: true, webhook_events_persisted: canPersistWebhookEvents })
  } catch (err: any) {
    console.error('Stripe webhook error:', err)

    if (err?.message?.includes('No signatures found matching the expected signature')) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }

    const supabaseAdmin = (() => {
      try {
        return getSupabaseAdmin()
      } catch {
        return null
      }
    })()

    if (supabaseAdmin && eventId) {
      try {
        await supabaseAdmin
          .from('webhook_events')
          .upsert(
            {
              provider: 'stripe',
              provider_event_id: eventId,
              event_type: 'unknown',
              payload: null,
              processing_status: 'failed',
              error_message: err?.message || 'Webhook handler failed',
              processed_at: new Date().toISOString(),
            },
            { onConflict: 'provider,provider_event_id' }
          )
      } catch (logErr: any) {
        console.error('Failed to persist webhook failure state:', logErr?.message || logErr)
      }
    }

    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
