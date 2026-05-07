import Groq from 'groq-sdk'
import type { DetailedAssessmentPayload } from '@/lib/recovery-report-types'
import type {
  GutHealthV2,
  LabTestV2,
  NutrientPairV2,
  RecoveryReportV2Data,
  ShoppingListV2,
  ShoppingSupplementBuyV2,
  SleepStressV2,
  WeeklyEssentialV2,
  GutAbsorptionTipV2,
  SleepStressNutrientRowV2,
} from '@/lib/recovery-report-v2-types'

const RECOVERY_REPORT_V2_SYSTEM_PROMPT = `You are Dr. Priya Sharma, Senior Clinical Nutritionist at TheBeetamin.
Generate a premium, deeply personalized recovery report based on the user's deficiency assessment AND any detailed lifestyle data provided.

CRITICAL RULES:
- Every sentence must reference THIS person's specific answers and symptoms when data is provided.
- Never use generic advice that could apply to everyone.
- Be specific: name exact foods common in Indian households, practical quantities (cups, katori, tbsp), and timings.
- Write in warm, doctor-to-patient language — minimise unexplained jargon.
- Sound premium and worth paying for.
- Produce a FULL 7-day meal plan with exactly 5 meal rows per day (Breakfast, Mid-morning snack, Lunch, Evening snack, Dinner) unless their diet type makes a slot clearly irrelevant (then substitute with an appropriate Indian meal/snack slot and say why briefly).
- Recommend at most 3 supplements total; prioritise evidence-based combinations (e.g. D3+K2) when appropriate.
- Use Indian meal variety across the week; do not clone the same main meals on multiple days.

Respond ONLY with this exact JSON structure, no markdown, no extra keys, no prose outside JSON:
{
  "healthScore": number,
  "subScores": {
    "energyVitality": number,
    "energyLabel": "string",
    "skinHairNails": number,
    "skinHairLabel": "string",
    "immunity": number,
    "immunityLabel": "string",
    "cognitiveClarity": number,
    "cognitiveLabel": "string",
    "sleepHormones": number,
    "sleepLabel": "string"
  },
  "scoreInterpretation": "string (2 sentences referencing their specifics)",
  "primaryDeficiencies": [
    {
      "nutrient": "string",
      "severity": "High" | "Moderate" | "Mild",
      "tagline": "string",
      "whatItMeans": "string",
      "whyTheyHaveIt": "string",
      "symptomsTheyFeel": ["string"],
      "bodyImpact": "string",
      "recoveryTime": "string"
    }
  ],
  "morningRoutine": [
    {
      "time": "string",
      "action": "string",
      "reason": "string"
    }
  ],
  "mealPlan": [
    {
      "day": 1,
      "focus": "string",
      "meals": [
        {
          "timing": "string",
          "food": "string",
          "deficiencyTarget": "string",
          "reason": "string"
        }
      ]
    }
  ],
  "supplements": [],
  "foodsToAvoid": [
    {
      "food": "string",
      "whyHurting": "string",
      "swapWith": "string"
    }
  ],
  "timeline": [
    {
      "period": "string",
      "phase": "string",
      "changes": ["string", "string", "string"]
    }
  ],
  "lifestyleInsights": ["string", "string", "string", "string"],
  "quickWins": ["string", "string", "string"],
  "doctorNote": "string",
  "top3Issues": ["string", "string", "string"],
  "top3Actions": ["string", "string", "string"],
  "gutHealth": {
    "absorptionScore": number,
    "absorptionNote": "string",
    "gutIssues": ["string"],
    "probioticFoods": ["string"],
    "absorptionTips": [
      { "tip": "string", "reason": "string" },
      { "tip": "string", "reason": "string" },
      { "tip": "string", "reason": "string" }
    ],
    "nutrientPairs": [
      { "pair": "string", "why": "string" },
      { "pair": "string", "why": "string" },
      { "pair": "string", "why": "string" }
    ]
  },
  "sleepStress": {
    "sleepScore": number,
    "stressImpact": "string",
    "eveningRoutine": [
      { "time": "string", "action": "string", "reason": "string" },
      { "time": "string", "action": "string", "reason": "string" },
      { "time": "string", "action": "string", "reason": "string" },
      { "time": "string", "action": "string", "reason": "string" },
      { "time": "string", "action": "string", "reason": "string" }
    ],
    "stressNutrients": [
      { "nutrient": "string", "why": "string" },
      { "nutrient": "string", "why": "string" },
      { "nutrient": "string", "why": "string" }
    ],
    "breathingExercise": "string",
    "weekendTip": "string"
  },
  "labTests": [
    {
      "testName": "string",
      "whyNeeded": "string",
      "normalRange": "string",
      "theirEstimatedLevel": "string",
      "whenToGet": "string",
      "cost": "string",
      "whereToGet": "string"
    }
  ],
  "shoppingList": {
    "weeklyEssentials": [],
    "supplements": [],
    "totalWeeklyGroceryAdd": "string",
    "totalSupplementCost": "string",
    "budgetTip": "string"
  }
}

NUMERIC CONSTRAINTS:
- gutHealth absorptionScore integer 0-100; sleepStress sleepScore integer 0-100.
- gutHealth nutrientPairs exactly 3 rows; absorptionTips exactly 3; sleepStress eveningRoutine exactly 5; stressNutrients exactly 3; labTests array length exactly 5 (panels: \"25-OH Vitamin D\", \"Omega-3 Index\", \"Serum Ferritin\", \"Magnesium RBC\", \"CBC\"); shoppingList supplements array aligns with prescribed protocol picks.
- All subScores fields ending in Vitality/Nails/immunity/Clarity/Hormones are integers 0-100.
- healthScore is integer 0-100.
- timeline must have exactly 4 objects in order: Week 1-2, Week 3-4, Week 5-8, Week 9-12 (adjust labels but keep that progression).`

