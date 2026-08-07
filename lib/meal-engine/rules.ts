/**
 * Maps a user's medical conditions, deficiencies and goal to boosted `health_tags`, plus the
 * hard filters (diet-type compatibility, allergen exclusion) every candidate meal must pass.
 */

import type { HealthTag, MealRow, UserNutritionProfile } from './types'

/** condition/deficiency/goal keyword -> health tags it should boost, with a relative weight. */
export type TagBoost = { tag: HealthTag; weight: number; source: string }

/** Fried/refined/sugar-heavy items — excluded for PCOS/diabetes/weight-loss unless clearly a healthy variant. */
const UNHEALTHY_MEAL_KEYWORDS = [
  'bhature',
  'bhatura',
  'chole bhature',
  'puri',
  'ghevar',
  'misal',
  'misal pav',
  'jalebi',
  'samosa',
  'pakora',
  'pakoda',
  'vada pav',
  'pav bhaji',
  'kachori',
  'ladoo',
  'laddu',
  'gulab jamun',
  'barfi',
  'malpua',
  'rabri',
  'deep fried',
  'deep-fried',
  'fried bread',
  'maida puri',
  'bedmi',
  'bedmi puri',
  'medu vada',
  'medu vada',
  'bajra puri',
  'methi puri',
  'shakarpara',
  'soan papdi',
  'mysore pak',
  'halwa',
  'sheera',
  'suji halwa',
  'motichoor',
  'imarti',
  'balushahi',
  'peda',
  'sandesh',
  'rasgulla',
  'rasmalai',
  'kulfi',
  'falooda',
] as const

/** If present alongside an unhealthy keyword, the dish may still be acceptable (e.g. baked samosa). */
const HEALTHY_VARIANT_HINTS = [
  'baked',
  'steamed',
  'grilled',
  'roasted',
  'air-fried',
  'air fried',
  'whole wheat',
  'multigrain',
  'ragi',
  'millet',
  'oats',
  'sprout',
  'salad',
  'soup',
  'dal',
  'sabzi',
  'light',
  'low oil',
  'no oil',
] as const

/** Keywords that earn extra score when present in meal name/ingredients. */
export const HEALTHY_MEAL_KEYWORDS = [
  'dal',
  'sprout',
  'grilled',
  'steamed',
  'salad',
  'oats',
  'ragi',
  'millet',
  'bajra',
  'jowar',
  'quinoa',
  'quinoa bowl',
  'paneer tikka',
  'tandoori',
  'soup',
  'chilla',
  'moong',
  'besan',
  'sabzi',
  'vegetable',
  'palak',
  'methi',
  'lauki',
  'turai',
  'fish',
  'chicken breast',
  'egg white',
  'curd',
  'chaas',
  'buttermilk',
  'upma',
  'khichdi',
  'brown rice',
  'whole wheat',
  'smoothie bowl',
  'bowl',
] as const

/**
 * Regional specialty / festival / street-food dish patterns — penalized at selection time so
 * everyday clinical staples win even when legacy DB rows carry the right health tags.
 */
const REGIONAL_SPECIALTY_KEYWORDS = [
  'undhiyu',
  'undhiya',
  'shukto',
  'shukton',
  'misal',
  'misal pav',
  'dhokla',
  'khaman',
  'khandvi',
  'handvo',
  'patra',
  'fafda',
  'thepla',
  'biryani',
  'biriyani',
  'pulao',
  'pulav',
  'pilaf',
  'thali',
  'chettinad',
  'avial',
  'kosha mangsho',
  'machher jhol',
  'shorshe ilish',
  'pani puri',
  'gol gappa',
  'sev puri',
  'bhel puri',
  'bhel',
  'dabeli',
  'pav bhaji',
  'vada pav',
  'modak',
  'puran poli',
  'basundi',
  'shrikhand',
  'chole bhature',
  'litti chokha',
  'dal baati',
  'ker sangri',
  'pakhala',
  'roshogolla',
  'rasgulla',
  'sandesh',
  'mishti doi',
  'payesh',
  'pitha',
  'pav',
] as const

