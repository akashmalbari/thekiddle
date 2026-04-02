import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const paidStatuses = new Set(['active', 'trialing'])

export async function markParentBillingState(parentId: string, status: string, countryCode?: string) {
  const isPaid = paidStatuses.has(status)
  const supabaseAdmin = getSupabaseAdmin()

  const { error } = await supabaseAdmin
    .from('parents')
    .update({
      access_tier: isPaid ? 'paid' : 'free',
      subscription_status: status,
      billing_country_code: countryCode || null,
    })
    .eq('id', parentId)

  if (error) {
    throw new Error(`Failed to update parent billing state: ${error.message}`)
  }
}
