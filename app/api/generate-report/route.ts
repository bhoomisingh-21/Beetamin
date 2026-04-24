import { auth, currentUser } from '@clerk/nextjs/server'
import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const maxDuration = 60

function makeReportId() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const suffix = randomBytes(2).toString('hex').toUpperCase()
  return `BT-${y}${m}${d}-${suffix}`
}

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000'
  )
}

function triggerBuildPdf(payload: { reportId: string; userId: string; detailedAssessmentId: string }) {
  const url = `${appBaseUrl()}/api/build-pdf`
  const secret = process.env.BUILD_PDF_INTERNAL_SECRET
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret) {
    headers['x-build-pdf-secret'] = secret
  }
  fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  }).catch((err) => console.error('[generate-report] build-pdf trigger failed', err))
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

    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('assessment_result, name')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    const freeAssessment =
      client?.assessment_result ??
      (body.freeAssessmentResult && typeof body.freeAssessmentResult === 'object'
        ? body.freeAssessmentResult
        : null)

    if (!freeAssessment) {
      return NextResponse.json(
        {
          error:
            'We could not find your free assessment on file. Open your results in this browser once while signed in, or complete the free test again so we can sync your profile.',
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
    const email = user?.primaryEmailAddress?.emailAddress || (detailed.email as string)

    const reportId = makeReportId()
    const storagePath = `${userId}/${reportId}.pdf`

    const { error: insErr } = await supabaseAdmin.from('paid_reports').insert({
      user_id: userId,
      email,
      report_id: reportId,
      pdf_url: storagePath,
      amount: 39,
      status: 'generating',
    })

    if (insErr) {
      console.error('[generate-report] paid_reports insert', insErr)
      return NextResponse.json(
        {
          error: 'We could not start your report. Check the paid_reports table and policies.',
          code: 'PAID_REPORTS_INSERT',
        },
        { status: 502 },
      )
    }

    triggerBuildPdf({ reportId, userId, detailedAssessmentId: detailedId })

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