function getGroq() {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY is not configured')
  return new Groq({ apiKey: key })
}

function num(n: unknown, fallback: number, min: number, max: number): number {
  if (typeof n !== 'number' || Number.isNaN(n)) return fallback
  return Math.max(min, Math.min(max, Math.round(n)))
}

export function parseRecoveryReportV2Json(raw: string): Record<string, unknown> {
  const trimmed = raw.trim()
  const tryParse = (s: string) => {
    try {
      return JSON.parse(s) as Record<string, unknown>
    } catch {
      return null
    }
  }
  let data = tryParse(trimmed)
  if (!data && trimmed.includes('{')) {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start !== -1 && end > start) data = tryParse(trimmed.slice(start, end + 1))
  }
  if (!data || typeof data !== 'object') throw new Error('Invalid recovery report JSON from model')
  return data
}

function asStr(v: unknown, d = ''): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number' && !Number.isNaN(v)) return String(v)
  return d
}

function asStrArr(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((s) => s.trim())
}

const DEFAULT_NUTRIENT_PAIRS: NutrientPairV2[] = [
  {
    pair: 'Vitamin D3 + Healthy Fat',
    why: 'D3 absorbs better with dietary fat — take with breakfast containing ghee or nuts.',
  },
  {
    pair: 'Iron + Vitamin C',
    why: 'Vitamin C supports non-heme iron uptake from plant meals.',
  },
  {
    pair: 'Magnesium + B6',
    why: 'B6 partners with magnesium replenishment pathways in stress-prone lifestyles.',
  },
]

function coerceTipRows(raw: unknown): GutAbsorptionTipV2[] {
  if (!Array.isArray(raw)) return []
  const rows = raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((o) => ({ tip: asStr(o.tip, ''), reason: asStr(o.reason, '') }))
    .filter((r) => r.tip || r.reason)
  const out = [...rows]
  while (out.length < 3) {
    out.push({
      tip: 'Separate tea/coffee from iron-rich lunches by ~60 minutes.',
      reason: 'Tannins can compete with mineral absorption.',
    })
  }
  return out.slice(0, 3)
}

