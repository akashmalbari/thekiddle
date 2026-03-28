import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { sendWelcomeEmail } from '@/lib/email/sendWelcomeEmail'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { error: subscriberError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .upsert(
        {
          email: normalizedEmail,
          source: 'landing_page',
          last_sample_sent_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )

    if (subscriberError) {
      console.error('Unable to persist newsletter subscriber:', subscriberError)
      return NextResponse.json({ error: 'Something went wrong. Try again!' }, { status: 500 })
    }

    const { error: parentUpsertError } = await supabaseAdmin
      .from('parents')
      .upsert(
        { email: normalizedEmail },
        { onConflict: 'email', ignoreDuplicates: false }
      )

    if (parentUpsertError) {
      console.error('Unable to upsert parent record:', parentUpsertError)
    }

    try {
      await sendWelcomeEmail(normalizedEmail)
    } catch (welcomeErr) {
      console.error('Welcome email send failed:', welcomeErr)
      return NextResponse.json({ error: 'We saved your email but could not send the sample right now. Please try again in a moment.' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Subscribe endpoint failed:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
