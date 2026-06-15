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

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const CDN_CACHE_SECONDS = 24 * 60 * 60
const BROWSER_CACHE_SECONDS = 60 * 60
const ERROR_CACHE_SECONDS = 5 * 60

type PricingRow = typeof FALLBACK_PRICING

type PricingResponse = {
  countryCode: string
  countryName: string
  currencyCode: string
  currencySymbol: string
  monthlyPrice: number
  yearlyPrice: number
  monthlyDisplay: string
  yearlyDisplay: string
  fallbackUsed: boolean
}

const pricingCache = new Map<string, { expiresAt: number; response: PricingResponse }>()

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
  const countryCode = (
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('cf-ipcountry') ||
    req.headers.get('x-country-code') ||
    'US'
  ).trim().toUpperCase()

  return /^[A-Z]{2}$/.test(countryCode) ? countryCode : 'US'
}

function buildPricingResponse(row: PricingRow, fallbackUsed: boolean): PricingResponse {
  return {
    countryCode: row.country_code,
    countryName: row.country_name,
    currencyCode: row.currency_code,
    currencySymbol: row.currency_symbol,
    monthlyPrice: Number(row.monthly_price),
    yearlyPrice: Number(row.yearly_price),
    monthlyDisplay: formatCurrency(Number(row.monthly_price), row.currency_code),
    yearlyDisplay: formatCurrency(Number(row.yearly_price), row.currency_code),
    fallbackUsed,
  }
}

function jsonWithCache(response: PricingResponse, cacheSeconds = CDN_CACHE_SECONDS) {
  return NextResponse.json(response, {
    headers: {
      'Cache-Control': `public, max-age=${BROWSER_CACHE_SECONDS}, s-maxage=${cacheSeconds}, stale-while-revalidate=${CDN_CACHE_SECONDS * 7}`,
      Vary: 'x-vercel-ip-country, cf-ipcountry, x-country-code',
    },
  })
}

export async function GET(req: NextRequest) {
  const countryCode = detectCountryCode(req)
  const now = Date.now()
  const cached = pricingCache.get(countryCode)

  if (cached && cached.expiresAt > now) {
    return jsonWithCache(cached.response)
  }

  try {
    const { data } = await supabase
      .from('country_pricing')
      .select('country_code, country_name, currency_code, currency_symbol, monthly_price, yearly_price, is_active')
      .eq('country_code', countryCode)
      .eq('is_active', true)
      .maybeSingle()

    const row = data || FALLBACK_PRICING
    const response = buildPricingResponse(row, !data)

    pricingCache.set(countryCode, { expiresAt: now + CACHE_TTL_MS, response })

    return jsonWithCache(response)
  } catch {
    return jsonWithCache(buildPricingResponse(FALLBACK_PRICING, true), ERROR_CACHE_SECONDS)
  }
}