function coerceNutrientPairs(raw: unknown): NutrientPairV2[] {
  if (!Array.isArray(raw)) return [...DEFAULT_NUTRIENT_PAIRS]
  const rows = raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((o) => ({
      pair: asStr(o.pair, ''),
      why: asStr(o.why, ''),
    }))
    .filter((r) => r.pair || r.why)
  const merged = [...rows]
  let i = 0
  while (merged.length < 3 && i < DEFAULT_NUTRIENT_PAIRS.length) {
    merged.push(DEFAULT_NUTRIENT_PAIRS[i])
    i += 1
  }
  return merged.slice(0, 3)
}

function coerceGutHealth(raw: unknown): GutHealthV2 {
  if (!raw || typeof raw !== 'object') raw = {}
  const g = raw as Record<string, unknown>
  let issues = asStrArr(g.gutIssues)
  if (!issues.length) issues = ['Meal timings and acidity can blunt micronutrient uptake.', 'Stress echoes in the gut lining over time.']
  let probiotics = asStrArr(g.probioticFoods)
  const probioticDefaults = ['Homemade curd — 1 small katori with lunch daily', 'Fermented idli batter — several meals weekly', 'Chaas — room-temperature, mid-day']
  while (probiotics.length < 4) probiotics.push(probioticDefaults[probiotics.length % probioticDefaults.length])

  return {
    absorptionScore: num(g.absorptionScore, 65, 0, 100),
    absorptionNote: asStr(
      g.absorptionNote,
      'How you digest and combine foods decides how much of your plate converts into circulating nutrients.',
    ),
    gutIssues: issues.slice(0, 6),
    probioticFoods: probiotics.slice(0, 4),
    absorptionTips: coerceTipRows(g.absorptionTips),
    nutrientPairs: coerceNutrientPairs(g.nutrientPairs),
  }
}

function coerceEveningRoutine(raw: unknown) {
  if (!Array.isArray(raw)) raw = []
  const rows = (raw as unknown[])
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((r) => ({
      time: asStr(r.time, ''),
      action: asStr(r.action, ''),
      reason: asStr(r.reason, ''),
    }))
  const defs = [
    { time: '8:00 PM', action: 'Dim lights; finish caffeine for the day', reason: 'Cooler light cues melatonin for recovery sleep.' },
    { time: '9:00 PM', action: 'Light protein + complex carb snack if hungry', reason: 'Stabilises glucose so stress hormones stay quieter overnight.' },
    { time: '9:30 PM', action: 'Phone down + warm shower', reason: 'Parasympathetic shift improves overnight mineral retention.' },
    { time: '10:00 PM', action: 'Magnesium support as advised in your protocol', reason: 'Evening dosing matches muscle relaxation and sleep onset.' },
    { time: '10:30 PM', action: 'Sleep window (7–8 hours)', reason: 'Deep sleep is when micronutrient repletion accelerates.' },
  ]
  const out = [...rows]
  let d = 0
  while (out.length < 5 && d < defs.length) {
    out.push(defs[d])
    d += 1
  }
  return out.slice(0, 5)
}

function coerceStressNutrients(raw: unknown): SleepStressNutrientRowV2[] {
  if (!Array.isArray(raw)) raw = []
  const rows = (raw as unknown[])
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((o) => ({ nutrient: asStr(o.nutrient, ''), why: asStr(o.why, '') }))
    .filter((r) => r.nutrient || r.why)
  const defs = [
    { nutrient: 'Magnesium', why: 'Rapid turnover under mental load — cramps and tension worsen when tanks run low.' },
    { nutrient: 'Vitamin C', why: 'Adrenal stress chemistry burns through antioxidant reserves faster.' },
    { nutrient: 'B vitamins', why: 'B5/B6-heavy pathways fatigue first when workloads stack.' },
  ]
  const out = [...rows]
  let i = 0
  while (out.length < 3 && i < defs.length) {
    out.push(defs[i])
    i += 1
  }
  return out.slice(0, 3)
}

