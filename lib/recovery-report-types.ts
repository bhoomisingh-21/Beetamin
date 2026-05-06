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
  /** Overall score narrative + pillar sub-scores + short interpretation */
  healthScoreSummary?: string
  /** Bullet-style personalised observations tying assessment facts together */
  smartInsights?: string
  /** Stage-based expectations (e.g. weeks 1–2 … 9–12) */
  ninetyDayTimeline?: string
  /** Short “why this paid report vs generic AI” differentiation */
  premiumValueStatement?: string
}
