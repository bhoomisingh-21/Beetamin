import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { normalizeFreeAssessment } from '@/lib/assessment-profile-fields'
import { persistFreeAssessmentForClerkUser } from '@/lib/persist-free-assessment'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { DetailedAssessmentPayload, FoodFrequencyKey } from '@/lib/recovery-report-types'

const FOOD_KEYS: FoodFrequencyKey[] = [
  'green_vegetables',
  'dairy',
  'eggs_or_nonveg',
  'nuts_seeds',
  'fresh_fruits',
]

function validatePayload(body: unknown): { ok: true; data: DetailedAssessmentPayload } | { ok: false; message: string } {
  if (!body || typeof body !== 'object') return { ok: false, message: 'Invalid request body' }
  const b = body as Record<string, unknown>

  const diet = typeof b.diet_type === 'string' ? b.diet_type.trim() : ''
  if (!diet) return { ok: false, message: 'diet_type is required' }

  const freq = b.food_frequency
  if (!freq || typeof freq !== 'object') return { ok: false, message: 'food_frequency is required' }
  const f = freq as Record<string, unknown>
  for (const key of FOOD_KEYS) {
    const v = f[key]
    if (v !== 'daily' && v !== 'sometimes' && v !== 'rarely') {
      return { ok: false, message: `food_frequency.${key} must be daily, sometimes, or rarely` }
    }
  }

  const str = (k: string) => (typeof b[k] === 'string' ? (b[k] as string).trim() : '')
  if (!str('sun_exposure')) return { ok: false, message: 'sun_exposure is required' }
  if (!Array.isArray(b.physical_symptoms)) {
    return { ok: false, message: 'physical_symptoms must be an array' }
  }
  if (!b.physical_symptoms.every((x) => typeof x === 'string')) {
    return { ok: false, message: 'physical_symptoms must be strings only' }
  }
  if (!str('energy_mood')) return { ok: false, message: 'energy_mood is required' }
  if (!str('sleep_quality')) return { ok: false, message: 'sleep_quality is required' }
  if (!str('digestion')) return { ok: false, message: 'digestion is required' }
  if (!str('exercise_level')) return { ok: false, message: 'exercise_level is required' }
  if (!str('water_intake')) return { ok: false, message: 'water_intake is required' }

  const menstrual =
    b.menstrual_health === null || b.menstrual_health === undefined
      ? null
      : typeof b.menstrual_health === 'string'
        ? b.menstrual_health.trim() || null
        : null

  const nullableStr = (k: string) => {
    const v = b[k]
    return typeof v === 'string' && v.trim() ? v.trim() : null
  }

  const nullableNum = (k: string) => {
    const v = b[k]
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string' && v.trim()) {
      const n = Number(v)
      if (Number.isFinite(n)) return n
    }
    return null
  }

  const strArray = (k: string): string[] => {
    const v = b[k]
    if (!Array.isArray(v)) return []
    return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
  }

  const conditionDetails =
    b.condition_details != null && typeof b.condition_details === 'object' && !Array.isArray(b.condition_details)
      ? (b.condition_details as Record<string, unknown>)
      : {}

  return {
    ok: true,
    data: {
      diet_type: diet,
      food_frequency: f as DetailedAssessmentPayload['food_frequency'],
      sun_exposure: str('sun_exposure'),
      physical_symptoms: (b.physical_symptoms as string[]).filter(Boolean),
      energy_mood: str('energy_mood'),
      sleep_quality: str('sleep_quality'),
      digestion: str('digestion'),
      exercise_level: str('exercise_level'),
      water_intake: str('water_intake'),
      menstrual_health: menstrual,
      gender: nullableStr('gender'),
      height_cm: nullableNum('height_cm'),
      weight_kg: nullableNum('weight_kg'),
      medical_conditions: strArray('medical_conditions'),
      allergies: strArray('allergies'),
      stress_level: nullableStr('stress_level'),
      condition_details: conditionDetails,
      weight_loss_target_kg: nullableNum('weight_loss_target_kg'),
    },
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'You need to be signed in to save your assessment.' }, { status: 401 })
    }

    let json: unknown
    try {
      json = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const validated = validatePayload(json)
    if (!validated.ok) {
      return NextResponse.json({ error: validated.message }, { status: 400 })
    }

    const user = await currentUser()
    const email =
      user?.primaryEmailAddress?.emailAddress ||
      (typeof (json as { email?: string }).email === 'string' ? (json as { email: string }).email : null)
    if (!email) {
      return NextResponse.json({ error: 'Could not determine your email. Please update your account.' }, { status: 400 })
    }

    const bodyObj = json as Record<string, unknown>
    const freeSnapshot = normalizeFreeAssessment(bodyObj.freeAssessmentResult)
    const freeMeta =
      bodyObj.assessmentMeta != null &&
      typeof bodyObj.assessmentMeta === 'object' &&
      !Array.isArray(bodyObj.assessmentMeta)
        ? bodyObj.assessmentMeta
        : null

    if (freeSnapshot) {
      try {
        await persistFreeAssessmentForClerkUser({
          clerkUserId: userId,
          freeAssessment: freeSnapshot,
          assessmentMeta: freeMeta,
        })
      } catch (persistErr) {
        console.error('[save-detailed-assessment] persist free quiz', persistErr)
      }
    }

    const insertRow: Record<string, unknown> = {
      user_id: userId,
      email,
      diet_type: validated.data.diet_type,
      food_frequency: validated.data.food_frequency,
      sun_exposure: validated.data.sun_exposure,
      physical_symptoms: validated.data.physical_symptoms,
      energy_mood: validated.data.energy_mood,
      sleep_quality: validated.data.sleep_quality,
      digestion: validated.data.digestion,
      exercise_level: validated.data.exercise_level,
      water_intake: validated.data.water_intake,
      menstrual_health: validated.data.menstrual_health,
      gender: validated.data.gender,
      height_cm: validated.data.height_cm,
      weight_kg: validated.data.weight_kg,
      medical_conditions: validated.data.medical_conditions,
      allergies: validated.data.allergies,
      stress_level: validated.data.stress_level,
      condition_details: validated.data.condition_details,
      weight_loss_target_kg: validated.data.weight_loss_target_kg,
    }
    if (freeSnapshot) {
      insertRow.free_assessment_snapshot = freeSnapshot
      insertRow.free_assessment_meta = freeMeta
    }

    const SELECT_COLUMNS =
      'id, gender, height_cm, weight_kg, medical_conditions, allergies, stress_level, condition_details, weight_loss_target_kg'

    const { data, error } = await supabaseAdmin
      .from('detailed_assessments')
      .insert(insertRow)
      .select(SELECT_COLUMNS)
      .single()

    if (error) {
      console.error('[save-detailed-assessment]', error)
      if (error.code === '42703' && freeSnapshot) {
        const { data: fallback, error: fallbackErr } = await supabaseAdmin
          .from('detailed_assessments')
          .insert({
            user_id: userId,
            email,
            diet_type: validated.data.diet_type,
            food_frequency: validated.data.food_frequency,
            sun_exposure: validated.data.sun_exposure,
            physical_symptoms: validated.data.physical_symptoms,
            energy_mood: validated.data.energy_mood,
            sleep_quality: validated.data.sleep_quality,
            digestion: validated.data.digestion,
            exercise_level: validated.data.exercise_level,
            water_intake: validated.data.water_intake,
            menstrual_health: validated.data.menstrual_health,
          })
          .select('id')
          .single()
        if (fallbackErr || !fallback?.id) {
          return NextResponse.json(
            { error: 'We could not save your assessment. Please try again shortly.' },
            { status: 500 },
          )
        }
        return NextResponse.json({ id: fallback.id, freeQuizStored: false })
      }
      return NextResponse.json(
        { error: 'We could not save your assessment. Please try again shortly.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      id: data.id,
      freeQuizStored: Boolean(freeSnapshot),
      gender: data.gender ?? null,
      height_cm: data.height_cm ?? null,
      weight_kg: data.weight_kg ?? null,
      medical_conditions: data.medical_conditions ?? [],
      allergies: data.allergies ?? [],
      stress_level: data.stress_level ?? null,
      condition_details: data.condition_details ?? {},
      weight_loss_target_kg: data.weight_loss_target_kg ?? null,
    })
  } catch (e) {
    console.error('[save-detailed-assessment]', e)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