function coerceSleepStress(raw: unknown): SleepStressV2 {
  if (!raw || typeof raw !== 'object') raw = {}
  const s = raw as Record<string, unknown>
  return {
    sleepScore: num(s.sleepScore, 60, 0, 100),
    stressImpact: asStr(
      s.stressImpact,
      'Cortisol rhythm and fragmented sleep blunt how well micronutrients are stored and utilised.',
    ),
    eveningRoutine: coerceEveningRoutine(s.eveningRoutine),
    stressNutrients: coerceStressNutrients(s.stressNutrients),
    breathingExercise: asStr(
      s.breathingExercise,
      '4-7-8 breathing — inhale quietly for 4 counts, hold for 7, exhale softly for 8. Complete 3 rounds before lights-out to shift the nervous system toward rest-and-digest.',
    ),
    weekendTip: asStr(s.weekendTip, 'Protect one slow morning weekly — irregular wake times delay mineral hormone rhythms.'),
  }
}

const LAB_TEST_DEFAULTS: LabTestV2[] = [
  {
    testName: '25-OH Vitamin D',
    whyNeeded: 'Confirms fat-soluble status and calibrates dosing before/after sun and food changes.',
    normalRange: '40–80 ng/mL preferred therapeutic range',
    theirEstimatedLevel: 'Often 15–35 ng/mL when sun + intake are low — lab will confirm.',
    whenToGet: 'Baseline now, repeat ~12 weeks after protocol',
    cost: '~₹800–1,200',
    whereToGet: 'Thyrocare · SRL Diagnostics · accredited local lab',
  },
  {
    testName: 'Omega-3 Index',
    whyNeeded: 'Quantifies cell-membrane omega-3 saturation beyond food recall alone.',
    normalRange: '>8% omega-3 index',
    theirEstimatedLevel: 'May read low if oily fish / alsi intake is sporadic.',
    whenToGet: 'Baseline if cardio/brain symptoms present',
    cost: '~₹2,500–4,000',
    whereToGet: 'Speciality metabolic labs (metros)',
  },
  {
    testName: 'Serum Ferritin',
    whyNeeded: 'Best first-line view of iron stores when fatigue or hair shedding feature.',
    normalRange: '40–150 ng/mL women · 40–300 ng/m men (lab-specific)',
    theirEstimatedLevel: 'Can sit <30 ng/mL with low heme iron + heavy cycles.',
    whenToGet: 'Before aggressive iron pushes; repeat 8–12 weeks',
    cost: '~₹400–800',
    whereToGet: 'Any national diagnostic chain',
  },
  {
    testName: 'Magnesium RBC',
    whyNeeded: 'RBC magnesium tracks tissue need better than serum alone.',
    normalRange: '4.2–6.8 mg/dL (method dependent)',
    theirEstimatedLevel: 'Often suboptimal with stress, poor sleep, cramps.',
    whenToGet: 'If symptoms overlap protocol focus',
    cost: '~₹1,800–3,500',
    whereToGet: 'Metro metabolic / functional panels',
  },
  {
    testName: 'CBC',
    whyNeeded: 'Screens haemoglobin patterns and infection/inflammation cues.',
    normalRange: 'Within lab reference intervals',
    theirEstimatedLevel: 'Use to contextualise ferritin and recovery pace.',
    whenToGet: 'Same baseline draw as ferritin',
    cost: '~₹300–600',
    whereToGet: 'Walk-in booths countrywide',
  },
]

