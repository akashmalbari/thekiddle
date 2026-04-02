import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const paidStatuses = new Set(['active', 'trialing'])

export async function markParentBillingState(parentId: string, status: string, countryCode?: string) {
  const isPaid = paidStatuses.has(status)
  const supabaseAdmin = getSupabaseAdmin()

  const { data: parent, error: parentLookupError } = await supabaseAdmin
    .from('parents')
    .select('subscribed_at')
    .eq('id', parentId)
    .maybeSingle()

  if (parentLookupError) {
    throw new Error(`Failed to load parent billing state: ${parentLookupError.message}`)
  }

  const nextSubscribedAt = isPaid ? parent?.subscribed_at || new Date().toISOString() : parent?.subscribed_at || null

  const { error } = await supabaseAdmin
    .from('parents')
    .update({
      access_tier: isPaid ? 'paid' : 'free',
      subscription_status: status,
      billing_country_code: countryCode || null,
      subscriber_state: isPaid ? 'active' : 'potential',
      subscribed_at: nextSubscribedAt,
      unsubscribed_at: isPaid ? null : new Date().toISOString(),
    })
    .eq('id', parentId)

  if (error) {
    throw new Error(`Failed to update parent billing state: ${error.message}`)
  }
}
