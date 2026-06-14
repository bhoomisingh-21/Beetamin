/** All Indian meal-time slots in one day. All fields are free text (empty string = no suggestion). */
export type MealSlots = {
  early_morning: string
  breakfast: string
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
}

export function emptyMealSlots(): MealSlots {
  return {
    early_morning: '',
    breakfast: '',
    mid_morning: '',
    lunch: '',
    evening_snack: '',
    dinner: '',
    bedtime: '',
  }
}

export function emptyDay(dayNumber: number): MealPlanDay {
  return {
    day: dayNumber,
    meals: emptyMealSlots(),
    water_target: '',
    day_notes: '',
  }
}

export const MEAL_SLOT_META: { key: keyof MealSlots; label: string; time: string; emoji: string }[] = [
  { key: 'early_morning', label: 'Early Morning', time: '6–7 AM', emoji: '🌅' },
  { key: 'breakfast', label: 'Breakfast', time: '8–9 AM', emoji: '🍽️' },
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
