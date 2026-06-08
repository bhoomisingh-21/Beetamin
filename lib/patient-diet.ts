/** Normalized diet for meal-plan generation and PDF sanitization. */
export type DietCategory = 'pure_vegetarian' | 'lacto_ovo_vegetarian' | 'non_vegetarian'

export type ResolvedPatientDiet = {
  category: DietCategory
  /** Short label sent to Groq */
  label: string
  /** Hard rules block for the model */
  groqRules: string
}

const NON_VEG_PATTERN =
  /\b(chicken|mutton|lamb|goat|fish|rohu|katla|surmai|bangda|sardine|salmon|tuna|prawn|prawns|shrimp|seafood|meat|keema|poultry|turkey|beef|pork|bacon|ham|sausage|sushi|omelette|omelet|egg yolk|boiled egg|fried egg|scotch egg|anda bhurji|anda curry|egg curry|fish curry|chicken curry|butter chicken|tandoori chicken|chicken tikka|mutton curry|keema|surmai fry|bangda fry)\b/i

const EGG_PATTERN =
  /\b(egg|eggs|anda|omelette|omelet|egg yolk|boiled egg|fried egg|scotch egg|anda bhurji|anda curry|egg curry)\b/i

const DAIRY_PATTERN = /\b(paneer|curd|dahi|ghee|milk|cheese|lassi|chaas|buttermilk|shrikhand|kheer)\b/i

/** Western / non-Indian ingredients and dish styles to block in ₹39 meal plans. */
export const FORBIDDEN_WESTERN_MEAL_TERMS: readonly string[] = [
  'quinoa',
  'avocado',
  'kale',
  'greek yogurt',
  'greek yoghurt',
  'caesar',
  'asparagus',
  'smoked salmon',
  'salmon',
  'shrimp',
  'citrus vinaigrette',
  'vinaigrette',
  'bagel',
  'granola',
  'smoothie bowl',
  'protein shake',
  'whey',
  'cottage cheese',
  'turkey',
  'beef',
  'pork',
  'bacon',
  'sushi',
  'couscous',
  'caprese',
  'pesto pasta',
  'overnight oats',
  'oatmeal bowl',
  'acai',
  'edamame',
  'hummus bowl',
  'poke bowl',
  'caesar salad',
  'garden salad',
  'western salad',
  'avocado toast',
]

function includesAny(haystack: string, terms: readonly string[]): boolean {
  const lower = haystack.toLowerCase()
  return terms.some((t) => lower.includes(t))
}

function matchesPattern(text: string, pattern: RegExp): boolean {
  return pattern.test(text)
}

/** Map free-quiz + detailed-assessment strings to a single authoritative category. */
export function resolvePatientDiet(input: {
  detailedDietType?: string | null
  freeQuizDiet?: string | null
  dietSummary?: string | null
}): ResolvedPatientDiet {
  const detailed = (input.detailedDietType ?? '').toLowerCase().trim()
  const free = (input.freeQuizDiet ?? '').toLowerCase().trim()
  const summary = (input.dietSummary ?? '').toLowerCase()

  let category: DietCategory = 'lacto_ovo_vegetarian'

  if (
    detailed.includes('non-vegetarian') ||
    detailed.includes('non vegetarian') ||
    detailed.includes('chicken') ||
    detailed.includes('fish/meat') ||
    free === 'non_veg' ||
    free.includes('non-veg') ||
    free.includes('non veg')
  ) {
    category = 'non_vegetarian'
  } else if (
    detailed.includes('pure vegetarian') ||
    detailed.includes('no eggs') ||
    free === 'vegan' ||
    summary.includes('vegan') ||
    summary.includes('no eggs') ||
    summary.includes('pure vegetarian')
  ) {
    category = 'pure_vegetarian'
  } else if (
    detailed.includes('vegetarian') ||
    free === 'vegetarian' ||
    summary.includes('vegetarian')
  ) {
    category = 'lacto_ovo_vegetarian'
  }

  const label =
    category === 'non_vegetarian'
      ? 'Non-Vegetarian (Indian chicken/fish allowed)'
      : category === 'pure_vegetarian'
        ? 'Pure Vegetarian — no eggs, no meat, no fish'
        : 'Vegetarian — eggs allowed, no meat or fish'

  const groqRules =
    category === 'non_vegetarian'
      ? 'NON_VEGETARIAN: Indian fish (rohu/katla/bangda) or chicken allowed sparingly for deficiency targets. Still NO western dishes. NO quinoa, avocado, kale, greek yogurt, salmon, shrimp, bagel, granola, smoothie bowls.'
      : category === 'pure_vegetarian'
        ? 'PURE_VEGETARIAN (HARD RULE): mealPlan must NEVER contain chicken, fish, meat, seafood, eggs, or anda. Dairy (paneer, curd, milk, ghee) is allowed. Use dal, sabzi, roti, idli, khichdi, rajma, alsi, til, ragi only.'
        : 'LACTO_OVO_VEGETARIAN (HARD RULE): mealPlan must NEVER contain chicken, fish, meat, or seafood. Eggs/anda are allowed. Use Indian home-cooking only — no western fusion.'

  return { category, label, groqRules }
}

