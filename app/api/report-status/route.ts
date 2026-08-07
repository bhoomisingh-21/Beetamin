import { auth } from '@clerk/nextjs/server'
import { waitUntil } from '@vercel/functions'
import { NextResponse } from 'next/server'
import { REPORT_GENERATION_STALE_MS } from '@/lib/report-generation-config'
import { runPaidReportGeneration } from '@/lib/run-paid-report-generation'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const restartedReports = new Set<string>()

function isStaleGenerating(row: { status?: string | null; created_at?: string | null }): boolean {
  if (String(row.status) !== 'generating') return false
  const createdAt = row.created_at ? new Date(row.created_at).getTime() : NaN
  return Number.isFinite(createdAt) && Date.now() - createdAt > REPORT_GENERATION_STALE_MS
}

/**
 * Status polling for /report/[reportId]. Uses Clerk + service role so the UI
 * works even when browser Supabase + RLS / JWT template are not configured.
 *
 * If a job is stale (waitUntil dropped on Vercel), re-queue generation once per report.
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
      .select('status, pdf_url, email, report_id, assessment_id, created_at')
      .eq('report_id', reportId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[report-status]', error)
      return NextResponse.json({ error: 'Could not load report' }, { status: 502 })
    }

    if (row && isStaleGenerating(row) && row.assessment_id) {
      const restartKey = `${userId}:${reportId}`
      if (!restartedReports.has(restartKey)) {
        restartedReports.add(restartKey)
        console.warn('[report-status] stale generating — re-queue', reportId)
        waitUntil(
          runPaidReportGeneration({
            reportId,
            userId,
            detailedAssessmentId: String(row.assessment_id),
          }).catch((e) => console.error('[report-status] background generation', e)),
        )
      }
    }

    return NextResponse.json({
      status: row?.status ?? null,
      pdf_url: row?.pdf_url ?? null,
      email: row?.email ?? null,
      report_id: row?.report_id ?? reportId,
      assessment_id: row?.assessment_id ?? null,
      created_at: row?.created_at ?? null,
    })
  } catch (e) {
    console.error('[report-status]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
