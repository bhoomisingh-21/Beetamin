export type FoodFrequencyKey =
  | 'green_vegetables'
  | 'dairy'
  | 'eggs_or_nonveg'
  | 'nuts_seeds'
  | 'fresh_fruits'

export type FoodFrequency = Record<FoodFrequencyKey, 'daily' | 'sometimes' | 'rarely' | ''>

export type DetailedAssessmentPayload = {
  diet_type: string
  food_frequency: FoodFrequency
  sun_exposure: string
  physical_symptoms: string[]
  energy_mood: string
  sleep_quality: string
  digestion: string
  exercise_level: string
  water_intake: string
  menstrual_health?: string | null
}

export type RecoveryReportSections = {
  deficiencyAnalysis: string
  mealPlan: string
  supplements: string
  blockingFoods: string
  dailyRoutine: string
  doctorNote: string
  disclaimer: string
}
