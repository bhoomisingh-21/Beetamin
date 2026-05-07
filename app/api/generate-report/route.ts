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
    let body: { detailedAssessmentId?: string; freeAssessmentResult?: unknown }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

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

    const { data: existingReport } = await supabaseAdmin
      .from('paid_reports')
      .select('report_id, status')
      .eq('user_id', userId)
      .eq('assessment_id', detailedId)
      .maybeSingle()

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

    /** Terminal states → do not regenerate */
    const er = existingReport as { report_id: string; status: string } | null
    if (er?.report_id && ['ready', 'generated', 'generating'].includes(String(er.status))) {
      return NextResponse.json({
        reportId: er.report_id,
        alreadyExists: true,
        status: er.status,
      })
    }

    /** Failed report for this assessment → reset and rerun */
    if (er?.report_id && String(er.status) === 'failed') {
      const rid = er.report_id
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
        const { data: again } = await supabaseAdmin
          .from('paid_reports')
          .select('report_id, status')
          .eq('user_id', userId)
          .eq('assessment_id', detailedId)
          .maybeSingle()
        if (again?.report_id) {
          const stAgain = String(again.status || '')
          if (stAgain === 'failed') {
            const retryRes = await supabaseAdmin
              .from('paid_reports')
              .update({
                status: 'generating',
                free_assessment_snapshot: freeAssessment,
                deficiency_summary: null,
                pdf_url: `${userId}/${again.report_id}.pdf`,
              })
              .eq('report_id', again.report_id)
              .eq('user_id', userId)

            if (!retryRes.error) {
              waitUntil(
                runPaidReportGeneration({
                  reportId: again.report_id,
                  userId,
                  detailedAssessmentId: detailedId,
                }),
              )
            }

            return NextResponse.json({
              reportId: again.report_id,
              status: 'generating',
              retriedAfterRace: !!retryRes.error,
            })
          }

          return NextResponse.json({
            reportId: again.report_id,
            alreadyExists: true,
            status: again.status,
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
