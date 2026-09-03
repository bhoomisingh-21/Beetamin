/** Maps free-quiz answers onto the paid detailed-assessment payload so we never re-ask. */

export const FREE_DIET_TO_DETAILED: Record<string, string> = {
  vegetarian: 'Pure Vegetarian (no eggs, no meat)',
  lacto_ovo: 'Vegetarian (eggs are okay)',
  non_veg: 'Non-Vegetarian (chicken/fish/meat)',
  vegan: 'Vegan (no dairy, no eggs, no meat)',
}

export const FREE_ENERGY_TO_DETAILED: Record<string, string> = {
  fully_alert: 'Feeling mostly fine and energetic',
  slight_dip: 'Okay in morning but crashes by afternoon',
  major_crash: 'Exhausted all day even after full sleep',
  unpredictable: 'Okay in morning but crashes by afternoon',
}

export const FREE_SLEEP_TO_DETAILED: Record<string, string> = {
  refreshed: 'Fall asleep easily and wake up refreshed',
  slow_start: 'Sleep long hours but still wake up tired',
  exhausted: 'Sleep long hours but still wake up tired',
  wired_tired: 'Take a long time to fall asleep',
}

export const FREE_SYMPTOM_TO_DETAILED: Record<string, string> = {
  hair_loss: 'hair',
  brittle_nails: 'nails',
  dry_skin: 'skin',
  gum_issues: 'healing',
  joint_issues: 'joints',
  none: 'none',
}

export type MappedFreeToDetailed = {
  diet: string
  energy: string
  sleep: string
  symptoms: string[]
}

function metaString(meta: Record<string, unknown> | null | undefined, key: string): string {
  if (!meta) return ''
  const v = meta[key]
  return typeof v === 'string' ? v.trim() : ''
}

function readAnswers(meta: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!meta) return {}
  const nested = meta.answers
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as Record<string, unknown>
  }
  return meta
}

export function mapFreeMetaToDetailed(
  meta: Record<string, unknown> | null | undefined,
): MappedFreeToDetailed {
  const answers = readAnswers(meta)
  const dietKey = metaString(meta, 'diet') || (typeof answers.diet === 'string' ? answers.diet : '')
  const energyKey =
    typeof answers.energyLevel === 'string'
      ? answers.energyLevel
      : metaString(meta, 'metabolicRhythm')
  const sleepKey =
    typeof answers.sleepQuality === 'string'
      ? answers.sleepQuality
      : metaString(meta, 'sleepArchitecture')

  const rawSymptoms = Array.isArray(answers.physicalSymptoms)
    ? answers.physicalSymptoms
    : Array.isArray(meta?.dermalMarkers)
      ? meta.dermalMarkers
      : []

  const symptoms = (rawSymptoms as unknown[])
    .filter((s): s is string => typeof s === 'string')
    .map((s) => FREE_SYMPTOM_TO_DETAILED[s])
    .filter((s): s is string => Boolean(s))

  const uniqueSymptoms = [...new Set(symptoms)]

  return {
    diet: FREE_DIET_TO_DETAILED[dietKey] ?? '',
    energy: FREE_ENERGY_TO_DETAILED[energyKey] ?? '',
    sleep: FREE_SLEEP_TO_DETAILED[sleepKey] ?? '',
    symptoms: uniqueSymptoms.length > 0 ? uniqueSymptoms : [],
  }
}

export function lifestyleBarsFromMeta(meta: Record<string, unknown> | null | undefined): {
  label: string
  value: number
}[] {
  const answers = readAnswers(meta)
  const energy = typeof answers.energyLevel === 'string' ? answers.energyLevel : ''
  const sleep = typeof answers.sleepQuality === 'string' ? answers.sleepQuality : ''
  const immune = typeof answers.immuneHealth === 'string' ? answers.immuneHealth : ''
  const muscle = typeof answers.muscleRecovery === 'string' ? answers.muscleRecovery : ''

  const energyScore =
    energy === 'fully_alert' ? 88 : energy === 'slight_dip' ? 62 : energy === 'major_crash' ? 34 : energy ? 48 : 55
  const sleepScore =
    sleep === 'refreshed' ? 90 : sleep === 'slow_start' ? 58 : sleep === 'exhausted' ? 32 : sleep ? 44 : 55
  const immuneScore =
    immune === 'zero' ? 86 : immune === 'one_two' ? 64 : immune === 'three_four' ? 42 : immune ? 28 : 55
  const recoveryScore =
    muscle === 'none' ? 88 : muscle === 'mild' ? 68 : muscle === 'moderate' ? 46 : muscle ? 30 : 55

  return [
    { label: 'Energy', value: energyScore },
    { label: 'Sleep', value: sleepScore },
    { label: 'Immunity', value: immuneScore },
    { label: 'Recovery', value: recoveryScore },
  ]
}
