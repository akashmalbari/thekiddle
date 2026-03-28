import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/serverAdminAuth'
import { getInvalidEmails, getNewsletterSendSettings, parseRecipientEmails } from '@/lib/newsletterSettings'

const BUCKET = 'newsletters'
const RESEND_API_URL = 'https://api.resend.com/emails'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  const { id } = await context.params
  const newsletterId = Number(id)
  if (!Number.isFinite(newsletterId)) {
    return NextResponse.json({ error: 'Invalid newsletter id' }, { status: 400 })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL

  if (!resendApiKey || !fromEmail) {
    return NextResponse.json({ error: 'Missing RESEND_API_KEY or NEWSLETTER_FROM_EMAIL' }, { status: 500 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  const { data: newsletter, error: newsletterError } = await supabaseAdmin
    .from('newsletters')
    .select('id,title,pdf_path,status')
    .eq('id', newsletterId)
    .maybeSingle()

  if (newsletterError || !newsletter || !newsletter.pdf_path) {
    return NextResponse.json({ error: 'Newsletter not found or missing PDF' }, { status: 404 })
  }

  const { data: subscribers, error: subscribersError } = await supabaseAdmin
    .from('parents')
    .select('email')
    .eq('subscriber_state', 'active')
    .not('email', 'is', null)

  if (subscribersError) {
    return NextResponse.json({ error: 'Unable to fetch subscribers' }, { status: 500 })
  }

  const productionRecipients = Array.from(new Set((subscribers || []).map((s: any) => s.email).filter(Boolean))) as string[]

  const settings = await getNewsletterSendSettings(supabaseAdmin)
  const testMode = settings.test_mode
  const testEmail = settings.test_email || ''
  const selectedRecipients = parseRecipientEmails(testEmail)

  if (testMode && selectedRecipients.length === 0) {
    return NextResponse.json({ error: 'Selected mode is enabled but recipient email(s) are missing in newsletter settings' }, { status: 500 })
  }

  const invalidSelectedEmails = getInvalidEmails(selectedRecipients)
  if (testMode && invalidSelectedEmails.length > 0) {
    return NextResponse.json(
      { error: `Selected mode has invalid recipient email(s): ${invalidSelectedEmails.join(', ')}` },
      { status: 500 }
    )
  }

  const recipients = testMode ? selectedRecipients : productionRecipients

  const dryRun = req.nextUrl.searchParams.get('dryRun') === 'true'
  if (dryRun) {
    return NextResponse.json({
      mode: testMode ? 'test' : 'production',
      recipientCount: recipients.length,
      newsletterTitle: newsletter.title,
    })
  }

  console.log('Newsletter send started', {
    newsletter_id: newsletterId,
    mode: testMode ? 'test' : 'production',
    recipient_count: recipients.length,
    timestamp: new Date().toISOString(),
  })

  await supabaseAdmin
    .from('newsletters')
    .update({ status: 'sending', send_error: null })
    .eq('id', newsletterId)

  const { data: signed, error: signedError } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(newsletter.pdf_path, 60 * 60 * 24 * 14)

  if (signedError || !signed?.signedUrl) {
    await supabaseAdmin.from('newsletters').update({ status: 'failed', send_error: 'Unable to create signed URL' }).eq('id', newsletterId)
    return NextResponse.json({ error: 'Unable to generate PDF link' }, { status: 500 })
  }

  let sentCount = 0
  let failedCount = 0

  for (const email of recipients) {
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#222;">
          <p>Hi,</p>
          <p>Your new Kiddle edition is ready!</p>
          <p>This week, we’ve put together a set of fun, thoughtful activities designed to spark curiosity, challenge young minds, and create meaningful moments together.</p>
          <p><a href="${signed.signedUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#FFD166;color:#1A1208;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:700;">Open this week’s Kiddle</a></p>
          <p>Take your time with it—there’s no rush. Even 30–40 minutes of focused, joyful engagement can make a big difference.</p>
          <p>See you next week!</p>
          <p>The Kiddle Team</p>
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
          subject: 'This Week’s Kiddle is Here',
          html,
        }),
      })

      const resendJson = await resendRes.json()

      if (!resendRes.ok) {
        failedCount += 1
        await supabaseAdmin.from('newsletter_send_logs').insert({
          newsletter_id: newsletterId,
          subscriber_email: email,
          status: 'failed',
          error_message: `[${testMode ? 'test' : 'production'}] ${resendJson?.message || 'Send failed'}`,
        })
      } else {
        sentCount += 1
        await supabaseAdmin.from('newsletter_send_logs').insert({
          newsletter_id: newsletterId,
          subscriber_email: email,
          status: 'sent',
          provider_message_id: resendJson?.id || null,
          error_message: testMode ? '[test] send successful' : null,
        })
      }
    } catch (err: any) {
      failedCount += 1
      await supabaseAdmin.from('newsletter_send_logs').insert({
        newsletter_id: newsletterId,
        subscriber_email: email,
        status: 'failed',
        error_message: `[${testMode ? 'test' : 'production'}] ${err?.message || 'Unexpected send error'}`,
      })
    }
  }

  await supabaseAdmin
    .from('newsletters')
    .update({
      status: failedCount > 0 ? 'failed' : 'sent',
      recipient_count: recipients.length,
      sent_count: sentCount,
      failed_count: failedCount,
      sent_at: sentCount > 0 ? new Date().toISOString() : null,
      send_error: failedCount > 0 ? 'Some sends failed. Check logs.' : null,
    })
    .eq('id', newsletterId)

  console.log('Newsletter send finished', {
    newsletter_id: newsletterId,
    mode: testMode ? 'test' : 'production',
    recipient_count: recipients.length,
    sent_count: sentCount,
    failed_count: failedCount,
    timestamp: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    mode: testMode ? 'test' : 'production',
    recipientCount: recipients.length,
    sentCount,
    failedCount,
  })
}
