import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { buildNewsletterDownloadLink } from '@/lib/newsletterDownloadToken'
import { requireAdmin } from '@/lib/serverAdminAuth'

const DEFAULT_EXPIRES_IN_DAYS = 14
const MAX_EXPIRES_IN_DAYS = 45

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  const { id } = await context.params
  const newsletterId = Number(id)

  if (!Number.isFinite(newsletterId)) {
    return NextResponse.json({ error: 'Invalid newsletter id' }, { status: 400 })
  }

  let requestedDays = DEFAULT_EXPIRES_IN_DAYS

  try {
    const body = await req.json()
    requestedDays = Number(body?.expiresInDays || DEFAULT_EXPIRES_IN_DAYS)
  } catch {
    requestedDays = DEFAULT_EXPIRES_IN_DAYS
  }

  const expiresInDays = Math.min(
    MAX_EXPIRES_IN_DAYS,
    Math.max(1, Math.floor(Number.isFinite(requestedDays) ? requestedDays : DEFAULT_EXPIRES_IN_DAYS))
  )

  const supabaseAdmin = getSupabaseAdmin()
  const { data: newsletter, error } = await supabaseAdmin
    .from('newsletters')
    .select('id,title,issue_date,pdf_path')
    .eq('id', newsletterId)
    .maybeSingle()

  if (error || !newsletter?.pdf_path) {
    return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 })
  }

  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
  let url = ''

  try {
    url = buildNewsletterDownloadLink({
      newsletterId: newsletter.id,
      pdfPath: newsletter.pdf_path,
      title: newsletter.title,
      expiresInSeconds: expiresInDays * 24 * 60 * 60,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unable to generate signed link' }, { status: 500 })
  }

  return NextResponse.json({
    url,
    expiresAt,
    expiresInDays,
    newsletter: {
      id: newsletter.id,
      title: newsletter.title,
      issueDate: newsletter.issue_date,
    },
  })
}
