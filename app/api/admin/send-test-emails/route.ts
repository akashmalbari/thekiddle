import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/serverAdminAuth'
import { sendTestEmailsToAllTestParents } from '@/lib/email/sendTestEmailsToAllTestParents'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  try {
    const result = await sendTestEmailsToAllTestParents()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to send test emails' }, { status: 500 })
  }
}
