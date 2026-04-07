import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { buildUnsubscribeLink } from '@/lib/unsubscribe'

const BUCKET = 'newsletters'
const RESEND_API_URL = 'https://api.resend.com/emails'
const BATCH_SIZE = 200

type ParentRow = {
  id: string
  email: string
  email_token_version: number | null
  active_subscription_id: number | null
}

type SubscriptionRow = {
  id: number
  status: string
  cancel_at_period_end: boolean | null
  current_period_end: string | null
}

type NewsletterRow = {
  id: number
  title: string
  pdf_path: string | null
}

type ProgressRow = {
  parent_id: string
  newsletter_id: number
  sent_at: string | null
  status: string | null
}

export type SendNewslettersResult = {
  success: true
  sent_count: number
  skipped_due_to_weekly_limit: number
  skipped_unsubscribed: number
}

export async function sendNewslettersToAllEligibleParents(): Promise<SendNewslettersResult> {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL

  if (!resendApiKey || !fromEmail) {
    throw new Error('Missing RESEND_API_KEY or NEWSLETTER_FROM_EMAIL')
  }

  const supabaseAdmin = getSupabaseAdmin()

  const { data: newsletters, error: newslettersError } = await supabaseAdmin
    .from('newsletters')
    .select('id,title,pdf_path')
    .order('issue_date', { ascending: true })
    .order('id', { ascending: true })

  if (newslettersError) {
    throw new Error(`Failed to load newsletters: ${newslettersError.message}`)
  }

  const orderedNewsletters = (newsletters || []) as NewsletterRow[]
  if (orderedNewsletters.length === 0) {
    return {
      success: true,
      sent_count: 0,
      skipped_due_to_weekly_limit: 0,
      skipped_unsubscribed: 0,
    }
  }

  const newsletterIndexById = new Map<number, number>()
  for (let i = 0; i < orderedNewsletters.length; i += 1) {
    newsletterIndexById.set(orderedNewsletters[i].id, i)
  }

  const signedUrlCache = new Map<number, string>()
  const now = Date.now()
  const weeklyCutoff = new Date(now - 7 * 24 * 60 * 60 * 1000)

  let sentCount = 0
  let skippedWeeklyLimit = 0
  let skippedUnsubscribed = 0

  let page = 0

  while (true) {
    const from = page * BATCH_SIZE
    const to = from + BATCH_SIZE - 1

    const { data: parents, error: parentsError } = await supabaseAdmin
      .from('parents')
      .select('id,email,email_token_version,active_subscription_id')
      .not('email', 'is', null)
      .order('id', { ascending: true })
      .range(from, to)

    if (parentsError) {
      throw new Error(`Failed to load parents: ${parentsError.message}`)
    }

    const parentRows = ((parents || []) as ParentRow[]).filter((p) => !!p.email)
    if (parentRows.length === 0) break

    const subscriptionIds = Array.from(
      new Set(parentRows.map((p) => p.active_subscription_id).filter((id): id is number => Number.isFinite(id as number)))
    )

    const subscriptionsById = new Map<number, SubscriptionRow>()
    if (subscriptionIds.length > 0) {
      const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
        .from('subscriptions')
        .select('id,status,cancel_at_period_end,current_period_end')
        .in('id', subscriptionIds)

      if (subscriptionsError) {
        throw new Error(`Failed to load subscriptions: ${subscriptionsError.message}`)
      }

      for (const row of (subscriptions || []) as SubscriptionRow[]) {
        subscriptionsById.set(row.id, row)
      }
    }

    const parentIds = parentRows.map((p) => p.id)
    const { data: progressRows, error: progressError } = await supabaseAdmin
      .from('parent_newsletter_progress')
      .select('parent_id,newsletter_id,sent_at,status')
      .in('parent_id', parentIds)

    if (progressError) {
      throw new Error(`Failed to load newsletter progress: ${progressError.message}`)
    }

    const progressByParent = new Map<string, ProgressRow[]>()
    for (const row of (progressRows || []) as ProgressRow[]) {
      if (!progressByParent.has(row.parent_id)) progressByParent.set(row.parent_id, [])
      progressByParent.get(row.parent_id)!.push(row)
    }

    for (const parent of parentRows) {
      const subscription = parent.active_subscription_id ? subscriptionsById.get(parent.active_subscription_id) : null
      const isActiveSubscription = !!subscription && ['active', 'trialing'].includes(subscription.status)

      if (!isActiveSubscription) {
        skippedUnsubscribed += 1
        continue
      }

      const endedBecauseCancelAtPeriodEnd =
        !!subscription.cancel_at_period_end &&
        !!subscription.current_period_end &&
        new Date(subscription.current_period_end).getTime() < now

      if (endedBecauseCancelAtPeriodEnd) {
        skippedUnsubscribed += 1
        continue
      }

      const parentProgress = progressByParent.get(parent.id) || []
      const sentProgress = parentProgress.filter((row) => row.status === 'SENT')

      const sentWithinWeek = sentProgress.some((row) => {
        if (!row.sent_at) return false
        return new Date(row.sent_at).getTime() >= weeklyCutoff.getTime()
      })

      if (sentWithinWeek) {
        skippedWeeklyLimit += 1
        continue
      }

      let lastSentIndex = -1
      for (const row of sentProgress) {
        const idx = newsletterIndexById.get(row.newsletter_id)
        if (typeof idx === 'number' && idx > lastSentIndex) {
          lastSentIndex = idx
        }
      }

      const nextNewsletter = orderedNewsletters[lastSentIndex + 1]
      if (!nextNewsletter || !nextNewsletter.pdf_path) {
        continue
      }

      const { data: claimedProgress, error: claimError } = await supabaseAdmin
        .from('parent_newsletter_progress')
        .insert({
          parent_id: parent.id,
          newsletter_id: nextNewsletter.id,
          status: 'PROCESSING',
        })
        .select('id')
        .maybeSingle()

      if (claimError || !claimedProgress?.id) {
        continue
      }

      let signedUrl = signedUrlCache.get(nextNewsletter.id)
      if (!signedUrl) {
        const { data: signed, error: signedError } = await supabaseAdmin.storage
          .from(BUCKET)
          .createSignedUrl(nextNewsletter.pdf_path, 60 * 60 * 24 * 14)

        if (signedError || !signed?.signedUrl) {
          await supabaseAdmin
            .from('parent_newsletter_progress')
            .update({ status: 'FAILED', sent_at: new Date().toISOString() })
            .eq('id', claimedProgress.id)

          continue
        }

        signedUrl = signed.signedUrl
        signedUrlCache.set(nextNewsletter.id, signedUrl)
      }

      const unsubscribeLink = buildUnsubscribeLink({
        parentId: parent.id,
        email: parent.email,
        emailTokenVersion: parent.email_token_version || 1,
      })

      const html = `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#222;">
          <p>Hi,</p>
          <p>Your new Kiddle edition is ready!</p>
          <p>This week, we’ve put together a set of fun, thoughtful activities designed to spark curiosity, challenge young minds, and create meaningful moments together.</p>
          <p><a href="${signedUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#FFD166;color:#1A1208;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:700;">Open this week’s Kiddle</a></p>
          <p>Take your time with it—there’s no rush. Even 30–40 minutes of focused, joyful engagement can make a big difference.</p>
          <p>See you next week!</p>
          <p>The Kiddle Team</p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #eee;" />
          <p style="font-size:12px;color:#6b7280;">
            <a href="${unsubscribeLink}">Unsubscribe from emails</a> · Manage subscription preferences
          </p>
        </div>
      `

      try {
        const resendRes = await fetch(RESEND_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [parent.email],
            subject: nextNewsletter.title,
            html,
          }),
        })

        const resendJson = await resendRes.json()

        if (!resendRes.ok) {
          await supabaseAdmin.from('newsletter_send_logs').insert({
            newsletter_id: nextNewsletter.id,
            subscriber_email: parent.email,
            status: 'failed',
            error_message: resendJson?.message || 'Send failed',
          })

          await supabaseAdmin
            .from('parent_newsletter_progress')
            .update({ status: 'FAILED', sent_at: new Date().toISOString() })
            .eq('id', claimedProgress.id)

          continue
        }

        await supabaseAdmin.from('newsletter_send_logs').insert({
          newsletter_id: nextNewsletter.id,
          subscriber_email: parent.email,
          status: 'sent',
          provider_message_id: resendJson?.id || null,
        })

        await supabaseAdmin
          .from('parent_newsletter_progress')
          .update({ status: 'SENT', sent_at: new Date().toISOString() })
          .eq('id', claimedProgress.id)

        sentCount += 1
      } catch (err: any) {
        await supabaseAdmin.from('newsletter_send_logs').insert({
          newsletter_id: nextNewsletter.id,
          subscriber_email: parent.email,
          status: 'failed',
          error_message: err?.message || 'Unexpected send error',
        })

        await supabaseAdmin
          .from('parent_newsletter_progress')
          .update({ status: 'FAILED', sent_at: new Date().toISOString() })
          .eq('id', claimedProgress.id)
      }
    }

    if (parentRows.length < BATCH_SIZE) break
    page += 1
  }

  return {
    success: true,
    sent_count: sentCount,
    skipped_due_to_weekly_limit: skippedWeeklyLimit,
    skipped_unsubscribed: skippedUnsubscribed,
  }
}