/** When these appear alongside a regional keyword, treat it as an acceptable everyday variant. */
const REGIONAL_SPECIALTY_EXCEPTIONS = [
  'steamed',
  'moong dal',
  'whole wheat',
  'multigrain',
  'methi',
  'oats',
  'ragi',
  'brown rice',
  'millet',
  'grilled',
  'baked',
  'low oil',
  'no oil',
  'salad',
  'sprout',
] as const

/** Score penalty per regional-specialty keyword hit (applied in generate-plan scoring). */
export const REGIONAL_SPECIALTY_PENALTY = 28

/** Score boost per everyday healthy keyword hit (applied in generate-plan scoring). */
export const HEALTHY_KEYWORD_BOOST = 4

/** Tags a meal must carry when the profile needs strict metabolic/PCOS-safe filtering. */
const STRICT_PROFILE_REQUIRED_TAGS: HealthTag[] = [
  'pcos',
  'low_gi',
  'high_fiber',
  'gut_friendly',
  'weight_loss',
  'low_carb',
  'high_protein',
  'heart_healthy',
  'diabetes',
]

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/['"]/g, '').trim()
}

function textContainsKeyword(text: string, keyword: string): boolean {
  return text.includes(keyword)
}

/** True when free text (name + ingredients) matches fried/junk patterns without a healthy variant hint. */
export function textContainsExcludedFood(text: string): boolean {
  const lower = text.toLowerCase()
  const hit = UNHEALTHY_MEAL_KEYWORDS.some((kw) => textContainsKeyword(lower, kw))
  if (!hit) return false
  return !HEALTHY_VARIANT_HINTS.some((hint) => lower.includes(hint))
}

/** True when text looks like a regional specialty / festival dish rather than everyday clinical food. */
export function textContainsRegionalSpecialty(text: string): boolean {
  const lower = text.toLowerCase()
  const hit = REGIONAL_SPECIALTY_KEYWORDS.some((kw) => textContainsKeyword(lower, kw))
  if (!hit) return false
  return !REGIONAL_SPECIALTY_EXCEPTIONS.some((hint) => lower.includes(hint))
}

export function mealContainsRegionalSpecialty(meal: MealRow): boolean {
  return textContainsRegionalSpecialty(mealTextBlob(meal))
}

/** Count of healthy-keyword hits in meal text — used for selection scoring boosts. */
export function countHealthyMealKeywords(text: string): number {
  const lower = text.toLowerCase()
  let count = 0
  for (const kw of HEALTHY_MEAL_KEYWORDS) {
    if (textContainsKeyword(lower, kw)) count += 1
  }
  return count
}

/** Count of regional-specialty keyword hits — used for selection scoring penalties. */
export function countRegionalSpecialtyKeywords(text: string): number {
  const lower = text.toLowerCase()
  if (REGIONAL_SPECIALTY_EXCEPTIONS.some((hint) => lower.includes(hint))) return 0
  let count = 0
  for (const kw of REGIONAL_SPECIALTY_KEYWORDS) {
    if (textContainsKeyword(lower, kw)) count += 1
  }
  return count
}

/** True when this meal row should be hard-excluded for metabolic/PCOS profiles (handles bad DB tags). */
export function mealContainsExcludedFood(meal: MealRow): boolean {
  return textContainsExcludedFood(mealTextBlob(meal))
}

export function profileRequiresStrictHealthFiltering(profile: UserNutritionProfile): boolean {
  const conditions = profile.medicalConditions.map(normalizeToken)
  if (conditions.some((c) => c.includes('pcos') || c.includes('pcod'))) return true
  if (conditions.some((c) => c.includes('diabetes'))) return true
  if (profile.goal === 'weight_loss') return true
  return false
}

/** Hard gate for PCOS/diabetes/weight-loss: require appropriate health tags and reject junk/fried rows. */
export function mealMeetsStrictHealthRequirements(meal: MealRow, profile: UserNutritionProfile): boolean {
  if (!profileRequiresStrictHealthFiltering(profile)) return true
  if (mealContainsExcludedFood(meal)) return false
  return meal.health_tags.some((t) => STRICT_PROFILE_REQUIRED_TAGS.includes(t))
}

