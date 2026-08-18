type FreeAssessmentAnswers = {
  energyLevel?: string
  sleepQuality?: string
  physicalSymptoms?: string[]
  mentalClarity?: string
  muscleRecovery?: string
  immuneHealth?: string
}

type FreeAssessmentInput = {
  name: string
  age: string
  diet: string
  goal: string
  answers: FreeAssessmentAnswers
}

type Deficiency = {
  nutrient: string
  severity: 'high' | 'medium' | 'low'
  reason: string
  symptoms: string[]
}

export type FreeAssessmentResult = {
  deficiencyScore: number
  primaryDeficiencies: Deficiency[]
  lifestyleInsights: string[]
  quickWins: string[]
  dietSummary: string
  urgencyMessage: string
}

function dermalCount(symptoms: string[] | undefined): number {
  if (!symptoms?.length) return 0
  if (symptoms.includes('none') || symptoms.includes('unsure')) return 0
  return symptoms.length
}

function scoreFromAnswers(answers: FreeAssessmentAnswers, diet: string): number {
  const energy = answers.energyLevel ?? ''
  const sleep = answers.sleepQuality ?? ''
  const clarity = answers.mentalClarity ?? ''
  const muscle = answers.muscleRecovery ?? ''
  const immune = answers.immuneHealth ?? ''
  const dermal = answers.physicalSymptoms ?? []

  const allPositive =
    energy === 'fully_alert' &&
    sleep === 'refreshed' &&
    (dermal.includes('none') || dermal.length === 0) &&
    clarity === 'sharp' &&
    muscle === 'none' &&
    immune === 'zero'

  if (allPositive) return 12

  let score = 0
  if (energy === 'major_crash' || sleep === 'exhausted') score += 20
  else if (energy === 'slight_dip' || sleep === 'slow_start') score += 10
  else if (sleep === 'wired_tired') score += 15

  if (clarity === 'frequent_fog' || clarity === 'severe') score += 15
  else if (clarity === 'occasional_fog') score += 8

  const dCount = dermalCount(dermal)
  if (dCount >= 3) score += 20
  else if (dCount >= 1) score += 10

  if (immune === 'three_four' || immune === 'five_plus') score += 15
  else if (immune === 'one_two') score += 7

  if (muscle === 'moderate' || muscle === 'severe') score += 12
  else if (muscle === 'mild') score += 5

  if (diet === 'vegetarian' || diet === 'vegan' || diet === 'lacto_ovo') score += 8
  else if (diet === 'irregular') score += 12

  return Math.min(92, Math.max(8, score))
}

function deficienciesFromSignals(
  answers: FreeAssessmentAnswers,
  diet: string,
  name: string,
): Deficiency[] {
  const out: Deficiency[] = []
  const push = (d: Deficiency) => {
    if (!out.some((x) => x.nutrient === d.nutrient)) out.push(d)
  }

  const energy = answers.energyLevel ?? ''
  const sleep = answers.sleepQuality ?? ''
  const clarity = answers.mentalClarity ?? ''
  const muscle = answers.muscleRecovery ?? ''
  const immune = answers.immuneHealth ?? ''
  const dermal = answers.physicalSymptoms ?? []

  if (energy === 'major_crash' || energy === 'slight_dip') {
    push({
      nutrient: 'Ferritin (Iron Storage)',
      severity: energy === 'major_crash' ? 'high' : 'medium',
      reason: `${name}, your afternoon energy pattern (${energy.replace(/_/g, ' ')}) often tracks with low iron stores or B-vitamin gaps — especially common in Indian vegetarian diets.`,
      symptoms: ['Afternoon fatigue', 'Low stamina', 'Brain fog after meals'],
    })
  }

  if (sleep === 'exhausted' || sleep === 'wired_tired' || sleep === 'slow_start') {
    push({
      nutrient: 'Magnesium Glycinate',
      severity: sleep === 'exhausted' ? 'high' : 'medium',
      reason: `Your sleep recovery signal (${sleep.replace(/_/g, ' ')}) suggests magnesium and nervous-system support may be low — a frequent pattern we see in busy Indian professionals.`,
      symptoms: ['Unrefreshing sleep', 'Morning heaviness', 'Muscle tension'],
    })
  }

  if (clarity === 'frequent_fog' || clarity === 'severe' || clarity === 'occasional_fog') {
    push({
      nutrient: 'Methylcobalamin (B12)',
      severity: clarity === 'severe' ? 'high' : 'medium',
      reason: `${name}'s focus pattern (${clarity.replace(/_/g, ' ')}) aligns with B12 or Vitamin D3 gaps — both are under-checked in routine Indian diets.`,
      symptoms: ['Brain fog', 'Poor concentration', 'Mental fatigue'],
    })
  }

  if (dermal.includes('hair_loss') || dermal.includes('brittle_nails')) {
    push({
      nutrient: 'Biotin + Zinc Complex',
      severity: 'medium',
      reason: 'Hair or nail changes you reported often reflect biotin, zinc, or ferritin gaps — especially when protein or iron intake is inconsistent.',
      symptoms: ['Hair shedding', 'Brittle nails', 'Slow regrowth'],
    })
  }

  if (dermal.includes('dry_skin') || dermal.includes('dry_eyes')) {
    push({
      nutrient: 'Omega-3 (EPA/DHA)',
      severity: 'medium',
      reason: 'Dry skin or eyes frequently point to low omega-3 intake — common when fish, flax, or walnut intake is limited.',
      symptoms: ['Dry skin', 'Dry eyes', 'Dull complexion'],
    })
  }

  if (immune === 'three_four' || immune === 'five_plus' || immune === 'one_two') {
    push({
      nutrient: 'Vitamin D3',
      severity: immune === 'five_plus' ? 'high' : 'medium',
      reason: `Frequent infections (${immune.replace(/_/g, ' ')}) in the last 6 months often correlate with low Vitamin D3 and zinc — both widespread in indoor Indian lifestyles.`,
      symptoms: ['Frequent colds', 'Slow recovery', 'Low resilience'],
    })
  }

  if (muscle === 'moderate' || muscle === 'severe') {
    push({
      nutrient: 'Electrolytes + Vitamin D3',
      severity: muscle === 'severe' ? 'high' : 'medium',
      reason: 'Muscle soreness lasting after light activity can reflect magnesium, electrolyte, or Vitamin D3 insufficiency.',
      symptoms: ['Prolonged soreness', 'Cramping', 'Slow recovery'],
    })
  }

  if ((diet === 'vegetarian' || diet === 'vegan') && out.length < 3) {
    push({
      nutrient: 'Methylcobalamin (B12)',
      severity: 'medium',
      reason: `${name}'s ${diet.replace(/_/g, ' ')} pattern carries inherent B12 risk because plant foods do not provide reliable active B12.`,
      symptoms: ['Fatigue', 'Tingling', 'Low mood'],
    })
  }

  if (out.length === 0) {
    push({
      nutrient: 'Vitamin D3',
      severity: 'low',
      reason: `${name}, your answers look relatively stable — still worth confirming Vitamin D3, the most common hidden gap in India despite a balanced routine.`,
      symptoms: ['Subtle fatigue', 'Low immunity', 'Mood dips'],
    })
  }

  return out.slice(0, 4)
}