function coerceLabTests(raw: unknown): LabTestV2[] {
  if (!Array.isArray(raw)) raw = []
  const rows = (raw as unknown[])
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((o) => ({
      testName: asStr(o.testName, ''),
      whyNeeded: asStr(o.whyNeeded, ''),
      normalRange: asStr(o.normalRange, ''),
      theirEstimatedLevel: asStr(o.theirEstimatedLevel, ''),
      whenToGet: asStr(o.whenToGet, ''),
      cost: asStr(o.cost, ''),
      whereToGet: asStr(o.whereToGet, ''),
    }))
    .filter((r) => r.testName.length > 1)

  function matchRow(seed: LabTestV2): LabTestV2 | null {
    const token = seed.testName.toLowerCase().split(/[\s-]+/)[0] ?? ''
    return (
      rows.find((r) => r.testName.toLowerCase().includes(token)) ||
      rows.find((r) => token.length > 2 && seed.testName.toLowerCase().includes(r.testName.toLowerCase().slice(0, 5))) ||
      null
    )
  }

  return LAB_TEST_DEFAULTS.map((def) => {
    const r = matchRow(def)
    if (!r) return def
    return {
      testName: r.testName || def.testName,
      whyNeeded: r.whyNeeded || def.whyNeeded,
      normalRange: r.normalRange || def.normalRange,
      theirEstimatedLevel: r.theirEstimatedLevel || def.theirEstimatedLevel,
      whenToGet: r.whenToGet || def.whenToGet,
      cost: r.cost || def.cost,
      whereToGet: r.whereToGet || def.whereToGet,
    }
  }).slice(0, 5)
}

function coerceShoppingList(raw: unknown): ShoppingListV2 {
  if (!raw || typeof raw !== 'object') raw = {}
  const s = raw as Record<string, unknown>
  let weeklyRaw = Array.isArray(s.weeklyEssentials) ? (s.weeklyEssentials as unknown[]) : []
  let weekly = weeklyRaw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((w) => ({
      item: asStr(w.item, ''),
      quantity: asStr(w.quantity, ''),
      deficiencyTarget: asStr(w.deficiencyTarget, ''),
      whereToBuy: asStr(w.whereToBuy, ''),
      cost: asStr(w.cost, ''),
    }))
    .filter((w) => w.item)

  const wdef: WeeklyEssentialV2[] = [
    { item: 'Mixed nuts (walnuts/almonds)', quantity: '~200 g / week', deficiencyTarget: 'Omega-3 + minerals', whereToBuy: 'Kirana / BigBasket', cost: '~₹180–260' },
    { item: 'Seasonal leafy greens bundle', quantity: '5–7 bundles / week', deficiencyTarget: 'Iron + folate', whereToBuy: 'Sabzi vendor', cost: '~₹150–220' },
    { item: 'Citrus / amla weekly pack', quantity: '1 kg rotation', deficiencyTarget: 'Vitamin C synergy', whereToBuy: 'Local mandi', cost: '~₹80–140' },
    { item: 'Curd culture refill', quantity: '500 g tubs × 2', deficiencyTarget: 'Gut microbiome support', whereToBuy: 'Dairy counter', cost: '~₹80–140' },
  ]
  while (weekly.length < 4) weekly.push(wdef[weekly.length])

  let supRaw = Array.isArray(s.supplements) ? (s.supplements as unknown[]) : []
  let supProds = supRaw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((p) => ({
      name: asStr(p.name, ''),
      brand: asStr(p.brand, ''),
      link: asStr(p.link, ''),
      monthlyQuantity: asStr(p.monthlyQuantity, ''),
      cost: asStr(p.cost, ''),
    }))
    .filter((p) => p.name)

  while (supProds.length < 1) {
    supProds.push({
      name: 'Vitamin D3 + K2 (as per protocol)',
      brand: 'Pharmacist-directed brand',
      link: 'Order via trusted pharmacy portals',
      monthlyQuantity: '1 bottle (~60 capsules)',
      cost: '~₹350–550',
    })
  }

  return {
    weeklyEssentials: weekly.slice(0, 14),
    supplementProducts: supProds.slice(0, 6) as ShoppingSupplementBuyV2[],
    totalWeeklyGroceryAdd: asStr(s.totalWeeklyGroceryAdd, '₹200–380 extra staples beyond usual cart'),
    totalSupplementCost: asStr(s.totalSupplementCost, '₹800–1,200 / month consolidated'),
    budgetTip: asStr(s.budgetTip, 'Buy dry nuts once mid-month; freeze extras to avoid spoilage.'),
  }
}