const CONDITION_TAG_RULES: { pattern: string; boosts: Array<{ tag: HealthTag; weight: number }> }[] = [
  {
    pattern: 'pcos',
    boosts: [
      { tag: 'pcos', weight: 4 },
      { tag: 'low_gi', weight: 3 },
      { tag: 'gut_friendly', weight: 2 },
      { tag: 'high_fiber', weight: 2 },
      { tag: 'weight_loss', weight: 2 },
    ],
  },
  {
    pattern: 'pcod',
    boosts: [
      { tag: 'pcos', weight: 4 },
      { tag: 'low_gi', weight: 3 },
      { tag: 'gut_friendly', weight: 2 },
      { tag: 'high_fiber', weight: 2 },
      { tag: 'weight_loss', weight: 2 },
    ],
  },
  { pattern: 'diabetes', boosts: [{ tag: 'low_gi', weight: 3 }, { tag: 'low_carb', weight: 3 }, { tag: 'high_fiber', weight: 1 }] },
  { pattern: 'thyroid', boosts: [{ tag: 'iron_rich', weight: 2 }, { tag: 'high_fiber', weight: 2 }, { tag: 'low_gi', weight: 1 }] },
  { pattern: 'hypertension', boosts: [{ tag: 'heart_healthy', weight: 3 }, { tag: 'low_gi', weight: 1 }] },
  { pattern: 'heart', boosts: [{ tag: 'heart_healthy', weight: 3 }] },
]

/** Canonical deficiency keys used internally after normalizing free-quiz nutrient names. */
export type CanonicalDeficiency =
  | 'iron'
  | 'vitamin_d'
  | 'vitamin_b12'
  | 'calcium'
  | 'magnesium'
  | 'omega3'
  | 'zinc'
  | 'vitamin_c'
  | 'biotin'
  | 'folate'
  | 'vitamin_a'
  | 'vitamin_e'
  | 'b_vitamins'
  | 'protein'
  | 'gut_health'

export type SelectionTarget = {
  id: string
  label: string
  kind: 'deficiency' | 'condition' | 'goal' | 'symptom'
  healthTagBoosts: Array<{ tag: HealthTag; weight: number }>
  ingredientKeywords: string[]
}

type DeficiencySpec = {
  label: string
  healthTagBoosts: Array<{ tag: HealthTag; weight: number }>
  ingredientKeywords: string[]
}

