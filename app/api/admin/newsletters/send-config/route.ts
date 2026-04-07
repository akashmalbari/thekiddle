import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/serverAdminAuth'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  return NextResponse.json(
    { error: 'Send config endpoint removed. Use POST /api/admin/send-newsletters.' },
    { status: 410 }
  )
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  return NextResponse.json(
    { error: 'Send config endpoint removed. Use POST /api/admin/send-newsletters.' },
    { status: 410 }
  )
}
