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

export type GutAbsorptionTipV2 = { tip: string; reason: string }

export type NutrientPairV2 = { pair: string; why: string }

export type GutHealthV2 = {
  absorptionScore: number
  absorptionNote: string
  gutIssues: string[]
  probioticFoods: string[]
  absorptionTips: GutAbsorptionTipV2[]
  nutrientPairs: NutrientPairV2[]
}

export type SleepStressNutrientRowV2 = { nutrient: string; why: string }

export type SleepStressV2 = {
  sleepScore: number
  stressImpact: string
  eveningRoutine: MorningRoutineItemV2[]
  stressNutrients: SleepStressNutrientRowV2[]
  breathingExercise: string
  weekendTip: string
}

export type LabTestV2 = {
  testName: string
  whyNeeded: string
  normalRange: string
  theirEstimatedLevel: string
  whenToGet: string
  cost: string
  whereToGet: string
}

export type WeeklyEssentialV2 = {
  item: string
  quantity: string
  deficiencyTarget: string
  whereToBuy: string
  cost: string
}

/** Shopping supplements to purchase (distinct from therapeutic protocol `supplements`) */
export type ShoppingSupplementBuyV2 = {
  name: string
  brand: string
  link: string
  monthlyQuantity: string
  cost: string
}

export type ShoppingListV2 = {
  weeklyEssentials: WeeklyEssentialV2[]
  supplementProducts: ShoppingSupplementBuyV2[]
  totalWeeklyGroceryAdd: string
  totalSupplementCost: string
  budgetTip: string
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
  gutHealth: GutHealthV2
  sleepStress: SleepStressV2
  labTests: LabTestV2[]
  shoppingList: ShoppingListV2
  /** Patient / run metadata merged after Groq parse */
  name?: string
  age?: string
  diet?: string
  goal?: string
  reportId?: string
  generatedAt?: string
}