export function mealViolatesDiet(foodText: string, category: DietCategory): boolean {
  if (category === 'non_vegetarian') return false
  if (matchesPattern(foodText, NON_VEG_PATTERN)) return true
  if (category === 'pure_vegetarian' && matchesPattern(foodText, EGG_PATTERN)) return true
  return false
}

export function mealHasWesternTerms(foodText: string): boolean {
  return includesAny(foodText, FORBIDDEN_WESTERN_MEAL_TERMS)
}

/** Indian veg fallbacks when the model outputs wrong meals (by nutrient + timing). */
const VEG_FALLBACKS: Record<string, Partial<Record<string, string>>> = {
  'omega-3': {
    Breakfast: 'Alsi (flaxseed) paratha — 2 rotis with ghee — why: alsi is your richest plant omega-3 for dry skin and eyes',
    Lunch: 'Rajma chawal with mustard oil tadka — 1 katori rajma + 1 katori rice — why: rajma and mustard oil support plant omega-3',
    Dinner: 'Methi dal with alsi tadka — 1 katori + 2 rotis — why: methi seeds and alsi boost omega-3 without fish',
    'Mid-snack': 'Soaked akhrot (walnuts) — 4 halves — why: akhrot gives DHA-friendly fats for skin and eyes',
    'Eve-snack': 'Alsi chutney with 2 multigrain rotis — why: daily alsi keeps omega-3 stores up',
  },
  iron: {
    Breakfast: 'Palak paratha with curd — 2 parathas + ½ katori curd — why: palak is a top iron source for fatigue and hair fall',
    Lunch: 'Masoor dal + palak sabzi + roti — 1 katori dal, 1 katori sabzi, 2 rotis — why: masoor and palak rebuild iron stores',
    Dinner: 'Rajgira roti with methi sabzi — 2 rotis — why: rajgira and methi are iron-rich for pale skin and low energy',
    'Mid-snack': 'Gud (jaggery) with warm water — 1 small piece — why: gud supports iron absorption between meals',
    'Eve-snack': 'Anar (pomegranate) — 1 katori seeds — why: vitamin C in anar helps you use iron from dinner',
  },
  'vitamin d': {
    Breakfast: 'Mushroom sabzi with multigrain roti — 1 katori + 2 rotis — why: sun-exposed mushrooms support vitamin D when sun is low',
    Lunch: 'Paneer bhurji with roti — 1 katori + 2 rotis — why: paneer adds vitamin D for bone health and fatigue',
    Dinner: 'Fortified atta roti with palak dal — 2 rotis + 1 katori dal — why: fortified grains help close your vitamin D gap',
    'Mid-snack': 'Dried mushrooms + til — 1 tbsp each — why: mushrooms and til support vitamin D naturally',
    'Eve-snack': 'Haldi doodh (turmeric milk) — 1 glass — why: warm milk at night supports vitamin D and sleep',
  },
  magnesium: {
    Breakfast: 'Bajra roti with palak sabzi — 2 rotis + 1 katori — why: bajra and palak are magnesium-rich for cramps and sleep',
    Lunch: 'Rajma chawal — 1 katori each — why: rajma magnesium eases muscle soreness and poor sleep',
    Dinner: 'Chana dal with methi — 1 katori + 2 rotis — why: chana and methi calm nerves and cramps',
    'Mid-snack': 'Kela (banana) + soaked kaju — 1 banana, 6 kaju — why: banana and cashews top up magnesium fast',
    'Eve-snack': 'Kaddu ke beej roasted — 2 tbsp — why: pumpkin seeds are dense magnesium for night cramps',
  },
  biotin: {
    Breakfast: 'Methi thepla with curd — 2 theplas + ½ katori curd — why: methi and whole grains support biotin for hair and nails',
    Lunch: 'Gobi sabzi with roti — 1 katori + 2 rotis — why: gobi and roti feed biotin for brittle nails',
    Dinner: 'Palak dal khichdi — 1 katori — why: palak and dal combine biotin-friendly nutrients',
    'Mid-snack': 'Roasted mungfali (peanuts) — 1 small katori — why: peanuts are a strong biotin source for hair fall',
    'Eve-snack': 'Shakarkandi chaat — 1 medium — why: sweet potato supports biotin and scalp health',
  },
  default: {
    Breakfast: 'Vegetable upma — 1 katori — why: light, Indian breakfast aligned with your recovery focus',
    Lunch: 'Dal chawal with seasonal sabzi — 1 katori dal, 1 katori rice, 1 katori sabzi — why: classic Indian plate for steady nutrient recovery',
    Dinner: 'Methi roti with moong dal — 2 rotis + 1 katori dal — why: easy-to-digest Indian dinner for daily healing',
    'Mid-snack': 'Seasonal fruit (seb or anaar) — 1 piece — why: affordable Indian fruit snack between meals',
    'Eve-snack': 'Roasted chana — 1 small katori — why: protein and minerals without western packaged snacks',
  },
}

