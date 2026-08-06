/**
 * Shared types for the rule-based meal-selection engine (lib/meal-engine/).
 *
 * `UserNutritionProfile` is the contract the detailed-assessment quiz targets — keep field
 * names identical when wiring that quiz's answers into a profile object.
 */

export type MealType = 'breakfast' | 'mid_morning_snack' | 'lunch' | 'evening_snack' | 'dinner'

export type Cuisine =
  | 'north_indian'
  | 'south_indian'
  | 'gujarati'
  | 'maharashtrian'
  | 'punjabi'
  | 'bengali'
  | 'rajasthani'
  | 'indian_fusion'

export type DietTag = 'vegetarian' | 'vegan' | 'jain' | 'non_vegetarian'

export type HealthTag =
  | 'high_protein'
  | 'weight_loss'
  | 'muscle_gain'
  | 'pcos'
  | 'diabetes'
  | 'thyroid'
  | 'iron_rich'
  | 'calcium_rich'
  | 'vitamin_d'
  | 'vitamin_b12'
  | 'high_fiber'
  | 'low_carb'
  | 'low_gi'
  | 'heart_healthy'
  | 'gut_friendly'

export type Difficulty = 'easy' | 'medium' | 'hard'

/** Row shape of `public.meals` (Supabase). Fetching is the integration agent's job — this
 * engine only ever receives an already-fetched array. */
export type MealRow = {
  id: string
  meal_name: string
  meal_type: MealType
  cuisine: Cuisine
  diet_type: DietTag[]
  health_tags: HealthTag[]
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  serving_size: string
  ingredients: string[]
  allergens: string[]
  difficulty: Difficulty
  preparation_time_minutes: number
  preparation_notes: string | null
  hydration_tip: string | null
  healthy_alternative: string | null
  is_active: boolean
}

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

export type NutritionGoal =
  | 'energy'
  | 'focus'
  | 'skin_hair'
  | 'recovery'
  | 'immunity'
  | 'hormones'
  | 'wellness'
  | 'weight_loss'
  | 'muscle_gain'

/**
 * Normalized user profile consumed by `generateWeeklyMealPlan`. Field names are a fixed
 * contract shared with the detailed-assessment quiz — do not rename without updating both sides.
 */
export type UserNutritionProfile = {
  age: number | null
  gender: 'male' | 'female' | 'other' | null
  heightCm: number | null
  weightKg: number | null
  activityLevel: ActivityLevel | null
  goal: NutritionGoal | null
  dietType: DietTag | null
  /** e.g. ['pcos','diabetes','thyroid','hypertension'] */
  medicalConditions: string[]
  /** e.g. ['nuts','dairy','gluten'] */
  allergies: string[]
  /** e.g. ['iron','vitamin_d','vitamin_b12'] */
  primaryDeficiencies: string[]
  stressLevel: string | null
  weightLossTargetKg?: number | null
  /** Stable per-report random seed so output is reproducible per report but differs across users. */
  seed: string
}

/** One meal slot in the generated weekly plan, matching what gets merged into `MealPlanMealV2`. */
export type MealPlanMealV3 = {
  /** Human label: Breakfast / Mid-Morning Snack / Lunch / Evening Snack / Dinner */
  timing: string
  mealName: string
  mealType: MealType
  cuisine: Cuisine
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  servingSize: string
  prepNotes?: string
  hydrationTip: string
  healthyAlternative?: string
  /** Short nutrient/condition/goal tag this meal was chosen to support, e.g. "Iron". */
  deficiencyTarget: string
  /** One-line, locally generated explanation of why this meal was picked (no LLM call). */
  reason: string
}

export type MealPlanDayV3 = {
  day: number
  /** Today's top nutrition focus + why, e.g. "Iron — building your stores through the week." */
  focus: string
  meals: MealPlanMealV3[]
}

/** Daily calorie + macro targets produced by targets.ts. */
export type DailyNutritionTargets = {
  bmr: number
  tdee: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
}
