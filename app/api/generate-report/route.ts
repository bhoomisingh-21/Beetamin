import { auth, currentUser } from '@clerk/nextjs/server'
import { waitUntil } from '@vercel/functions'
import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { runPaidReportGeneration } from '@/lib/run-paid-report-generation'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const maxDuration = 300

function makeReportId() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const suffix = randomBytes(2).toString('hex').toUpperCase()
  return `BT-${y}${m}${d}-${suffix}`
}

/** Persist free quiz JSON so Groq PDF jobs always see it (`runPaidReportGeneration` reads DB). */
async function syncFreeAssessmentToClientsTable(input: {
  clerkUserId: string
  freeAssessment: object
  email: string
  displayName: string
}) {
  const { data: updated, error: uErr } = await supabaseAdmin
    .from('clients')
    .update({ assessment_result: input.freeAssessment })
    .eq('clerk_user_id', input.clerkUserId)
    .select('id')

  if (uErr) {
    console.error('[generate-report] client assessment update', uErr)
  }
  if (updated && updated.length > 0) return

  const start = new Date()
  const end = new Date()
  end.setMonth(end.getMonth() + 3)
  const { error: insErr } = await supabaseAdmin.from('clients').insert({
    clerk_user_id: input.clerkUserId,
    name: input.displayName || 'User',
    email: input.email,
    phone: '',
    assessment_result: input.freeAssessment,
    plan_start_date: start.toISOString().split('T')[0],
    plan_end_date: end.toISOString().split('T')[0],
    status: 'active',
    sessions_total: 6,
    sessions_used: 0,
    sessions_remaining: 6,
  })
  if (insErr?.code === '23505') {
    const { data: byEmail } = await supabaseAdmin
      .from('clients')
      .select('id, clerk_user_id')
      .eq('email', input.email.toLowerCase())
      .maybeSingle()
    const match = byEmail as { id: string; clerk_user_id: string | null } | null
    if (match?.id && (!match.clerk_user_id || match.clerk_user_id === input.clerkUserId)) {
      const { error: fixErr } = await supabaseAdmin
        .from('clients')
        .update({
          clerk_user_id: input.clerkUserId,
          assessment_result: input.freeAssessment,
          name: input.displayName || 'User',
        })
        .eq('id', match.id)
      if (fixErr) console.error('[generate-report] client merge by email', fixErr)
    } else if (insErr) {
      console.error('[generate-report] client insert', insErr)
    }
  } else if (insErr) {
    console.error('[generate-report] client insert', insErr)
  }
}