const DEFICIENCY_SPECS: Record<CanonicalDeficiency, DeficiencySpec> = {
  iron: {
    label: 'Iron',
    healthTagBoosts: [
      { tag: 'iron_rich', weight: 5 },
      { tag: 'high_protein', weight: 2 },
    ],
    ingredientKeywords: [
      'spinach',
      'palak',
      'methi',
      'beetroot',
      'chukandar',
      'dal',
      'masoor',
      'moong',
      'rajma',
      'chana',
      'sprout',
      'jaggery',
      'gur',
      'pomegranate',
      'anar',
      'dates',
      'khajoor',
      'sesame',
      'til',
    ],
  },
  vitamin_d: {
    label: 'Vitamin D',
    healthTagBoosts: [{ tag: 'vitamin_d', weight: 5 }],
    ingredientKeywords: ['egg', 'anda', 'mushroom', 'ghee', 'fortified', 'fish', 'bangda', 'rohu', 'katla', 'sunflower'],
  },
  vitamin_b12: {
    label: 'Vitamin B12',
    healthTagBoosts: [{ tag: 'vitamin_b12', weight: 5 }],
    ingredientKeywords: ['egg', 'anda', 'curd', 'dahi', 'paneer', 'milk', 'doodh', 'fortified', 'nutritional yeast'],
  },
  calcium: {
    label: 'Calcium',
    healthTagBoosts: [{ tag: 'calcium_rich', weight: 5 }],
    ingredientKeywords: ['curd', 'dahi', 'paneer', 'milk', 'doodh', 'ragi', 'sesame', 'til', 'amaranth', 'rajgeera', 'moringa'],
  },
  magnesium: {
    label: 'Magnesium',
    healthTagBoosts: [{ tag: 'gut_friendly', weight: 1 }],
    ingredientKeywords: [
      'almond',
      'badam',
      'walnut',
      'akhrot',
      'pumpkin seed',
      'sunflower seed',
      'ragi',
      'bajra',
      'spinach',
      'palak',
      'banana',
      'kela',
      'cocoa',
      'dark chocolate',
    ],
  },
  omega3: {
    label: 'Omega-3',
    healthTagBoosts: [{ tag: 'heart_healthy', weight: 2 }],
    ingredientKeywords: [
      'fish',
      'bangda',
      'rohu',
      'katla',
      'sardine',
      'surmai',
      'flax',
      'alsi',
      'walnut',
      'akhrot',
      'chia',
      'hemp',
    ],
  },
  zinc: {
    label: 'Zinc',
    healthTagBoosts: [{ tag: 'high_protein', weight: 2 }],
    ingredientKeywords: ['pumpkin seed', 'sesame', 'til', 'chana', 'moong', 'peanut', 'mungfali', 'cashew', 'kaju', 'lentil', 'dal'],
  },
  vitamin_c: {
    label: 'Vitamin C',
    healthTagBoosts: [{ tag: 'iron_rich', weight: 1 }],
    ingredientKeywords: ['amla', 'lemon', 'nimbu', 'orange', 'mosambi', 'guava', 'amrud', 'tomato', 'bell pepper', 'capsicum', 'coriander'],
  },
  biotin: {
    label: 'Biotin',
    healthTagBoosts: [{ tag: 'high_protein', weight: 1 }],
    ingredientKeywords: ['egg', 'anda', 'almond', 'badam', 'walnut', 'sweet potato', 'shakarkandi', 'spinach', 'palak', 'peanut'],
  },
  folate: {
    label: 'Folate',
    healthTagBoosts: [{ tag: 'iron_rich', weight: 2 }],
    ingredientKeywords: ['spinach', 'palak', 'methi', 'beetroot', 'chukandar', 'moong', 'sprout', 'rajma', 'chana', 'lettuce'],
  },
  vitamin_a: {
    label: 'Vitamin A',
    healthTagBoosts: [{ tag: 'gut_friendly', weight: 1 }],
    ingredientKeywords: ['carrot', 'gajar', 'sweet potato', 'shakarkandi', 'spinach', 'palak', 'mango', 'aam', 'papaya', 'pumpkin', 'kaddu'],
  },
  vitamin_e: {
    label: 'Vitamin E',
    healthTagBoosts: [{ tag: 'heart_healthy', weight: 1 }],
    ingredientKeywords: ['almond', 'badam', 'sunflower seed', 'peanut', 'mungfali', 'spinach', 'palak', 'mustard', 'sarson'],
  },
  b_vitamins: {
    label: 'B vitamins',
    healthTagBoosts: [{ tag: 'vitamin_b12', weight: 2 }, { tag: 'high_protein', weight: 2 }],
    ingredientKeywords: ['dal', 'whole grain', 'brown rice', 'oats', 'egg', 'anda', 'peanut', 'mungfali', 'spinach', 'palak', 'nutritional yeast'],
  },
  protein: {
    label: 'Protein',
    healthTagBoosts: [{ tag: 'high_protein', weight: 5 }, { tag: 'muscle_gain', weight: 2 }],
    ingredientKeywords: ['paneer', 'dal', 'chana', 'moong', 'rajma', 'soya', 'tofu', 'egg', 'anda', 'chicken', 'fish', 'sprout', 'quinoa'],
  },
  gut_health: {
    label: 'Gut health',
    healthTagBoosts: [{ tag: 'gut_friendly', weight: 5 }, { tag: 'high_fiber', weight: 3 }],
    ingredientKeywords: ['curd', 'dahi', 'chaas', 'buttermilk', 'ferment', 'sprout', 'fiber', 'oats', 'isabgol', 'psyllium', 'ginger', 'adrak'],
  },
}

