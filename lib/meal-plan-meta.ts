/** Optional metadata stored inside `nutritionist_notes` as JSON. */
import type { MealPlanDay } from '@/lib/meal-plan-types'
import { emptyDay, nextIsoDate, renumberPlanDays, todayIsoDate } from '@/lib/meal-plan-types'
import { hydrateMealSlots } from '@/lib/meal-slot-suggestions'

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

/** Compact column header: "Fri 26-Jun-2026" */
export function formatGridDayColumn(date: Date): string {
  const weekday = date.toLocaleDateString('en-IN', { weekday: 'short' })
  const day = date.getDate()
  const rest = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  return `${weekday} ${day}-${rest}`
}

export function formatWeekRangeLabel(start: Date, end: Date): string {
  const sm = start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  const em = end.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  return `${sm} - ${em}`
}

export function addDaysToIso(iso: string, offset: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export function initialWeekDays(existing: MealPlanDay[], weekLength = 7): MealPlanDay[] {
  const withDefaults = (d: MealPlanDay) => ({ ...d, meals: hydrateMealSlots(d.meals) })

  if (existing.length >= weekLength) {
    return existing.map(withDefaults)
  }

  const list = existing.length > 0 ? existing.map(withDefaults) : []
  let iso =
    list.length > 0 && list[list.length - 1]?.plan_date
      ? nextIsoDate(list[list.length - 1].plan_date!)
      : todayIsoDate()
  if (list.length === 0) {
    list.push(withDefaults(emptyDay(1, iso)))
    iso = nextIsoDate(iso)
  }
  while (list.length < weekLength) {
    list.push(withDefaults(emptyDay(list.length + 1, iso)))
    iso = nextIsoDate(iso)
  }
  return renumberPlanDays(list)
}
