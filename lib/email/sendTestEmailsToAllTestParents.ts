import { resolveAppBaseUrl } from '@/lib/appUrl'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const RESEND_API_URL = 'https://api.resend.com/emails'

type TestParentRow = {
  email: string | null
}

export type SendTestEmailsResult = {
  success: true
  recipient_count: number
  sent_count: number
  failed_count: number
}

export async function sendTestEmailsToAllTestParents(): Promise<SendTestEmailsResult> {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL

  if (!resendApiKey || !fromEmail) {
    throw new Error('Missing RESEND_API_KEY or NEWSLETTER_FROM_EMAIL')
  }

  const appBaseUrl = resolveAppBaseUrl().replace(/\/$/, '')
  const sampleNewsletterUrl = `${appBaseUrl}/sample-newsletter-test`
  const unsubscribeUrl = `${appBaseUrl}/unsubscribe`

  const supabaseAdmin = getSupabaseAdmin()
  const { data: testParents, error: testParentsError } = await supabaseAdmin
    .from('test_parents')
    .select('email')

  if (testParentsError) {
    throw new Error(`Failed to load test recipients: ${testParentsError.message}`)
  }

  const recipientEmails = Array.from(
    new Set(
      ((testParents || []) as TestParentRow[])
        .map((row) => (typeof row.email === 'string' ? row.email.trim().toLowerCase() : ''))
        .filter((email) => !!email && email.includes('@'))
    )
  )

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.75; color:#222;">
      <p>Hi Kiddler Parent,</p>
      <p>This Earth Day, let’s try something different with your child. Tell them they got a message from planet Earth!</p>
      <p>
        <a href="${sampleNewsletterUrl}" target="_blank" rel="noopener noreferrer"
           style="display:inline-block;background:#FFD166;color:#1A1208;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:700;">
           MESSAGE FROM EARTH
        </a>
      </p>
      <p>
        If your child enjoyed this little moment, take a photo and tag
        <a href="https://www.instagram.com/thekiddle_/" target="_blank" style="text-decoration:none;">
          <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png"
               alt="Instagram"
               style="width:16px; height:16px; vertical-align:middle; margin-right:0; border:0; display:inline-block;"><span style="vertical-align:middle;">@thekiddle_</span>
        </a>
        on Instagram! This is exactly what we build at
        <a href="https://www.thekiddle.com/" style="text-decoration:none;">
          The Kiddle
        </a>stories + activities + imagination in one weekly experience.
      </p>
      <p><b>Happy Earth Day</b> 🌍</p>
      <p>Warmly,<br/>The Kiddle Team</p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #eee;" />
      <p style="font-size:12px;color:#6b7280;">
        Prefer fewer emails? <a href="${unsubscribeUrl}">Unsubscribe from emails</a>.
      </p>
    </div>
  `

  let sentCount = 0
  let failedCount = 0

  for (const recipientEmail of recipientEmails) {
    try {
      const resendRes = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipientEmail],
          subject: 'We received a message… from Earth 🌍',
          html,
        }),
      })

      const resendJson = await resendRes.json()

      if (!resendRes.ok) {
        failedCount += 1
        console.error('Failed to send test email:', {
          recipientEmail,
          error: resendJson?.message || 'Failed to send test email',
        })
        continue
      }

      sentCount += 1
    } catch (error: any) {
      failedCount += 1
      console.error('Unexpected test email send error:', {
        recipientEmail,
        error: error?.message || 'Unexpected test email send error',
      })
    }
  }

  return {
    success: true,
    recipient_count: recipientEmails.length,
    sent_count: sentCount,
    failed_count: failedCount,
  }
}
