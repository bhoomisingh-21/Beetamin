import Groq from 'groq-sdk'
import type { DetailedAssessmentPayload } from '@/lib/recovery-report-types'
import type {
  GutHealthV2,
  LabTestV2,
  NutrientPairV2,
  RecoveryReportV2Data,
  ShoppingListV2,
  ShoppingSupplementBuyV2,
  SymptomDeficiencyMapRowV2,
  SleepStressV2,
  WeeklyEssentialV2,
  GutAbsorptionTipV2,
  SleepStressNutrientRowV2,
} from '@/lib/recovery-report-v2-types'

/** Dense prompt = smaller completion. Brevity rules keep output within Groq TPM. */
const RECOVERY_REPORT_V2_SYSTEM_PROMPT = `You are Dr. Priya Sharma, Senior Clinical Nutritionist (TheBeetamin). Write for Indian readers: kirana/sabzi, metro + tier-2 realistic costs, veg/non-veg per patient diet.

VOICE: Smart wellness coach—warm, precise, never textbook. Short paragraphs. Zero filler. Ban phrases like "supports overall health", "balanced diet", "listen to your body" unless tied to their symptom.

ANTI-GENERIC: Every block must tie to THIS patient's JSON (symptoms, sleep, stress, meals, goal). If data missing, infer once, label lightly—never long lectures.

MEALS: 7 days × 5 rows/day (Breakfast, Mid-snack, Lunch, Eve-snack, Dinner). Indian-first; different lunch/dinner mains across the week (no copy-paste dal/roti repeat). "deficiencyTarget" = nutrient focus; "reason" ≤14 words. Affordable swaps (eggs, chana, ragi) where useful.

SUPPLEMENTS: Max 3. Each must include dosage, when, takeWithFood (with meal / empty / away from tea/coffee), absorptionPair (synergy), whyThisForm ≤18 words, howItWorks ≤16 words, expectedResults ≤14 words, 2 foodAlternatives India-specific, safetyNote if needed.

JSON ONLY — no markdown, no keys outside schema:

{
  "healthScore": number,
  "subScores": { "energyVitality": number, "energyLabel": "≤14 words — their pattern",
    "skinHairNails": number, "skinHairLabel": "≤14 words",
    "immunity": number, "immunityLabel": "≤14 words",
    "cognitiveClarity": number, "cognitiveLabel": "≤14 words",
    "sleepHormones": number, "sleepLabel": "≤14 words" },
  "scoreInterpretation": "2 tight sentences — their symptoms + scores only",
  "primaryDeficiencies": [ { "nutrient": "", "severity": "High"|"Moderate"|"Mild", "tagline": "≤12 words",
    "whatItMeans": "≤22 words", "whyTheyHaveIt": "their habit/sun/veg choice/sleep — ≤24 words",
    "symptomsTheyFeel": ["≤10 words each, max 4"],
    "bodyImpact": "daily life ≤22 words", "recoveryTime": "realistic window" } ],
  "symptomDeficiencyMap": [ { "symptom": "from their answers", "nutrient": "", "link": "why this pair for THEM ≤18 words" } ],
  "recoveryBlockers": [ "habit/sleep/stress/absorption issue — ≤18 words each" ],
  "progressPrediction": "2 sentences — 30/60/90 day trajectory IF they follow plan; credible numbers",
  "morningRoutine": [ { "time": "", "action": "", "reason": "their case ≤16 words" } ],
  "mealPlan": [ { "day": 1, "focus": "day theme ≤14 words", "meals": [ { "timing": "", "food": "Indian dish + portion hint", "deficiencyTarget": "", "reason": "" } ] } ],
  "supplements": [ { "name": "", "dosage": "", "when": "", "takeWithFood": "", "absorptionPair": "",
    "duration": "", "brand": "realistic India", "whyThisForm": "", "howItWorks": "", "expectedResults": "",
    "foodAlternatives": ["", ""], "safetyNote": "" } ],
  "foodsToAvoid": [ { "food": "", "whyHurting": "their symptom link ≤18 words", "swapWith": "affordable Indian ≤14 words" } ],
  "timeline": [ { "period": "", "phase": "", "changes": ["", "", ""] } ],
  "lifestyleInsights": [ "pattern insights — ≤16 words each" ],
  "quickWins": [ "72h — ≤14 words each" ],
  "doctorNote": "≤45 words — signed-off coach note, specific to them",
  "top3Issues": ["", "", ""],
  "top3Actions": ["", "", ""],
  "gutHealth": { "absorptionScore": number, "absorptionNote": "≤28 words",
    "gutIssues": ["≤16 words"], "probioticFoods": ["Indian ferments — short"],
    "absorptionTips": [ {"tip":"","reason":""}, {"tip":"","reason":""}, {"tip":"","reason":""} ],
    "nutrientPairs": [ {"pair":"","why":""}, {"pair":"","why":""}, {"pair":"","why":""} ]
  },
  "sleepStress": { "sleepScore": number, "stressImpact": "≤28 words tied to them",
    "eveningRoutine": [
      {"time":"","action":"","reason":""},{"time":"","action":"","reason":""},{"time":"","action":"","reason":""},
      {"time":"","action":"","reason":""},{"time":"","action":"","reason":""}
    ],
    "stressNutrients": [ {"nutrient":"","why":""}, {"nutrient":"","why":""}, {"nutrient":"","why":""} ],
    "breathingExercise": "one compact protocol",
    "weekendTip": "≤20 words"
  },
  "labTests": [ five panels: "25-OH Vitamin D", "Omega-3 Index", "Serum Ferritin", "Magnesium RBC", "CBC" — each with whyNeeded, normalRange, theirEstimatedLevel, whenToGet, cost (₹), whereToGet ],
  "shoppingList": { "weeklyEssentials": [ { "item":"","quantity":"","deficiencyTarget":"","whereToBuy":"","cost":"" } ],
    "supplements": [ { "name":"","brand":"","link":"","monthlyQuantity":"","cost":"" } ],
    "totalWeeklyGroceryAdd": "", "totalSupplementCost": "", "budgetTip": "" }
}

COUNTS: primaryDeficiencies 3–4 max. symptomDeficiencyMap exactly 4. recoveryBlockers exactly 4. lifestyleInsights exactly 4. quickWins exactly 3. foodsToAvoid ≥3. morningRoutine ≥5 rows. mealPlan exactly 7 days each with exactly 5 meals. timeline exactly 4 phases: Week 1-2 / Week 3-4 / Week 5-8 / Week 9-12 (90-day arc). gutHealth nutrientPairs 3; absorptionTips 3; sleepStress eveningRoutine 5; stressNutrients 3; labTests 5. subScores 0-100; healthScore 0-100; gut absorptionScore 0-100; sleepScore 0-100.`

