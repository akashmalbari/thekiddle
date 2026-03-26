import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/serverAdminAuth'

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
    .select('id,title,subject,pdf_path,status')
    .eq('id', newsletterId)
    .maybeSingle()

  if (newsletterError || !newsletter || !newsletter.pdf_path) {
    return NextResponse.json({ error: 'Newsletter not found or missing PDF' }, { status: 404 })
  }

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

  const { data: subscribers, error: subscribersError } = await supabaseAdmin
    .from('parents')
    .select('id,email')
    .not('email', 'is', null)

  if (subscribersError) {
    await supabaseAdmin.from('newsletters').update({ status: 'failed', send_error: subscribersError.message }).eq('id', newsletterId)
    return NextResponse.json({ error: 'Unable to fetch subscribers' }, { status: 500 })
  }

  const uniqueEmails = Array.from(new Set((subscribers || []).map((s: any) => s.email).filter(Boolean)))

  let sentCount = 0
  let failedCount = 0

  for (const email of uniqueEmails) {
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#222;">
          <h2>${newsletter.title}</h2>
          <p>Hi there,</p>
          <p>Your latest The Kiddle newsletter is ready.</p>
          <p><a href="${signed.signedUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#FFD166;color:#1A1208;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:700;">Open Newsletter PDF</a></p>
          <p>Enjoy!<br/>The Kiddle Team</p>
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
          subject: newsletter.subject,
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
          error_message: resendJson?.message || 'Send failed',
        })
      } else {
        sentCount += 1
        await supabaseAdmin.from('newsletter_send_logs').insert({
          newsletter_id: newsletterId,
          subscriber_email: email,
          status: 'sent',
          provider_message_id: resendJson?.id || null,
        })
      }
    } catch (err: any) {
      failedCount += 1
      await supabaseAdmin.from('newsletter_send_logs').insert({
        newsletter_id: newsletterId,
        subscriber_email: email,
        status: 'failed',
        error_message: err?.message || 'Unexpected send error',
      })
    }
  }

  await supabaseAdmin
    .from('newsletters')
    .update({
      status: failedCount > 0 ? 'failed' : 'sent',
      recipient_count: uniqueEmails.length,
      sent_count: sentCount,
      failed_count: failedCount,
      sent_at: sentCount > 0 ? new Date().toISOString() : null,
      send_error: failedCount > 0 ? 'Some sends failed. Check logs.' : null,
    })
    .eq('id', newsletterId)

  return NextResponse.json({
    success: true,
    recipientCount: uniqueEmails.length,
    sentCount,
    failedCount,
  })
}
