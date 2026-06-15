import crypto from 'node:crypto'
import { resolveAppBaseUrl } from '@/lib/appUrl'

export type NewsletterDownloadTokenPayload = {
  sub?: string
  email?: string
  nid: number
  path: string
  title: string
  purpose: 'newsletter_download'
  exp: number
}

function base64urlEncode(input: string) {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function base64urlDecode(input: string) {
  return Buffer.from(input, 'base64url').toString('utf8')
}

function sign(input: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(input).digest('base64url')
}

function getSecret() {
  const secret = process.env.NEWSLETTER_DOWNLOAD_TOKEN_SECRET || process.env.UNSUBSCRIBE_TOKEN_SECRET
  if (!secret) throw new Error('Missing NEWSLETTER_DOWNLOAD_TOKEN_SECRET or UNSUBSCRIBE_TOKEN_SECRET')
  return secret
}

export function generateNewsletterDownloadToken(payload: NewsletterDownloadTokenPayload) {
  const secret = getSecret()
  const encodedPayload = base64urlEncode(JSON.stringify(payload))
  const signature = sign(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

export function verifyNewsletterDownloadToken(token: string): NewsletterDownloadTokenPayload | null {
  const secret = getSecret()
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSig = sign(encodedPayload, secret)
  const providedSigBuffer = Buffer.from(signature)
  const expectedSigBuffer = Buffer.from(expectedSig)

  if (providedSigBuffer.length !== expectedSigBuffer.length) return null
  if (!crypto.timingSafeEqual(providedSigBuffer, expectedSigBuffer)) return null

  try {
    const payload = JSON.parse(base64urlDecode(encodedPayload)) as NewsletterDownloadTokenPayload
    if (!payload?.nid || !payload?.path || !payload?.title || !payload?.purpose || !payload?.exp) {
      return null
    }

    if (payload.purpose !== 'newsletter_download') return null
    if (payload.exp * 1000 < Date.now()) return null

    return payload
  } catch {
    return null
  }
}

function buildNewsletterDownloadTokenPayload(params: {
  parentId?: string
  email?: string
  newsletterId: number
  pdfPath: string
  title: string
  expiresInSeconds?: number
}): NewsletterDownloadTokenPayload {
  const now = Math.floor(Date.now() / 1000)
  return {
    sub: params.parentId || undefined,
    email: params.email || undefined,
    nid: params.newsletterId,
    path: params.pdfPath,
    title: params.title,
    purpose: 'newsletter_download',
    exp: now + (params.expiresInSeconds || 60 * 60 * 24 * 14),
  }
}

export function buildNewsletterDownloadLink(params: {
  parentId?: string
  email?: string
  newsletterId: number
  pdfPath: string
  title: string
  expiresInSeconds?: number
}) {
  const appBase = resolveAppBaseUrl().replace(/\/$/, '')
  const payload = buildNewsletterDownloadTokenPayload(params)
  const token = generateNewsletterDownloadToken(payload)
  return `${appBase}/newsletter/download?token=${encodeURIComponent(token)}`
}

export function buildNewsletterDownloadFileName(title: string, pdfPath: string) {
  const fallbackName = pdfPath.split('/').pop() || 'kiddle-newsletter.pdf'
  const baseName = title.trim() || fallbackName.replace(/\.pdf$/i, '')
  const safeName = baseName.replace(/[^a-zA-Z0-9._ -]/g, '_').replace(/\s+/g, '_')
  return safeName.toLowerCase().endsWith('.pdf') ? safeName : `${safeName}.pdf`
}
