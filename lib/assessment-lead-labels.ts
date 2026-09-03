/** Human-readable labels for the assessment lead sheet. Codes only — never dump raw answers. */

const GOAL_LABELS: Record<string, string> = {
  energy: 'More energy',
  focus: 'Better focus',
  skin_hair: 'Skin, hair & nails',
  recovery: 'Strength & recovery',
  immunity: 'Build immunity',
  hormones: 'Hormonal balance',
  wellness: 'Overall wellness',
  weight_loss: 'Weight loss',
  muscle_gain: 'Muscle gain',
}

const DIET_LABELS: Record<string, string> = {
  vegetarian: 'Pure vegetarian',
  lacto_ovo: 'Vegetarian + eggs',
  non_veg: 'Non-vegetarian',
  vegan: 'Vegan',
  irregular: 'Irregular meals',
}

const ENERGY_LABELS: Record<string, string> = {
  fully_alert: 'Fully alert',
  slight_dip: 'Afternoon energy dip',
  major_crash: 'Major energy crash',
  unpredictable: 'Unpredictable energy',
}

const SLEEP_LABELS: Record<string, string> = {
  refreshed: 'Refreshed on waking',
  slow_start: 'Slow to feel awake',
  exhausted: 'Exhausted after sleep',
  wired_tired: 'Wired but tired',
}

const CONCERN_LABELS: Record<string, string> = {
  hair_loss: 'Hair thinning / shedding',
  brittle_nails: 'Brittle nails',
  dry_skin: 'Dry or dull skin',
  dry_eyes: 'Dry or puffy eyes',
  gum_issues: 'Gum issues / slow healing',
  joint_issues: 'Joint stiffness',
  none: 'None reported',
  unsure: 'Unsure',
}

const GENDER_LABELS: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
}

export type AssessmentLeadSnapshot = {
  goal: string
  diet: string
  energy: string
  sleep: string
  concerns: string[]
  gender: string
  heightCm: string
  weightKg: string
}

export function isValidLeadBodyMetrics(snapshot: AssessmentLeadSnapshot): boolean {
  const h = Number(snapshot.heightCm)
  const w = Number(snapshot.weightKg)
  return (
    (snapshot.gender === 'male' || snapshot.gender === 'female' || snapshot.gender === 'other') &&
    Number.isFinite(h) &&
    h >= 50 &&
    h <= 250 &&
    Number.isFinite(w) &&
    w >= 20 &&
    w <= 300
  )
}

export function parseLeadSnapshot(raw: unknown): AssessmentLeadSnapshot {
  const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  const concerns = Array.isArray(o.concerns)
    ? o.concerns.filter((c): c is string => typeof c === 'string').slice(0, 8)
    : []
  return {
    goal: typeof o.goal === 'string' ? o.goal.slice(0, 50) : '',
    diet: typeof o.diet === 'string' ? o.diet.slice(0, 50) : '',
    energy: typeof o.energy === 'string' ? o.energy.slice(0, 50) : '',
    sleep: typeof o.sleep === 'string' ? o.sleep.slice(0, 50) : '',
    concerns,
    gender: typeof o.gender === 'string' ? o.gender.slice(0, 20) : '',
    heightCm: typeof o.heightCm === 'string' ? o.heightCm.slice(0, 8) : '',
    weightKg: typeof o.weightKg === 'string' ? o.weightKg.slice(0, 8) : '',
  }
}

export function formatLeadSnapshot(snapshot: AssessmentLeadSnapshot): {
  goal: string
  diet: string
  energy: string
  sleep: string
  healthConcern: string
  gender: string
  height: string
  weight: string
} {
  const concernLabels = snapshot.concerns
    .map((c) => CONCERN_LABELS[c] ?? '')
    .filter(Boolean)
  const h = snapshot.heightCm.trim()
  const w = snapshot.weightKg.trim()
  return {
    goal: GOAL_LABELS[snapshot.goal] ?? snapshot.goal,
    diet: DIET_LABELS[snapshot.diet] ?? snapshot.diet,
    energy: ENERGY_LABELS[snapshot.energy] ?? snapshot.energy,
    sleep: SLEEP_LABELS[snapshot.sleep] ?? snapshot.sleep,
    healthConcern: concernLabels.join('; '),
    gender: GENDER_LABELS[snapshot.gender] ?? snapshot.gender,
    height: h ? `${h} cm` : '',
    weight: w ? `${w} kg` : '',
  }
}
