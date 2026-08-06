/** Normalized diet for meal-plan generation and PDF sanitization. */
export type DietCategory = 'pure_vegetarian' | 'lacto_ovo_vegetarian' | 'non_vegetarian'

export type ResolvedPatientDiet = {
  category: DietCategory
  /** Short label sent to Groq */
  label: string
  /** Hard rules block for the model */
  groqRules: string
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
      ? 'NON_VEGETARIAN: Indian fish (rohu/katla/bangda) or chicken allowed sparingly for deficiency targets. Still NO western dishes/ingredients in any food references. NO quinoa, avocado, kale, greek yogurt, salmon, shrimp, bagel, granola, smoothie bowls.'
      : category === 'pure_vegetarian'
        ? 'PURE_VEGETARIAN (HARD RULE): any food reference (foodsToAvoid swaps, shopping list, supplement food alternatives) must NEVER suggest chicken, fish, meat, seafood, eggs, or anda. Dairy (paneer, curd, milk, ghee) is allowed. Indian home-cooking only.'
        : 'LACTO_OVO_VEGETARIAN (HARD RULE): any food reference (foodsToAvoid swaps, shopping list, supplement food alternatives) must NEVER suggest chicken, fish, meat, or seafood. Eggs/anda are allowed. Indian home-cooking only — no western fusion.'

  return { category, label, groqRules }
}
