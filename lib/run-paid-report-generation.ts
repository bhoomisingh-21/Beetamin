import { clerkClient } from '@clerk/nextjs/server'
import { resolvePatientDiet } from '@/lib/patient-diet'
import type { DetailedAssessmentPayload } from '@/lib/recovery-report-types'
import {
  coerceRecoveryReportV2,
  deficiencySummaryFromV2,
  generateEngineMealPlan,
  generateRecoveryReportV2Payload,
} from '@/lib/recovery-report-v2-groq'
import { renderRecoveryReportV2PdfBuffer } from '@/lib/render-recovery-report-v2-pdf'
import { sendRecoveryReportEmail } from '@/lib/send-report-email'
import { supabaseAdmin } from '@/lib/supabase-admin'

/** Prevent duplicate waitUntil invocations for the same report within one warm lambda. */
const activeGenerationKeys = new Set<string>()

function readAssessmentMeta(am: unknown): { age?: string; diet?: string; goal?: string } {
  if (!am || typeof am !== 'object') return {}
  const o = am as Record<string, unknown>
  return {
    age: o.age != null && o.age !== '' ? String(o.age) : undefined,
    diet: typeof o.diet === 'string' ? o.diet : undefined,
    goal: typeof o.goal === 'string' ? o.goal : undefined,
  }
}

async function markFailed(reportId: string, userId: string, reason: string) {
  console.error(`[run-paid-report-generation] FAILED ${reportId}: ${reason}`)
  await supabaseAdmin
    .from('paid_reports')
    .update({ status: 'failed' })
    .eq('report_id', reportId)
    .eq('user_id', userId)
}

function failureReason(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return 'Unknown error'
  }
}

function logTiming(reportId: string, phase: string, startedMs: number) {
  console.log(`[run-paid-report-generation] ${reportId} ${phase} +${Date.now() - startedMs}ms`)
}

