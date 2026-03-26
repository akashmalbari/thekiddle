import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/serverAdminAuth'

const BUCKET = 'newsletters'

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  const { id } = await context.params
  const newsletterId = Number(id)

  if (!Number.isFinite(newsletterId)) {
    return NextResponse.json({ error: 'Invalid newsletter id' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  const { data: newsletter, error: fetchError } = await supabaseAdmin
    .from('newsletters')
    .select('id,title,pdf_path,status')
    .eq('id', newsletterId)
    .maybeSingle()

  if (fetchError || !newsletter) {
    return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 })
  }

  if (newsletter.status === 'sending') {
    return NextResponse.json({ error: 'Cannot delete while newsletter is sending' }, { status: 409 })
  }

  if (newsletter.pdf_path) {
    const { error: storageError } = await supabaseAdmin.storage.from(BUCKET).remove([newsletter.pdf_path])

    if (storageError) {
      return NextResponse.json({ error: `Failed to delete PDF file: ${storageError.message}` }, { status: 500 })
    }
  }

  const { error: deleteError } = await supabaseAdmin
    .from('newsletters')
    .delete()
    .eq('id', newsletterId)

  if (deleteError) {
    console.error('Newsletter DB delete failed after storage delete', {
      newsletter_id: newsletterId,
      error: deleteError.message,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'PDF deleted but database deletion failed. Please contact support.' }, { status: 500 })
  }

  console.log('Newsletter deleted', {
    newsletter_id: newsletterId,
    title: newsletter.title,
    timestamp: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}
