import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendRecoveryReportEmail } from '@/lib/send-report-email'

/**
 * Re-send the recovery plan email (same PDF from storage).
 * Used for support / manual retries — not required for the default checkout flow.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { reportId?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const reportId = typeof body.reportId === 'string' ? body.reportId.trim() : ''
    if (!reportId) return NextResponse.json({ error: 'reportId is required' }, { status: 400 })

    const { data: row, error } = await supabaseAdmin
      .from('paid_reports')
      .select('pdf_url, email, report_id')
      .eq('report_id', reportId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !row?.pdf_url) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const { data: file, error: dlErr } = await supabaseAdmin.storage.from('reports').download(row.pdf_url)
    if (dlErr || !file) {
      console.error('[send-report] download', dlErr)
      return NextResponse.json({ error: 'Could not read PDF from storage' }, { status: 500 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const user = await currentUser()
    const name = user?.fullName || user?.firstName || 'Patient'

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from('reports')
      .createSignedUrl(row.pdf_url, 60 * 60 * 24 * 7)

    if (signErr || !signed?.signedUrl) {
      return NextResponse.json({ error: 'Could not sign URL' }, { status: 500 })
    }

    const result = await sendRecoveryReportEmail({
      to: row.email,
      name,
      reportId: row.report_id,
      signedDownloadUrl: signed.signedUrl,
      pdfBuffer: buf,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[send-report]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
