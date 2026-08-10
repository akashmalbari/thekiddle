import { NextRequest, NextResponse } from 'next/server'
import { getNewsletterSendSettings } from '@/lib/newsletterSettings'
import { requireAdmin } from '@/lib/serverAdminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  try {
    const settings = await getNewsletterSendSettings(getSupabaseAdmin())
    return NextResponse.json({ weekly_cutoff_at: settings.weekly_cutoff_at })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load newsletter send settings'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  let body: { weeklyCutoffAt?: unknown }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body.weeklyCutoffAt !== 'string' || !body.weeklyCutoffAt.trim()) {
    return NextResponse.json({ error: 'A weekly cutoff date is required' }, { status: 400 })
  }

  const cutoff = new Date(body.weeklyCutoffAt)
  if (!Number.isFinite(cutoff.getTime())) {
    return NextResponse.json({ error: 'The weekly cutoff date is invalid' }, { status: 400 })
  }

  if (cutoff.getTime() > Date.now()) {
    return NextResponse.json({ error: 'The weekly cutoff cannot be in the future' }, { status: 400 })
  }

  const cutoffIso = cutoff.toISOString()
  const { data, error } = await getSupabaseAdmin()
    .from('newsletter_settings')
    .upsert({ id: 1, weekly_cutoff_at: cutoffIso }, { onConflict: 'id' })
    .select('weekly_cutoff_at')
    .single()

  if (error) {
    return NextResponse.json({ error: `Failed to save newsletter cutoff: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ weekly_cutoff_at: data.weekly_cutoff_at })
}