/** Groq free/on-demand TPM is often 12k per request bundle (prompt estimate + completion budget). Stay conservative. */
const GROQ_TPM_REQUEST_BUDGET = 11000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Rough tokenizer for budgeting (English-heavy JSON ~4 chars/token). */
function estimateTokens(chars: number): number {
  return Math.ceil(chars / 4)
}

/** Limit huge assessment blobs so prompt + completion cap stays within Groq TPM. */
function shrinkForGroqInput(data: unknown, maxStringLen: number, maxArrayItems: number): unknown {
  if (data === null || data === undefined) return data
  if (typeof data === 'string') {
    return data.length <= maxStringLen ? data : `${data.slice(0, maxStringLen)}…`
  }
  if (typeof data === 'number' || typeof data === 'boolean') return data
  if (Array.isArray(data)) {
    return data.slice(0, maxArrayItems).map((x) => shrinkForGroqInput(x, maxStringLen, maxArrayItems))
  }
  if (typeof data === 'object') {
    const o = data as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(o)) {
      out[k] = shrinkForGroqInput(o[k], maxStringLen, maxArrayItems)
    }
    return out
  }
  return data
}

function buildUserPayloadForGroq(input: GenerateRecoveryReportV2Input, stringCap: number) {
  return {
    patientName: input.patientName,
    age: input.age ?? undefined,
    diet: input.diet ?? undefined,
    goal: input.goal ?? undefined,
    freeAssessment: shrinkForGroqInput(input.freeAssessment, stringCap, 48),
    detailedLifestyleAssessment: input.detailed
      ? (shrinkForGroqInput(input.detailed, Math.min(800, stringCap), 32) as DetailedAssessmentPayload)
      : undefined,
  }
}


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

function coerceSymptomDeficiencyMap(
  raw: unknown,
  defs: {
    nutrient: string
    tagline: string
    whyTheyHaveIt: string
    symptomsTheyFeel: string[]
  }[],
): SymptomDeficiencyMapRowV2[] {
  const rows: SymptomDeficiencyMapRowV2[] = []
  if (Array.isArray(raw)) {
    for (const x of raw) {
      if (!x || typeof x !== 'object') continue
      const o = x as Record<string, unknown>
      rows.push({
        symptom: asStr(o.symptom, ''),
        nutrient: asStr(o.nutrient, ''),
        link: asStr(o.link, ''),
      })
    }
  }
  const out = rows.filter((r) => r.symptom || r.nutrient || r.link)
  for (const d of defs) {
    if (out.length >= 4) break
    const sym = (d.symptomsTheyFeel[0] ?? '').trim()
    const link = (d.whyTheyHaveIt || d.tagline).trim()
    if (!sym && !link) continue
    const dedupe = `${d.nutrient}|${sym}`
    if (out.some((r) => `${r.nutrient}|${r.symptom}` === dedupe)) continue
    out.push({
      symptom: sym || 'What you reported in the assessment',
      nutrient: d.nutrient,
      link: link || 'Linked from your symptoms and lifestyle answers.',
    })
  }
  return out.slice(0, 4)
}