function nutrientKey(deficiencyTarget: string): string {
  const t = deficiencyTarget.toLowerCase()
  if (t.includes('omega')) return 'omega-3'
  if (t.includes('iron') || t.includes('ferritin')) return 'iron'
  if (t.includes('vitamin d') || t === 'd3') return 'vitamin d'
  if (t.includes('magnesium')) return 'magnesium'
  if (t.includes('biotin')) return 'biotin'
  return 'default'
}

export function indianVegMealFallback(timing: string, deficiencyTarget: string): string {
  const key = nutrientKey(deficiencyTarget)
  const bucket = VEG_FALLBACKS[key] ?? VEG_FALLBACKS.default
  const normalizedTiming =
    timing.toLowerCase().includes('breakfast')
      ? 'Breakfast'
      : timing.toLowerCase().includes('lunch')
        ? 'Lunch'
        : timing.toLowerCase().includes('dinner')
          ? 'Dinner'
          : timing.toLowerCase().includes('eve')
            ? 'Eve-snack'
            : timing.toLowerCase().includes('mid')
              ? 'Mid-snack'
              : 'Mid-snack'
  return bucket[normalizedTiming] ?? VEG_FALLBACKS.default[normalizedTiming] ?? VEG_FALLBACKS.default.Lunch!
}

export function scrubWesternTermsFromMeal(food: string): string {
  let out = food
  for (const term of FORBIDDEN_WESTERN_MEAL_TERMS) {
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    out = out.replace(re, '')
  }
  out = out.replace(/\s{2,}/g, ' ').replace(/\s+—\s+—/g, ' — ').trim()
  if (out.length < 12) return ''
  return out
}

type MealPlanDayLike = {
  day: number
  focus: string
  meals: Array<{ timing: string; food: string; deficiencyTarget: string; reason: string }>
}

/** Post-process Groq mealPlan: enforce Indian dishes and patient diet category. */
export function sanitizeMealPlanForPatient<T extends MealPlanDayLike>(
  mealPlan: T[],
  category: DietCategory,
): T[] {
  return mealPlan.map((day) => {
    const focus =
      category !== 'non_vegetarian' && mealViolatesDiet(day.focus, category)
        ? day.focus.replace(NON_VEG_PATTERN, '').replace(EGG_PATTERN, '').trim() || day.focus
        : day.focus

    const meals = day.meals.map((meal) => {
      let food = meal.food
      const violates = mealViolatesDiet(food, category)
      const western = mealHasWesternTerms(food)

      if (violates || western) {
        food = indianVegMealFallback(meal.timing, meal.deficiencyTarget)
      } else {
        const scrubbed = scrubWesternTermsFromMeal(food)
        if (scrubbed && scrubbed.length >= 12) food = scrubbed
      }

      if (category !== 'non_vegetarian' && mealViolatesDiet(food, category)) {
        food = indianVegMealFallback(meal.timing, meal.deficiencyTarget)
      }

      return { ...meal, food }
    })

    return { ...day, focus, meals }
  })
}
