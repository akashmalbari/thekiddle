import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function GET(req: NextRequest, context: { params: Promise<{ sendId: string }> }) {
  const { sendId } = await context.params

  if (!isValidUuid(sendId)) {
    return NextResponse.json({ error: 'Invalid send id' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data: sendRow } = await supabaseAdmin
    .from('test_newsletter_sends')
    .select('id,newsletter_file,first_clicked_at')
    .eq('id', sendId)
    .maybeSingle()

  if (sendRow?.id && !sendRow.first_clicked_at) {
    await supabaseAdmin
      .from('test_newsletter_sends')
      .update({ first_clicked_at: new Date().toISOString() })
      .eq('id', sendId)
      .is('first_clicked_at', null)
  }

  const file =
    typeof sendRow?.newsletter_file === 'string' && sendRow.newsletter_file.trim()
      ? sendRow.newsletter_file
      : 'Mothers_day_kiddle.pdf'

  const redirectUrl = new URL(`/sample-newsletter-test?file=${encodeURIComponent(file)}`, req.url)
  return NextResponse.redirect(redirectUrl)
}