const CONDITION_SPECS: Record<string, Omit<SelectionTarget, 'id' | 'kind'>> = {
  pcos: {
    label: 'PCOS',
    healthTagBoosts: [
      { tag: 'pcos', weight: 5 },
      { tag: 'low_gi', weight: 4 },
      { tag: 'high_fiber', weight: 3 },
      { tag: 'gut_friendly', weight: 2 },
    ],
    ingredientKeywords: ['millet', 'bajra', 'ragi', 'jowar', 'oats', 'sprout', 'dal', 'palak', 'methi'],
  },
  pcod: {
    label: 'PCOS',
    healthTagBoosts: [
      { tag: 'pcos', weight: 5 },
      { tag: 'low_gi', weight: 4 },
      { tag: 'high_fiber', weight: 3 },
      { tag: 'gut_friendly', weight: 2 },
    ],
    ingredientKeywords: ['millet', 'bajra', 'ragi', 'jowar', 'oats', 'sprout', 'dal', 'palak', 'methi'],
  },
  diabetes: {
    label: 'Diabetes',
    healthTagBoosts: [
      { tag: 'low_gi', weight: 5 },
      { tag: 'low_carb', weight: 4 },
      { tag: 'high_fiber', weight: 3 },
      { tag: 'diabetes', weight: 3 },
    ],
    ingredientKeywords: ['millet', 'bajra', 'ragi', 'oats', 'dal', 'vegetable', 'sabzi'],
  },
  thyroid: {
    label: 'Thyroid',
    healthTagBoosts: [
      { tag: 'thyroid', weight: 4 },
      { tag: 'iron_rich', weight: 2 },
      { tag: 'high_fiber', weight: 2 },
      { tag: 'low_gi', weight: 2 },
    ],
    ingredientKeywords: ['brazil nut', 'selenium', 'iodine', 'seaweed', 'ragi', 'oats', 'dal'],
  },
  hypertension: {
    label: 'Heart health',
    healthTagBoosts: [{ tag: 'heart_healthy', weight: 5 }, { tag: 'low_gi', weight: 2 }],
    ingredientKeywords: ['beetroot', 'chukandar', 'garlic', 'lasan', 'oats', 'fish', 'leafy'],
  },
  heart: {
    label: 'Heart health',
    healthTagBoosts: [{ tag: 'heart_healthy', weight: 5 }],
    ingredientKeywords: ['oats', 'fish', 'walnut', 'akhrot', 'flax', 'alsi', 'olive'],
  },
}

const GOAL_SPECS: Partial<Record<string, Omit<SelectionTarget, 'id' | 'kind'>>> = {
  weight_loss: {
    label: 'Weight loss',
    healthTagBoosts: [
      { tag: 'weight_loss', weight: 4 },
      { tag: 'high_protein', weight: 3 },
      { tag: 'high_fiber', weight: 3 },
    ],
    ingredientKeywords: ['sprout', 'dal', 'salad', 'grilled', 'steamed', 'oats', 'millet'],
  },
  muscle_gain: {
    label: 'Muscle gain',
    healthTagBoosts: [
      { tag: 'muscle_gain', weight: 4 },
      { tag: 'high_protein', weight: 5 },
    ],
    ingredientKeywords: ['paneer', 'egg', 'anda', 'chicken', 'fish', 'dal', 'soya', 'peanut'],
  },
  energy: {
    label: 'Energy',
    healthTagBoosts: [{ tag: 'iron_rich', weight: 2 }, { tag: 'high_protein', weight: 2 }],
    ingredientKeywords: ['dates', 'khajoor', 'jaggery', 'gur', 'banana', 'kela', 'sprout', 'dal'],
  },
  immunity: {
    label: 'Immunity',
    healthTagBoosts: [{ tag: 'gut_friendly', weight: 2 }],
    ingredientKeywords: ['amla', 'turmeric', 'haldi', 'ginger', 'adrak', 'garlic', 'lasan', 'curd', 'dahi'],
  },
  hormones: {
    label: 'Hormone balance',
    healthTagBoosts: [{ tag: 'pcos', weight: 2 }, { tag: 'high_fiber', weight: 2 }],
    ingredientKeywords: ['flax', 'alsi', 'sesame', 'til', 'moringa', 'ashwagandha'],
  },
}

