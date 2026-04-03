import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getStripe } from '@/lib/stripe'
import { getAppUrlFromRequest } from '@/lib/appUrl'

const PRICE_BY_PLAN: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY_USD,
  yearly: process.env.STRIPE_PRICE_YEARLY_USD,
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  const stripe = getStripe()
  const appUrl = getAppUrlFromRequest(req)
  try {
    const { parentName, email, childAge, plan } = await req.json()
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!parentName || !normalizedEmail || !normalizedEmail.includes('@')) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const selectedPlan = plan === 'yearly' ? 'yearly' : 'monthly'
    const stripePriceId = PRICE_BY_PLAN[selectedPlan]

    if (!stripePriceId) {
      return NextResponse.json({ error: 'Pricing is not configured for this plan yet.' }, { status: 500 })
    }

    const { data: existingParent, error: existingParentError } = await supabaseAdmin
      .from('parents')
      .select('id,email,subscriber_state')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingParentError) {
      return NextResponse.json(
        { error: 'Unable to prepare account. Please try again.' },
        { status: 500 }
      )
    }

    if (existingParent?.subscriber_state === 'active') {
      return NextResponse.json(
        { error: 'This email is already subscribed.' },
        { status: 409 }
      )
    }

    let parent: { id: string; email: string } | null = null

    if (existingParent?.id) {
      const { data: updatedParent, error: updateParentError } = await supabaseAdmin
        .from('parents')
        .update({
          name: parentName,
          parent_name: parentName,
          subscription_intent_at: new Date().toISOString(),
        })
        .eq('id', existingParent.id)
        .select('id,email')
        .single()

      if (updateParentError || !updatedParent) {
        return NextResponse.json(
          { error: 'Unable to prepare account. Please try again.' },
          { status: 500 }
        )
      }

      parent = updatedParent
    } else {
      const { data: insertedParent, error: insertParentError } = await supabaseAdmin
        .from('parents')
        .insert({
          name: parentName,
          parent_name: parentName,
          email: normalizedEmail,
          subscriber_state: 'potential',
          subscription_intent_at: new Date().toISOString(),
        })
        .select('id, email')
        .single()

      if (insertParentError || !insertedParent) {
        return NextResponse.json(
          { error: 'Unable to prepare account. Please try again.' },
          { status: 500 }
        )
      }

      parent = insertedParent
    }

    if (Number.isFinite(Number(childAge))) {
      const age = parseInt(String(childAge), 10)
      if (age > 0) {
        const { data: existingChild } = await supabaseAdmin
          .from('children')
          .select('id')
          .eq('parent_id', parent.id)
          .eq('age_value', age)
          .eq('age_unit', 'years')
          .maybeSingle()

        if (!existingChild) {
          await supabaseAdmin.from('children').insert({
            parent_id: parent.id,
            age_value: age,
            age_unit: 'years',
          })
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: `${appUrl}/register?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/register?billing=cancelled`,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      customer_email: parent.email,
      client_reference_id: parent.id,
      metadata: {
        parent_id: parent.id,
        plan: selectedPlan,
      },
      subscription_data: {
        metadata: {
          parent_id: parent.id,
          plan: selectedPlan,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Unable to start checkout. Please try again.' }, { status: 500 })
  }
}
