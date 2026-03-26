import type { SupabaseClient } from '@supabase/supabase-js'

export type NewsletterSendSettings = {
  test_mode: boolean
  test_email: string | null
}

export async function getNewsletterSendSettings(supabaseAdmin: SupabaseClient): Promise<NewsletterSendSettings> {
  const { data } = await supabaseAdmin
    .from('newsletter_settings')
    .select('test_mode,test_email')
    .eq('id', 1)
    .maybeSingle()

  return {
    test_mode: !!data?.test_mode,
    test_email: data?.test_email || null,
  }
}
