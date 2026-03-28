import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/email/sendWelcomeEmail'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 })
    }

    const { data: existingParent, error: existingLookupError } = await supabase
      .from('parents')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingLookupError) {
      return NextResponse.json({ error: 'Something went wrong. Try again!' }, { status: 500 })
    }

    if (existingParent) {
      return NextResponse.json({ success: true })
    }

    const { error: insertError } = await supabase
      .from('parents')
      .insert({ email: normalizedEmail })

    if (insertError) {
      return NextResponse.json({ error: 'Something went wrong. Try again!' }, { status: 500 })
    }

    try {
      await sendWelcomeEmail(normalizedEmail)
    } catch (welcomeErr) {
      console.error('Welcome email send failed:', welcomeErr)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
