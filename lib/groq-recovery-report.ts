import Groq from 'groq-sdk'
import { RECOVERY_PLAN_SYSTEM_PROMPT } from './recovery-report-prompt'
import type { DetailedAssessmentPayload, RecoveryReportSections } from './recovery-report-types'

function getGroq() {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY is not configured')
  return new Groq({ apiKey: key })
}

function safeParseJson(raw: string): RecoveryReportSections {
  let text = raw.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  }
  const parsed = JSON.parse(text) as Partial<RecoveryReportSections>
  const keys: (keyof RecoveryReportSections)[] = [
    'deficiencyAnalysis',
    'mealPlan',
    'supplements',
    'blockingFoods',
    'dailyRoutine',
    'doctorNote',
    'disclaimer',
  ]
  const out = {} as RecoveryReportSections
  for (const k of keys) {
    const v = parsed[k]
    out[k] = typeof v === 'string' && v.trim() ? v.trim() : `[${String(k)} — content being prepared. Please contact support if this persists.]`
  }
  return out
}

export async function generateRecoveryReportSections(input: {
  patientName: string
  freeAssessment: unknown
  detailed: DetailedAssessmentPayload
}): Promise<RecoveryReportSections> {
  const groq = getGroq()
  const userPayload = {
    patientName: input.patientName,
    freeDeficiencyAssessment: input.freeAssessment,
    detailedLifestyleAssessment: input.detailed,
  }

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: RECOVERY_PLAN_SYSTEM_PROMPT },
      {
        role: 'user',
        content:
          'Patient data (JSON):\n' +
          JSON.stringify(userPayload, null, 2) +
          '\n\nProduce the JSON object as specified in your system instructions.',
      },
    ],
    temperature: 0.35,
    max_tokens: 8192,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) throw new Error('Empty response from report generation')
  return safeParseJson(raw)
}