export async function runPaidReportGeneration(args: {
  reportId: string
  userId: string
  detailedAssessmentId: string
}) {
  const { reportId, userId, detailedAssessmentId } = args
  const dedupeKey = `${userId}:${reportId}`
  if (activeGenerationKeys.has(dedupeKey)) {
    console.warn('[run-paid-report-generation] duplicate invocation skipped', reportId)
    return
  }
  activeGenerationKeys.add(dedupeKey)

  const pipelineStarted = Date.now()

  try {
    const { data: jobRow, error: jobErr } = await supabaseAdmin
      .from('paid_reports')
      .select('status, pdf_url, email, free_assessment_snapshot')
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

    logTiming(reportId, 'claimed', pipelineStarted)

    const storagePath = `${userId}/${reportId}.pdf`

    const { data: detailed, error: dErr } = await supabaseAdmin
      .from('detailed_assessments')
      .select('*')
      .eq('id', detailedAssessmentId)
      .eq('user_id', userId)
      .maybeSingle()

    if (dErr || !detailed) {
      console.error('[run-paid-report-generation] detailed', dErr)
      await markFailed(reportId, userId, dErr?.message ?? 'Detailed assessment not found')
      return
    }

    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('assessment_result, name, assessment_meta, assessment_goal')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    const snapshot = jobRow.free_assessment_snapshot
    const fromSnapshot =
      snapshot != null && typeof snapshot === 'object' && !Array.isArray(snapshot) ? snapshot : null

    const fromClientRow =
      client?.assessment_result != null &&
      typeof client.assessment_result === 'object' &&
      !Array.isArray(client.assessment_result)
        ? client.assessment_result
        : null

    const freeAssessment = fromSnapshot ?? fromClientRow

    if (!freeAssessment || typeof freeAssessment !== 'object') {
      console.error('[run-paid-report-generation] missing free assessment (no snapshot & no profile JSON)')
      await markFailed(reportId, userId, 'Missing free assessment snapshot and profile JSON')
      return
    }

    const meta = readAssessmentMeta(client?.assessment_meta)
    const dietSummary =
      freeAssessment && typeof freeAssessment === 'object' && !Array.isArray(freeAssessment)
        ? typeof (freeAssessment as Record<string, unknown>).dietSummary === 'string'
          ? ((freeAssessment as Record<string, unknown>).dietSummary as string)
          : undefined
        : undefined
    const resolvedDiet = resolvePatientDiet({
      detailedDietType: detailed.diet_type as string | undefined,
      freeQuizDiet: meta.diet,
      dietSummary,
    })
    const goalFromClient =
      client && typeof client.assessment_goal === 'string' && client.assessment_goal.trim()
        ? client.assessment_goal.trim()
        : undefined

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
      gender: detailed.gender ?? null,
      height_cm: typeof detailed.height_cm === 'number' ? detailed.height_cm : null,
      weight_kg: typeof detailed.weight_kg === 'number' ? detailed.weight_kg : null,
      medical_conditions: Array.isArray(detailed.medical_conditions) ? detailed.medical_conditions : [],
      allergies: Array.isArray(detailed.allergies) ? detailed.allergies : [],
      stress_level: detailed.stress_level ?? null,
      condition_details:
        detailed.condition_details && typeof detailed.condition_details === 'object'
          ? (detailed.condition_details as Record<string, unknown>)
          : {},
      weight_loss_target_kg: typeof detailed.weight_loss_target_kg === 'number' ? detailed.weight_loss_target_kg : null,
    }

    const reportGenerationInput = {
      patientName,
      freeAssessment,
      detailed: detailedPayload,
      age: meta.age ?? 'Not specified',
      diet: resolvedDiet.label,
      goal: meta.goal ?? goalFromClient ?? 'Personalised nutrient recovery',
      reportId,
    }

    const parallelStarted = Date.now()
    const [groqSettled, mealSettled] = await Promise.allSettled([
      generateRecoveryReportV2Payload(reportGenerationInput),
      generateEngineMealPlan(reportGenerationInput),
    ])
    logTiming(reportId, 'groq+meals parallel', parallelStarted)

    if (groqSettled.status === 'rejected') {
      console.error('[run-paid-report-generation] Groq', groqSettled.reason)
      await markFailed(reportId, userId, `Groq: ${failureReason(groqSettled.reason)}`)
      return
    }

    if (mealSettled.status === 'rejected') {
      // Loud + traceable: meals table empty/missing, or engine failure — never ship a broken/empty plan.
      console.error('[run-paid-report-generation] meal engine', mealSettled.reason)
      await markFailed(reportId, userId, `Meal engine: ${failureReason(mealSettled.reason)}`)
      return
    }

    const raw = groqSettled.value
    const mealPlan = mealSettled.value

    const generatedAt = new Date().toISOString()
    const reportData = coerceRecoveryReportV2(
      raw,
      {
        name: patientName,
        age: meta.age,
        diet: resolvedDiet.label,
        goal: meta.goal ?? goalFromClient,
        reportId,
        generatedAt,
      },
      mealPlan,
    )

    const deficiencySummary = deficiencySummaryFromV2(reportData)

    let pdfBuffer: Buffer
    const pdfStarted = Date.now()
    try {
      pdfBuffer = await renderRecoveryReportV2PdfBuffer(reportData)
    } catch (pdfError) {
      console.error('[run-paid-report-generation] PDF', pdfError)
      await markFailed(reportId, userId, `PDF render: ${failureReason(pdfError)}`)
      return
    }
    logTiming(reportId, 'pdf render', pdfStarted)

    const uploadStarted = Date.now()
    const { error: upErr } = await supabaseAdmin.storage
      .from('reports')
      .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (upErr) {
      console.error('[run-paid-report-generation] storage upload', upErr)
      await markFailed(reportId, userId, `Storage upload: ${upErr.message}`)
      return
    }
    logTiming(reportId, 'storage upload', uploadStarted)

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
      await markFailed(reportId, userId, `DB update: ${upRowErr.message}`)
      return
    }

    logTiming(reportId, 'pipeline complete', pipelineStarted)

    // Email is best-effort — never block the ready status the client polls for.
    void (async () => {
      try {
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
      } catch (emailErr) {
        console.error('[run-paid-report-generation] email unhandled', emailErr)
      }
    })()
  } catch (e) {
    console.error('[run-paid-report-generation] unhandled', e)
    await markFailed(reportId, userId, `Unhandled: ${failureReason(e)}`)
  } finally {
    activeGenerationKeys.delete(dedupeKey)
  }
}