function coerceRecoveryBlockers(raw: unknown): string[] {
  return asStrArr(raw).slice(0, 4)
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
    .slice(0, 4)

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
      takeWithFood: asStr(s.takeWithFood, ''),
      absorptionPair: asStr(s.absorptionPair, ''),
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

  const symptomDeficiencyMap = coerceSymptomDeficiencyMap(data.symptomDeficiencyMap, primaryDeficiencies)
  const recoveryBlockers = coerceRecoveryBlockers(data.recoveryBlockers)

  return {
    healthScore: num(data.healthScore, 50, 0, 100),
    subScores,
    scoreInterpretation: asStr(
      data.scoreInterpretation,
      'Your score sums up symptom burden and probable nutrient gaps from your questionnaire.',
    ),
    primaryDeficiencies,
    symptomDeficiencyMap,
    recoveryBlockers,
    progressPrediction: asStr(
      data.progressPrediction,
      'Steady weeks 1–4 calm the worst symptoms; by week 8–12 stores and rhythm usually match how you feel day-to-day.',
    ),
    morningRoutine,
    mealPlan,
    supplements,
    foodsToAvoid,
    timeline,
    lifestyleInsights: lifestyleInsights.slice(0, 4),
    quickWins: quickWins.slice(0, 3),
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

const USER_PAYLOAD_INSTRUCTION_PREFIX =
  'Generate the complete recovery report JSON for this patient. Use BOTH freeAssessment and detailedLifestyleAssessment when present; infer carefully only where data is missing.\nPatient payload (JSON):\n'

/** Completion budget so estimated prompt tokens + max_tokens stays under Groq TPM per request (often 12k). */
function maxCompletionTokensForPrompt(promptCharLength: number): number {
  const promptTokensEst = estimateTokens(promptCharLength) + 450
  const room = GROQ_TPM_REQUEST_BUDGET - promptTokensEst - 350
  return Math.min(6144, Math.max(1536, room))
}

export async function generateRecoveryReportV2Payload(input: GenerateRecoveryReportV2Input): Promise<Record<string, unknown>> {
  const groq = getGroq()

  let stringCap = 2800

  const tryComplete = async (maxCeiling: number): Promise<{ content: string | null | undefined }> => {
    const userPayload = buildUserPayloadForGroq(input, stringCap)
    const userJson = JSON.stringify(userPayload)
    const promptChars =
      RECOVERY_REPORT_V2_SYSTEM_PROMPT.length + USER_PAYLOAD_INSTRUCTION_PREFIX.length + userJson.length
    let max_tokens = Math.min(maxCeiling, maxCompletionTokensForPrompt(promptChars))

    /** Still over budget — shrink assessment strings further */
    while (max_tokens < 2048 && stringCap > 500) {
      stringCap = Math.floor(stringCap * 0.55)
      const shrunk = JSON.stringify(buildUserPayloadForGroq(input, stringCap))
      const chars =
        RECOVERY_REPORT_V2_SYSTEM_PROMPT.length + USER_PAYLOAD_INSTRUCTION_PREFIX.length + shrunk.length
      max_tokens = Math.min(maxCeiling, maxCompletionTokensForPrompt(chars))
      if (stringCap <= 500) break
    }

    const userPayloadFinal = buildUserPayloadForGroq(input, stringCap)
    const userJsonFinal = JSON.stringify(userPayloadFinal)

    const completion = await Promise.race([
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: RECOVERY_REPORT_V2_SYSTEM_PROMPT },
          {
            role: 'user',
            content: USER_PAYLOAD_INSTRUCTION_PREFIX + userJsonFinal,
          },
        ],
        temperature: 0.35,
        max_tokens,
        response_format: { type: 'json_object' },
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Groq timeout')), 90000)),
    ])

    return { content: completion.choices[0]?.message?.content }
  }

  function groqFailureStatus(error: unknown): number | undefined {
    if (!error || typeof error !== 'object') return undefined
    const err = error as Record<string, unknown>
    if (typeof err.status === 'number') return err.status
    const resp = err.response as { status?: number } | undefined
    return resp?.status
  }

  function looksLikeGroqLowTpmBudget(error: unknown): boolean {
    const status = groqFailureStatus(error)
    if (status === 413 || status === 429) return true
    const blob =
      error instanceof Error
        ? error.message
        : typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            typeof (error as { message: unknown }).message === 'string'
          ? (error as { message: string }).message
          : JSON.stringify(error)
    const b = blob.toLowerCase()
    return (
      b.includes('rate_limit_exceeded') ||
      b.includes('tokens per minute') ||
      (b.includes('request too large') && b.includes('tpm'))
    )
  }

  let maxCeiling = 6144

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const { content } = await tryComplete(maxCeiling)
      if (!content) throw new Error('Empty response from report generation')
      return parseRecoveryReportV2Json(content)
    } catch (e: unknown) {
      const tpmHit = looksLikeGroqLowTpmBudget(e)
      if (!tpmHit) throw e

      stringCap = Math.max(350, Math.floor(stringCap * 0.52))
      maxCeiling = Math.max(3072, Math.floor(maxCeiling * 0.72))

      if (attempt >= 2) await sleep(24000)
      else await sleep(groqFailureStatus(e) === 429 ? 2600 : 450)
    }
  }

  throw new Error('Groq rate limit / TPM exceeded after retries — try again shortly or shorten assessment payload.')
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
