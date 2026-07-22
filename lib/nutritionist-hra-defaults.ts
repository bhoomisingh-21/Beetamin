import type { PortalClientBundle } from '@/lib/nutritionist-types'
import { parseNutritionistHra, type NutritionistHraForm } from '@/lib/nutritionist-hra-types'

function metaString(meta: unknown, key: string): string {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return ''
  const v = (meta as Record<string, unknown>)[key]
  return typeof v === 'string' ? v.trim() : ''
}

/** Merge saved HRA with client assessment / progress for empty fields. */
export function buildHraFormDefaults(bundle: PortalClientBundle): NutritionistHraForm {
  const { client, progressLogs, detailedAssessment } = bundle
  const saved = parseNutritionistHra(client.nutritionist_hra)
  const meta = client.assessment_meta
  const result =
    client.assessment_result && typeof client.assessment_result === 'object' && !Array.isArray(client.assessment_result)
      ? (client.assessment_result as Record<string, unknown>)
      : null

  const latestWeight = progressLogs.find((l) => l.weight_kg != null)?.weight_kg
  const height = client.height_cm ?? progressLogs.find((l) => l.height_cm != null)?.height_cm ?? null

  const activity =
    saved.activity_level ||
    metaString(meta, 'activity') ||
    metaString(meta, 'activityLevel') ||
    (typeof result?.activityLevel === 'string' ? result.activityLevel : '') ||
    detailedAssessment?.exercise_level ||
    ''

  const food =
    saved.food_preference ||
    detailedAssessment?.diet_type ||
    (typeof result?.diet === 'string' ? result.diet : '') ||
    ''

  return {
    phone: String(client.phone || '').trim(),
    gender: saved.gender || metaString(meta, 'gender') || metaString(meta, 'sex') || '',
    age: saved.age ?? (Number(metaString(meta, 'age')) || null),
    actual_weight_kg: saved.actual_weight_kg ?? (latestWeight != null ? Number(latestWeight) : null),
    desired_weight_kg: saved.desired_weight_kg ?? null,
    height_cm: saved.height_cm ?? (height != null ? Number(height) : null),
    country: saved.country || metaString(meta, 'country') || 'India',
    community: saved.community || metaString(meta, 'community') || metaString(meta, 'state') || '',
    activity_level: activity,
    goal: saved.goal || client.assessment_goal || '',
    food_preference: food,
    allergies: saved.allergies || 'No allergy',
    diseases: saved.diseases || 'No diseases',
    clinical_notes: saved.clinical_notes || '',
    updated_at: saved.updated_at,
  }
}