/** Maps free-quiz nutrient strings ("Vitamin D3", "Ferritin (Iron Storage)") to canonical keys. */
export function normalizeDeficiencyKey(raw: string): CanonicalDeficiency | null {
  const t = raw.toLowerCase().trim()
  if (!t) return null

  if (/ferritin|iron|anaemi|anemi|hemoglobin|haemoglobin/.test(t)) return 'iron'
  if (/vitamin d|vitamin d3|\bd3\b|25-oh|cholecalciferol/.test(t)) return 'vitamin_d'
  if (/b12|b-12|methylcobalamin|cobalamin|vitamin b12/.test(t)) return 'vitamin_b12'
  if (/calcium/.test(t)) return 'calcium'
  if (/magnesium/.test(t)) return 'magnesium'
  if (/omega|dha|epa|fish oil/.test(t)) return 'omega3'
  if (/zinc/.test(t)) return 'zinc'
  if (/vitamin c|ascorbic/.test(t)) return 'vitamin_c'
  if (/biotin/.test(t)) return 'biotin'
  if (/folate|folic|\bb9\b/.test(t)) return 'folate'
  if (/vitamin a|retinol|beta.?carotene/.test(t)) return 'vitamin_a'
  if (/vitamin e|tocopherol/.test(t)) return 'vitamin_e'
  if (/b1|thiamin|b3|niacin|b5|pantothen|b6|b vitamin|b-complex|b complex/.test(t)) return 'b_vitamins'
  if (/protein|amino acid/.test(t)) return 'protein'
  if (/gut|digest|microbiome|probiotic/.test(t)) return 'gut_health'

  const underscored = t.replace(/\s+/g, '_')
  if (underscored in DEFICIENCY_SPECS) return underscored as CanonicalDeficiency

  return null
}

/** Deduped canonical deficiency keys from raw nutrient names. */
export function normalizeDeficiencyList(rawList: string[]): CanonicalDeficiency[] {
  const out: CanonicalDeficiency[] = []
  const seen = new Set<string>()
  for (const raw of rawList) {
    const key = normalizeDeficiencyKey(raw)
    if (key && !seen.has(key)) {
      seen.add(key)
      out.push(key)
    }
  }
  return out
}

function deficiencyToTarget(key: CanonicalDeficiency): SelectionTarget {
  const spec = DEFICIENCY_SPECS[key]
  return { id: key, kind: 'deficiency', ...spec }
}

function conditionToTarget(condition: string): SelectionTarget | null {
  const lower = normalizeToken(condition)
  for (const [pattern, spec] of Object.entries(CONDITION_SPECS)) {
    if (lower.includes(pattern)) {
      return { id: pattern, kind: 'condition', ...spec }
    }
  }
  return null
}

/**
 * Ordered rotation targets for meal selection — deficiencies first, then conditions, then goal.
 * Each slot picks from this list so the week cycles through the user's actual needs.
 */
export function buildSelectionTargets(profile: UserNutritionProfile): SelectionTarget[] {
  const targets: SelectionTarget[] = []
  const seen = new Set<string>()

  const add = (t: SelectionTarget) => {
    if (seen.has(t.id)) return
    seen.add(t.id)
    targets.push(t)
  }

  for (const key of normalizeDeficiencyList(profile.primaryDeficiencies)) {
    add(deficiencyToTarget(key))
  }

  for (const condition of profile.medicalConditions) {
    const t = conditionToTarget(condition)
    if (t) add(t)
  }

  if (profile.goal && GOAL_SPECS[profile.goal]) {
    const spec = GOAL_SPECS[profile.goal]!
    add({ id: profile.goal, kind: 'goal', ...spec })
  }

  if (targets.length === 0) {
    add({
      id: 'balanced',
      kind: 'symptom',
      label: 'Balanced nutrition',
      healthTagBoosts: [{ tag: 'high_fiber', weight: 2 }, { tag: 'gut_friendly', weight: 1 }],
      ingredientKeywords: ['dal', 'vegetable', 'sabzi', 'sprout'],
    })
  }

  return targets
}

export function mealTextBlob(meal: MealRow): string {
  return [meal.meal_name, ...meal.ingredients, meal.preparation_notes ?? ''].join(' ').toLowerCase()
}

/** How strongly a meal matches a selection target (tags + ingredient keywords). */
export function mealMatchesTargetStrength(meal: MealRow, target: SelectionTarget): number {
  let strength = 0
  for (const { tag, weight } of target.healthTagBoosts) {
    if (meal.health_tags.includes(tag)) strength += weight
  }
  const text = mealTextBlob(meal)
  for (const kw of target.ingredientKeywords) {
    if (text.includes(kw)) strength += 2
  }
  return strength
}

