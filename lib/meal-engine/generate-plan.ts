/**
 * Deterministic weekly meal plan generator. Pure function over data passed in — no network/DB
 * calls here; fetching `meals` from Supabase is the integration layer's job.
 */

import { MEAL_TYPE_CALORIE_SHARE, calculateDailyTargets } from './targets'
import {
  HEALTHY_MEAL_KEYWORDS,
  getBoostedHealthTags,
  isMealEligible,
  labelForBoostSource,
  mealContainsExcludedFood,
  type TagBoost,
} from './rules'
import type { HealthTag, MealPlanDayV3, MealPlanMealV3, MealRow, MealType, UserNutritionProfile } from './types'

const MEAL_TYPES_ORDERED: MealType[] = ['breakfast', 'mid_morning_snack', 'lunch', 'evening_snack', 'dinner']

const TIMING_LABEL: Record<MealType, string> = {
  breakfast: 'Breakfast',
  mid_morning_snack: 'Mid-Morning Snack',
  lunch: 'Lunch',
  evening_snack: 'Evening Snack',
  dinner: 'Dinner',
}

const DAYS_PER_WEEK = 7

/** Deterministically turns an arbitrary seed string into a 32-bit integer for the PRNG. */
function hashSeedToInt(seed: string): number {
  let h = 2166136261 // FNV-1a offset basis
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 — small, fast, seeded PRNG. Same seed always produces the same sequence. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Weighted random pick from `candidates` using `weights` (same length/order), via the seeded PRNG. */
function weightedPick<T>(candidates: T[], weights: number[], rng: () => number): number {
  const total = weights.reduce((sum, w) => sum + w, 0)
  if (total <= 0) return Math.floor(rng() * candidates.length)

  let roll = rng() * total
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return i
  }
  return candidates.length - 1
}

function scoreMeal(
  meal: MealRow,
  boostedTags: Map<HealthTag, TagBoost>,
  targetCaloriesForSlot: number,
): number {
  let score = 1

  for (const tag of meal.health_tags) {
    const boost = boostedTags.get(tag)
    if (boost) score += boost.weight
  }

  const text = [meal.meal_name, ...meal.ingredients].join(' ').toLowerCase()
  if (mealContainsExcludedFood(meal)) score = 0
  else {
    for (const kw of HEALTHY_MEAL_KEYWORDS) {
      if (text.includes(kw)) score += 0.75
    }
  }

  if (targetCaloriesForSlot > 0) {
    const diffRatio = Math.abs(meal.calories - targetCaloriesForSlot) / targetCaloriesForSlot
    if (diffRatio <= 0.15) score += 1.5
    else if (diffRatio <= 0.3) score += 0.5
  }

  return Math.max(0.1, score)
}

function buildReason(
  meal: MealRow,
  boostedTags: Map<HealthTag, TagBoost>,
): { deficiencyTarget: string; reason: string } {
  let best: TagBoost | null = null
  for (const tag of meal.health_tags) {
    const boost = boostedTags.get(tag)
    if (boost && (!best || boost.weight > best.weight)) best = boost
  }

  if (!best) {
    return {
      deficiencyTarget: 'Balance',
      reason: `A balanced, nutrient-dense pick to keep your daily targets on track.`,
    }
  }

  const label = labelForBoostSource(best.source)
  const tagLabel = best.tag.replace(/_/g, ' ')
  return {
    deficiencyTarget: label,
    reason: `Chosen for its ${tagLabel} profile — directly supports ${label}.`,
  }
}

function dayFocusLabel(day: number, profile: UserNutritionProfile): string {
  const rotationSources = [...profile.primaryDeficiencies, ...profile.medicalConditions, profile.goal].filter(
    (x): x is string => typeof x === 'string' && x.trim().length > 0,
  )
  if (rotationSources.length === 0) return 'Steady, balanced nutrition for your day.'

  const source = rotationSources[(day - 1) % rotationSources.length]
  const label = labelForBoostSource(source.toLowerCase().replace(/\s+/g, '_'))
  return `${label.charAt(0).toUpperCase() + label.slice(1)} — today's meals are weighted to support this.`
}

/**
 * Generates a 7-day x 5-meal-slot plan for the given profile from the supplied meal pool.
 *
 * - Hard-filters ineligible meals (diet-type mismatch, allergen conflict) before any selection.
 * - Boosts meals whose `health_tags` match the profile's conditions/deficiencies/goal.
 * - Seeded weighted-random selection avoids repeats until the eligible pool for a slot is
 *   exhausted, then resets — so a small catalog still produces a full 7-day plan.
 * - Health + condition appropriateness drive selection (not regional cuisine variety).
 */
export function generateWeeklyMealPlan(profile: UserNutritionProfile, meals: MealRow[]): MealPlanDayV3[] {
  const rng = mulberry32(hashSeedToInt(profile.seed || 'default-seed'))
  const boostedTags = getBoostedHealthTags(profile)
  const dailyTargets = calculateDailyTargets(profile)

  const eligibleByType = new Map<MealType, MealRow[]>()
  for (const mealType of MEAL_TYPES_ORDERED) {
    eligibleByType.set(
      mealType,
      meals.filter((m) => m.meal_type === mealType && isMealEligible(m, profile)),
    )
  }

  // Track which meal ids have already been used per slot this week; reset once a slot's pool is exhausted.
  const usedByType = new Map<MealType, Set<string>>()
  for (const mealType of MEAL_TYPES_ORDERED) usedByType.set(mealType, new Set())

  const days: MealPlanDayV3[] = []

  for (let day = 1; day <= DAYS_PER_WEEK; day++) {
    const dayMeals: MealPlanMealV3[] = []

    for (let slotIndex = 0; slotIndex < MEAL_TYPES_ORDERED.length; slotIndex++) {
      const mealType = MEAL_TYPES_ORDERED[slotIndex]
      const pool = eligibleByType.get(mealType) ?? []
      if (pool.length === 0) continue

      const used = usedByType.get(mealType)!
      let candidates = pool.filter((m) => !used.has(m.id))
      if (candidates.length === 0) {
        // Eligible pool exhausted for this slot — reset so the week can keep filling this slot.
        used.clear()
        candidates = pool
      }

      const targetCaloriesForSlot = dailyTargets.calories * (MEAL_TYPE_CALORIE_SHARE[mealType] ?? 0.2)

      const weights = candidates.map((m) => scoreMeal(m, boostedTags, targetCaloriesForSlot))
      const pickIndex = weightedPick(candidates, weights, rng)
      const chosen = candidates[pickIndex]

      used.add(chosen.id)

      const { deficiencyTarget, reason } = buildReason(chosen, boostedTags)

      dayMeals.push({
        timing: TIMING_LABEL[mealType],
        mealName: chosen.meal_name,
        mealType,
        cuisine: chosen.cuisine,
        calories: chosen.calories,
        protein: chosen.protein_g,
        carbs: chosen.carbs_g,
        fat: chosen.fat_g,
        fiber: chosen.fiber_g,
        servingSize: chosen.serving_size,
        prepNotes: chosen.preparation_notes ?? undefined,
        hydrationTip: chosen.hydration_tip ?? 'Sip warm water through the day; avoid gulping large volumes right after meals.',
        healthyAlternative: chosen.healthy_alternative ?? undefined,
        deficiencyTarget,
        reason,
      })
    }

    days.push({ day, focus: dayFocusLabel(day, profile), meals: dayMeals })
  }

  return days
}
