import { clerkClient } from '@clerk/nextjs/server'
import type { DetailedAssessmentPayload } from '@/lib/recovery-report-types'
import {
  coerceRecoveryReportV2,
  deficiencySummaryFromV2,
  generateRecoveryReportV2Payload,
} from '@/lib/recovery-report-v2-groq'
import { renderRecoveryReportV2PdfBuffer } from '@/lib/render-recovery-report-v2-pdf'
import { sendRecoveryReportEmail } from '@/lib/send-report-email'
import { supabaseAdmin } from '@/lib/supabase-admin'

function readAssessmentMeta(am: unknown): { age?: string; diet?: string; goal?: string } {
  if (!am || typeof am !== 'object') return {}
  const o = am as Record<string, unknown>
  return {
    age: o.age != null && o.age !== '' ? String(o.age) : undefined,
    diet: typeof o.diet === 'string' ? o.diet : undefined,
    goal: typeof o.goal === 'string' ? o.goal : undefined,
  }
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
      await markFailed(reportId, userId)
      return
    }

    const meta = readAssessmentMeta(client?.assessment_meta)
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
    }

    let raw: Record<string, unknown>
    try {
      raw = await generateRecoveryReportV2Payload({
        patientName,
        freeAssessment,
        detailed: detailedPayload,
        age: meta.age ?? 'Not specified',
        diet: meta.diet ?? detailed.diet_type ?? 'Mixed',
        goal: meta.goal ?? goalFromClient ?? 'Personalised nutrient recovery',
      })
    } catch (e) {
      console.error('[run-paid-report-generation] Groq', e)
      await markFailed(reportId, userId)
      return
    }

    const generatedAt = new Date().toISOString()
    const reportData = coerceRecoveryReportV2(raw, {
      name: patientName,
      age: meta.age,
      diet: meta.diet ?? detailed.diet_type,
      goal: meta.goal ?? goalFromClient,
      reportId,
      generatedAt,
    })

    const deficiencySummary = deficiencySummaryFromV2(reportData)

    let pdfBuffer: Buffer
    try {
      pdfBuffer = await renderRecoveryReportV2PdfBuffer(reportData)
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