function dietSummaryFor(diet: string, name: string): string {
  const map: Record<string, string> = {
    vegetarian:
      `${name}'s pure vegetarian pattern limits B12, heme iron, and EPA/DHA unless consciously supplemented — we weighted those nutrients higher in your score.`,
    lacto_ovo:
      `${name}'s vegetarian + eggs diet improves B12 and protein quality, but iron absorption and omega-3 still need attention in Indian meal patterns.`,
    vegan:
      `${name}'s vegan diet requires deliberate B12, iron, zinc, and omega-3 planning — gaps here are structural, not occasional.`,
    non_veg:
      `${name}'s non-vegetarian diet generally covers more micronutrients, but symptom patterns still flag specific gaps worth correcting.`,
    irregular:
      `${name}'s irregular eating pattern disrupts blood sugar and fat-soluble vitamin absorption — timing and consistency matter as much as food choice.`,
  }
  return map[diet] ?? `${name}'s diet pattern was factored into nutrient risk alongside your symptom answers.`
}

/** Deterministic free quiz output when Groq is unavailable. */
export function buildFreeAssessmentFallback(input: FreeAssessmentInput): FreeAssessmentResult {
  const { name, diet, goal, answers } = input
  const deficiencyScore = scoreFromAnswers(answers, diet)
  const primaryDeficiencies = deficienciesFromSignals(answers, diet, name)

  const lifestyleInsights = [
    `Your #1 stated goal (${goal.replace(/_/g, ' ')}) is directly tied to correcting ${primaryDeficiencies[0]?.nutrient ?? 'key micronutrients'} first.`,
    deficiencyScore <= 25
      ? 'Your daily signals look mostly stable — focus on maintenance and confirming Vitamin D3.'
      : 'Fatigue, sleep, or symptom clusters you reported suggest your body is compensating for gaps that labs often miss.',
    diet === 'vegetarian' || diet === 'vegan'
      ? 'Plant-forward Indian diets need structured B12, iron, and omega-3 support — not just “eating healthy”.'
      : 'Even with mixed diets, Indian households often under-consume omega-3, magnesium, and Vitamin D3.',
    'Small daily food swaps beat random supplement stacks — your quick wins below are ordered for your answers.',
  ]

  const quickWins = [
    'Add 2 whole eggs or 150 g paneer daily if your diet allows — supports B12, protein, and iron together.',
    'Take 10 minutes of morning sun on arms/legs before 10 AM to support Vitamin D3 naturally.',
    'Include a palm-sized serving of nuts or seeds (almonds, flax, walnuts) with breakfast for magnesium and omega-3.',
  ]

  const urgencyMessage =
    deficiencyScore <= 25
      ? `${name}, your profile looks relatively healthy — a few targeted tweaks can keep it that way.`
      : deficiencyScore <= 45
        ? `${name}, early warning signs are showing — fixing these gaps now is far easier than waiting for lab-confirmed deficiency.`
        : `${name}, your symptom pattern suggests meaningful nutrient gaps that are likely affecting energy and recovery daily.`

  return {
    deficiencyScore,
    primaryDeficiencies,
    lifestyleInsights,
    quickWins,
    dietSummary: dietSummaryFor(diet, name),
    urgencyMessage,
  }
}
