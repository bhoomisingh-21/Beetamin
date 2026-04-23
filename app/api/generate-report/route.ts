import { auth, currentUser } from '@clerk/nextjs/server'
import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateRecoveryReportSections } from '@/lib/groq-recovery-report'
import { generateRecoveryPlanPdfBuffer } from '@/lib/generate-pdf'
import { sendRecoveryReportEmail } from '@/lib/send-report-email'

function makeReportId() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const suffix = randomBytes(2).toString('hex').toUpperCase()
  return `BT-${y}${m}${d}-${suffix}`
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to generate your report.' }, { status: 401 })
    }

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
      return NextResponse.json({ error: 'Could not load your assessment.' }, { status: 500 })
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

    const user = await currentUser()
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
    } catch (e) {
      console.error('[generate-report] pdf', e)
      return NextResponse.json({ error: 'We could not build your PDF. Please try again.' }, { status: 500 })
    }

    const storagePath = `${userId}/${reportId}.pdf`
    const { error: upErr } = await supabaseAdmin.storage
      .from('reports')
      .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (upErr) {
      console.error('[generate-report] storage upload', upErr)
      return NextResponse.json({ error: 'We could not store your report. Please try again.' }, { status: 500 })
    }

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from('reports')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7)

    if (signErr || !signed?.signedUrl) {
      console.error('[generate-report] signed url', signErr)
      return NextResponse.json({ error: 'Could not create a download link.' }, { status: 500 })
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
      return NextResponse.json({ error: 'We could not finalise your report record.' }, { status: 500 })
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
    console.error('[generate-report]', e)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const maxDuration = 120
