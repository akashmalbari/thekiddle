import type { SupabaseClient } from '@supabase/supabase-js'

export type NewsletterSendSettings = {
  test_mode: boolean
  test_email: string | null
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function parseRecipientEmails(raw: string | null | undefined): string[] {
  if (!raw) return []

  return Array.from(
    new Set(
      raw
        .split(/[;,\n]/)
        .map((email) => email.trim())
        .filter(Boolean)
    )
  )
}

export function getInvalidEmails(emails: string[]): string[] {
  return emails.filter((email) => !EMAIL_REGEX.test(email))
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
