/** Optional metadata stored inside `nutritionist_notes` as JSON. */
export type MealPlanMeta = {
  note?: string
  targetCalories?: number
}

const META_PREFIX = '{"__mealPlanMeta":'

export function parseMealPlanMeta(raw: string | null | undefined): MealPlanMeta {
  if (!raw?.trim()) return {}
  const trimmed = raw.trim()
  if (!trimmed.startsWith(META_PREFIX)) {
    return { note: trimmed }
  }
  try {
    const parsed = JSON.parse(trimmed) as { __mealPlanMeta?: MealPlanMeta }
    return parsed.__mealPlanMeta ?? {}
  } catch {
    return { note: trimmed }
  }
}

export function serializeMealPlanMeta(meta: MealPlanMeta): string | null {
  const note = meta.note?.trim() ?? ''
  const hasCalories = typeof meta.targetCalories === 'number' && meta.targetCalories > 0
  if (!note && !hasCalories) return null
  return JSON.stringify({
    __mealPlanMeta: {
      ...(note ? { note } : {}),
      ...(hasCalories ? { targetCalories: meta.targetCalories } : {}),
    },
  })
}

export function estimateDailyMacros(targetCalories: number) {
  const carbs = Math.round((targetCalories * 0.55) / 4)
  const fat = Math.round((targetCalories * 0.25) / 9)
  const protein = Math.round((targetCalories * 0.2) / 4)
  const fiber = Math.round((targetCalories * 14) / 1000)
  return { carbs, fat, protein, fiber }
}

export function formatHeight(cm: number | null | undefined): string {
  if (!cm || cm <= 0) return '—'
  const totalIn = cm / 2.54
  const ft = Math.floor(totalIn / 12)
  const inches = Math.round(totalIn % 12)
  return `${ft}' ${inches}"`
}

export function shortClientId(id: string): string {
  const digits = id.replace(/\D/g, '')
  if (digits.length >= 7) return digits.slice(-7)
  return id.slice(0, 8)
}

export function weekDatesFrom(numDays: number, anchor = new Date()): Date[] {
  const d = new Date(anchor)
  const day = d.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: numDays }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return date
  })
}

export function datesForPlanDays(days: { plan_date?: string }[], anchor = new Date()): Date[] {
  const fallback = weekDatesFrom(days.length, anchor)
  return days.map((d, i) => {
    if (d.plan_date) return new Date(`${d.plan_date}T12:00:00`)
    return fallback[i] ?? new Date(anchor)
  })
}

export function formatGridDayHeader(date: Date): string {
  const weekday = date.toLocaleDateString('en-IN', { weekday: 'short' })
  const rest = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  return `${weekday}, ${rest}`
}
