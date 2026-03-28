import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { parentName, email, childAge } = await req.json()

    if (!parentName || !email || !email.includes('@')) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .upsert(
        {
          name: parentName,
          parent_name: parentName,
          email,
          subscriber_state: 'active',
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
        },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (parentError) {
      return NextResponse.json(
        { error: 'That email is already registered. Try signing in instead!' },
        { status: 409 }
      )
    }

    if (childAge && parent?.id) {
      const parsedAge = Number(childAge)
      if (Number.isFinite(parsedAge) && parsedAge > 0) {
        await supabase.from('children').insert({
          parent_id: parent.id,
          age_value: parsedAge,
          age_unit: 'years',
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
