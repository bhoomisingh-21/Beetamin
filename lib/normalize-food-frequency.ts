import type { FoodFrequency, FoodFrequencyKey } from '@/lib/recovery-report-types'

const FOOD_KEYS: FoodFrequencyKey[] = [
  'green_vegetables',
  'dairy',
  'eggs_or_nonveg',
  'nuts_seeds',
  'fresh_fruits',
]

const VALID_FREQ = new Set(['daily', 'sometimes', 'rarely'])

function dietSkipsEggsOrNonveg(dietType: string): boolean {
  if (dietType === 'Pure Vegetarian (no eggs, no meat)') return true
  if (dietType.toLowerCase().startsWith('vegan')) return true
  return false
}

/** Fill hidden / skipped food rows so API validation passes (e.g. eggs for pure veg). */
export function normalizeFoodFrequencyForDiet(
  dietType: string,
  raw: Record<string, unknown> | FoodFrequency | null | undefined,
): FoodFrequency {
  const out = {} as FoodFrequency
  for (const key of FOOD_KEYS) {
    const v = raw && typeof raw === 'object' ? (raw as Record<string, unknown>)[key] : undefined
    if (typeof v === 'string' && VALID_FREQ.has(v)) {
      out[key] = v as FoodFrequency[FoodFrequencyKey]
    } else if (key === 'eggs_or_nonveg' && dietSkipsEggsOrNonveg(dietType)) {
      out[key] = 'rarely'
    } else {
      out[key] = ''
    }
  }
  return out
}

export { FOOD_KEYS as FOOD_FREQUENCY_KEYS }
