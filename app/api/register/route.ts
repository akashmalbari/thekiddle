import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { parentName, email, childName, childAge, plan } = await req.json()

    if (!parentName || !email || !email.includes('@')) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Upsert parent
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .upsert(
        { name: parentName, parent_name: parentName, email },
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

    // Insert child if provided
    if (childName && childAge && parent?.id) {
      await supabase.from('children').insert({
        parent_id: parent.id,
        name: childName,
        age_value: parseInt(childAge),
        age_unit: 'years',
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
