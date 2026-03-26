import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/serverAdminAuth'

const BUCKET = 'newsletters'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  try {
    const form = await req.formData()
    const file = form.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF uploads are allowed' }, { status: 400 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${new Date().toISOString().slice(0, 10)}/${Date.now()}-${safeName}`

    const bytes = await file.arrayBuffer()
    const supabaseAdmin = getSupabaseAdmin()

    let { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, bytes, {
      contentType: 'application/pdf',
      upsert: false,
    })

    if (error?.message?.toLowerCase().includes('bucket not found')) {
      const { error: bucketError } = await supabaseAdmin.storage.createBucket(BUCKET, {
        public: false,
        fileSizeLimit: 15 * 1024 * 1024,
        allowedMimeTypes: ['application/pdf'],
      })

      if (bucketError && !bucketError.message.toLowerCase().includes('already exists')) {
        return NextResponse.json({ error: bucketError.message }, { status: 500 })
      }

      const retry = await supabaseAdmin.storage.from(BUCKET).upload(path, bytes, {
        contentType: 'application/pdf',
        upsert: false,
      })
      error = retry.error
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      bucket: BUCKET,
      path,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type,
    })
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
