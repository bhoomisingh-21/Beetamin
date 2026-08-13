/** All Indian meal-time slots in one day. All fields are free text (empty string = no suggestion). */
export type MealSlots = {
  early_morning: string
  breakfast: string
  post_workout: string
  mid_morning: string
  lunch: string
  evening_snack: string
  dinner: string
  bedtime: string
}

export type MealPlanDay = {
  day: number
  meals: MealSlots
  water_target: string
  day_notes: string
  /** ISO date (YYYY-MM-DD) for calendar column header */
  plan_date?: string
  /** When true, this day is off — no meals required */
  skipped?: boolean
}

export function emptyMealSlots(): MealSlots {
  return {
    early_morning: '',
    breakfast: '',
    post_workout: '',
    mid_morning: '',
    lunch: '',
    evening_snack: '',
    dinner: '',
    bedtime: '',
  }
}

/** Ensure every slot key exists when reading legacy plan JSON from the DB. */
export function normalizeMealSlots(meals: Partial<MealSlots> | undefined): MealSlots {
  const base = emptyMealSlots()
  if (!meals) return base
  return {
    early_morning: meals.early_morning ?? base.early_morning,
    breakfast: meals.breakfast ?? base.breakfast,
    post_workout: meals.post_workout ?? base.post_workout,
    mid_morning: meals.mid_morning ?? base.mid_morning,
    lunch: meals.lunch ?? base.lunch,
    evening_snack: meals.evening_snack ?? base.evening_snack,
    dinner: meals.dinner ?? base.dinner,
    bedtime: meals.bedtime ?? base.bedtime,
  }
}

export function emptyDay(dayNumber: number, planDate?: string, skipped = false): MealPlanDay {
  return {
    day: dayNumber,
    meals: emptyMealSlots(),
    water_target: '',
    day_notes: '',
    ...(planDate ? { plan_date: planDate } : {}),
    ...(skipped ? { skipped: true } : {}),
  }
}

export function todayIsoDate(): string {
  return isoFromLocalDate(new Date())
}

/** Local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function isoFromLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Resolve the entry_date key used for meal_plan_entries and PDF lookups. */
export function entryDateForPlanDay(
  day: Pick<MealPlanDay, 'plan_date'>,
  columnDate: Date,
  fallbackIso = todayIsoDate(),
): string {
  if (day.plan_date?.trim()) return day.plan_date.trim()
  return isoFromLocalDate(columnDate) || fallbackIso
}

export function nextIsoDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + 1)
  return isoFromLocalDate(d)
}

export function renumberPlanDays(dayList: MealPlanDay[]): MealPlanDay[] {
  return dayList.map((d, i) => ({ ...d, day: i + 1 }))
}

export function activePlanDayCount(days: MealPlanDay[]): number {
  return days.filter((d) => !d.skipped).length
}

export const MEAL_SLOT_META: { key: keyof MealSlots; label: string; time: string; emoji: string }[] = [
  { key: 'early_morning', label: 'Early Morning', time: '6–7 AM', emoji: '🌅' },
  { key: 'breakfast', label: 'Breakfast', time: '8–9 AM', emoji: '🍽️' },
  { key: 'post_workout', label: 'Post Workout', time: '9:30 AM', emoji: '💪' },
  { key: 'mid_morning', label: 'Mid-Morning Snack', time: '11 AM', emoji: '🥤' },
  { key: 'lunch', label: 'Lunch', time: '1–2 PM', emoji: '🌿' },
  { key: 'evening_snack', label: 'Evening Snack', time: '5 PM', emoji: '🫖' },
  { key: 'dinner', label: 'Dinner', time: '7–8 PM', emoji: '🌙' },
  { key: 'bedtime', label: 'Bedtime', time: '10 PM', emoji: '💊' },
]

/** Shape stored in Supabase and returned by server actions. */
export type MealPlan = {
  id: string
  client_id: string
  nutritionist_id: string
  client_email: string
  title: string
  nutritionist_notes: string | null
  status: 'draft' | 'published' | 'archived'
  days: MealPlanDay[]
  published_at: string | null
  created_at: string
  updated_at: string
  pdf_storage_path?: string | null
  target_kcal?: number | null
}

/** Lightweight list item (no days JSON). */
export type MealPlanListItem = {
  id: string
  title: string
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  created_at: string
  num_days: number
}

/** DTO seen by client in sessions dashboard. */
export type MealPlanCustomerDTO = {
  id: string
  title: string
  nutritionist_notes: string | null
  days: MealPlanDay[]
  published_at: string
  nutritionist_name: string | null
}
