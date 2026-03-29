import crypto from 'node:crypto'

export type UnsubscribeTokenPayload = {
  sub: string
  email: string
  sid?: string
  purpose: 'manage_email_or_subscription'
  ver: number
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
  const secret = process.env.UNSUBSCRIBE_TOKEN_SECRET
  if (!secret) throw new Error('Missing UNSUBSCRIBE_TOKEN_SECRET')
  return secret
}

export function generateUnsubscribeToken(payload: UnsubscribeTokenPayload) {
  const secret = getSecret()
  const encodedPayload = base64urlEncode(JSON.stringify(payload))
  const signature = sign(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

export function verifyUnsubscribeToken(token: string): UnsubscribeTokenPayload | null {
  const secret = getSecret()
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSig = sign(encodedPayload, secret)
  const providedSigBuffer = Buffer.from(signature)
  const expectedSigBuffer = Buffer.from(expectedSig)

  if (providedSigBuffer.length !== expectedSigBuffer.length) {
    return null
  }

  if (!crypto.timingSafeEqual(providedSigBuffer, expectedSigBuffer)) {
    return null
  }

  try {
    const payload = JSON.parse(base64urlDecode(encodedPayload)) as UnsubscribeTokenPayload
    if (!payload?.sub || !payload?.email || !payload?.purpose || !payload?.ver || !payload?.exp) {
      return null
    }

    if (payload.purpose !== 'manage_email_or_subscription') return null
    if (payload.exp * 1000 < Date.now()) return null

    return payload
  } catch {
    return null
  }
}

export function buildUnsubscribeTokenPayload(params: {
  parentId: string
  email: string
  emailTokenVersion: number
  subscriptionId?: string | null
  expiresInSeconds?: number
}): UnsubscribeTokenPayload {
  const now = Math.floor(Date.now() / 1000)
  return {
    sub: params.parentId,
    email: params.email,
    sid: params.subscriptionId || undefined,
    purpose: 'manage_email_or_subscription',
    ver: params.emailTokenVersion,
    exp: now + (params.expiresInSeconds || 60 * 60 * 24 * 45),
  }
}
