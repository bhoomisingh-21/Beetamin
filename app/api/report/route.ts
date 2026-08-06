import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { resolvePatientDiet } from '@/lib/patient-diet'
import type { DetailedAssessmentPayload } from '@/lib/recovery-report-types'
import {
  coerceRecoveryReportV2,
  generateEngineMealPlan,
  generateRecoveryReportV2Payload,
} from '@/lib/recovery-report-v2-groq'
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
    gender: typeof row.gender === 'string' ? row.gender : null,
    height_cm: typeof row.height_cm === 'number' ? row.height_cm : null,
    weight_kg: typeof row.weight_kg === 'number' ? row.weight_kg : null,
    medical_conditions: Array.isArray(row.medical_conditions)
      ? (row.medical_conditions as unknown[]).filter((x): x is string => typeof x === 'string')
      : [],
    allergies: Array.isArray(row.allergies)
      ? (row.allergies as unknown[]).filter((x): x is string => typeof x === 'string')
      : [],
    stress_level: typeof row.stress_level === 'string' ? row.stress_level : null,
    condition_details:
      row.condition_details && typeof row.condition_details === 'object' && !Array.isArray(row.condition_details)
        ? (row.condition_details as Record<string, unknown>)
        : {},
    weight_loss_target_kg: typeof row.weight_loss_target_kg === 'number' ? row.weight_loss_target_kg : null,
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
  const dietSummary =
    assessmentResult &&
    typeof assessmentResult === 'object' &&
    !Array.isArray(assessmentResult) &&
    typeof (assessmentResult as Record<string, unknown>).dietSummary === 'string'
      ? ((assessmentResult as Record<string, unknown>).dietSummary as string)
      : undefined
  const resolvedDiet = resolvePatientDiet({
    detailedDietType: detailed?.diet_type,
    freeQuizDiet: diet,
    dietSummary,
  })

  const reportId = `BT-${Date.now().toString(36).toUpperCase()}`
  const reportGenerationInput = {
    patientName,
    freeAssessment: assessmentResult,
    detailed,
    age,
    diet: resolvedDiet.label,
    goal,
    reportId,
  }

  try {
    const raw = await generateRecoveryReportV2Payload(reportGenerationInput)

    let mealPlan
    try {
      mealPlan = await generateEngineMealPlan(reportGenerationInput)
    } catch (mealError) {
      // Loud + traceable: meals table empty/missing, or engine failure — never ship a broken/empty plan.
      console.error('[api/report] meal engine', mealError)
      return NextResponse.json(
        {
          success: false,
          error: mealError instanceof Error ? mealError.message : 'Meal plan generation failed',
        },
        { status: 503 },
      )
    }

    const reportData = coerceRecoveryReportV2(
      raw,
      {
        name: patientName,
        age,
        diet: resolvedDiet.label,
        goal,
        reportId,
        generatedAt: new Date().toISOString(),
      },
      mealPlan,
    )

    return NextResponse.json({
      success: true,
      reportData,
    })
  } catch (e) {
    console.error('[api/report] generation', e)
    return NextResponse.json({ success: false, error: 'Generation failed' }, { status: 500 })
  }
}
