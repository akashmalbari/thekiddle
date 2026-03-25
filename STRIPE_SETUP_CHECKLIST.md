# Stripe Setup Checklist (Your Side)

Use this to complete all Stripe dashboard + platform setup before I wire full billing flow.

## 1) Create/prepare Stripe account
- Sign in at https://dashboard.stripe.com
- Confirm account country + business details
- Enable **Test mode** first (toggle in dashboard)

## 2) Create products and prices
Create one product: `The Kiddle Newsletter`.

Then create prices:
- Monthly (recurring every month)
- Yearly (recurring every year)

For now create USD prices matching current plans:
- Monthly: 1.99 USD
- Yearly: 21.99 USD

If you want country-local checkout with Stripe-only later:
- add additional prices in INR, GBP, EUR, AUD, NZD, JPY, etc.

## 3) Collect IDs you will share with me
From Stripe dashboard, copy:
- `price_...` for monthly
- `price_...` for yearly
- (optional later) per-country `price_...` IDs

## 4) Configure webhook endpoint
In Stripe Dashboard:
- Developers → Webhooks → Add endpoint
- Endpoint URL (local via tunnel):
  - `https://<your-ngrok-domain>/api/billing/webhook`
  - or deployed URL: `https://<your-domain>/api/billing/webhook`

Select events (minimum):
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Then copy:
- Webhook signing secret: `whsec_...`

## 5) API keys (Test mode first)
Developers → API keys:
- Publishable key: `pk_test_...`
- Secret key: `sk_test_...`

You should keep these in environment variables only.

## 6) Add env vars to your app
Create/update `.env.local` with:

```env
# existing
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# initial plan mapping
STRIPE_PRICE_MONTHLY_USD=price_...
STRIPE_PRICE_YEARLY_USD=price_...

# app/server
APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=...
```

## 7) Optional (recommended) customer portal
Stripe Dashboard:
- Settings → Billing → Customer portal
- Enable portal and cancellation options

This lets us add a `Manage Billing` button later.

## 8) Local webhook testing
Two options:

### A) Stripe CLI (best)
- Install Stripe CLI
- Login: `stripe login`
- Forward events:
  - `stripe listen --forward-to localhost:3000/api/billing/webhook`

### B) ngrok tunnel
- Start app: `npm run dev`
- Tunnel local 3000
- Use ngrok URL as webhook endpoint in dashboard

## 9) Go-live checklist (later)
- Switch to Live mode keys
- Create live product/prices
- Create live webhook endpoint + `whsec_live`
- Verify taxes/compliance per region

---

## What I need from you to continue coding
Share these values (test mode):
1. `STRIPE_SECRET_KEY` (you can paste masked)
2. `STRIPE_WEBHOOK_SECRET`
3. `STRIPE_PRICE_MONTHLY_USD`
4. `STRIPE_PRICE_YEARLY_USD`
5. `SUPABASE_SERVICE_ROLE_KEY`
6. Whether you want **Stripe-only** now, or Stripe+Razorpay later for India optimization.

---

## Endpoints now implemented in app
- Checkout: `POST /api/billing/checkout`
- Webhook: `POST /api/billing/webhook`

Register flow now redirects to Stripe Checkout using `/api/billing/checkout`.
