import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/serverAdminAuth'
import { sendNewslettersToAllEligibleParents } from '@/lib/email/sendNewslettersToAllEligibleParents'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  try {
    const result = await sendNewslettersToAllEligibleParents()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to send newsletters' }, { status: 500 })
  }
}
