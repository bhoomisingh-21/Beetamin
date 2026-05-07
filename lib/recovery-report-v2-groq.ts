import Groq from 'groq-sdk'
import type { DetailedAssessmentPayload } from '@/lib/recovery-report-types'
import type { RecoveryReportV2Data } from '@/lib/recovery-report-v2-types'

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
  "top3Actions": ["string", "string", "string"]
}

NUMERIC CONSTRAINTS:
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
      max_tokens: 8192,
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
