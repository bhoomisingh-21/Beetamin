/**
 * Maps a user's medical conditions, deficiencies and goal to boosted `health_tags`, plus the
 * hard filters (diet-type compatibility, allergen exclusion) every candidate meal must pass.
 */

import type { HealthTag, MealRow, UserNutritionProfile } from './types'

/** condition/deficiency/goal keyword -> health tags it should boost, with a relative weight. */
export type TagBoost = { tag: HealthTag; weight: number; source: string }

const CONDITION_TAG_RULES: { pattern: string; boosts: Array<{ tag: HealthTag; weight: number }> }[] = [
  { pattern: 'pcos', boosts: [{ tag: 'low_gi', weight: 3 }, { tag: 'gut_friendly', weight: 2 }, { tag: 'high_fiber', weight: 2 }] },
  { pattern: 'diabetes', boosts: [{ tag: 'low_gi', weight: 3 }, { tag: 'low_carb', weight: 3 }, { tag: 'high_fiber', weight: 1 }] },
  { pattern: 'thyroid', boosts: [{ tag: 'iron_rich', weight: 2 }, { tag: 'high_fiber', weight: 2 }, { tag: 'low_gi', weight: 1 }] },
  { pattern: 'hypertension', boosts: [{ tag: 'heart_healthy', weight: 3 }, { tag: 'low_gi', weight: 1 }] },
  { pattern: 'heart', boosts: [{ tag: 'heart_healthy', weight: 3 }] },
]

const DEFICIENCY_TAG_RULES: Record<string, HealthTag> = {
  iron: 'iron_rich',
  vitamin_d: 'vitamin_d',
  'vitamin d': 'vitamin_d',
  vitamin_b12: 'vitamin_b12',
  b12: 'vitamin_b12',
  calcium: 'calcium_rich',
}

const GOAL_TAG_RULES: Record<string, Array<{ tag: HealthTag; weight: number }>> = {
  weight_loss: [
    { tag: 'weight_loss', weight: 3 },
    { tag: 'high_protein', weight: 2 },
    { tag: 'high_fiber', weight: 2 },
  ],
  muscle_gain: [
    { tag: 'muscle_gain', weight: 3 },
    { tag: 'high_protein', weight: 3 },
  ],
}

/** Human-readable label for a boost source, used to build the per-meal `reason` string. */
export function labelForBoostSource(source: string): string {
  const known: Record<string, string> = {
    pcos: 'PCOS',
    diabetes: 'diabetes management',
    thyroid: 'thyroid support',
    hypertension: 'heart-healthy eating',
    heart: 'heart health',
    iron: 'iron deficiency',
    vitamin_d: 'vitamin D deficiency',
    vitamin_b12: 'vitamin B12 deficiency',
    calcium: 'calcium needs',
    weight_loss: 'your weight-loss goal',
    muscle_gain: 'your muscle-gain goal',
  }
  return known[source] ?? source
}

/**
 * Weighted map of health tags this profile should be biased toward, each tagged with the
 * condition/deficiency/goal that drove it (for the `reason` string) — highest weight per tag wins.
 */
export function getBoostedHealthTags(profile: UserNutritionProfile): Map<HealthTag, TagBoost> {
  const boosts: TagBoost[] = []

  const conditionsLower = profile.medicalConditions.map((c) => c.toLowerCase())
  for (const rule of CONDITION_TAG_RULES) {
    if (conditionsLower.some((c) => c.includes(rule.pattern))) {
      for (const b of rule.boosts) boosts.push({ tag: b.tag, weight: b.weight, source: rule.pattern })
    }
  }

  const deficienciesLower = profile.primaryDeficiencies.map((d) => d.toLowerCase().replace(/\s+/g, '_'))
  for (const deficiency of deficienciesLower) {
    const tag = DEFICIENCY_TAG_RULES[deficiency] ?? DEFICIENCY_TAG_RULES[deficiency.replace(/_/g, ' ')]
    if (tag) boosts.push({ tag, weight: 3, source: deficiency })
  }

  if (profile.goal && GOAL_TAG_RULES[profile.goal]) {
    for (const b of GOAL_TAG_RULES[profile.goal]) boosts.push({ tag: b.tag, weight: b.weight, source: profile.goal! })
  }

  const map = new Map<HealthTag, TagBoost>()
  for (const b of boosts) {
    const existing = map.get(b.tag)
    if (!existing || b.weight > existing.weight) map.set(b.tag, b)
  }
  return map
}

/** Keyword groups for matching a reported allergy against free-text ingredient lists. */
const ALLERGEN_INGREDIENT_KEYWORDS: Record<string, string[]> = {
  nuts: ['peanut', 'mungfali', 'almond', 'badam', 'cashew', 'kaju', 'walnut', 'akhrot', 'pistachio', 'pista', 'hazelnut', 'pine nut', 'groundnut'],
  dairy: ['milk', 'doodh', 'paneer', 'curd', 'dahi', 'ghee', 'cheese', 'cream', 'khoya', 'malai', 'buttermilk', 'chaas', 'lassi', 'shrikhand', 'kheer', 'rabri'],
  gluten: ['wheat', 'gehun', 'atta', 'maida', 'suji', 'rava', 'sooji', 'sewiya', 'vermicelli', 'barley', 'jau', 'rye', 'bread', 'naan', 'khakhra'],
  soy: ['soy', 'soya', 'tofu', 'edamame'],
  eggs: ['egg', 'anda'],
  seafood: ['fish', 'prawn', 'shrimp', 'crab', 'seafood', 'machh', 'rohu', 'katla', 'bangda', 'surmai', 'sardine', 'pomfret'],
}

function allergyKeywords(allergy: string): string[] {
  const key = allergy.toLowerCase().trim()
  return ALLERGEN_INGREDIENT_KEYWORDS[key] ?? [key]
}

/** True if this meal is unsafe for the user's reported allergies (tag match OR ingredient text match). */
export function mealViolatesAllergies(meal: MealRow, allergies: string[]): boolean {
  if (allergies.length === 0) return false
  const allergensLower = new Set(meal.allergens.map((a) => a.toLowerCase().trim()))
  const ingredientsLower = meal.ingredients.map((i) => i.toLowerCase())

  for (const allergy of allergies) {
    const key = allergy.toLowerCase().trim()
    if (!key) continue
    if (allergensLower.has(key)) return true

    const keywords = allergyKeywords(key)
    if (ingredientsLower.some((ingredient) => keywords.some((kw) => ingredient.includes(kw)))) return true
  }
  return false
}

/** True if the meal's diet_type tags satisfy the user's stated diet (vegan/vegetarian/jain/non_veg). */
export function mealMatchesDietType(meal: MealRow, dietType: UserNutritionProfile['dietType']): boolean {
  if (!dietType) return true
  // Non-vegetarian eaters can eat anything in the catalog (veg or non-veg).
  if (dietType === 'non_vegetarian') return true
  return meal.diet_type.includes(dietType)
}

/** Hard filter: diet-type compatible AND allergen-safe. Meals failing this must never be selectable. */
export function isMealEligible(meal: MealRow, profile: UserNutritionProfile): boolean {
  if (!meal.is_active) return false
  if (!mealMatchesDietType(meal, profile.dietType)) return false
  if (mealViolatesAllergies(meal, profile.allergies)) return false
  return true
}
