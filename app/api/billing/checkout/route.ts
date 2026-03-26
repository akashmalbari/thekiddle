import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getStripe } from '@/lib/stripe'

const PRICE_BY_PLAN: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY_USD,
  yearly: process.env.STRIPE_PRICE_YEARLY_USD,
}

function getAppUrl(req: NextRequest) {
  if (process.env.APP_URL) return process.env.APP_URL

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') || 'https'

  if (host) return `${proto}://${host}`

  return 'http://localhost:3000'
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  const stripe = getStripe()
  const appUrl = getAppUrl(req)
  try {
    const { parentName, email, childName, childAge, plan } = await req.json()

    if (!parentName || !email || !email.includes('@')) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const selectedPlan = plan === 'yearly' ? 'yearly' : 'monthly'
    const stripePriceId = PRICE_BY_PLAN[selectedPlan]

    if (!stripePriceId) {
      return NextResponse.json({ error: 'Pricing is not configured for this plan yet.' }, { status: 500 })
    }

    const { data: parent, error: parentError } = await supabaseAdmin
      .from('parents')
      .upsert(
        { name: parentName, parent_name: parentName, email },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('id, email')
      .single()

    if (parentError || !parent) {
      return NextResponse.json(
        { error: 'Unable to prepare account. Please try again.' },
        { status: 500 }
      )
    }

    if (childName && childAge && Number.isFinite(Number(childAge))) {
      const age = parseInt(String(childAge), 10)
      if (age > 0) {
        const { data: existingChild } = await supabaseAdmin
          .from('children')
          .select('id')
          .eq('parent_id', parent.id)
          .eq('name', childName)
          .eq('age_value', age)
          .maybeSingle()

        if (!existingChild) {
          await supabaseAdmin.from('children').insert({
            parent_id: parent.id,
            name: childName,
            age_value: age,
            age_unit: 'years',
          })
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: `${appUrl}/register?billing=success`,
      cancel_url: `${appUrl}/register?billing=cancelled`,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      customer_email: parent.email,
      client_reference_id: parent.id,
      metadata: {
        parent_id: parent.id,
        plan: selectedPlan,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Unable to start checkout. Please try again.' }, { status: 500 })
  }
}
