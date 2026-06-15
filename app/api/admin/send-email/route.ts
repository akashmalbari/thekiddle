import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/serverAdminAuth'

const RESEND_API_URL = 'https://api.resend.com/emails'
const MAX_RECIPIENTS = 50

function parseRecipients(input: unknown) {
  if (Array.isArray(input)) {
    return input
      .flatMap((value) => String(value).split(/[\s,;]+/))
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  }

  return String(input || '')
    .split(/[\s,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderBodyHtml(message: string) {
  return `
    <div style="font-family: Arial, sans-serif; line-height:1.7; color:#222;">
      ${escapeHtml(message)
        .split(/\n{2,}/)
        .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br />')}</p>`)
        .join('')}
    </div>
  `
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL

  if (!resendApiKey || !fromEmail) {
    return NextResponse.json({ error: 'Missing RESEND_API_KEY or NEWSLETTER_FROM_EMAIL' }, { status: 500 })
  }

  try {
    const { recipients, subject, message } = await req.json()
    const parsedRecipients = Array.from(new Set(parseRecipients(recipients)))
    const invalidRecipients = parsedRecipients.filter((email) => !isValidEmail(email))
    const cleanSubject = typeof subject === 'string' ? subject.trim() : ''
    const cleanMessage = typeof message === 'string' ? message.trim() : ''

    if (parsedRecipients.length === 0) {
      return NextResponse.json({ error: 'At least one recipient is required' }, { status: 400 })
    }

    if (parsedRecipients.length > MAX_RECIPIENTS) {
      return NextResponse.json({ error: `Use ${MAX_RECIPIENTS} or fewer recipients at a time` }, { status: 400 })
    }

    if (invalidRecipients.length > 0) {
      return NextResponse.json({ error: `Invalid recipient: ${invalidRecipients[0]}` }, { status: 400 })
    }

    if (!cleanSubject || !cleanMessage) {
      return NextResponse.json({ error: 'Subject and message body are required' }, { status: 400 })
    }

    const providerMessageIds: string[] = []

    for (const recipient of parsedRecipients) {
      const resendRes = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipient],
          subject: cleanSubject,
          text: cleanMessage,
          html: renderBodyHtml(cleanMessage),
        }),
      })

      const resendJson = await resendRes.json()

      if (!resendRes.ok) {
        return NextResponse.json(
          {
            error: resendJson?.message || `Failed to send email to ${recipient}`,
            sentCount: providerMessageIds.length,
          },
          { status: 502 }
        )
      }

      if (resendJson?.id) providerMessageIds.push(resendJson.id)
    }

    return NextResponse.json({
      success: true,
      recipientCount: parsedRecipients.length,
      providerMessageIds,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
  }
}
