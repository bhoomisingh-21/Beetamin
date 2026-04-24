import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: Request) {
  let userId: string | null = null
  try {
    userId = (await auth()).userId ?? null
  } catch (e) {
    console.error('[download-report] Clerk auth() failed', e)
    return NextResponse.json(
      { error: 'Sign-in service error. Refresh and try again.', code: 'AUTH_UNAVAILABLE' },
      { status: 503 },
    )
  }

  try {
    const { searchParams } = new URL(req.url)
    const reportId = searchParams.get('reportId')?.trim()

    if (!userId) {
      const sign = new URL('/sign-in', req.url)
      if (reportId) sign.searchParams.set('after', `/report/${encodeURIComponent(reportId)}`)
      return NextResponse.redirect(sign)
    }

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 })
    }

    const { data: row, error } = await supabaseAdmin
      .from('paid_reports')
      .select('pdf_url')
      .eq('report_id', reportId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[download-report] paid_reports query', error)
      return NextResponse.json(
        {
          error: 'Could not load your report from the database.',
          code: 'SUPABASE_PAID_REPORTS',
        },
        { status: 502 },
      )
    }
    if (!row?.pdf_url) {
      return NextResponse.json({ error: 'Report not found.' }, { status: 404 })
    }

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from('reports')
      .createSignedUrl(row.pdf_url, 60 * 60 * 24 * 7)

    if (signErr || !signed?.signedUrl) {
      console.error('[download-report] sign', signErr)
      return NextResponse.json(
        {
          error: 'Could not create a signed URL for the PDF file.',
          code: 'STORAGE_SIGN_URL',
        },
        { status: 502 },
      )
    }

    return NextResponse.redirect(signed.signedUrl)
  } catch (e) {
    console.error('[download-report]', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
