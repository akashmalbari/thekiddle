import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripe() {
  if (stripeClient) return stripeClient

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY')
  }

  stripeClient = new Stripe(stripeSecretKey)

  return stripeClient
}
