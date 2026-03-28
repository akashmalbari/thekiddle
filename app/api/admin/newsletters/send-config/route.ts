import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/serverAdminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getNewsletterSendSettings } from '@/lib/newsletterSettings'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  const supabaseAdmin = getSupabaseAdmin()
  const settings = await getNewsletterSendSettings(supabaseAdmin)

  return NextResponse.json({
    testMode: settings.test_mode,
    testEmail: settings.test_email || '',
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  try {
    const body = await req.json()
    const testMode = !!body.testMode
    const testEmail = typeof body.testEmail === 'string' ? body.testEmail.trim() : ''

    if (testMode && !testEmail) {
      return NextResponse.json({ error: 'Recepient email(s) is required when selected mode is enabled' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from('newsletter_settings')
      .upsert({
        id: 1,
        test_mode: testMode,
        test_email: testEmail || null,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
