import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

function extractSubscriptionPlanCode(subscription: Stripe.Subscription): 'monthly' | 'yearly' {
  const interval = subscription.items.data[0]?.price?.recurring?.interval
  return interval === 'year' ? 'yearly' : 'monthly'
}

async function markParentAccess(parentId: string, status: string, countryCode?: string) {
  const paidStatuses = new Set(['active', 'trialing'])
  const isPaid = paidStatuses.has(status)
  const supabaseAdmin = getSupabaseAdmin()

  await supabaseAdmin
    .from('parents')
    .update({
      access_tier: isPaid ? 'paid' : 'free',
      subscriber_state: isPaid ? 'active' : 'unsubscribed',
      subscribed_at: isPaid ? new Date().toISOString() : null,
      unsubscribed_at: isPaid ? null : new Date().toISOString(),
      subscription_status: status,
      billing_country_code: countryCode || null,
    })
    .eq('id', parentId)
}

async function upsertBillingCustomer(parentId: string, customerId: string, email?: string | null, countryCode?: string | null) {
  const supabaseAdmin = getSupabaseAdmin()

  const { data } = await supabaseAdmin
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

  return data?.id || null
}

async function upsertSubscription(parentId: string, billingCustomerId: number | null, subscription: Stripe.Subscription, countryCode?: string | null) {
  const planCode = extractSubscriptionPlanCode(subscription)
  const amount = (subscription.items.data[0]?.price?.unit_amount || 0) / 100
  const currency = (subscription.currency || 'usd').toUpperCase()
  const supabaseAdmin = getSupabaseAdmin()

  const { data } = await supabaseAdmin
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

  if (data?.id) {
    await supabaseAdmin
      .from('parents')
      .update({ active_subscription_id: data.id, subscription_status: data.status })
      .eq('id', parentId)
  }

  return data?.id || null
}

async function handleEvent(event: Stripe.Event) {
  const supabaseAdmin = getSupabaseAdmin()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const parentId = session.client_reference_id || session.metadata?.parent_id
      if (!parentId) return

      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
      if (!customerId) return

      const billingCustomerId = await upsertBillingCustomer(
        parentId,
        customerId,
        session.customer_details?.email || null,
        session.customer_details?.address?.country || null
      )

      if (session.subscription) {
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
        const stripe = getStripe()
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        await upsertSubscription(parentId, billingCustomerId, subscription, session.customer_details?.address?.country || null)
        await markParentAccess(parentId, subscription.status, session.customer_details?.address?.country || undefined)
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
      if (!customerId) return

      const { data: billingCustomer } = await supabaseAdmin
        .from('billing_customers')
        .select('id,parent_id,country_code')
        .eq('provider', 'stripe')
        .eq('provider_customer_id', customerId)
        .maybeSingle()

      if (!billingCustomer?.parent_id) return

      await upsertSubscription(billingCustomer.parent_id, billingCustomer.id, subscription, billingCustomer.country_code)
      await markParentAccess(billingCustomer.parent_id, subscription.status, billingCustomer.country_code)
      break
    }

    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
      if (!customerId) return

      const { data: billingCustomer } = await supabaseAdmin
        .from('billing_customers')
        .select('parent_id')
        .eq('provider', 'stripe')
        .eq('provider_customer_id', customerId)
        .maybeSingle()

      await supabaseAdmin.from('payment_transactions').insert({
        parent_id: billingCustomer?.parent_id || null,
        provider: 'stripe',
        provider_payment_id: null,
        provider_invoice_id: invoice.id,
        type: 'invoice',
        status: event.type === 'invoice.paid' ? 'paid' : 'failed',
        amount: (invoice.amount_paid || invoice.amount_due || 0) / 100,
        currency_code: (invoice.currency || 'usd').toUpperCase(),
        raw_metadata: invoice as unknown as Record<string, unknown>,
      })
      break
    }

    default:
      break
  }
}

export async function POST(req: NextRequest) {
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
    const supabaseAdmin = getSupabaseAdmin()

    const { data: existing } = await supabaseAdmin
      .from('webhook_events')
      .select('id,processing_status')
      .eq('provider', 'stripe')
      .eq('provider_event_id', event.id)
      .maybeSingle()

    if (existing?.id && existing.processing_status === 'processed') {
      return NextResponse.json({ received: true, duplicate: true })
    }

    if (!existing?.id) {
      await supabaseAdmin.from('webhook_events').insert({
        provider: 'stripe',
        provider_event_id: event.id,
        event_type: event.type,
        payload: event as unknown as Record<string, unknown>,
        processing_status: 'received',
      })
    }

    await handleEvent(event)

    await supabaseAdmin
      .from('webhook_events')
      .update({ processing_status: 'processed', processed_at: new Date().toISOString(), error_message: null })
      .eq('provider', 'stripe')
      .eq('provider_event_id', event.id)

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Stripe webhook error:', err)

    if (err?.message?.includes('No signatures found matching the expected signature')) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
