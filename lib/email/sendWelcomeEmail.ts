const RESEND_API_URL = 'https://api.resend.com/emails'

function resolveAppBaseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
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
  const sampleNewsletterUrl = `${appBaseUrl}/TheKiddle_Newsletter.pdf`

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#222;">
      <p>Hello,</p>
      <p>Thanks for requesting a sample from The Kiddle!</p>
      <p>You’re receiving this as a <strong>free sample preview</strong> so you can see what our activity newsletters look like before deciding to subscribe.</p>
      <p>Open your sample newsletter here:</p>
      <p>
        <a href="${sampleNewsletterUrl}" target="_blank" rel="noopener noreferrer"
           style="display:inline-block;background:#FFD166;color:#1A1208;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:700;">
           Open Sample Newsletter
        </a>
      </p>
      <p>If you enjoy it, you can subscribe anytime to receive full weekly editions.</p>
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
      subject: 'Your Free Sample Kiddle Newsletter ✨',
      html,
    }),
  })

  const resendJson = await resendRes.json()

  if (!resendRes.ok) {
    throw new Error(resendJson?.message || 'Failed to send welcome email')
  }

  return resendJson
}
