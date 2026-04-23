import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
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

    const { data, error } = await supabaseAdmin
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

    if (error) {
      console.error('[save-detailed-assessment]', error)
      return NextResponse.json(
        { error: 'We could not save your assessment. Please try again shortly.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ id: data.id })
  } catch (e) {
    console.error('[save-detailed-assessment]', e)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
