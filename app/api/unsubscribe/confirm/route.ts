import { NextRequest, NextResponse } from 'next/server'
import { resolveAppBaseUrl } from '@/lib/appUrl'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { verifyUnsubscribeToken } from '@/lib/unsubscribeToken'
import { getStripe } from '@/lib/stripe'
import { markParentBillingState } from '@/lib/subscriptionState'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    const isFormPost = !contentType.includes('application/json')
    let token: string | undefined
    let action: string | undefined
    let mode: string | undefined
    let reason: string | undefined
    let feedback: string | undefined

    if (contentType.includes('application/json')) {
      const body = await req.json()
      token = body?.token
      action = body?.action
      mode = body?.mode || 'period_end'
      reason = body?.reason
      feedback = body?.feedback
    } else {
      const formData = await req.formData()
      token = String(formData.get('token') || '')
      action = String(formData.get('action') || '')
      mode = String(formData.get('mode') || 'period_end')
      reason = String(formData.get('reason') || '') || undefined
      feedback = String(formData.get('feedback') || '') || undefined
    }

    if (!token || !action) {
      return NextResponse.json({ error: 'Missing token or action' }, { status: 400 })
    }

    const payload = verifyUnsubscribeToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: parent } = await supabaseAdmin
      .from('parents')
      .select('id,email,email_token_version')
      .eq('id', payload.sub)
      .maybeSingle()

    if (!parent || parent.email !== payload.email || (parent.email_token_version || 1) !== payload.ver) {
      return NextResponse.json({ error: 'Token no longer valid' }, { status: 400 })
    }

    if (action === 'email_unsubscribe') {
      await supabaseAdmin
        .from('parents')
        .update({
          marketing_email_opt_in: false,
          marketing_unsubscribed_at: new Date().toISOString(),
          marketing_unsubscribe_source: 'email_link',
        })
        .eq('id', parent.id)

      if (isFormPost) {
        const redirectUrl = new URL('/unsubscribe', resolveAppBaseUrl())
        redirectUrl.searchParams.set('token', token)
        redirectUrl.searchParams.set('status', 'email_unsubscribed')
        return NextResponse.redirect(redirectUrl)
      }

      return NextResponse.json({
        success: true,
        action,
        message: 'You have been unsubscribed from marketing emails.',
      })
    }

    if (action !== 'cancel_subscription') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const stripe = getStripe()
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('id,provider_subscription_id,status,cancel_at_period_end,current_period_end')
      .eq('parent_id', parent.id)
      .eq('provider', 'stripe')
      .order('created_at', { ascending: false })
      .limit(3)

    const target =
      subscriptions?.find((s) => (payload.sid ? String(s.id) === payload.sid : true)) || subscriptions?.[0]

    if (!target) {
      return NextResponse.json({
        success: true,
        action,
        message: 'No active subscription found. Nothing to cancel.',
      })
    }

    if (target.status === 'canceled' || target.cancel_at_period_end) {
      return NextResponse.json({
        success: true,
        action,
        alreadyCanceled: true,
        effective_at: target.current_period_end,
        message: 'Subscription is already canceled or scheduled to cancel.',
      })
    }

    const stripeSubscription =
      mode === 'immediate'
        ? await stripe.subscriptions.cancel(target.provider_subscription_id)
        : await stripe.subscriptions.update(target.provider_subscription_id, {
            cancel_at_period_end: true,
          })

    const currentPeriodEnd = stripeSubscription.items.data[0]?.current_period_end
      ? new Date(stripeSubscription.items.data[0].current_period_end * 1000).toISOString()
      : null

    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: stripeSubscription.status,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        current_period_end: currentPeriodEnd,
        canceled_at: stripeSubscription.canceled_at
          ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
          : null,
        cancel_requested_at: new Date().toISOString(),
        cancel_source: 'email',
        cancel_reason: reason || null,
        cancel_feedback: feedback || null,
      })
      .eq('id', target.id)

    await markParentBillingState(parent.id, stripeSubscription.status)

    if (isFormPost) {
      const redirectUrl = new URL('/unsubscribe', resolveAppBaseUrl())
      redirectUrl.searchParams.set('token', token)
      redirectUrl.searchParams.set(
        'status',
        mode === 'immediate' ? 'subscription_canceled_immediately' : 'subscription_canceled_period_end'
      )
      return NextResponse.redirect(redirectUrl)
    }

    return NextResponse.json({
      success: true,
      action,
      effective_at: currentPeriodEnd,
      message:
        mode === 'immediate'
          ? 'Your subscription has been canceled immediately.'
          : 'Your subscription has been scheduled to cancel at period end.',
      pending_webhook_sync: true,
    })
  } catch (err) {
    console.error('Unsubscribe confirm error:', err)
    return NextResponse.json({ error: 'Unable to process unsubscribe request' }, { status: 500 })
  }
}
