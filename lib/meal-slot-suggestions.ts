import type { MealSlots } from '@/lib/meal-plan-types'

/** Common Indian meal suggestions — tap to fill a slot, then replace with IFCT food if needed. */
export const MEAL_SLOT_SUGGESTIONS: Record<keyof MealSlots, string[]> = {
  early_morning: ['Warm water + lemon', 'Soaked almonds (5)', 'Green tea'],
  breakfast: ['Oats with milk', 'Idli + sambar', 'Poha', 'Upma', 'Paratha + curd'],
  mid_morning: ['Seasonal fruit', 'Buttermilk', 'Roasted chana'],
  lunch: ['Dal + rice + sabzi', 'Roti + paneer sabzi', 'Khichdi + curd', 'Brown rice + rajma'],
  evening_snack: ['Green tea + biscuits', 'Sprouts chaat', 'Roasted makhana'],
  dinner: ['Roti + dal + vegetables', 'Grilled chicken + salad', 'Vegetable soup + toast'],
  bedtime: ['Turmeric milk', 'Soaked walnuts', 'Herbal tea'],
}
