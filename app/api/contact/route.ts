import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !email.includes('@') || !message) {
      return NextResponse.json({ error: 'Please fill all required fields.' }, { status: 400 })
    }

    const { error } = await supabase.from('contact_queries').insert({
      name,
      email,
      subject: subject || null,
      message,
    })

    if (error) {
      return NextResponse.json({ error: 'Unable to submit your message right now.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
