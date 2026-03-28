import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { sendWelcomeEmail } from '@/lib/email/sendWelcomeEmail'

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

    const { data: billingCustomer } = await supabaseAdmin
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

    const { data: upsertedSub } = await supabaseAdmin
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

    if (upsertedSub?.id) {
      await supabaseAdmin
        .from('parents')
        .update({ active_subscription_id: upsertedSub.id, subscription_status: upsertedSub.status })
        .eq('id', parentId)
    }

    await markParentAccess(parentId, subscription.status, customerCountry || undefined)

    if (session.customer_details?.email) {
      try {
        await sendWelcomeEmail(session.customer_details.email)
      } catch {
        // keep confirmation successful even if sample email fails
      }
    }

    const { data: parent } = await supabaseAdmin
      .from('parents')
      .select('email,subscriber_state,access_tier,subscription_status,subscribed_at')
      .eq('id', parentId)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      parentId,
      parent,
    })
  } catch (err: any) {
    console.error('Billing confirmation error:', err)
    return NextResponse.json({ error: 'Unable to confirm billing state' }, { status: 500 })
  }
}
