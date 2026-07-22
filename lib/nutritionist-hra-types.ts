/** Health Risk Assessment form stored in `clients.nutritionist_hra`. */
export type NutritionistHraForm = {
  gender?: string
  age?: number | null
  actual_weight_kg?: number | null
  desired_weight_kg?: number | null
  height_cm?: number | null
  country?: string
  community?: string
  activity_level?: string
  goal?: string
  food_preference?: string
  allergies?: string
  diseases?: string
  clinical_notes?: string
  updated_at?: string
  /** Not stored in the HRA jsonb — mirrors/updates clients.phone directly. */
  phone?: string
}

export const HRA_GENDER_OPTIONS = ['Female', 'Male', 'Other', 'Prefer not to say'] as const

export const HRA_COUNTRY_OPTIONS = [
  'India',
  'United States',
  'United Kingdom',
  'United Arab Emirates',
  'Canada',
  'Australia',
  'Singapore',
  'Saudi Arabia',
  'Qatar',
  'Other',
] as const

/** States & union territories of India, for the intake "State" dropdown. */
export const HRA_INDIAN_STATE_OPTIONS = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (NCT)',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
  'Other',
] as const

export const HRA_ACTIVITY_OPTIONS = [
  'Sedentary',
  'Lightly active',
  'Moderately active',
  'Very active',
  'Athlete',
] as const

export const HRA_GOAL_OPTIONS = [
  'Weight loss',
  'Weight gain',
  'Maintenance',
  'Muscle gain',
  'General wellness',
  'Manage condition',
] as const

export const HRA_FOOD_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Eggetarian',
  'Non-vegetarian',
  'Jain',
  'Other',
] as const

/** Lifestyle / metabolic disorders common in Indian nutrition practice. */
export const HRA_LIFESTYLE_DISORDER_OPTIONS = [
  'None',
  'Prediabetes',
  'Type 2 Diabetes',
  'Hypertension (High BP)',
  'Hypothyroidism',
  'Hyperthyroidism',
  'PCOS / PCOD',
  'Obesity',
  'Overweight',
  'Dyslipidemia (High cholesterol)',
  'Fatty liver (NAFLD)',
  'GERD / Acid reflux',
  'IBS (Irritable bowel)',
  'Anaemia',
  'Iron deficiency',
  'Vitamin D deficiency',
  'Vitamin B12 deficiency',
  'Gout',
  'Chronic kidney disease (early)',
  'Cardiovascular disease',
  'Osteoporosis',
  'Sleep apnea',
  'Stress-related eating',
  'Sedentary lifestyle',
  'Other (specify in clinical notes)',
] as const

export function parseNutritionistHra(raw: unknown): NutritionistHraForm {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const o = raw as Record<string, unknown>
  const num = (k: string) => {
    const v = o[k]
    if (typeof v === 'number' && !Number.isNaN(v)) return v
    if (typeof v === 'string' && v.trim()) {
      const n = Number(v)
      return Number.isNaN(n) ? null : n
    }
    return null
  }
  const str = (k: string) => (typeof o[k] === 'string' ? String(o[k]).trim() : '')
  return {
    gender: str('gender') || undefined,
    age: num('age'),
    actual_weight_kg: num('actual_weight_kg'),
    desired_weight_kg: num('desired_weight_kg'),
    height_cm: num('height_cm'),
    country: str('country') || undefined,
    community: str('community') || undefined,
    activity_level: str('activity_level') || undefined,
    goal: str('goal') || undefined,
    food_preference: str('food_preference') || undefined,
    allergies: str('allergies') || undefined,
    diseases: str('diseases') || undefined,
    clinical_notes: str('clinical_notes') || undefined,
    updated_at: str('updated_at') || undefined,
  }
}
