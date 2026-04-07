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

  const { error: logsDeleteError } = await supabaseAdmin
    .from('newsletter_send_logs')
    .delete()
    .eq('newsletter_id', newsletterId)

  if (logsDeleteError) {
    return NextResponse.json({ error: `Failed to delete newsletter send logs: ${logsDeleteError.message}` }, { status: 500 })
  }

  const { error: progressDeleteError } = await supabaseAdmin
    .from('parent_newsletter_progress')
    .delete()
    .eq('newsletter_id', newsletterId)

  if (progressDeleteError) {
    return NextResponse.json({ error: `Failed to delete newsletter progress: ${progressDeleteError.message}` }, { status: 500 })
  }

  const { error: deleteError } = await supabaseAdmin
    .from('newsletters')
    .delete()
    .eq('id', newsletterId)

  if (deleteError) {
    return NextResponse.json({ error: `Failed to delete newsletter: ${deleteError.message}` }, { status: 500 })
  }

  if (newsletter.pdf_path) {
    const { error: storageError } = await supabaseAdmin.storage.from(BUCKET).remove([newsletter.pdf_path])

    if (storageError) {
      console.error('Newsletter storage delete failed after database delete', {
        newsletter_id: newsletterId,
        path: newsletter.pdf_path,
        error: storageError.message,
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        warning: `Newsletter deleted, but PDF cleanup failed: ${storageError.message}`,
      })
    }
  }

  console.log('Newsletter deleted', {
    newsletter_id: newsletterId,
    title: newsletter.title,
    timestamp: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}