export async function POST(req: Request) {
  let userId: string | null = null
  try {
    userId = (await auth()).userId ?? null
  } catch (e) {
    console.error('[generate-report] Clerk auth() failed', e)
    return NextResponse.json(
      {
        error: 'Sign-in service error. Refresh the page and try again.',
        code: 'AUTH_UNAVAILABLE',
      },
      { status: 503 },
    )
  }
  if (!userId) {
    return NextResponse.json({ error: 'Please sign in to generate your report.' }, { status: 401 })
  }

  try {
    let body: {
      detailedAssessmentId?: string
      freeAssessmentResult?: unknown
      /** Second (or later) ₹39 purchase for same detailed assessment — inserts a new paid_reports row. */
      forceNewPaidReport?: boolean
    }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const forceNewPaidReport = body.forceNewPaidReport === true

    const detailedId = typeof body.detailedAssessmentId === 'string' ? body.detailedAssessmentId.trim() : ''
    if (!detailedId) {
      return NextResponse.json({ error: 'detailedAssessmentId is required' }, { status: 400 })
    }

    const { data: detailed, error: dErr } = await supabaseAdmin
      .from('detailed_assessments')
      .select('*')
      .eq('id', detailedId)
      .eq('user_id', userId)
      .maybeSingle()

    if (dErr) {
      console.error('[generate-report] detailed fetch', dErr)
      return NextResponse.json(
        {
          error: 'Could not load your assessment from the database. Check Supabase tables and env keys.',
          code: 'SUPABASE_DETAILED_ASSESSMENT',
        },
        { status: 502 },
      )
    }
    if (!detailed) {
      return NextResponse.json({ error: 'Assessment not found or access denied.' }, { status: 404 })
    }

    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('assessment_result, name')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    const rawFree =
      client?.assessment_result ??
      (body.freeAssessmentResult != null &&
      typeof body.freeAssessmentResult === 'object' &&
      !Array.isArray(body.freeAssessmentResult)
        ? body.freeAssessmentResult
        : null)

    const freeAssessment: object | null = rawFree && typeof rawFree === 'object' && !Array.isArray(rawFree) ? rawFree : null

    if (!freeAssessment) {
      return NextResponse.json(
        {
          error:
            'We could not find your free assessment on file. Finish the free quiz again or open your results once while signed in, then retry.',
          code: 'MISSING_FREE_ASSESSMENT',
        },
        { status: 400 },
      )
    }

    let user: Awaited<ReturnType<typeof currentUser>> = null
    try {
      user = await currentUser()
    } catch (e) {
      console.error('[generate-report] currentUser() failed', e)
    }
    const emailResolved =
      user?.primaryEmailAddress?.emailAddress?.trim() ||
      String(detailed.email || '').trim() ||
      `noemail_${userId.slice(-14)}@beetamin.internal`

    const displayName =
      (client?.name as string | undefined)?.trim() ||
      user?.fullName?.trim() ||
      user?.firstName ||
      user?.username ||
      'User'

    await syncFreeAssessmentToClientsTable({
      clerkUserId: userId,
      freeAssessment,
      email: emailResolved.toLowerCase(),
      displayName,
    })

    if (forceNewPaidReport) {
      const { count, error: genCountErr } = await supabaseAdmin
        .from('paid_reports')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'generating')
      if (genCountErr) {
        console.error('[generate-report] generating count', genCountErr)
      } else if (count && count > 0) {
        return NextResponse.json(
          {
            error: 'A report is already generating. Wait for it to finish, then try again.',
            code: 'GENERATION_IN_FLIGHT',
          },
          { status: 409 },
        )
      }
    }

    const { data: assessmentReportRows } = await supabaseAdmin
      .from('paid_reports')
      .select('report_id, status, created_at')
      .eq('user_id', userId)
      .eq('assessment_id', detailedId)
      .order('created_at', { ascending: false })
      .limit(25)

    const rows = assessmentReportRows || []

    if (!forceNewPaidReport) {
      const existingActive = rows.find((r) =>
        ['ready', 'generated', 'generating'].includes(String(r.status)),
      )
      if (existingActive?.report_id) {
        return NextResponse.json({
          reportId: existingActive.report_id,
          alreadyExists: true,
          status: existingActive.status,
        })
      }

      const latestRow = rows[0] ?? null
      if (latestRow?.report_id && String(latestRow.status) === 'failed') {
        const rid = latestRow.report_id
        const storagePath = `${userId}/${rid}.pdf`
        const { error: retryErr } = await supabaseAdmin
          .from('paid_reports')
          .update({
            status: 'generating',
            free_assessment_snapshot: freeAssessment,
            deficiency_summary: null,
            email: emailResolved,
            pdf_url: storagePath,
          })
          .eq('report_id', rid)
          .eq('user_id', userId)

        if (retryErr) {
          console.error('[generate-report] failed→generating retry', retryErr)
          return NextResponse.json({ error: 'Could not retry report generation.' }, { status: 500 })
        }

        waitUntil(
          runPaidReportGeneration({
            reportId: rid,
            userId,
            detailedAssessmentId: detailedId,
          }),
        )

        return NextResponse.json({
          reportId: rid,
          status: 'generating',
          retriedFromFailed: true,
        })
      }
    }

    /** New insert */
    const reportId = makeReportId()
    const storagePath = `${userId}/${reportId}.pdf`

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('paid_reports')
      .insert({
        user_id: userId,
        email: emailResolved,
        report_id: reportId,
        pdf_url: storagePath,
        amount: 39,
        status: 'generating',
        assessment_id: detailedId,
        free_assessment_snapshot: freeAssessment,
      })
      .select()
      .single()

    console.log('[generate-report] Insert result:', insertData, insertError)

    if (insertError) {
      const msg = insertError.message || ''
      const isDup =
        insertError.code === '23505' ||
        msg.toLowerCase().includes('duplicate') ||
        msg.toLowerCase().includes('unique')
      if (isDup) {
        const { data: againRows } = await supabaseAdmin
          .from('paid_reports')
          .select('report_id, status')
          .eq('user_id', userId)
          .eq('assessment_id', detailedId)
          .order('created_at', { ascending: false })
          .limit(8)
        const againList = againRows || []
        const active = againList.find((r) =>
          ['ready', 'generated', 'generating'].includes(String(r.status)),
        )
        if (active?.report_id) {
          return NextResponse.json({
            reportId: active.report_id,
            alreadyExists: true,
            status: active.status,
          })
        }
        const failed = againList.find((r) => String(r.status) === 'failed')
        if (failed?.report_id && !forceNewPaidReport) {
          const retryRes = await supabaseAdmin
            .from('paid_reports')
            .update({
              status: 'generating',
              free_assessment_snapshot: freeAssessment,
              deficiency_summary: null,
              pdf_url: `${userId}/${failed.report_id}.pdf`,
            })
            .eq('report_id', failed.report_id)
            .eq('user_id', userId)

          if (!retryRes.error) {
            waitUntil(
              runPaidReportGeneration({
                reportId: failed.report_id,
                userId,
                detailedAssessmentId: detailedId,
              }),
            )
          }

          return NextResponse.json({
            reportId: failed.report_id,
            status: 'generating',
            retriedAfterRace: !!retryRes.error,
          })
        }
      }
      console.error('[generate-report] Failed to create record:', insertError)
      return NextResponse.json({ error: 'Failed to create report record' }, { status: 500 })
    }

    waitUntil(
      runPaidReportGeneration({
        reportId,
        userId,
        detailedAssessmentId: detailedId,
      }),
    )

    return NextResponse.json({
      reportId,
      status: 'generating',
    })
  } catch (e) {
    console.error('[generate-report] unhandled', e)
    return NextResponse.json(
      {
        error: 'Something went wrong. Please try again.',
        code: 'UNHANDLED',
      },
      { status: 500 },
    )
  }
}
