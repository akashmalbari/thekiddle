import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/serverAdminAuth'
import { buildUnsubscribeLink } from '@/lib/unsubscribe'

const BUCKET = 'newsletters'
const RESEND_API_URL = 'https://api.resend.com/emails'

type EligibleParent = {
  id: string
  email: string
  email_token_version?: number | null
}

type NewsletterRecord = {
  id: number
  title: string
  pdf_path: string | null
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  // Keep route param parsing for compatibility with existing /[id]/send endpoint wiring.
  const { id } = await context.params
  const triggerNewsletterId = Number(id)
  if (!Number.isFinite(triggerNewsletterId)) {
    return NextResponse.json({ error: 'Invalid newsletter id' }, { status: 400 })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL

  if (!resendApiKey || !fromEmail) {
    return NextResponse.json({ error: 'Missing RESEND_API_KEY or NEWSLETTER_FROM_EMAIL' }, { status: 500 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  const { data: minNewsletter, error: minNewsletterError } = await supabaseAdmin
    .from('newsletters')
    .select('id')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (minNewsletterError) {
    return NextResponse.json({ error: 'Unable to resolve first newsletter' }, { status: 500 })
  }

  if (!minNewsletter?.id) {
    return NextResponse.json({ error: 'No newsletters found to send' }, { status: 400 })
  }

  const { data: parents, error: parentsError } = await supabaseAdmin
    .from('parents')
    .select('id,email,email_token_version')
    .eq('subscriber_state', 'active')
    .not('email', 'is', null)

  if (parentsError) {
    return NextResponse.json({ error: 'Unable to fetch active subscribers' }, { status: 500 })
  }

  const eligibleParents = Array.from(
    new Map(
      (parents || [])
        .filter((p: any) => p?.email)
        .map((p: any) => [String(p.email).toLowerCase(), p])
    ).values()
  ) as EligibleParent[]

  const dryRun = req.nextUrl.searchParams.get('dryRun') === 'true'
  if (dryRun) {
    return NextResponse.json({
      mode: 'production',
      triggerNewsletterId,
      eligibleParentCount: eligibleParents.length,
      description: 'Each active subscriber will receive their next newsletter in sequence.',
    })
  }

  console.log('Sequential newsletter send started', {
    trigger_newsletter_id: triggerNewsletterId,
    eligible_parent_count: eligibleParents.length,
    timestamp: new Date().toISOString(),
  })

  const newsletterCache = new Map<number, NewsletterRecord | null>()
  const signedUrlCache = new Map<number, string>()

  let sentCount = 0
  let failedCount = 0
  let skippedCount = 0

  for (const parent of eligibleParents) {
    try {
      const { data: lastProgress, error: progressError } = await supabaseAdmin
        .from('parent_newsletter_progress')
        .select('newsletter_id')
        .eq('parent_id', parent.id)
        .eq('status', 'SENT')
        .order('newsletter_id', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (progressError) {
        failedCount += 1
        continue
      }

      const nextNewsletterId = lastProgress?.newsletter_id
        ? Number(lastProgress.newsletter_id) + 1
        : Number(minNewsletter.id)

      if (!Number.isFinite(nextNewsletterId)) {
        skippedCount += 1
        continue
      }

      let newsletter = newsletterCache.get(nextNewsletterId)
      if (typeof newsletter === 'undefined') {
        const { data: fetchedNewsletter, error: newsletterError } = await supabaseAdmin
          .from('newsletters')
          .select('id,title,pdf_path')
          .eq('id', nextNewsletterId)
          .maybeSingle()

        if (newsletterError || !fetchedNewsletter) {
          newsletterCache.set(nextNewsletterId, null)
          skippedCount += 1
          continue
        }

        newsletter = fetchedNewsletter as NewsletterRecord
        newsletterCache.set(nextNewsletterId, newsletter)
      }

      if (!newsletter || !newsletter.pdf_path) {
        skippedCount += 1
        continue
      }

      let signedUrl = signedUrlCache.get(nextNewsletterId)
      if (!signedUrl) {
        const { data: signed, error: signedError } = await supabaseAdmin.storage
          .from(BUCKET)
          .createSignedUrl(newsletter.pdf_path, 60 * 60 * 24 * 14)

        if (signedError || !signed?.signedUrl) {
          failedCount += 1
          continue
        }

        signedUrl = signed.signedUrl
        signedUrlCache.set(nextNewsletterId, signedUrl)
      }

      const { data: claimedProgress, error: claimError } = await supabaseAdmin
        .from('parent_newsletter_progress')
        .insert({
          parent_id: parent.id,
          newsletter_id: nextNewsletterId,
          status: 'PROCESSING',
        })
        .select('id')
        .maybeSingle()

      if (claimError) {
        skippedCount += 1
        continue
      }

      if (!claimedProgress?.id) {
        skippedCount += 1
        continue
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

      const resendRes = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [parent.email],
          subject: newsletter.title,
          html,
        }),
      })

      const resendJson = await resendRes.json()

      if (!resendRes.ok) {
        failedCount += 1
        await supabaseAdmin.from('newsletter_send_logs').insert({
          newsletter_id: nextNewsletterId,
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

      sentCount += 1
      await supabaseAdmin.from('newsletter_send_logs').insert({
        newsletter_id: nextNewsletterId,
        subscriber_email: parent.email,
        status: 'sent',
        provider_message_id: resendJson?.id || null,
      })

      await supabaseAdmin
        .from('parent_newsletter_progress')
        .update({ status: 'SENT', sent_at: new Date().toISOString() })
        .eq('id', claimedProgress.id)
    } catch (err: any) {
      failedCount += 1
      await supabaseAdmin.from('newsletter_send_logs').insert({
        subscriber_email: parent.email,
        status: 'failed',
        error_message: err?.message || 'Unexpected send error',
      })
    }
  }

  console.log('Sequential newsletter send finished', {
    trigger_newsletter_id: triggerNewsletterId,
    eligible_parent_count: eligibleParents.length,
    sent_count: sentCount,
    failed_count: failedCount,
    skipped_count: skippedCount,
    timestamp: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    mode: 'production',
    triggerNewsletterId,
    eligibleParentCount: eligibleParents.length,
    sentCount,
    failedCount,
    skippedCount,
  })
}
