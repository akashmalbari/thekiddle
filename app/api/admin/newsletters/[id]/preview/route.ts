import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/serverAdminAuth'

const BUCKET = 'newsletters'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  const newsletterId = Number(params.id)
  if (!Number.isFinite(newsletterId)) {
    return NextResponse.json({ error: 'Invalid newsletter id' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data: newsletter, error } = await supabaseAdmin
    .from('newsletters')
    .select('pdf_path')
    .eq('id', newsletterId)
    .maybeSingle()

  if (error || !newsletter?.pdf_path) {
    return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 })
  }

  const { data: signed, error: signedError } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(newsletter.pdf_path, 60 * 15)

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Unable to create preview URL' }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl })
}
