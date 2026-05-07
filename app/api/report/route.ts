import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { DetailedAssessmentPayload } from '@/lib/recovery-report-types'
import { coerceRecoveryReportV2, generateRecoveryReportV2Payload } from '@/lib/recovery-report-v2-groq'
import { supabaseAdmin } from '@/lib/supabase-admin'

/** Recovery report Groq prompt + JSON shape live in `recovery-report-v2-groq.ts`. */
export const runtime = 'nodejs'
export const maxDuration = 300

function mapDetailedRow(row: Record<string, unknown>): DetailedAssessmentPayload {
  return {
    diet_type: typeof row.diet_type === 'string' ? row.diet_type : String(row.diet_type ?? ''),
    food_frequency:
      row.food_frequency && typeof row.food_frequency === 'object'
        ? (row.food_frequency as DetailedAssessmentPayload['food_frequency'])
        : ({} as DetailedAssessmentPayload['food_frequency']),
    sun_exposure: typeof row.sun_exposure === 'string' ? row.sun_exposure : String(row.sun_exposure ?? ''),
    physical_symptoms: Array.isArray(row.physical_symptoms)
      ? (row.physical_symptoms as unknown[]).filter((x): x is string => typeof x === 'string')
      : [],
    energy_mood: typeof row.energy_mood === 'string' ? row.energy_mood : String(row.energy_mood ?? ''),
    sleep_quality: typeof row.sleep_quality === 'string' ? row.sleep_quality : String(row.sleep_quality ?? ''),
    digestion: typeof row.digestion === 'string' ? row.digestion : String(row.digestion ?? ''),
    exercise_level: typeof row.exercise_level === 'string' ? row.exercise_level : String(row.exercise_level ?? ''),
    water_intake: typeof row.water_intake === 'string' ? row.water_intake : String(row.water_intake ?? ''),
    menstrual_health:
      row.menstrual_health == null ? null : typeof row.menstrual_health === 'string' ? row.menstrual_health : String(row.menstrual_health),
  }
}

export async function POST(req: Request) {
  let userId: string | null = null
  try {
    userId = (await auth()).userId ?? null
  } catch (e) {
    console.error('[api/report] auth', e)
    return NextResponse.json({ success: false, error: 'Auth unavailable' }, { status: 503 })
  }
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let parsed: Record<string, unknown>
  try {
    parsed = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const assessmentResult = parsed.assessmentResult
  const name = typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : ''
  const age = typeof parsed.age === 'string' ? parsed.age : 'Not specified'
  const diet = typeof parsed.diet === 'string' ? parsed.diet : 'Mixed'
  const goal = typeof parsed.goal === 'string' ? parsed.goal : 'Personalised nutrient recovery'
  const detailedAssessmentId =
    typeof parsed.detailedAssessmentId === 'string' ? parsed.detailedAssessmentId.trim() : ''

  if (!assessmentResult || typeof assessmentResult !== 'object') {
    return NextResponse.json({ success: false, error: 'assessmentResult is required' }, { status: 400 })
  }

  let detailed: DetailedAssessmentPayload | null = null
  if (detailedAssessmentId) {
    const { data: row, error } = await supabaseAdmin
      .from('detailed_assessments')
      .select('*')
      .eq('id', detailedAssessmentId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !row) {
      return NextResponse.json({ success: false, error: 'Detailed assessment not found' }, { status: 404 })
    }
    detailed = mapDetailedRow(row as Record<string, unknown>)
  }

  let clerkFallbackName = ''
  try {
    const u = await currentUser()
    clerkFallbackName = u?.fullName || u?.firstName || ''
  } catch {
    /* ignore */
  }

  const patientName = name || clerkFallbackName || 'Patient'

  try {
    const raw = await generateRecoveryReportV2Payload({
      patientName,
      freeAssessment: assessmentResult,
      detailed,
      age,
      diet: detailed?.diet_type ?? diet,
      goal,
    })

    const reportId = `BT-${Date.now().toString(36).toUpperCase()}`
    const reportData = coerceRecoveryReportV2(raw, {
      name: patientName,
      age,
      diet,
      goal,
      reportId,
      generatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      reportData,
    })
  } catch (e) {
    console.error('[api/report] generation', e)
    return NextResponse.json({ success: false, error: 'Generation failed' }, { status: 500 })
  }
}
