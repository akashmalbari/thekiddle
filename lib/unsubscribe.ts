import { resolveAppBaseUrl } from '@/lib/appUrl'
import {
  buildUnsubscribeTokenPayload,
  generateUnsubscribeToken,
} from '@/lib/unsubscribeToken'

export function buildUnsubscribeLink(params: {
  parentId: string
  email: string
  emailTokenVersion?: number | null
  subscriptionId?: string | null
}) {
  const appBase = resolveAppBaseUrl().replace(/\/$/, '')
  const payload = buildUnsubscribeTokenPayload({
    parentId: params.parentId,
    email: params.email,
    emailTokenVersion: params.emailTokenVersion || 1,
    subscriptionId: params.subscriptionId,
  })
  const token = generateUnsubscribeToken(payload)
  return `${appBase}/unsubscribe?token=${encodeURIComponent(token)}`
}
