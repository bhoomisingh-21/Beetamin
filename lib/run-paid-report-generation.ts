import { clerkClient } from '@clerk/nextjs/server'
import Groq from 'groq-sdk'
import { generateRecoveryPlanPdfBuffer } from '@/lib/generate-pdf'
import { parseRecoverySectionsJson } from '@/lib/recovery-report-parse'
import { RECOVERY_PLAN_SYSTEM_PROMPT } from '@/lib/recovery-report-prompt'
import type { DetailedAssessmentPayload, RecoveryReportSections } from '@/lib/recovery-report-types'
import { sendRecoveryReportEmail } from '@/lib/send-report-email'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

PREMIUM JSON FIELDS (REQUIRED NON-EMPTY STRINGS — every key must contain real prose, never placeholders):
Include these keys in your JSON WITH the seven main sections:

premiumValueStatement:
Write 4–6 sentences for an Indian wellness buyer. Explain why this ₹39 Beetamin report is more valuable than a free ChatGPT answer: merges FREE + DETAILED assessments, structured sections, actionable 7-day plan, numbered routine, timeline, supplements limited to what's safe, Indian foods/brands — without naming ChatGPT explicitly (say "generic online tools").

healthScoreSummary:
Start with OVERALL DEFICIENCY RISK SCORE: X/100 using the patient's score from freeDeficiencyAssessment when present; otherwise estimate from analysis (state that it is clinician-style estimate).
Then add 5 pillar lines (Energy & Vitality, Skin Hair Nails, Immunity & Recovery, Cognitive Clarity, Sleep & Hormones) each scored 0–100 with ONE short textual progress bar made of █ and ░ (e.g. ████████░░ 82/100) and ONE sentence tying that pillar to THEIR answers (sun, diet_type, symptoms, sleep_quality, digestion, etc.).
End with WHY THIS SCORE RANK vs risk band (Healthy / Moderate / High) and what it implies for their 90-day plan.

smartInsights:
Exactly 5 bullet lines. Each bullet starts "- ". Each MUST connect TWO concrete facts from the JSON patient data (e.g. vegetarian + low sun exposure) to one mechanism or meal-plan priority. No fluffy generic wellness quotes.

