import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { sendWelcomeEmail } from '@/lib/email/sendWelcomeEmail'
import { sendNextNewsletterToParent } from '@/lib/email/sendNextNewsletterToParent'
import { markParentBillingState } from '@/lib/subscriptionState'

function extractSubscriptionPlanCode(subscription: Stripe.Subscription): 'monthly' | 'yearly' {
  const interval = subscription.items.data[0]?.price?.recurring?.interval
  return interval === 'year' ? 'yearly' : 'monthly'
}


export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id')
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    const stripe = getStripe()
    const supabaseAdmin = getSupabaseAdmin()

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
    const subscriptionId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id

    const parentId = session.client_reference_id || session.metadata?.parent_id
    if (!parentId || !customerId || !subscriptionId) {
      return NextResponse.json({ error: 'Session is missing required billing linkage data' }, { status: 400 })
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const customer = await stripe.customers.retrieve(customerId)

    const customerEmail = customer && !('deleted' in customer) ? customer.email : null
    const customerCountry = customer && !('deleted' in customer) ? customer.address?.country || null : null

    const { data: billingCustomer, error: billingCustomerError } = await supabaseAdmin
      .from('billing_customers')
      .upsert(
        {
          parent_id: parentId,
          provider: 'stripe',
          provider_customer_id: customerId,
          email_snapshot: customerEmail,
          country_code: customerCountry,
        },
        { onConflict: 'parent_id,provider' }
      )
      .select('id')
      .single()

    if (billingCustomerError) {
      throw new Error(`Failed to upsert billing customer in confirm route: ${billingCustomerError.message}`)
    }

    const { data: upsertedSub, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .upsert(
        {
          parent_id: parentId,
          billing_customer_id: billingCustomer?.id || null,
          plan_code: extractSubscriptionPlanCode(subscription),
          provider: 'stripe',
          provider_subscription_id: subscription.id,
          status: subscription.status,
          country_code: customerCountry,
          currency_code: (subscription.currency || 'usd').toUpperCase(),
          amount: (subscription.items.data[0]?.price?.unit_amount || 0) / 100,
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

    if (subscriptionError) {
      throw new Error(`Failed to upsert subscription in confirm route: ${subscriptionError.message}`)
    }

    if (upsertedSub?.id) {
      const { error: parentUpdateError } = await supabaseAdmin
        .from('parents')
        .update({ active_subscription_id: upsertedSub.id, subscription_status: upsertedSub.status })
        .eq('id', parentId)

      if (parentUpdateError) {
        throw new Error(`Failed to update parent in confirm route: ${parentUpdateError.message}`)
      }
    }

    await markParentBillingState(parentId, subscription.status, customerCountry || undefined)

    const { data: parent } = await supabaseAdmin
      .from('parents')
      .select('email,email_token_version,marketing_email_opt_in,access_tier,subscription_status')
      .eq('id', parentId)
      .maybeSingle()

    let welcomeDelivery: { status: 'sent' | 'failed' | 'skipped'; reason?: string } = {
      status: 'skipped',
      reason: 'missing_recipient_email',
    }
    let newsletterDelivery:
      | { status: 'sent'; newsletterId?: number }
      | { status: 'failed' | 'skipped'; reason: string } = {
      status: 'skipped',
      reason: 'missing_recipient_email',
    }

    const recipientEmail = session.customer_details?.email || customerEmail || parent?.email || null
    if (recipientEmail) {
      try {
        await sendWelcomeEmail(recipientEmail)
        welcomeDelivery = { status: 'sent' }
      } catch (welcomeErr: any) {
        const reason = welcomeErr?.message || 'unknown_error'
        welcomeDelivery = { status: 'failed', reason }
        console.error('Welcome email send failed in confirm route:', reason)
      }

      try {
        const newsletterResult = await sendNextNewsletterToParent({
          parentId,
          email: recipientEmail,
          emailTokenVersion: parent?.email_token_version || 1,
        })

        if (newsletterResult?.sent) {
          newsletterDelivery = { status: 'sent', newsletterId: newsletterResult.newsletterId }
        } else {
          newsletterDelivery = {
            status: 'skipped',
            reason: newsletterResult?.reason || 'unknown_reason',
          }
          console.log('First newsletter skipped in confirm route:', {
            parentId,
            email: recipientEmail,
            reason: newsletterResult?.reason || 'unknown_reason',
          })
        }
      } catch (newsletterErr: any) {
        const reason = newsletterErr?.message || 'unknown_error'
        newsletterDelivery = { status: 'failed', reason }
        console.error('First newsletter send failed in confirm route:', reason)
      }
    }

    return NextResponse.json({
      success: true,
      parentId,
      parent: parent
        ? {
            email: parent.email,
            marketing_email_opt_in: parent.marketing_email_opt_in,
            access_tier: parent.access_tier,
            subscription_status: parent.subscription_status,
          }
        : null,
      delivery: {
        recipientEmail,
        welcome: welcomeDelivery,
        firstNewsletter: newsletterDelivery,
      },
    })
  } catch (err: any) {
    console.error('Billing confirmation error:', err)
    return NextResponse.json({ error: 'Unable to confirm billing state' }, { status: 500 })
  }
}