export function coerceRecoveryReportV2(
  data: Record<string, unknown>,
  envelope: {
    name: string
    age?: string
    diet?: string
    goal?: string
    reportId?: string
    generatedAt?: string
  },
): RecoveryReportV2Data {
  const ss = data.subScores && typeof data.subScores === 'object' ? (data.subScores as Record<string, unknown>) : {}

  const subScores = {
    energyVitality: num(ss.energyVitality, 55, 0, 100),
    energyLabel: asStr(ss.energyLabel, 'Energy reflects your reported stamina and daytime crashes.'),
    skinHairNails: num(ss.skinHairNails, 55, 0, 100),
    skinHairLabel: asStr(ss.skinHairLabel, 'Hair, skin and nail signals from your questionnaire.'),
    immunity: num(ss.immunity, 55, 0, 100),
    immunityLabel: asStr(ss.immunityLabel, 'Immune resilience cues from digestion, sleep and recovery.'),
    cognitiveClarity: num(ss.cognitiveClarity, 55, 0, 100),
    cognitiveLabel: asStr(ss.cognitiveLabel, 'Focus and mental clarity aligned with lifestyle answers.'),
    sleepHormones: num(ss.sleepHormones, 55, 0, 100),
    sleepLabel: asStr(ss.sleepLabel, 'Sleep and rhythm stressors you described.'),
  }

  const primaryDeficienciesRaw = Array.isArray(data.primaryDeficiencies) ? data.primaryDeficiencies : []
  const primaryDeficiencies = primaryDeficienciesRaw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((d) => ({
      nutrient: asStr(d.nutrient, 'Key nutrient'),
      severity: asStr(d.severity, 'Moderate'),
      tagline: asStr(d.tagline, ''),
      whatItMeans: asStr(d.whatItMeans, ''),
      whyTheyHaveIt: asStr(d.whyTheyHaveIt, ''),
      symptomsTheyFeel: asStrArr(d.symptomsTheyFeel),
      bodyImpact: asStr(d.bodyImpact, ''),
      recoveryTime: asStr(d.recoveryTime, '6–8 weeks with the protocol'),
    }))

  const morningRoutineRaw = Array.isArray(data.morningRoutine) ? data.morningRoutine : []
  const morningRoutine = morningRoutineRaw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((r) => ({
      time: asStr(r.time, ''),
      action: asStr(r.action, ''),
      reason: asStr(r.reason, ''),
    }))

  const mealPlanRaw = Array.isArray(data.mealPlan) ? data.mealPlan : []
  const mealPlan = mealPlanRaw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((d) => {
      const mealsRaw = Array.isArray(d.meals) ? d.meals : []
      const meals = mealsRaw
        .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
        .map((m) => ({
          timing: asStr(m.timing, ''),
          food: asStr(m.food, ''),
          deficiencyTarget: asStr(m.deficiencyTarget, ''),
          reason: asStr(m.reason, ''),
        }))
      return {
        day: num(d.day, 1, 1, 14),
        focus: asStr(d.focus, ''),
        meals,
      }
    })

  const supplementsRaw = Array.isArray(data.supplements) ? data.supplements : []
  const supplements = supplementsRaw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .slice(0, 3)
    .map((s) => ({
      name: asStr(s.name, ''),
      dosage: asStr(s.dosage, ''),
      when: asStr(s.when, ''),
      duration: asStr(s.duration, ''),
      brand: asStr(s.brand, ''),
      whyThisForm: asStr(s.whyThisForm, ''),
      howItWorks: asStr(s.howItWorks, ''),
      expectedResults: asStr(s.expectedResults, ''),
      foodAlternatives: asStrArr(s.foodAlternatives),
      safetyNote: asStr(s.safetyNote, ''),
    }))

  const foodsRaw = Array.isArray(data.foodsToAvoid) ? data.foodsToAvoid : []
  const foodsToAvoid = foodsRaw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((f) => ({
      food: asStr(f.food, ''),
      whyHurting: asStr(f.whyHurting, ''),
      swapWith: asStr(f.swapWith, ''),
    }))

  const timelineRaw = Array.isArray(data.timeline) ? data.timeline : []
  const timeline = timelineRaw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((t) => ({
      period: asStr(t.period, ''),
      phase: asStr(t.phase, ''),
      changes: asStrArr(t.changes),
    }))

  const quickWins = asStrArr(data.quickWins)
  const lifestyleInsights = asStrArr(data.lifestyleInsights)
  const top3Issues = asStrArr(data.top3Issues)
  const top3Actions = asStrArr(data.top3Actions)

  return {
    healthScore: num(data.healthScore, 50, 0, 100),
    subScores,
    scoreInterpretation: asStr(
      data.scoreInterpretation,
      'Your score sums up symptom burden and probable nutrient gaps from your questionnaire.',
    ),
    primaryDeficiencies,
    morningRoutine,
    mealPlan,
    supplements,
    foodsToAvoid,
    timeline,
    lifestyleInsights: lifestyleInsights.slice(0, 8),
    quickWins: quickWins.slice(0, 8),
    doctorNote: asStr(data.doctorNote, ''),
    top3Issues: top3Issues.slice(0, 5),
    top3Actions: top3Actions.slice(0, 5),
    gutHealth: coerceGutHealth(data.gutHealth),
    sleepStress: coerceSleepStress(data.sleepStress),
    labTests: coerceLabTests(data.labTests),
    shoppingList: coerceShoppingList(data.shoppingList),
    name: envelope.name,
    age: envelope.age,
    diet: envelope.diet,
    goal: envelope.goal,
    reportId: envelope.reportId,
    generatedAt: envelope.generatedAt,
  }
}

