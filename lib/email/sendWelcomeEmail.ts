RESEND_API_URL = 'https://api.resend.com/emails'

function normalizeBaseUrl(url: string) {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function resolveAppBaseUrl() {
  const explicit = normalizeBaseUrl(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '')
  if (explicit) return explicit

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export async function sendWelcomeEmail(recipientEmail: string) {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL

  if (!resendApiKey || !fromEmail) {
    throw new Error('Missing RESEND_API_KEY or NEWSLETTER_FROM_EMAIL')
  }

  const appBaseUrl = resolveAppBaseUrl().replace(/\/$/, '')
  const sampleNewsletterUrl = `${appBaseUrl}/sample-newsletter`

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.75; color:#222;">
      <p>Hello,</p>
      <p>We are so glad you’re here.</p>
      <p>
        You are now part of a journey focused on raising curious, confident young minds. As we step
        into the era of Gen Alpha and beyond, it’s not just kids who grow—we as parents grow with
        them. The Kiddle is our way of making that journey intentional, joyful, and meaningful.
      </p>
      <p>If you missed it, here’s your first free edition to get started:</p>
      <p>
        <a href="${sampleNewsletterUrl}" target="_blank" rel="noopener noreferrer"
           style="display:inline-block;background:#FFD166;color:#1A1208;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:700;">
           Open Sample Newsletter
        </a>
      </p>
      <p>
        And if you love what you see, share it with your Kiddler’s friends—let’s bring more families
        along on this journey.
      </p>
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
      subject: 'Welcome to The Kiddle',
      html,
    }),
  })

  const resendJson = await resendRes.json()

  if (!resendRes.ok) {
    throw new Error(resendJson?.message || 'Failed to send welcome email')
  }

  return resendJson
}
