import type { SupabaseClient } from '@supabase/supabase-js'

export type NewsletterSendSettings = {
  test_mode: boolean
  test_email: string | null
  weekly_cutoff_at: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DEFAULT_WEEKLY_CUTOFF_LOOKBACK_MS = 6 * 24 * 60 * 60 * 1000

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
  const { data, error } = await supabaseAdmin
    .from('newsletter_settings')
    .select('test_mode,test_email,weekly_cutoff_at')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load newsletter settings: ${error.message}`)
  }

  const configuredCutoff = data?.weekly_cutoff_at
  const parsedCutoff = configuredCutoff ? new Date(configuredCutoff) : null

  return {
    test_mode: !!data?.test_mode,
    test_email: data?.test_email || null,
    weekly_cutoff_at:
      parsedCutoff && Number.isFinite(parsedCutoff.getTime())
        ? parsedCutoff.toISOString()
        : new Date(Date.now() - DEFAULT_WEEKLY_CUTOFF_LOOKBACK_MS).toISOString(),
  }
}
