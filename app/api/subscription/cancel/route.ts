import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error:
        'This endpoint has been deprecated. Use the email-link flow at /unsubscribe?token=... to manage unsubscribe or cancellation.',
    },
    { status: 410 }
  )
}
