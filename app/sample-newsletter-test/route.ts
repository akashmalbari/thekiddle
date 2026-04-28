import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Serve via a stable route for better behavior in mobile email clients.
  // Redirect keeps the newsletter file managed in /public.
  return NextResponse.redirect(new URL('/Mothers_day_kiddle.pdf', req.url))
}
