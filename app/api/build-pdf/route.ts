import { auth, clerkClient } from '@clerk/nextjs/server'
import Groq from 'groq-sdk'
import { NextResponse } from 'next/server'
import { generateRecoveryPlanPdfBuffer } from '@/lib/generate-pdf'
import { RECOVERY_PLAN_SYSTEM_PROMPT } from '@/lib/recovery-report-prompt'
import type { DetailedAssessmentPayload, RecoveryReportSections } from '@/lib/recovery-report-types'
import { sendRecoveryReportEmail } from '@/lib/send-report-email'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const maxDuration = 300

const GROQ_APPENDIX = `
SUPPLEMENT SECTION RULES — VERY IMPORTANT:
Recommend MAXIMUM 2 supplements only.
Pick only the top 2 most critical deficiencies to supplement for.
Do not recommend more than 2 under any circumstance.
The user should have complete clarity on what to take.
For the remaining deficiencies, focus on fixing them through the meal plan instead.
For each supplement, explain very clearly:
- Exactly what it is in simple language
- Exactly one brand to buy (be specific, one brand only)
- Exact dosage (e.g. 1000 IU, 500mg)
- Exact timing (e.g. every morning with breakfast)
- How long to take it
- That it is safe and well researched

MEAL PLAN RULES — VERY IMPORTANT:
Every single day must have COMPLETELY DIFFERENT meals.
Do not repeat the same breakfast, lunch, or dinner on any two days.
Day 1 and Day 4 must be different.
Day 2 and Day 5 must be different.
Day 3 and Day 6 must be different.
Variety is the entire point of a 7-day plan.
Use a wide range of Indian ingredients across the week:
poha, upma, idli, dosa, paratha, oats, eggs, daliya, chilla on different mornings.
Dal, rajma, chana, chole, paneer, tofu, chicken, fish on different lunches and dinners.
Every day should feel like a genuinely different menu.

DEFICIENCY ANALYSIS — SYMPTOM SPECIFICITY:
When writing YOUR SYMPTOMS POINTING TO THIS,
list the patient's ACTUAL specific reported symptoms word for word — not generic descriptions.
For example instead of "skin and hair issues" write "your reported hair fall, brittle nails, and dry skin".
Make it clear you are talking about THEIR specific answers.
`.trim()

function getGroq() {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY is not configured')
  return new Groq({ apiKey: key })
}

function safeParseJson(raw: string): RecoveryReportSections {
  let text = raw.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  }
  const parsed = JSON.parse(text) as Partial<RecoveryReportSections>
  const keys: (keyof RecoveryReportSections)[] = [
    'deficiencyAnalysis',
    'mealPlan',
    'supplements',
    'blockingFoods',
    'dailyRoutine',
    'doctorNote',
    'disclaimer',
  ]
  const out = {} as RecoveryReportSections
  for (const k of keys) {
    const v = parsed[k]
    out[k] =
      typeof v === 'string' && v.trim()
        ? v.trim()
        : `[${String(k)} — content being prepared. Please contact support if this persists.]`
  }
  return out
}

async function generateRecoveryReportSections(input: {
  patientName: string
  freeAssessment: unknown
  detailed: DetailedAssessmentPayload
}): Promise<RecoveryReportSections> {
  const groq = getGroq()
  const userPayload = {
    patientName: input.patientName,
    freeDeficiencyAssessment: input.freeAssessment,
    detailedLifestyleAssessment: input.detailed,
  }

  const completion = await Promise.race([
    groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `${RECOVERY_PLAN_SYSTEM_PROMPT}\n\n${GROQ_APPENDIX}`,
        },
        {
          role: 'user',
          content:
            'Patient data (JSON):\n' +
            JSON.stringify(userPayload, null, 2) +
            '\n\nProduce the JSON object as specified in your system instructions.',
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Groq timeout')), 90000)
    }),
  ])

  const raw = completion.choices[0]?.message?.content
  if (!raw) throw new Error('Empty response from report generation')
  return safeParseJson(raw)
}

async function markFailed(reportId: string, userId: string) {
  await supabaseAdmin
    .from('paid_reports')
    .update({ status: 'failed' })
    .eq('report_id', reportId)
    .eq('user_id', userId)
}

