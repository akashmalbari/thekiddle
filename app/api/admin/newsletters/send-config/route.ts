import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/serverAdminAuth'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  const testMode = process.env.TEST_MODE === 'true'
  const testEmail = process.env.TEST_EMAIL || ''

  return NextResponse.json({
    testMode,
    testEmail,
  })
}