export type GenerateRecoveryReportV2Input = {
  patientName: string
  /** Free quiz JSON stored on clients */
  freeAssessment: unknown
  detailed?: DetailedAssessmentPayload | null
  /** Optional richer meta for prompting */
  age?: string | null
  diet?: string | null
  goal?: string | null
}

export async function generateRecoveryReportV2Payload(input: GenerateRecoveryReportV2Input): Promise<Record<string, unknown>> {
  const groq = getGroq()

  const userPayload = {
    patientName: input.patientName,
    age: input.age ?? undefined,
    diet: input.diet ?? undefined,
    goal: input.goal ?? undefined,
    freeAssessment: input.freeAssessment,
    detailedLifestyleAssessment: input.detailed ?? undefined,
  }

  const completion = await Promise.race([
    groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: RECOVERY_REPORT_V2_SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            'Generate the complete recovery report JSON for this patient. Use BOTH freeAssessment and detailedLifestyleAssessment when present; infer carefully only where data is missing.\nPatient payload (JSON):\n' +
            JSON.stringify(userPayload, null, 2),
        },
      ],
      temperature: 0.35,
      max_tokens: 14000,
      response_format: { type: 'json_object' },
    }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Groq timeout')), 90000)),
  ])

  const raw = completion.choices[0]?.message?.content
  if (!raw) throw new Error('Empty response from report generation')

  return parseRecoveryReportV2Json(raw)
}

export function deficiencySummaryFromV2(reportData: RecoveryReportV2Data) {
  const deficiencies = reportData.primaryDeficiencies.map((p) => {
    const sev = p.severity.toLowerCase()
    const severity = sev === 'high' ? 'high' : sev === 'mild' ? 'low' : 'medium'
    return {
      nutrient: p.nutrient,
      severity,
      reason: p.tagline || p.whatItMeans,
      symptoms: p.symptomsTheyFeel || [],
    }
  })

  return {
    overallScore: reportData.healthScore,
    deficiencies,
    urgencyMessage: reportData.scoreInterpretation.slice(0, 400),
    source: 'v2_structured' as const,
  }
}
