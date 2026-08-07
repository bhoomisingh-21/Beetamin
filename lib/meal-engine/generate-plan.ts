/**
 * Deterministic weekly meal plan generator. Pure function over data passed in — no network/DB
 * calls here; fetching `meals` from Supabase is the integration layer's job.
 *
 * Selection is deficiency/condition-driven: each meal slot targets a rotating priority need
 * (iron, PCOS, vitamin D, etc.) and picks the highest-scoring eligible meal — not random variety.
 */

import { MEAL_TYPE_CALORIE_SHARE, calculateDailyTargets } from './targets'
import {
  buildSelectionTargets,
  countHealthyMealKeywords,
  countRegionalSpecialtyKeywords,
  getBoostedHealthTags,
  isMealEligible,
  MIN_STRICT_POOL_PER_SLOT,
  mealContainsExcludedFood,
  mealMatchesTarget,
  mealTextBlob,
  HEALTHY_KEYWORD_BOOST,
  REGIONAL_SPECIALTY_PENALTY,
  type SelectionTarget,
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

/** Slot-level weight multiplier for the day's primary target vs secondary profile needs. */
const SLOT_TARGET_TAG_WEIGHT = 10
const SLOT_TARGET_INGREDIENT_WEIGHT = 7
const SECONDARY_TARGET_TAG_WEIGHT = 4
const SECONDARY_TARGET_INGREDIENT_WEIGHT = 3
const GLOBAL_BOOST_WEIGHT = 2
const HEALTHY_KEYWORD_CAP = 6

/** Short health-quality labels derived from meal tags for PDF display names. */
const TAG_DISPLAY_LABELS: Partial<Record<HealthTag, string>> = {
  iron_rich: 'Iron-Rich',
  low_gi: 'Low-GI',
  high_fiber: 'High-Fiber',
  high_protein: 'High-Protein',
  pcos: 'PCOS-Friendly',
  gut_friendly: 'Gut-Support',
  calcium_rich: 'Calcium-Rich',
  vitamin_d: 'Vitamin D',
  vitamin_b12: 'B12-Support',
  heart_healthy: 'Heart-Healthy',
  weight_loss: 'Weight-Loss',
  diabetes: 'Diabetes-Safe',
}

/** Deterministically turns an arbitrary seed string into a 32-bit integer for tie-breaking. */
function hashSeedToInt(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 — small, fast, seeded PRNG. Used only to break ties among equally good meals. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function slotTargetIndex(day: number, slotIndex: number, targetCount: number): number {
  if (targetCount === 0) return 0
  return ((day - 1) * MEAL_TYPES_ORDERED.length + slotIndex) % targetCount
}

function scoreMealForSlot(
  meal: MealRow,
  slotTarget: SelectionTarget,
  allTargets: SelectionTarget[],
  globalBoosts: Map<HealthTag, TagBoost>,
  targetCaloriesForSlot: number,
): number {
  if (mealContainsExcludedFood(meal)) return 0

  let score = 0
  const text = mealTextBlob(meal)

  for (const { tag, weight } of slotTarget.healthTagBoosts) {
    if (meal.health_tags.includes(tag)) score += weight * SLOT_TARGET_TAG_WEIGHT
  }
  for (const kw of slotTarget.ingredientKeywords) {
    if (text.includes(kw)) score += SLOT_TARGET_INGREDIENT_WEIGHT
  }

  for (const target of allTargets) {
    if (target.id === slotTarget.id) continue
    for (const { tag, weight } of target.healthTagBoosts) {
      if (meal.health_tags.includes(tag)) score += weight * SECONDARY_TARGET_TAG_WEIGHT
    }
    for (const kw of target.ingredientKeywords) {
      if (text.includes(kw)) score += SECONDARY_TARGET_INGREDIENT_WEIGHT
    }
  }

  for (const tag of meal.health_tags) {
    const boost = globalBoosts.get(tag)
    if (boost) score += boost.weight * GLOBAL_BOOST_WEIGHT
  }

  if (targetCaloriesForSlot > 0) {
    const diffRatio = Math.abs(meal.calories - targetCaloriesForSlot) / targetCaloriesForSlot
    if (diffRatio <= 0.15) score += 3
    else if (diffRatio <= 0.3) score += 1
  }

  const healthyHits = Math.min(HEALTHY_KEYWORD_CAP, countHealthyMealKeywords(text))
  score += healthyHits * HEALTHY_KEYWORD_BOOST

  const regionalHits = countRegionalSpecialtyKeywords(text)
  score -= regionalHits * REGIONAL_SPECIALTY_PENALTY

  return Math.max(0, score)
}

function matchedIngredientHints(meal: MealRow, target: SelectionTarget, max = 2): string[] {
  const text = mealTextBlob(meal)
  const hits: string[] = []
  for (const kw of target.ingredientKeywords) {
    if (text.includes(kw)) {
      hits.push(kw)
      if (hits.length >= max) break
    }
  }
  return hits
}

function buildReason(
  meal: MealRow,
  slotTarget: SelectionTarget,
  allTargets: SelectionTarget[],
): { deficiencyTarget: string; reason: string } {
  const matchedLabels: string[] = []

  if (mealMatchesTarget(meal, slotTarget)) {
    matchedLabels.push(slotTarget.label)
  }

  for (const target of allTargets) {
    if (target.id === slotTarget.id) continue
    if (target.kind === 'condition' && mealMatchesTarget(meal, target)) {
      matchedLabels.push(target.label)
    }
  }

  if (matchedLabels.length === 0) {
    for (const target of allTargets) {
      if (target.id === slotTarget.id) continue
      if (mealMatchesTarget(meal, target)) {
        matchedLabels.push(target.label)
      }
    }
  }

  const deficiencyTarget =
    matchedLabels.length > 0 ? matchedLabels.join(' + ') : slotTarget.label

  const hints = matchedIngredientHints(meal, slotTarget)
  const ingredientNote =
    hints.length > 0
      ? ` — rich in ${hints.join(', ')} for your ${slotTarget.label.toLowerCase()} focus`
      : ''

  const tagHits = slotTarget.healthTagBoosts
    .filter(({ tag }) => meal.health_tags.includes(tag))
    .map(({ tag }) => tag.replace(/_/g, ' '))

  const tagNote =
    tagHits.length > 0 && hints.length === 0
      ? ` — ${tagHits.slice(0, 2).join(' + ')} profile supports ${slotTarget.label.toLowerCase()}`
      : ''

  return {
    deficiencyTarget,
    reason: `Selected to target ${slotTarget.label}${ingredientNote || tagNote || ' based on your assessment priorities'}.`,
  }
}

function buildHealthFocusedDisplayName(
  meal: MealRow,
  slotTarget: SelectionTarget,
  deficiencyTarget: string,
  mealType: MealType,
): string {
  const raw = meal.meal_name.trim()

  if (/iron-rich|low-gi|pcos-friendly|high-fiber|high-protein|vitamin|clinical|recovery/i.test(raw)) {
    return raw
  }

  const tagLabels = meal.health_tags
    .map((tag) => TAG_DISPLAY_LABELS[tag])
    .filter((label): label is string => Boolean(label))
    .slice(0, 2)

  const healthPrefix = tagLabels.length > 0 ? tagLabels.join(' ') : slotTarget.label
  const timingShort = TIMING_LABEL[mealType]
  const targets = deficiencyTarget
    .split('+')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' + ')

  const simplified = raw
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (targets) {
    return `${healthPrefix} ${timingShort}: ${simplified} (${targets})`
  }
  return `${healthPrefix} ${timingShort}: ${simplified}`
}

function dayFocusLabel(day: number, targets: SelectionTarget[]): string {
  if (targets.length === 0) return 'Balanced nutrition'

  const dayStartIndex = ((day - 1) * MEAL_TYPES_ORDERED.length) % targets.length
  const dayTargets = MEAL_TYPES_ORDERED.map((_, i) => targets[(dayStartIndex + i) % targets.length])
  const uniqueLabels = [...new Set(dayTargets.map((t) => t.label))]

  return uniqueLabels.slice(0, 3).join(', ')
}

/**
 * Picks the highest-scoring meal. Among near-ties (≥92% of max), prefers meals not yet used
 * this week; remaining ties broken deterministically via seeded RNG.
 */
function pickBestMeal(
  candidates: MealRow[],
  scoreFn: (meal: MealRow) => number,
  used: Set<string>,
  rng: () => number,
): MealRow {
  const scored = candidates.map((meal) => ({ meal, score: scoreFn(meal) }))
  const maxScore = Math.max(...scored.map((s) => s.score))

  if (maxScore <= 0) {
    const unused = candidates.filter((m) => !used.has(m.id))
    const pool = unused.length > 0 ? unused : candidates
    return pool[Math.floor(rng() * pool.length)]
  }

  const threshold = maxScore * 0.92
  let top = scored.filter((s) => s.score >= threshold)

  const unusedTop = top.filter((s) => !used.has(s.meal.id))
  if (unusedTop.length > 0) top = unusedTop

  top.sort((a, b) => b.score - a.score)
  const bestScore = top[0].score
  const ties = top.filter((s) => s.score === bestScore)
  return ties[Math.floor(rng() * ties.length)].meal
}

/**
 * Generates a 7-day x 5-meal-slot plan for the given profile from the supplied meal pool.
 *
 * - Hard-filters ineligible meals (diet-type mismatch, allergen conflict) before any selection.
 * - Each slot rotates through the user's deficiencies, conditions, and goal as primary targets.
 * - Picks the best-scoring eligible meal for that slot's target — not random regional variety.
 */
export function generateWeeklyMealPlan(profile: UserNutritionProfile, meals: MealRow[]): MealPlanDayV3[] {
  const rng = mulberry32(hashSeedToInt(profile.seed || 'default-seed'))
  const selectionTargets = buildSelectionTargets(profile)
  const globalBoosts = getBoostedHealthTags(profile)
  const dailyTargets = calculateDailyTargets(profile)

  const eligibleByType = new Map<MealType, MealRow[]>()
  for (const mealType of MEAL_TYPES_ORDERED) {
    const typeMeals = meals.filter((m) => m.meal_type === mealType)
    const strictPool = typeMeals.filter((m) => isMealEligible(m, profile))
    if (strictPool.length >= MIN_STRICT_POOL_PER_SLOT) {
      eligibleByType.set(mealType, strictPool)
      continue
    }

    const relaxedPool = typeMeals.filter((m) => isMealEligible(m, profile, { relaxStrictHealth: true }))
    if (relaxedPool.length > strictPool.length) {
      console.warn(
        `[meal-engine] ${mealType}: strict pool=${strictPool.length} — using relaxed fallback (${relaxedPool.length})`,
      )
      eligibleByType.set(mealType, relaxedPool)
    } else {
      eligibleByType.set(mealType, strictPool)
    }
  }

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
        used.clear()
        candidates = pool
      }

      const slotTarget = selectionTargets[slotTargetIndex(day, slotIndex, selectionTargets.length)]
      const targetCaloriesForSlot = dailyTargets.calories * (MEAL_TYPE_CALORIE_SHARE[mealType] ?? 0.2)

      const chosen = pickBestMeal(
        candidates,
        (meal) =>
          scoreMealForSlot(meal, slotTarget, selectionTargets, globalBoosts, targetCaloriesForSlot),
        used,
        rng,
      )

      used.add(chosen.id)

      const { deficiencyTarget, reason } = buildReason(chosen, slotTarget, selectionTargets)
      const displayName = buildHealthFocusedDisplayName(chosen, slotTarget, deficiencyTarget, mealType)

      dayMeals.push({
        timing: TIMING_LABEL[mealType],
        mealName: displayName,
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

    days.push({ day, focus: dayFocusLabel(day, selectionTargets), meals: dayMeals })
  }

  return days
}
