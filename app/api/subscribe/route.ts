import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 })
    }

    const { error } = await supabase
      .from('parents')
      .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true })

    if (error) {
      return NextResponse.json({ error: 'Something went wrong. Try again!' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
