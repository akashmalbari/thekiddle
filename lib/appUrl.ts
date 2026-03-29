import { NextRequest } from 'next/server'

function normalizeBaseUrl(url: string) {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function resolveAppBaseUrl() {
  const explicit = normalizeBaseUrl(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '')
  if (explicit) return explicit

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export function getAppUrlFromRequest(req: NextRequest) {
  if (process.env.APP_URL) return process.env.APP_URL

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') || 'https'

  if (host) return `${proto}://${host}`

  return resolveAppBaseUrl()
}
