import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { buildUnsubscribeLink } from '@/lib/unsubscribe'

const BUCKET = 'newsletters'
const RESEND_API_URL = 'https://api.resend.com/emails'

type SendNextNewsletterParams = {
  parentId: string
  email: string
  emailTokenVersion?: number | null
}

export async function sendNextNewsletterToParent({
  parentId,
  email,
  emailTokenVersion,
}: SendNextNewsletterParams) {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL

  if (!resendApiKey || !fromEmail) {
    throw new Error('Missing RESEND_API_KEY or NEWSLETTER_FROM_EMAIL')
  }

  const supabaseAdmin = getSupabaseAdmin()

  const { data: minNewsletter, error: minNewsletterError } = await supabaseAdmin
    .from('newsletters')
    .select('id')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (minNewsletterError || !minNewsletter?.id) {
    return { sent: false, reason: 'no_newsletters_available' }
  }

  const { data: lastProgress } = await supabaseAdmin
    .from('parent_newsletter_progress')
    .select('newsletter_id')
    .eq('parent_id', parentId)
    .eq('status', 'SENT')
    .order('newsletter_id', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextNewsletterId = lastProgress?.newsletter_id
    ? Number(lastProgress.newsletter_id) + 1
    : Number(minNewsletter.id)

  const { data: existingProgress } = await supabaseAdmin
    .from('parent_newsletter_progress')
    .select('id,status')
    .eq('parent_id', parentId)
    .eq('newsletter_id', nextNewsletterId)
    .in('status', ['PROCESSING', 'SENT'])
    .limit(1)
    .maybeSingle()

  if (existingProgress?.id) {
    return { sent: false, reason: 'already_sent_or_processing' }
  }

  const { data: newsletter, error: newsletterError } = await supabaseAdmin
    .from('newsletters')
    .select('id,title,pdf_path')
    .eq('id', nextNewsletterId)
    .maybeSingle()

  if (newsletterError || !newsletter?.pdf_path) {
    return { sent: false, reason: 'newsletter_missing_pdf' }
  }

  const { data: signed, error: signedError } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(newsletter.pdf_path, 60 * 60 * 24 * 14)

  if (signedError || !signed?.signedUrl) {
    throw new Error(signedError?.message || 'Unable to create newsletter signed URL')
  }

  const { data: claimedProgress, error: claimError } = await supabaseAdmin
    .from('parent_newsletter_progress')
    .insert({
      parent_id: parentId,
      newsletter_id: nextNewsletterId,
      status: 'PROCESSING',
    })
    .select('id')
    .maybeSingle()

  if (claimError || !claimedProgress?.id) {
    return { sent: false, reason: 'progress_claim_failed' }
  }

  const unsubscribeLink = buildUnsubscribeLink({
    parentId,
    email,
    emailTokenVersion: emailTokenVersion || 1,
  })

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#222;">
      <p>Hi,</p>
      <p>Your new Kiddle edition is ready!</p>
      <p>This week, we’ve put together a set of fun, thoughtful activities designed to spark curiosity, challenge young minds, and create meaningful moments together.</p>
      <p><a href="${signed.signedUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#FFD166;color:#1A1208;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:700;">Open this week’s Kiddle</a></p>
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
      to: [email],
      subject: newsletter.title,
      html,
    }),
  })

  const resendJson = await resendRes.json()

  if (!resendRes.ok) {
    await supabaseAdmin.from('newsletter_send_logs').insert({
      newsletter_id: nextNewsletterId,
      subscriber_email: email,
      status: 'failed',
      error_message: resendJson?.message || 'Send failed',
    })

    await supabaseAdmin
      .from('parent_newsletter_progress')
      .update({ status: 'FAILED', sent_at: new Date().toISOString() })
      .eq('id', claimedProgress.id)

    throw new Error(resendJson?.message || 'Failed to send newsletter email')
  }

  await supabaseAdmin.from('newsletter_send_logs').insert({
    newsletter_id: nextNewsletterId,
    subscriber_email: email,
    status: 'sent',
    provider_message_id: resendJson?.id || null,
  })

  await supabaseAdmin
    .from('parent_newsletter_progress')
    .update({ status: 'SENT', sent_at: new Date().toISOString() })
    .eq('id', claimedProgress.id)

  return { sent: true, newsletterId: nextNewsletterId }
}
