import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FALLBACK_PRICING = {
  country_code: 'US',
  country_name: 'United States',
  currency_code: 'USD',
  currency_symbol: '$',
  monthly_price: 1.99,
  yearly_price: 21.99,
}

function formatCurrency(amount: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount)
  } catch {
    return amount.toFixed(2)
  }
}

function detectCountryCode(req: NextRequest) {
  return (
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('cf-ipcountry') ||
    req.headers.get('x-country-code') ||
    'US'
  ).toUpperCase()
}

export async function GET(req: NextRequest) {
  const countryCode = detectCountryCode(req)

  try {
    const { data } = await supabase
      .from('country_pricing')
      .select('country_code, country_name, currency_code, currency_symbol, monthly_price, yearly_price, is_active')
      .eq('country_code', countryCode)
      .eq('is_active', true)
      .maybeSingle()

    const row = data || FALLBACK_PRICING

    return NextResponse.json({
      countryCode: row.country_code,
      countryName: row.country_name,
      currencyCode: row.currency_code,
      currencySymbol: row.currency_symbol,
      monthlyPrice: Number(row.monthly_price),
      yearlyPrice: Number(row.yearly_price),
      monthlyDisplay: formatCurrency(Number(row.monthly_price), row.currency_code),
      yearlyDisplay: formatCurrency(Number(row.yearly_price), row.currency_code),
      fallbackUsed: !data,
    })
  } catch {
    return NextResponse.json({
      countryCode: FALLBACK_PRICING.country_code,
      countryName: FALLBACK_PRICING.country_name,
      currencyCode: FALLBACK_PRICING.currency_code,
      currencySymbol: FALLBACK_PRICING.currency_symbol,
      monthlyPrice: FALLBACK_PRICING.monthly_price,
      yearlyPrice: FALLBACK_PRICING.yearly_price,
      monthlyDisplay: formatCurrency(FALLBACK_PRICING.monthly_price, FALLBACK_PRICING.currency_code),
      yearlyDisplay: formatCurrency(FALLBACK_PRICING.yearly_price, FALLBACK_PRICING.currency_code),
      fallbackUsed: true,
    })
  }
}