ninetyDayTimeline:
Four labelled blocks ONLY:
Weeks 1–2 | Weeks 3–4 | Weeks 5–8 | Weeks 9–12
Under each heading, exactly 3 short bullet sentences predicting realistic improvements tied to THEIR named deficiencies — not boilerplate longevity claims.
`.trim()

function getGroq() {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY is not configured')
  return new Groq({ apiKey: key })
}

function extractDeficiencySummary(freeAssessment: unknown): Record<string, unknown> | null {
  if (!freeAssessment || typeof freeAssessment !== 'object') return null
  const fa = freeAssessment as {
    primaryDeficiencies?: unknown
    deficiencyScore?: unknown
    urgencyMessage?: unknown
  }
  const raw = fa.primaryDeficiencies
  if (!Array.isArray(raw)) return null
  const deficiencies: unknown[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const sev = o.severity
    const severity =
      sev === 'high' || sev === 'medium' || sev === 'low' ? sev : 'low'
    const symptoms = Array.isArray(o.symptoms)
      ? (o.symptoms as unknown[]).filter((s): s is string => typeof s === 'string')
      : []
    deficiencies.push({
      nutrient: typeof o.nutrient === 'string' ? o.nutrient : String(o.nutrient ?? ''),
      severity,
      reason:
        typeof o.reason === 'string'
          ? o.reason
          : typeof o.explanation === 'string'
            ? o.explanation
            : '',
      symptoms,
    })
  }
  if (!deficiencies.length) return null
  const score = typeof fa.deficiencyScore === 'number' ? fa.deficiencyScore : null
  const urgencyRaw = fa.urgencyMessage
  const urgencyMessage =
    typeof urgencyRaw === 'string' && urgencyRaw.trim() ? urgencyRaw.trim() : undefined
  return {
    overallScore: score,
    deficiencies,
    ...(urgencyMessage ? { urgencyMessage } : {}),
  }
}

function freeAssessmentMeta(free: unknown): {
  deficiencyScore: number | null
  urgencyPreview: string | null
} {
  if (!free || typeof free !== 'object') return { deficiencyScore: null, urgencyPreview: null }
  const fa = free as Record<string, unknown>
  const rawScore = fa.deficiencyScore
  const deficiencyScore =
    typeof rawScore === 'number' && !Number.isNaN(rawScore) ? Math.round(rawScore) : null
  const u = fa.urgencyMessage
  const urgencyPreview =
    typeof u === 'string' && u.trim() ? u.trim().slice(0, 320) : null
  return { deficiencyScore, urgencyPreview }
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
      temperature: 0.55,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
    }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Groq timeout')), 90000)
    }),
  ])

  const raw = completion.choices[0]?.message?.content
  if (!raw) throw new Error('Empty response from report generation')
  return parseRecoverySectionsJson(raw)
}

async function markFailed(reportId: string, userId: string) {
  await supabaseAdmin
    .from('paid_reports')
    .update({ status: 'failed' })
    .eq('report_id', reportId)
    .eq('user_id', userId)
}

export async function runPaidReportGeneration(args: {
  reportId: string
  userId: string
  detailedAssessmentId: string
}) {
  const { reportId, userId, detailedAssessmentId } = args

  try {
    const { data: jobRow, error: jobErr } = await supabaseAdmin
      .from('paid_reports')
      .select('status, pdf_url, email')
      .eq('report_id', reportId)
      .eq('user_id', userId)
      .maybeSingle()

    if (jobErr || !jobRow) {
      console.error('[run-paid-report-generation] job row', jobErr)
      return
    }
    if (jobRow.status !== 'generating') {
      console.warn('[run-paid-report-generation] skip, status is', jobRow.status)
      return
    }

    const storagePath = `${userId}/${reportId}.pdf`

    const { data: detailed, error: dErr } = await supabaseAdmin
      .from('detailed_assessments')
      .select('*')
      .eq('id', detailedAssessmentId)
      .eq('user_id', userId)
      .maybeSingle()

    if (dErr || !detailed) {
      console.error('[run-paid-report-generation] detailed', dErr)
      await markFailed(reportId, userId)
      return
    }

    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('assessment_result, name')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    const freeAssessment = client?.assessment_result
    if (!freeAssessment || typeof freeAssessment !== 'object') {
      console.error('[run-paid-report-generation] missing free assessment')
      await markFailed(reportId, userId)
      return
    }

    const deficiencySummary = extractDeficiencySummary(freeAssessment)

    let clerkUser
    try {
      const cc = await clerkClient()
      clerkUser = await cc.users.getUser(userId)
    } catch (e) {
      console.error('[run-paid-report-generation] clerk user', e)
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
      console.error('[run-paid-report-generation] Groq', e)
      await markFailed(reportId, userId)
      return
    }

    const preparedOn = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    let pdfBuffer: Buffer
    try {
      const { deficiencyScore, urgencyPreview } = freeAssessmentMeta(freeAssessment)
      pdfBuffer = await generateRecoveryPlanPdfBuffer({
        patientName,
        reportId,
        preparedOn,
        sections,
        deficiencyScore,
        urgencyPreview,
      })
    } catch (pdfError) {
      console.error('[run-paid-report-generation] PDF', pdfError)
      await markFailed(reportId, userId)
      return
    }

    const { error: upErr } = await supabaseAdmin.storage
      .from('reports')
      .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (upErr) {
      console.error('[run-paid-report-generation] storage upload', upErr)
      await markFailed(reportId, userId)
      return
    }

    const { error: upRowErr } = await supabaseAdmin
      .from('paid_reports')
      .update({
        status: 'ready',
        pdf_url: storagePath,
        email,
        deficiency_summary: deficiencySummary,
      })
      .eq('report_id', reportId)
      .eq('user_id', userId)

    if (upRowErr) {
      console.error('[run-paid-report-generation] paid_reports update', upRowErr)
      await markFailed(reportId, userId)
      return
    }

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from('reports')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7)

    if (signErr || !signed?.signedUrl) {
      console.error('[run-paid-report-generation] signed URL for email', signErr)
      return
    }

    const emailResult = await sendRecoveryReportEmail({
      to: email,
      name: patientName,
      reportId,
      signedDownloadUrl: signed.signedUrl,
      pdfBuffer,
    })

    if (!emailResult.ok) {
      console.error('[run-paid-report-generation] email', emailResult.error)
    } else {
      console.log('[run-paid-report-generation] Email sent successfully')
    }
  } catch (e) {
    console.error('[run-paid-report-generation] unhandled', e)
    await markFailed(reportId, userId)
  }
}
