/** Structured recovery report consumed by Groq generation + React PDF (v2). */

export type RecoverySubScoresV2 = {
  energyVitality: number
  energyLabel: string
  skinHairNails: number
  skinHairLabel: string
  immunity: number
  immunityLabel: string
  cognitiveClarity: number
  cognitiveLabel: string
  sleepHormones: number
  sleepLabel: string
}

export type PrimaryDeficiencyV2 = {
  nutrient: string
  severity: 'High' | 'Moderate' | 'Mild' | string
  tagline: string
  whatItMeans: string
  whyTheyHaveIt: string
  symptomsTheyFeel: string[]
  bodyImpact: string
  recoveryTime: string
}

export type MorningRoutineItemV2 = {
  time: string
  action: string
  reason: string
}

export type MealPlanMealV2 = {
  timing: string
  food: string
  deficiencyTarget: string
  reason: string
}

export type MealPlanDayV2 = {
  day: number
  focus: string
  meals: MealPlanMealV2[]
}

export type SupplementV2 = {
  name: string
  dosage: string
  when: string
  duration: string
  brand: string
  whyThisForm: string
  howItWorks: string
  expectedResults: string
  foodAlternatives: string[]
  safetyNote: string
}

export type FoodToAvoidV2 = {
  food: string
  whyHurting: string
  swapWith: string
}

export type TimelinePhaseV2 = {
  period: string
  phase: string
  changes: string[]
}

export type RecoveryReportV2Data = {
  healthScore: number
  subScores: RecoverySubScoresV2
  scoreInterpretation: string
  primaryDeficiencies: PrimaryDeficiencyV2[]
  morningRoutine: MorningRoutineItemV2[]
  mealPlan: MealPlanDayV2[]
  supplements: SupplementV2[]
  foodsToAvoid: FoodToAvoidV2[]
  timeline: TimelinePhaseV2[]
  lifestyleInsights: string[]
  quickWins: string[]
  doctorNote: string
  top3Issues: string[]
  top3Actions: string[]
  /** Patient / run metadata merged after Groq parse */
  name?: string
  age?: string
  diet?: string
  goal?: string
  reportId?: string
  generatedAt?: string
}
