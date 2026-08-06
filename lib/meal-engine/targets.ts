/**
 * Daily calorie + macro targets: Mifflin-St Jeor BMR -> activity-adjusted TDEE -> goal- and
 * condition-adjusted macro split. Pure calculation, no network/DB calls.
 */

import type { ActivityLevel, DailyNutritionTargets, NutritionGoal, UserNutritionProfile } from './types'

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

const DEFAULT_AGE = 30
const DEFAULT_HEIGHT_CM = 165
const DEFAULT_WEIGHT_KG = 65
const DEFAULT_ACTIVITY: ActivityLevel = 'moderate'

/** Mifflin-St Jeor equation. `gender: 'other'`/unknown uses the midpoint of the male/female offset. */
export function calculateBMR(input: {
  age: number | null
  gender: 'male' | 'female' | 'other' | null
  heightCm: number | null
  weightKg: number | null
}): number {
  const age = input.age ?? DEFAULT_AGE
  const heightCm = input.heightCm ?? DEFAULT_HEIGHT_CM
  const weightKg = input.weightKg ?? DEFAULT_WEIGHT_KG

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  const offset = input.gender === 'male' ? 5 : input.gender === 'female' ? -161 : -78

  return Math.max(900, Math.round(base + offset))
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel | null): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel ?? DEFAULT_ACTIVITY]
  return Math.round(bmr * multiplier)
}

function hasAnyCondition(medicalConditions: string[], patterns: string[]): boolean {
  const lower = medicalConditions.map((c) => c.toLowerCase())
  return patterns.some((p) => lower.some((c) => c.includes(p)))
}

/** Calorie multiplier off TDEE for the user's stated goal. */
function calorieMultiplierForGoal(goal: NutritionGoal | null): number {
  if (goal === 'weight_loss') return 0.82 // ~18% deficit, within the 15-20% band
  if (goal === 'muscle_gain') return 1.125 // ~12.5% surplus, within the 10-15% band
  return 1
}

/** Macro split (protein/carb/fat as % of total calories) for goal + condition combination. */
function macroSplitPercent(
  goal: NutritionGoal | null,
  medicalConditions: string[],
): { proteinPct: number; carbsPct: number; fatPct: number } {
  let proteinPct = 20
  let carbsPct = 50
  let fatPct = 30

  if (goal === 'weight_loss') {
    proteinPct = 30
    carbsPct = 40
    fatPct = 30
  } else if (goal === 'muscle_gain') {
    proteinPct = 30
    carbsPct = 45
    fatPct = 25
  }

  const lowerCarbConditions = hasAnyCondition(medicalConditions, ['pcos', 'diabetes', 'thyroid'])
  if (lowerCarbConditions) {
    // Shift toward a lower-carb, higher-protein/fat split — sane for insulin-resistance-linked conditions.
    carbsPct -= 10
    proteinPct += 5
    fatPct += 5
  }

  // Normalize defensively in case future tuning breaks the 100% sum.
  const total = proteinPct + carbsPct + fatPct
  if (total !== 100) {
    const scale = 100 / total
    proteinPct = Math.round(proteinPct * scale)
    carbsPct = Math.round(carbsPct * scale)
    fatPct = 100 - proteinPct - carbsPct
  }

  return { proteinPct, carbsPct, fatPct }
}

/** ICMR/WHO-style fiber guideline (~14g / 1000 kcal), boosted for fiber-sensitive conditions/goals. */
function fiberTargetGrams(calories: number, goal: NutritionGoal | null, medicalConditions: string[]): number {
  const base = (calories / 1000) * 14
  const boost = hasAnyCondition(medicalConditions, ['pcos', 'diabetes', 'thyroid']) || goal === 'weight_loss' ? 1.25 : 1
  return Math.round(base * boost)
}

/**
 * Full daily calorie + macro target set for a user profile.
 * BMR -> TDEE (activity) -> goal-adjusted calories -> goal+condition-adjusted macro grams.
 */
export function calculateDailyTargets(profile: UserNutritionProfile): DailyNutritionTargets {
  const bmr = calculateBMR({
    age: profile.age,
    gender: profile.gender,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
  })
  const tdee = calculateTDEE(bmr, profile.activityLevel)

  const calorieMultiplier = calorieMultiplierForGoal(profile.goal)
  // Never dip below BMR — a floor against unsafe extreme deficits regardless of goal.
  const calories = Math.max(bmr, Math.round(tdee * calorieMultiplier))

  const { proteinPct, carbsPct, fatPct } = macroSplitPercent(profile.goal, profile.medicalConditions)

  const proteinG = Math.round((calories * (proteinPct / 100)) / 4)
  const carbsG = Math.round((calories * (carbsPct / 100)) / 4)
  const fatG = Math.round((calories * (fatPct / 100)) / 9)
  const fiberG = fiberTargetGrams(calories, profile.goal, profile.medicalConditions)

  return { bmr, tdee, calories, proteinG, carbsG, fatG, fiberG }
}

/** Share of daily calories allocated to each meal slot; used to keep picks calorie-appropriate. */
export const MEAL_TYPE_CALORIE_SHARE: Record<string, number> = {
  breakfast: 0.25,
  mid_morning_snack: 0.1,
  lunch: 0.3,
  evening_snack: 0.1,
  dinner: 0.25,
}
