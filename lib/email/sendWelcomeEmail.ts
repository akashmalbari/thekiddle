import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const BUCKET = 'newsletters'
const RESEND_API_URL = 'https://api.resend.com/emails'

export async function sendWelcomeEmail(recipientEmail: string) {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL

  if (!resendApiKey || !fromEmail) {
    throw new Error('Missing RESEND_API_KEY or NEWSLETTER_FROM_EMAIL')
  }

  const supabaseAdmin = getSupabaseAdmin()

  const { data: files, error: listError } = await supabaseAdmin.storage
    .from(BUCKET)
    .list('', { limit: 100, sortBy: { column: 'name', order: 'asc' } })

  if (listError) {
    throw new Error(`Unable to list welcome edition PDF: ${listError.message}`)
  }

  const firstPdf = (files || []).find((file) => file.name?.toLowerCase().endsWith('.pdf'))

  if (!firstPdf?.name) {
    throw new Error('No free edition PDF found in storage')
  }

  const { data: signed, error: signedError } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(firstPdf.name, 60 * 60 * 24 * 14)

  if (signedError || !signed?.signedUrl) {
    throw new Error('Unable to generate signed URL for free edition PDF')
  }

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#222;">
      <p>Hello,</p>
      <p>We are so glad you’re here.</p>
      <p>You are now part of a journey focused on raising curious, confident young minds. As we step into the era of Gen Alpha and beyond, it’s not just kids who grow—we as parents grow with them. The Kiddle is our way of making that journey intentional, joyful, and meaningful.</p>
      <p>If you missed it, here’s your first free edition to get started</p>
      <p>
        <a href="${signed.signedUrl}" target="_blank" rel="noopener noreferrer"
           style="display:inline-block;background:#FFD166;color:#1A1208;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:700;">
           Open First Free Edition
        </a>
      </p>
      <p>And if you love what you see, share it with your Kiddler’s friends—let’s bring more families along on this journey.</p>
      <p>Here’s to many curious weeks ahead ✨</p>
      <p>Warmly,<br/>The Kiddle Team</p>
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
      to: [recipientEmail],
      subject: 'Welcome to The Kiddle ✨',
      html,
    }),
  })

  const resendJson = await resendRes.json()

  if (!resendRes.ok) {
    throw new Error(resendJson?.message || 'Failed to send welcome email')
  }

  return resendJson
}