/** Browser polling: status + email + display name for the report page. */
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
      .select('status, pdf_url, email, report_id')
      .eq('report_id', reportId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[build-pdf GET]', error)
      return NextResponse.json({ error: 'Could not load status' }, { status: 502 })
    }

    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('name')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    return NextResponse.json({
      status: row?.status ?? null,
      pdf_url: row?.pdf_url ?? null,
      email: row?.email ?? null,
      report_id: row?.report_id ?? reportId,
      patientName: (client?.name as string | undefined)?.trim() || null,
    })
  } catch (e) {
    console.error('[build-pdf GET]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

type BuildPdfBody = {
  reportId?: string
  userId?: string
  detailedAssessmentId?: string
}

export async function POST(req: Request) {
  const secret = process.env.BUILD_PDF_INTERNAL_SECRET
  if (secret) {
    const hdr = req.headers.get('x-build-pdf-secret')
    if (hdr !== secret) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  let reportId = ''
  let userId = ''
  let detailedAssessmentId = ''

  try {
    let body: BuildPdfBody
    try {
      body = (await req.json()) as BuildPdfBody
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    reportId = typeof body.reportId === 'string' ? body.reportId.trim() : ''
    userId = typeof body.userId === 'string' ? body.userId.trim() : ''
    detailedAssessmentId =
      typeof body.detailedAssessmentId === 'string' ? body.detailedAssessmentId.trim() : ''

    if (!reportId || !userId || !detailedAssessmentId) {
      return NextResponse.json(
        { error: 'reportId, userId, and detailedAssessmentId are required' },
        { status: 400 },
      )
    }

    const { data: jobRow, error: jobErr } = await supabaseAdmin
      .from('paid_reports')
      .select('status, pdf_url, email')
      .eq('report_id', reportId)
      .eq('user_id', userId)
      .maybeSingle()

    if (jobErr || !jobRow) {
      console.error('[build-pdf POST] job row', jobErr)
      return NextResponse.json({ error: 'Report job not found' }, { status: 404 })
    }
    if (jobRow.status !== 'generating') {
      return NextResponse.json({ error: 'Report is not in generating state', status: jobRow.status }, { status: 409 })
    }

    const storagePath = `${userId}/${reportId}.pdf`

    const { data: detailed, error: dErr } = await supabaseAdmin
      .from('detailed_assessments')
      .select('*')
      .eq('id', detailedAssessmentId)
      .eq('user_id', userId)
      .maybeSingle()

    if (dErr || !detailed) {
      console.error('[build-pdf POST] detailed', dErr)
      await markFailed(reportId, userId)
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('assessment_result, name')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    const freeAssessment = client?.assessment_result
    if (!freeAssessment || typeof freeAssessment !== 'object') {
      console.error('[build-pdf POST] missing free assessment')
      await markFailed(reportId, userId)
      return NextResponse.json({ error: 'Free assessment not found for user' }, { status: 400 })
    }

    let clerkUser
    try {
      const cc = await clerkClient()
      clerkUser = await cc.users.getUser(userId)
    } catch (e) {
      console.error('[build-pdf POST] clerk user', e)
      clerkUser = null
    }
    const primaryEmail =
      clerkUser?.primaryEmailAddress?.emailAddress ||
      (clerkUser?.primaryEmailAddressId
        ? clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress
        : undefined) ||
      clerkUser?.emailAddresses?.[0]?.emailAddress
    const email = primaryEmail || (detailed.email as string) || (jobRow.email as string)
    const patientName =
      (client?.name as string | undefined)?.trim() ||
      clerkUser?.firstName ||
      clerkUser?.username ||
      'Patient'

    const detailedPayload: DetailedAssessmentPayload = {
      diet_type: detailed.diet_type,
      food_frequency: detailed.food_frequency,
      sun_exposure: detailed.sun_exposure,
      physical_symptoms: detailed.physical_symptoms || [],
      energy_mood: detailed.energy_mood,
      sleep_quality: detailed.sleep_quality,
      digestion: detailed.digestion,
      exercise_level: detailed.exercise_level,
      water_intake: detailed.water_intake,
      menstrual_health: detailed.menstrual_health,
    }

    let sections: RecoveryReportSections
    try {
      sections = await generateRecoveryReportSections({
        patientName,
        freeAssessment,
        detailed: detailedPayload,
      })
    } catch (e) {
      console.error('[build-pdf POST] Groq', e)
      await markFailed(reportId, userId)
      return NextResponse.json({ error: 'AI generation failed', detail: String(e) }, { status: 502 })
    }

    const preparedOn = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    let pdfBuffer: Buffer
    try {
      pdfBuffer = await generateRecoveryPlanPdfBuffer({
        patientName,
        reportId,
        preparedOn,
        sections,
      })
    } catch (pdfError) {
      console.error('[PDF Style Error]', pdfError)
      await markFailed(reportId, userId)
      return NextResponse.json(
        { error: 'PDF generation failed', detail: String(pdfError) },
        { status: 500 },
      )
    }

    const { error: upErr } = await supabaseAdmin.storage
      .from('reports')
      .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (upErr) {
      console.error('[build-pdf POST] storage upload', upErr)
      await markFailed(reportId, userId)
      return NextResponse.json({ error: 'Storage upload failed' }, { status: 502 })
    }

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from('reports')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7)

    if (signErr || !signed?.signedUrl) {
      console.error('[build-pdf POST] signed url', signErr)
      await markFailed(reportId, userId)
      return NextResponse.json({ error: 'Could not create signed URL' }, { status: 502 })
    }

    const { error: upRowErr } = await supabaseAdmin
      .from('paid_reports')
      .update({
        status: 'ready',
        pdf_url: storagePath,
        email,
      })
      .eq('report_id', reportId)
      .eq('user_id', userId)

    if (upRowErr) {
      console.error('[build-pdf POST] paid_reports update', upRowErr)
      await markFailed(reportId, userId)
      return NextResponse.json({ error: 'Could not update report row' }, { status: 502 })
    }

    const emailResult = await sendRecoveryReportEmail({
      to: email,
      name: patientName,
      reportId,
      signedDownloadUrl: signed.signedUrl,
      pdfBuffer,
    })

    if (!emailResult.ok) {
      console.error('[build-pdf POST] email', emailResult.error)
    }

    return NextResponse.json({ ok: true, reportId, emailSent: emailResult.ok })
  } catch (e) {
    console.error('[build-pdf POST] unhandled', e)
    if (reportId && userId) {
      await markFailed(reportId, userId)
    }
    return NextResponse.json({ error: 'Server error', detail: String(e) }, { status: 500 })
  }
}
