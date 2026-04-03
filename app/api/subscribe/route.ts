import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { sendSampleNewsletterEmail } from '@/lib/email/sendSampleNewsletterEmail'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: existingParent, error: parentLookupError } = await supabaseAdmin
      .from('parents')
      .select('id,subscriber_state')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (parentLookupError) {
      console.error('Unable to check existing subscriber record:', parentLookupError)
      return NextResponse.json({ error: 'Something went wrong. Try again!' }, { status: 500 })
    }

    if (existingParent) {
      return NextResponse.json(
        {
          error:
            existingParent.subscriber_state === 'active'
              ? 'You are already subscribed with this email.'
              : 'You are already in our system with this email.',
        },
        { status: 409 }
      )
    }

    const { error: parentInsertError } = await supabaseAdmin.from('parents').insert({
      email: normalizedEmail,
      subscriber_state: 'potential',
      marketing_source: 'landing_page',
      sample_requested_at: new Date().toISOString(),
    })

    if (parentInsertError) {
      console.error('Unable to create potential subscriber record:', parentInsertError)
      return NextResponse.json({ error: 'Something went wrong. Try again!' }, { status: 500 })
    }

    try {
      await sendSampleNewsletterEmail(normalizedEmail)
      return NextResponse.json({ success: true, sampleEmailSent: true })
    } catch (sampleEmailErr) {
      console.error('Sample newsletter email send failed:', sampleEmailErr)
      // Do not block capture if email service is temporarily unavailable.
      return NextResponse.json({ success: true, sampleEmailSent: false })
    }
  } catch (err) {
    console.error('Subscribe endpoint failed:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
