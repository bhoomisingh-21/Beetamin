import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

/**
 * Status polling for /report/[reportId]. Uses Clerk + service role so the UI
 * works even when browser Supabase + RLS / JWT template are not configured.
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const reportId = searchParams.get('reportId')?.trim()
    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 })
    }

    const { data: row, error } = await supabaseAdmin
      .from('paid_reports')
      .select('status, pdf_url, email, report_id, assessment_id')
      .eq('report_id', reportId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[report-status]', error)
      return NextResponse.json({ error: 'Could not load report' }, { status: 502 })
    }

    return NextResponse.json({
      status: row?.status ?? null,
      pdf_url: row?.pdf_url ?? null,
      email: row?.email ?? null,
      report_id: row?.report_id ?? reportId,
      assessment_id: row?.assessment_id ?? null,
    })
  } catch (e) {
    console.error('[report-status]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
