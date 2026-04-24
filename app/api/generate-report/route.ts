import { auth, currentUser } from '@clerk/nextjs/server'
import { randomBytes } from 'crypto'
import Groq from 'groq-sdk'
import { NextResponse } from 'next/server'
import { generateRecoveryPlanPdfBuffer } from '@/lib/generate-pdf'
import { RECOVERY_PLAN_SYSTEM_PROMPT } from '@/lib/recovery-report-prompt'
import type { DetailedAssessmentPayload, RecoveryReportSections } from '@/lib/recovery-report-types'
import { sendRecoveryReportEmail } from '@/lib/send-report-email'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const maxDuration = 60

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

  const completion = await groq.chat.completions.create({
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
    temperature: 0.35,
    max_tokens: 8192,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) throw new Error('Empty response from report generation')
  return safeParseJson(raw)
}

function makeReportId() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const suffix = randomBytes(2).toString('hex').toUpperCase()
  return `BT-${y}${m}${d}-${suffix}`
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
    const email = user?.primaryEmailAddress?.emailAddress || detailed.email
    const patientName =
      (client?.name as string | undefined)?.trim() ||
      user?.fullName ||
      user?.firstName ||
      'Patient'

    const detailedPayload = {
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

    let sections
    try {
      sections = await generateRecoveryReportSections({
        patientName,
        freeAssessment,
        detailed: detailedPayload,
      })
    } catch (e) {
      console.error('[generate-report] groq', e)
      return NextResponse.json(
        { error: 'We could not finish preparing your report. Please try again in a few minutes.' },
        { status: 502 },
      )
    }

    const reportId = makeReportId()
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
    } catch (err) {
      console.error('[PDF Generation Error]', err)
      return NextResponse.json(
        { error: 'PDF generation failed', detail: String(err) },
        { status: 500 },
      )
    }

    const storagePath = `${userId}/${reportId}.pdf`
    const { error: upErr } = await supabaseAdmin.storage
      .from('reports')
      .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (upErr) {
      console.error('[generate-report] storage upload', upErr)
      return NextResponse.json(
        {
          error: 'We could not upload the PDF. Ensure the Supabase "reports" bucket exists and the service role can write to it.',
          code: 'STORAGE_UPLOAD',
        },
        { status: 502 },
      )
    }

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from('reports')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7)

    if (signErr || !signed?.signedUrl) {
      console.error('[generate-report] signed url', signErr)
      return NextResponse.json(
        {
          error: 'Could not create a signed download link for storage.',
          code: 'STORAGE_SIGN_URL',
        },
        { status: 502 },
      )
    }

    const { error: insErr } = await supabaseAdmin.from('paid_reports').insert({
      user_id: userId,
      email,
      report_id: reportId,
      pdf_url: storagePath,
      amount: 39,
      status: 'generated',
    })

    if (insErr) {
      console.error('[generate-report] paid_reports insert', insErr)
      return NextResponse.json(
        {
          error: 'We could not save your report row. Check the paid_reports table and RLS/policies.',
          code: 'PAID_REPORTS_INSERT',
        },
        { status: 502 },
      )
    }

    const emailResult = await sendRecoveryReportEmail({
      to: email,
      name: patientName,
      reportId,
      signedDownloadUrl: signed.signedUrl,
      pdfBuffer,
    })

    if (!emailResult.ok) {
      console.error('[generate-report] email', emailResult.error)
    }

    return NextResponse.json({
      reportId,
      emailSent: emailResult.ok,
      emailError: emailResult.ok ? undefined : emailResult.error,
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
