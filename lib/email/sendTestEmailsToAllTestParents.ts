import { resolveAppBaseUrl } from '@/lib/appUrl'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const RESEND_API_URL = 'https://api.resend.com/emails'
const TEST_NEWSLETTER_FILE = 'Mothers_day_kiddle.pdf'

type TestParentRow = {
  email: string | null
}

type TestNewsletterSendRow = {
  id: string
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
  const batchId = crypto.randomUUID()

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

  let sentCount = 0
  let failedCount = 0

  for (const recipientEmail of recipientEmails) {
    try {
      const { data: sendRow, error: sendRowError } = await supabaseAdmin
        .from('test_newsletter_sends')
        .insert({
          batch_id: batchId,
          recipient_email: recipientEmail,
          newsletter_file: TEST_NEWSLETTER_FILE,
          send_status: 'pending',
        })
        .select('id')
        .maybeSingle()

      if (sendRowError || !(sendRow as TestNewsletterSendRow | null)?.id) {
        failedCount += 1
        console.error('Failed to create test newsletter send row:', {
          recipientEmail,
          error: sendRowError?.message || 'Missing send row id',
        })
        continue
      }

      const trackedSampleNewsletterUrl = `${appBaseUrl}/api/test-newsletter-click/${encodeURIComponent((sendRow as TestNewsletterSendRow).id)}`

      const html = `
        <div style="font-family: Arial, sans-serif; line-height:1.75; color:#222;">
          <p>Hi Mama,</p>
          <p>We made something small for you today— but it might stay with you longer than you expect.</p>
          <p>It’s a tiny activity where your child gets to love you… the way you love them every day.</p>
          <p>Simple. Sweet. And surprisingly deep.</p>
          <p>💛 Try it— it takes under 10 minutes.</p>
          <p><a href="${trackedSampleNewsletterUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#FFD166;color:#1A1208;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:700;">Download your free activity</a></p>
          <p>If it makes you pause even for a second… that’s exactly why we created <a href="https://www.thekiddle.com/" style="text-decoration:none;"> The Kiddle</a>.</p>
          <p style="margin:0;">
            Love,<br/>
            Kiddle<br/>
            <a href="https://www.instagram.com/thekiddle_/" target="_blank" style="text-decoration:none;">
              <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" style="width:16px;height:16px;vertical-align:middle;border:0;display:inline-block;">
              <span style="vertical-align:middle;">@thekiddle_</span>
            </a><br/>
            <a href="https://www.thekiddle.com/" style="text-decoration:none;">The Kiddle</a>
          </p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #eee;" />
          <p style="font-size:12px;color:#6b7280;">Prefer fewer emails? <a href="#">Unsubscribe from emails</a>.</p>
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
          subject: 'This made me tear up (and I didn’t expect it)',
          html,
        }),
      })

      const resendJson = await resendRes.json()

      if (!resendRes.ok) {
        await supabaseAdmin
          .from('test_newsletter_sends')
          .update({
            send_status: 'failed',
            error_message: resendJson?.message || 'Failed to send test email',
          })
          .eq('id', (sendRow as TestNewsletterSendRow).id)

        failedCount += 1
        console.error('Failed to send test email:', {
          recipientEmail,
          error: resendJson?.message || 'Failed to send test email',
        })
        continue
      }

      await supabaseAdmin
        .from('test_newsletter_sends')
        .update({
          send_status: 'sent',
          sent_at: new Date().toISOString(),
          provider_message_id: resendJson?.id || null,
        })
        .eq('id', (sendRow as TestNewsletterSendRow).id)

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
