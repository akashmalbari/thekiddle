import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_TEST_NEWSLETTER_FILE = 'My_New_Test_PDF.pdf'

function isValidPublicPdfPath(filePath: string): boolean {
  if (!filePath) return false
  if (filePath.startsWith('/')) return false
  if (filePath.includes('..')) return false
  if (!filePath.toLowerCase().endsWith('.pdf')) return false

  return /^[A-Za-z0-9._/-]+$/.test(filePath)
}

export async function GET(req: NextRequest) {
  // Serve via a stable route for better behavior in mobile email clients.
  // Redirect keeps the newsletter file managed in /public.
  // If a file query param is present, pin this request to that exact file.
  const requestedFile = req.nextUrl.searchParams.get('file')?.trim()

  if (requestedFile && !isValidPublicPdfPath(requestedFile)) {
    return NextResponse.json({ error: 'Invalid newsletter file path.' }, { status: 400 })
  }

  const resolvedFile = requestedFile || DEFAULT_TEST_NEWSLETTER_FILE
  return NextResponse.redirect(new URL(`/${resolvedFile}`, req.url))
}
