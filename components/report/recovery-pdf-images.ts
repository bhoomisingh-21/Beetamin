/** Unsplash sources for recovery PDF visuals (URLs include w/q for size/bandwidth). */

export const COVER_IMAGE_HERO =
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80'

export const COVER_IMAGE_BOTTOM_LEFT =
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80'

export const HEALTH_SCORE_WELLNESS =
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&q=80'

export const MEAL_PLAN_BANNER =
  'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80'

export const SUPPLEMENT_SECTION_BANNER =
  'https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&q=80'

export const FOODS_AVOID_JUNK =
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&q=80'

export const FOODS_EAT_FRESH =
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80'

export const TIMELINE_BANNER =
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80'

export const DOCTOR_AVATAR =
  'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&q=80'

export const deficiencyImages: Record<string, string> = {
  'Vitamin D': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=200&q=80',
  'Vitamin D3': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=200&q=80',
  'Omega-3': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=200&q=80',
  'Omega-3 (DHA)': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=200&q=80',
  'Omega-3 (EPA/DHA)': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=200&q=80',
  Magnesium: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&q=80',
  'Magnesium Glycinate': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&q=80',
  Iron: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80',
  Ferritin: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80',
  'Vitamin B12': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&q=80',
  B12: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&q=80',
  Biotin: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=200&q=80',
  Zinc: 'https://images.unsplash.com/photo-1574689211033-5ac6a3cddaaa?w=200&q=80',
  Calcium: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80',
  'Vitamin C': 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=200&q=80',
  default: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=200&q=80',
}

export const dayFoodImages = [
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&q=80',
  'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=100&q=80',
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=100&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&q=80',
  'https://images.unsplash.com/photo-1547592180-85f173990554?w=100&q=80',
]

export const supplementImages: Record<string, string> = {
  'Vitamin D3': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=100&q=80',
  'Vitamin D3 + K2': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=100&q=80',
  'Omega-3': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=100&q=80',
  'Omega-3 (EPA + DHA)': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=100&q=80',
  'Magnesium Glycinate': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&q=80',
  default: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&q=80',
}

export function getDeficiencyImageUrl(nutrient: string): string {
  const t = nutrient.trim()
  if (deficiencyImages[t]) return deficiencyImages[t]
  const lower = t.toLowerCase()
  const key = Object.keys(deficiencyImages).find(
    (k) => k !== 'default' && lower.includes(k.toLowerCase()),
  )
  return key ? deficiencyImages[key] : deficiencyImages.default
}

export function getSupplementImageUrl(name: string): string {
  const t = name.trim()
  if (supplementImages[t]) return supplementImages[t]
  const lower = t.toLowerCase()
  const key = Object.keys(supplementImages).find(
    (k) => k !== 'default' && lower.includes(k.toLowerCase()),
  )
  return key ? supplementImages[key] : supplementImages.default
}
