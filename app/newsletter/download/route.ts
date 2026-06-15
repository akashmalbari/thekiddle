import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import {
  buildNewsletterDownloadFileName,
  type NewsletterDownloadTokenPayload,
  verifyNewsletterDownloadToken,
} from '@/lib/newsletterDownloadToken'

const BUCKET = 'newsletters'
const RETRY_DELAYS_MS = [250, 750]

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'Unknown download error'
}

function isRetryableStorageError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()
  const statusCode =
    error && typeof error === 'object' && 'statusCode' in error
      ? String(error.statusCode)
      : ''

  return (
    statusCode.startsWith('5') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('fetch failed') ||
    message.includes('temporarily unavailable')
  )
}

async function downloadNewsletterPdf(path: string) {
  const supabaseAdmin = getSupabaseAdmin()
  let lastError: unknown = null

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(path)

    if (data && !error) return data

    lastError = error
    if (!isRetryableStorageError(error) || attempt === RETRY_DELAYS_MS.length) break

    await sleep(RETRY_DELAYS_MS[attempt])
  }

  throw lastError || new Error('Unable to download newsletter')
}

function renderMessage(title: string, message: string, status: number) {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; color: #2C2016; background: #FFF8E1; }
      main { min-height: 100vh; display: grid; place-items: center; padding: 24px; box-sizing: border-box; }
      section { max-width: 520px; background: #fff; border: 1px solid #F0E8D4; border-radius: 16px; padding: 28px; box-shadow: 0 14px 34px rgba(26, 18, 8, 0.08); }
      h1 { margin: 0 0 12px; font-size: 24px; line-height: 1.2; }
      p { margin: 0; font-size: 16px; line-height: 1.6; color: #5f6670; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>${title}</h1>
        <p>${message}</p>
      </section>
    </main>
  </body>
</html>`,
    {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-store',
      },
    }
  )
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  let payload: NewsletterDownloadTokenPayload | null = null

  try {
    payload = token ? verifyNewsletterDownloadToken(token) : null
  } catch (error) {
    console.error('Newsletter download token verification failed', {
      error: getErrorMessage(error),
    })

    return renderMessage(
      'Newsletter temporarily unavailable',
      'Please wait a minute and tap the email link again. If it keeps happening, reply to the email and we will help.',
      503
    )
  }

  if (!payload) {
    return renderMessage(
      'Newsletter link expired',
      'This Kiddle download link is invalid or has expired. Please use the newest email link, or contact us and we will help.',
      410
    )
  }

  try {
    const pdf = await downloadNewsletterPdf(payload.path)
    const fileName = buildNewsletterDownloadFileName(payload.title, payload.path).replace(/"/g, '')

    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('Newsletter download failed', {
      newsletter_id: payload.nid,
      path: payload.path,
      error: getErrorMessage(error),
    })

    return renderMessage(
      'The Kiddle is taking longer than usual to load',
      'Please wait a minute and tap the email link again. If it keeps happening, reply to the email and we will send you the PDF directly.',
      503
    )
  }
}