export function mealMatchesTarget(meal: MealRow, target: SelectionTarget): boolean {
  return mealMatchesTargetStrength(meal, target) >= 2
}

const DEFICIENCY_TAG_RULES: Record<string, HealthTag> = {
  iron: 'iron_rich',
  vitamin_d: 'vitamin_d',
  'vitamin d': 'vitamin_d',
  vitamin_b12: 'vitamin_b12',
  b12: 'vitamin_b12',
  calcium: 'calcium_rich',
  magnesium: 'gut_friendly',
  omega3: 'heart_healthy',
  zinc: 'high_protein',
  vitamin_c: 'iron_rich',
  biotin: 'high_protein',
  folate: 'iron_rich',
  gut_health: 'gut_friendly',
  b_vitamins: 'vitamin_b12',
  protein: 'high_protein',
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
  const clean = normalizeToken(source).replace(/\s+/g, '_')
  const known: Record<string, string> = {
    pcos: 'PCOS',
    pcod: 'PCOS',
    diabetes: 'Diabetes',
    thyroid: 'Thyroid',
    hypertension: 'Heart health',
    heart: 'Heart health',
    iron: 'Iron',
    vitamin_d: 'Vitamin D',
    vitamin_b12: 'Vitamin B12',
    calcium: 'Calcium',
    magnesium: 'Magnesium',
    omega3: 'Omega-3',
    zinc: 'Zinc',
    vitamin_c: 'Vitamin C',
    biotin: 'Biotin',
    folate: 'Folate',
    vitamin_a: 'Vitamin A',
    vitamin_e: 'Vitamin E',
    b_vitamins: 'B vitamins',
    protein: 'Protein',
    gut_health: 'Gut health',
    weight_loss: 'Weight loss',
    muscle_gain: 'Muscle gain',
    energy: 'Energy',
    immunity: 'Immunity',
    hormones: 'Hormone balance',
    balanced: 'Balanced nutrition',
  }
  return known[clean] ?? clean.replace(/_/g, ' ')
}

/**
 * Weighted map of health tags this profile should be biased toward, each tagged with the
 * condition/deficiency/goal that drove it (for the `reason` string) — highest weight per tag wins.
 */
export function getBoostedHealthTags(profile: UserNutritionProfile): Map<HealthTag, TagBoost> {
  const boosts: TagBoost[] = []

  const conditionsLower = profile.medicalConditions.map(normalizeToken)
  for (const rule of CONDITION_TAG_RULES) {
    if (conditionsLower.some((c) => c.includes(rule.pattern))) {
      for (const b of rule.boosts) boosts.push({ tag: b.tag, weight: b.weight, source: rule.pattern })
    }
  }

  for (const key of normalizeDeficiencyList(profile.primaryDeficiencies)) {
    const spec = DEFICIENCY_SPECS[key]
    for (const b of spec.healthTagBoosts) {
      boosts.push({ tag: b.tag, weight: b.weight, source: key })
    }
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

export type MealEligibilityOptions = {
  /** When strict PCOS/diabetes filtering leaves too few candidates, still exclude junk but skip tag gate. */
  relaxStrictHealth?: boolean
}

/** Hard filter: diet-type compatible, allergen-safe, and condition-appropriate. Meals failing this must never be selectable. */
export function isMealEligible(
  meal: MealRow,
  profile: UserNutritionProfile,
  options?: MealEligibilityOptions,
): boolean {
  if (!meal.is_active) return false
  if (!mealMatchesDietType(meal, profile.dietType)) return false
  if (mealViolatesAllergies(meal, profile.allergies)) return false

  if (options?.relaxStrictHealth) {
    if (profileRequiresStrictHealthFiltering(profile) && mealContainsExcludedFood(meal)) return false
    return true
  }

  if (!mealMeetsStrictHealthRequirements(meal, profile)) return false
  return true
}

/** Minimum strict-eligible meals per slot before we widen to relaxed (junk-free) pool. */
export const MIN_STRICT_POOL_PER_SLOT = 5
