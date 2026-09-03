'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  Loader2,
  Leaf,
  Check,
  User,
  Utensils,
  Apple,
  HeartPulse,
  Stethoscope,
  AlertTriangle,
  BrainCircuit,
  Sun,
  Activity,
  Zap,
  Moon,
  Gauge,
  Dumbbell,
  Target,
  Droplets,
  HandHeart,
  UserCheck,
  ShieldCheck,
  Lock,
  Clock,
  type LucideIcon,
} from 'lucide-react'
import { signInReturnForPaidReport } from '@/lib/assessment-auth-links'
import {
  hasLocalFreeAssessment,
  readLocalAssessmentMeta,
  readLocalFreeAssessmentSnapshot,
  syncLocalAssessmentToProfile,
} from '@/lib/sync-local-assessment-client'
import { assessmentMetaString } from '@/lib/assessment-profile-fields'
import { mapFreeMetaToDetailed } from '@/lib/map-free-to-detailed'
import { normalizeFoodFrequencyForDiet } from '@/lib/normalize-food-frequency'
import type { DetailedAssessmentPayload, FoodFrequency, FoodFrequencyKey } from '@/lib/recovery-report-types'
import { trackEvent } from '@/lib/analytics'
import { startReport39Payment } from '@/lib/start-report-payment-client'

const ALL_FOOD_ROWS: { key: FoodFrequencyKey; label: string; dietFilter?: 'eggs_ok' | 'nonveg_only' | 'any' }[] = [
  { key: 'green_vegetables', label: 'Green vegetables (palak, methi, broccoli)', dietFilter: 'any' },
  { key: 'dairy', label: 'Dairy products (milk, curd, paneer)', dietFilter: 'any' },
  { key: 'eggs_or_nonveg', label: 'Eggs or non-veg (chicken, fish)', dietFilter: 'nonveg_only' },
  { key: 'nuts_seeds', label: 'Nuts and seeds (almonds, walnuts, seeds)', dietFilter: 'any' },
  { key: 'fresh_fruits', label: 'Fresh fruits', dietFilter: 'any' },
]

const SYMPTOM_OPTIONS: { id: string; label: string }[] = [
  { id: 'hair', label: 'Hair fall or thinning' },
  { id: 'nails', label: 'Brittle or weak nails' },
  { id: 'skin', label: 'Dry, dull, or flaky skin' },
  { id: 'cramps', label: 'Muscle cramps or twitching' },
  { id: 'tingling', label: 'Tingling in hands or feet' },
  { id: 'headaches', label: 'Frequent headaches' },
  { id: 'joints', label: 'Joint or bone pain' },
  { id: 'healing', label: 'Slow healing of cuts/wounds' },
  { id: 'colds', label: 'Frequent colds or infections' },
  { id: 'none', label: 'None of the above' },
]

const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const MEDICAL_CONDITION_OPTIONS: { value: string; label: string }[] = [
  { value: 'none', label: 'None of these' },
  { value: 'pcos', label: 'PCOS / PCOD' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'thyroid', label: 'Thyroid' },
  { value: 'hypertension', label: 'Hypertension' },
  { value: 'heart_condition', label: 'Heart condition' },
  { value: 'other', label: 'Other' },
]

const ALLERGY_OPTIONS: { value: string; label: string }[] = [
  { value: 'nuts', label: 'Nuts' },
  { value: 'dairy', label: 'Dairy / Lactose' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'soy', label: 'Soy' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'seafood', label: 'Seafood / Shellfish' },
  { value: 'none', label: 'None' },
  { value: 'other', label: 'Other' },
]

const STRESS_OPTIONS: { value: string; label: string }[] = [
  { value: 'low', label: 'Low — I feel calm most days' },
  { value: 'moderate', label: 'Moderate — manageable, comes and goes' },
  { value: 'high', label: 'High — frequently stressed' },
  { value: 'very_high', label: 'Very high — constantly overwhelmed' },
]

const PCOS_FOLLOWUP_OPTIONS: { value: string; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: 'Not sure' },
]

const DIABETES_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'type_1', label: 'Type 1' },
  { value: 'type_2', label: 'Type 2' },
  { value: 'prediabetes', label: 'Prediabetes' },
  { value: 'gestational', label: 'Gestational' },
]

const FOOD_DISLIKE_OPTIONS: { value: string; label: string }[] = [
  { value: 'bitter_veg', label: 'Bitter vegetables (karela, methi)' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'fish', label: 'Fish' },
  { value: 'very_spicy', label: 'Very spicy food' },
  { value: 'none', label: 'None of these' },
]

const MEAL_TIMING_OPTIONS = [
  'Regular 3 meals around the same time',
  'I often skip breakfast',
  'Late dinners (after 9pm)',
  'Irregular — no fixed meal times',
]

const COOKING_HABIT_OPTIONS = [
  'I cook most meals at home',
  'Mix of home-cooked and ordered',
  'Mostly tiffin / ordered / eating out',
]

const SUPPLEMENT_PREF_OPTIONS = [
  'Prefer food-first, supplements only if needed',
  'Open to a simple supplement plan',
  'Already taking supplements',
]

const TRAINING_FREQUENCY_OPTIONS: { value: string; label: string }[] = [
  { value: 'rarely', label: 'Rarely' },
  { value: '1_2_per_week', label: '1–2x per week' },
  { value: '3_4_per_week', label: '3–4x per week' },
  { value: '5_plus_per_week', label: '5+ per week' },
]

const TRUST_BADGES: { icon: LucideIcon; label: string }[] = [
  { icon: UserCheck, label: 'Nutritionist Approved' },
  { icon: ShieldCheck, label: '100% Personalized' },
  { icon: Lock, label: 'Data is Secure' },
]

type QuizKey =
  | 'personal_info'
  | 'diet'
  | 'food'
  | 'meal_timing'
  | 'cooking_habit'
  | 'food_dislikes'
  | 'supplement_preference'
  | 'medical_conditions'
  | 'pcos_followup'
  | 'diabetes_followup'
  | 'allergies'
  | 'stress'
  | 'sun'
  | 'symptoms'
  | 'energy'
  | 'sleep'
  | 'digestion'
  | 'exercise'
  | 'goal_followup'
  | 'water'
  | 'menstrual'

const STEP_META: Record<QuizKey, { category: string; icon: LucideIcon }> = {
  personal_info: { category: 'About You', icon: User },
  diet: { category: 'Your Diet', icon: Utensils },
  food: { category: 'Food Habits', icon: Apple },
  meal_timing: { category: 'Meal Rhythm', icon: Clock },
  cooking_habit: { category: 'Cooking', icon: Utensils },
  food_dislikes: { category: 'Food Preferences', icon: Apple },
  supplement_preference: { category: 'Supplements', icon: HeartPulse },
  medical_conditions: { category: 'Medical History', icon: HeartPulse },
  pcos_followup: { category: 'Medical History', icon: Stethoscope },
  diabetes_followup: { category: 'Medical History', icon: Stethoscope },
  allergies: { category: 'Allergies', icon: AlertTriangle },
  stress: { category: 'Stress Level', icon: BrainCircuit },
  sun: { category: 'Sunlight', icon: Sun },
  symptoms: { category: 'Physical Symptoms', icon: Activity },
  energy: { category: 'Energy & Mood', icon: Zap },
  sleep: { category: 'Sleep', icon: Moon },
  digestion: { category: 'Digestion', icon: Gauge },
  exercise: { category: 'Activity Level', icon: Dumbbell },
  goal_followup: { category: 'Your Goal', icon: Target },
  water: { category: 'Hydration', icon: Droplets },
  menstrual: { category: 'For Women', icon: HandHeart },
}

function emptyFoodFreq(): FoodFrequency {
  return {
    green_vegetables: '',
    dairy: '',
    eggs_or_nonveg: '',
    nuts_seeds: '',
    fresh_fruits: '',
  }
}

/** Single-select option button — scale micro-interaction + checkmark fade-in when picked. */
function SingleChoiceButton({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.01 }}
      className={`w-full flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-colors ${
        selected
          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm shadow-emerald-100'
          : 'border-gray-200 bg-white text-gray-800 hover:border-emerald-300 hover:bg-emerald-50/40'
      }`}
    >
      <span>{label}</span>
      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

/** Multi-select option button — same feel as SingleChoiceButton but a square checkbox indicator. */
function MultiChoiceButton({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.01 }}
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
        selected
          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm shadow-emerald-100'
          : 'border-gray-200 bg-white text-gray-800 hover:border-emerald-300 hover:bg-emerald-50/40'
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          selected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300 bg-white'
        }`}
      >
        <AnimatePresence>
          {selected && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center justify-center"
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {label}
    </motion.button>
  )
}

export default function DetailedAssessmentPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()

  const [index, setIndex] = useState(0)
  const indexRef = useRef(0)
  useEffect(() => {
    indexRef.current = index
  }, [index])

  const [phase, setPhase] = useState<'quiz' | 'summary' | 'generating'>('quiz')
  const [freeQuizOnFile, setFreeQuizOnFile] = useState<boolean | null>(null)
  const assessmentSyncRef = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id || assessmentSyncRef.current) return
    assessmentSyncRef.current = true
    void (async () => {
      const ok = await syncLocalAssessmentToProfile(user.id)
      setFreeQuizOnFile(ok || hasLocalFreeAssessment())
    })().catch(() => {
      assessmentSyncRef.current = false
      setFreeQuizOnFile(hasLocalFreeAssessment())
    })
  }, [isLoaded, isSignedIn, user?.id])

  /** Goal picked in the free quiz — drives the optional goal-based follow-up step below. */
  const [freeGoal, setFreeGoal] = useState('')
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const meta = readLocalAssessmentMeta()
      setFreeGoal(assessmentMetaString(meta, 'goal'))
      const mapped = mapFreeMetaToDetailed(meta)
      if (mapped.diet) {
        setDiet(mapped.diet)
        setSkipDiet(true)
      }
      if (mapped.energy) {
        setEnergy(mapped.energy)
        setSkipEnergy(true)
      }
      if (mapped.sleep) {
        setSleep(mapped.sleep)
        setSkipSleep(true)
      }
      if (mapped.symptoms.length > 0) {
        setSymptoms(mapped.symptoms)
        setSkipSymptoms(true)
      }
    } catch {
      /* defensive — missing/garbled meta must never break the quiz */
    }
  }, [])

  const [direction, setDirection] = useState<'next' | 'back'>('next')

  // Personal info
  const [gender, setGender] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')

  const [diet, setDiet] = useState('')
  const [skipDiet, setSkipDiet] = useState(false)
  const [skipSymptoms, setSkipSymptoms] = useState(false)
  const [skipEnergy, setSkipEnergy] = useState(false)
  const [skipSleep, setSkipSleep] = useState(false)
  const [mealTiming, setMealTiming] = useState('')
  const [cookingHabit, setCookingHabit] = useState('')
  const [foodDislikes, setFoodDislikes] = useState<string[]>([])
  const [supplementPreference, setSupplementPreference] = useState('')
  const [foodFreq, setFoodFreq] = useState<FoodFrequency>(emptyFoodFreq)

  // Medical history
  const [medicalConditions, setMedicalConditions] = useState<string[]>([])
  const [medicalConditionsOtherText, setMedicalConditionsOtherText] = useState('')
  const [pcosFollowup, setPcosFollowup] = useState('')
  const [diabetesType, setDiabetesType] = useState('')

  // Allergies
  const [allergiesSelected, setAllergiesSelected] = useState<string[]>([])
  const [allergiesOtherText, setAllergiesOtherText] = useState('')

  // Stress
  const [stress, setStress] = useState('')

  // Goal-based follow-up
  const [weightLossTargetKg, setWeightLossTargetKg] = useState('')
  const [trainingFrequency, setTrainingFrequency] = useState('')

  /** Rows shown in the food-frequency question — filtered by diet choice. */
  const visibleFoodRows = useMemo(() => {
    const isVeg = diet === 'Pure Vegetarian (no eggs, no meat)'
    const isVegan = diet.toLowerCase().startsWith('vegan')
    const isLactoOvo = diet === 'Vegetarian (eggs are okay)'
    const isNonVeg = diet === 'Non-Vegetarian (chicken/fish/meat)'
    return ALL_FOOD_ROWS
      .filter((row) => {
        if (row.dietFilter === 'any') return true
        if (row.key === 'eggs_or_nonveg') {
          if (isVeg || isVegan) return false
          return true
        }
        return true
      })
      .map((row) => {
        if (row.key === 'eggs_or_nonveg' && isLactoOvo) {
          return { ...row, label: 'Eggs (boiled, omelette, anda bhurji)' }
        }
        if (row.key === 'eggs_or_nonveg' && isNonVeg) {
          return { ...row, label: 'Non-veg (chicken, fish, eggs)' }
        }
        return row
      })
  }, [diet])
  const [sun, setSun] = useState('')
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [energy, setEnergy] = useState('')
  const [sleep, setSleep] = useState('')
  const [digestion, setDigestion] = useState('')
  const [exercise, setExercise] = useState('')
  const [water, setWater] = useState('')
  const [menstrual, setMenstrual] = useState('')

  const showMenstrual = gender === 'female'
  const goalFollowupType: 'weight_loss' | 'muscle_gain' | null =
    freeGoal === 'weight_loss' ? 'weight_loss' : freeGoal === 'muscle_gain' ? 'muscle_gain' : null

  const keys = useMemo<QuizKey[]>(() => {
    const arr: QuizKey[] = ['personal_info']
    if (!skipDiet) arr.push('diet')
    arr.push('food', 'meal_timing', 'cooking_habit', 'food_dislikes', 'supplement_preference', 'medical_conditions')
    if (medicalConditions.includes('pcos')) arr.push('pcos_followup')
    if (medicalConditions.includes('diabetes')) arr.push('diabetes_followup')
    arr.push('allergies', 'stress', 'sun')
    if (!skipSymptoms) arr.push('symptoms')
    if (!skipEnergy) arr.push('energy')
    if (!skipSleep) arr.push('sleep')
    arr.push('digestion', 'exercise')
    if (goalFollowupType) arr.push('goal_followup')
    arr.push('water')
    if (showMenstrual) arr.push('menstrual')
    return arr
  }, [medicalConditions, goalFollowupType, showMenstrual, skipDiet, skipSymptoms, skipEnergy, skipSleep])

  const [genError, setGenError] = useState('')
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [isRetakePaidFlow, setIsRetakePaidFlow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('retake') === 'paid') {
        sessionStorage.setItem('beetamin.retakePaidReportFlow', '1')
        setIsRetakePaidFlow(true)
      } else if (sessionStorage.getItem('beetamin.retakePaidReportFlow') === '1') {
        setIsRetakePaidFlow(true)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const currentKey = keys[index] ?? keys[keys.length - 1]
  const questionNumber = index + 1
  const totalQuestions = keys.length
  const remainingQuestions = totalQuestions - questionNumber
  const showEncouragement = remainingQuestions > 0 && remainingQuestions <= 2

  const goNext = useCallback(() => {
    setDirection('next')
    const i = indexRef.current
    if (i + 1 >= keys.length) {
      setPhase('summary')
      return
    }
    setIndex(i + 1)
  }, [keys.length])

  const scheduleAdvance = useCallback(() => {
    window.setTimeout(() => goNext(), 300)
  }, [goNext])

  const goBack = useCallback(() => {
    setDirection('back')
    const i = indexRef.current
    if (i === 0) {
      router.push('/assessment/results')
      return
    }
    setIndex(i - 1)
  }, [router])

  function toggleSymptom(id: string) {
    setSymptoms((prev) => {
      if (id === 'none') return ['none']
      const withoutNone = prev.filter((x) => x !== 'none')
      if (withoutNone.includes(id)) return withoutNone.filter((x) => x !== id)
      return [...withoutNone, id]
    })
  }

  function toggleMedicalCondition(value: string) {
    setMedicalConditions((prev) => {
      if (value === 'none') return ['none']
      const withoutNone = prev.filter((x) => x !== 'none')
      if (withoutNone.includes(value)) return withoutNone.filter((x) => x !== value)
      return [...withoutNone, value]
    })
  }

  function toggleFoodDislike(value: string) {
    setFoodDislikes((prev) => {
      if (value === 'none') return ['none']
      const withoutNone = prev.filter((x) => x !== 'none')
      if (withoutNone.includes(value)) return withoutNone.filter((x) => x !== value)
      return [...withoutNone, value]
    })
  }

  function toggleAllergy(value: string) {
    setAllergiesSelected((prev) => {
      if (value === 'none') return ['none']
      const withoutNone = prev.filter((x) => x !== 'none')
      if (withoutNone.includes(value)) return withoutNone.filter((x) => x !== value)
      return [...withoutNone, value]
    })
  }

  function foodComplete() {
    return visibleFoodRows.every((r) => foodFreq[r.key] === 'daily' || foodFreq[r.key] === 'sometimes' || foodFreq[r.key] === 'rarely')
  }

  function personalInfoComplete() {
    const h = Number(heightCm)
    const w = Number(weightKg)
    return Boolean(gender) && heightCm.trim() !== '' && weightKg.trim() !== '' && Number.isFinite(h) && Number.isFinite(w) && h > 0 && w > 0
  }

  function medicalConditionsComplete() {
    if (medicalConditions.length === 0) return false
    if (medicalConditions.includes('other') && !medicalConditionsOtherText.trim()) return false
    return true
  }

  function allergiesComplete() {
    if (allergiesSelected.length === 0) return false
    if (allergiesSelected.includes('other') && !allergiesOtherText.trim()) return false
    return true
  }

  function goalFollowupComplete() {
    if (goalFollowupType === 'weight_loss') {
      const n = Number(weightLossTargetKg)
      return weightLossTargetKg.trim() !== '' && Number.isFinite(n) && n > 0
    }
    if (goalFollowupType === 'muscle_gain') return Boolean(trainingFrequency)
    return true
  }

  function buildConditionDetails(): Record<string, unknown> {
    const details: Record<string, unknown> = {}
    if (medicalConditions.includes('pcos') && pcosFollowup) details.pcos = pcosFollowup
    if (medicalConditions.includes('diabetes') && diabetesType) details.diabetes_type = diabetesType
    if (medicalConditions.includes('other') && medicalConditionsOtherText.trim()) {
      details.other_medical_condition = medicalConditionsOtherText.trim()
    }
    if (allergiesSelected.includes('other') && allergiesOtherText.trim()) {
      details.other_allergy = allergiesOtherText.trim()
    }
    if (goalFollowupType === 'muscle_gain' && trainingFrequency) details.training_frequency = trainingFrequency
    if (mealTiming) details.meal_timing = mealTiming
    if (cookingHabit) details.cooking_habit = cookingHabit
    if (foodDislikes.length) details.food_dislikes = foodDislikes.filter((d) => d !== 'none')
    if (supplementPreference) details.supplement_preference = supplementPreference
    return details
  }

  function buildPayload(): DetailedAssessmentPayload {
    return {
      diet_type: diet,
      food_frequency: normalizeFoodFrequencyForDiet(diet, foodFreq),
      sun_exposure: sun,
      physical_symptoms: symptoms.filter((s) => s !== 'none'),
      energy_mood: energy,
      sleep_quality: sleep,
      digestion,
      exercise_level: exercise,
      water_intake: water,
      menstrual_health: showMenstrual ? menstrual || null : null,
      gender: gender || null,
      height_cm: heightCm.trim() ? Number(heightCm) : null,
      weight_kg: weightKg.trim() ? Number(weightKg) : null,
      medical_conditions: medicalConditions.filter((c) => c !== 'none'),
      allergies: allergiesSelected.filter((a) => a !== 'none'),
      stress_level: stress || null,
      condition_details: buildConditionDetails(),
      weight_loss_target_kg:
        goalFollowupType === 'weight_loss' && weightLossTargetKg.trim() ? Number(weightLossTargetKg) : null,
    }
  }

  const topTags = useMemo(() => {
    const labels = symptoms
      .filter((id) => id !== 'none')
      .map((id) => SYMPTOM_OPTIONS.find((o) => o.id === id)?.label)
      .filter(Boolean) as string[]
    return labels.slice(0, 3)
  }, [symptoms])

  async function handleGenerateReport() {
    setGenError('')
    if (!isSignedIn) {
      router.push(signInReturnForPaidReport())
      return
    }

    const localSnapshot = readLocalFreeAssessmentSnapshot()
    if (!localSnapshot && !(await syncLocalAssessmentToProfile(user?.id))) {
      setGenError(
        'Your free quiz is missing on this device. Complete the free assessment first (same browser), open your results page, then return here.',
      )
      setFreeQuizOnFile(false)
      return
    }
    if (!localSnapshot) {
      await syncLocalAssessmentToProfile(user?.id)
    }
    setFreeQuizOnFile(true)
    setIsCheckoutLoading(true)

    try {
      const freeAssessmentSnapshot = readLocalFreeAssessmentSnapshot()
      const assessmentMeta = readLocalAssessmentMeta()

      const saveRes = await fetch('/api/save-detailed-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...buildPayload(),
          ...(freeAssessmentSnapshot
            ? { freeAssessmentResult: freeAssessmentSnapshot, assessmentMeta }
            : {}),
        }),
      })
      const saveJson = await saveRes.json().catch(() => ({}))
      if (!saveRes.ok) {
        throw new Error(typeof saveJson.error === 'string' ? saveJson.error : 'Could not save your answers')
      }
      const detailedAssessmentId = saveJson.id as string

      let paymentMode: 'new' | 'retake' = 'new'
      try {
        if (sessionStorage.getItem('beetamin.retakePaidReportFlow') === '1') {
          paymentMode = 'retake'
          sessionStorage.removeItem('beetamin.retakePaidReportFlow')
        }
      } catch {
        /* ignore */
      }

      trackEvent('payment_initiated', { plan: 'report', amount: 39, mode: paymentMode })

      const paymentError = await startReport39Payment({
        detailedAssessmentId,
        mode: paymentMode,
        freeAssessmentSnapshot,
        assessmentMeta,
      })
      if (paymentError) {
        throw new Error(paymentError)
      }
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="text-emerald-500 shrink-0" size={18} />
            <span className="text-gray-900 font-bold">TheBeetamin</span>
          </Link>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-gray-800 font-semibold">Sign in to continue</p>
          <p className="mt-2 text-sm text-gray-500 max-w-sm">
            We need your account to save and email your personalised recovery PDF.
          </p>
          <button
            type="button"
            onClick={() => router.push(signInReturnForPaidReport())}
            className="mt-6 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm"
          >
            Sign in
          </button>
        </div>
      </div>
    )
  }

  const variants = {
    enter: (dir: 'next' | 'back') => ({ opacity: 0, x: dir === 'next' ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: 'next' | 'back') => ({ opacity: 0, x: dir === 'next' ? -40 : 40 }),
  }

  const CategoryIcon = STEP_META[currentKey]?.icon ?? Leaf

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-emerald-50/30 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <Leaf className="text-emerald-500 shrink-0" size={18} />
          <span className="text-gray-900 font-bold">TheBeetamin</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/assessment/results')}
            className="text-sm text-gray-500 hover:text-gray-800 transition"
          >
            ← Results
          </button>
          {user?.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt="" className="w-8 h-8 rounded-full ring-2 ring-gray-100" />
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <div className="flex-1 flex flex-col items-center px-4 py-6 sm:py-8 lg:py-12 lg:justify-center overflow-y-auto">
          <div className="w-full max-w-xl mx-auto">
            {phase === 'quiz' && (
              <>
                <div className="hidden lg:block mb-6 text-center lg:text-left">
                  <h2 className="text-2xl font-black text-gray-900">Personalised recovery intake</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {isRetakePaidFlow
                      ? 'Answer the paid follow-up questionnaire, then complete ₹39 PayU checkout for a fresh PDF.'
                      : 'A few follow-up questions — same calm layout as your profile setup.'}
                  </p>
                </div>
                {isRetakePaidFlow ? (
                  <p className="lg:hidden mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    Retake flow: complete this paid questionnaire, then pay ₹39 on PayU for an updated report.
                  </p>
                ) : null}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-emerald-950/5 p-6 sm:p-8">
                  <div className="flex items-center gap-3 sm:gap-4 mb-5">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex shrink-0 items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Back</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                          initial={false}
                          animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="mt-1 text-center text-[11px] font-medium text-gray-500 sm:text-xs">
                        Question {questionNumber} of {totalQuestions}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-700">
                      <CategoryIcon className="h-3.5 w-3.5" />
                      {STEP_META[currentKey]?.category ?? 'Assessment'}
                    </span>
                    <AnimatePresence>
                      {showEncouragement && (
                        <motion.span
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-[11px] font-semibold text-emerald-600"
                        >
                          Almost there — {remainingQuestions} more question{remainingQuestions > 1 ? 's' : ''}!
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  {questionNumber === 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="mt-4 space-y-3"
                    >
                      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                        <Clock className="h-3.5 w-3.5 text-emerald-500" />
                        Takes about 3–4 minutes
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-gray-50/80 border border-gray-100 px-4 py-3">
                        {TRUST_BADGES.map((badge) => (
                          <span key={badge.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
                            <badge.icon className="h-3.5 w-3.5 text-emerald-600" />
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${currentKey}-${index}`}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22 }}
                className="mt-6 flex-1"
              >
                {currentKey === 'personal_info' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">Tell us a bit about yourself</h1>
                    <p className="mt-2 text-sm text-gray-500">This helps us personalise your calorie and nutrient targets.</p>

                    <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">Gender</p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {GENDER_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setGender(opt.value)}
                          className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                            gender === opt.value ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Height (cm)</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          min={50}
                          max={250}
                          value={heightCm}
                          onChange={(e) => setHeightCm(e.target.value)}
                          placeholder="e.g. 165"
                          className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Weight (kg)</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          min={20}
                          max={300}
                          value={weightKg}
                          onChange={(e) => setWeightKg(e.target.value)}
                          placeholder="e.g. 62"
                          className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!personalInfoComplete()}
                      onClick={goNext}
                      className="mt-8 w-full rounded-full bg-emerald-500 py-3.5 text-sm font-bold text-black transition hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
                    >
                      Continue
                    </button>
                  </div>
                )}

                {currentKey === 'diet' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">What best describes your current diet?</h1>
                    <div className="mt-6 space-y-2">
                      {[
                        'Pure Vegetarian (no eggs, no meat)',
                        'Vegetarian (eggs are okay)',
                        'Non-Vegetarian (chicken/fish/meat)',
                        'Vegan (no dairy, no eggs, no meat)',
                      ].map((opt) => (
                        <SingleChoiceButton
                          key={opt}
                          label={opt}
                          selected={diet === opt}
                          onClick={() => {
                            setDiet(opt)
                            scheduleAdvance()
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentKey === 'food' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">How often do you eat these foods?</h1>
                    <p className="mt-2 text-sm text-gray-500">Choose Daily, Sometimes, or Rarely for each row.</p>
                    <div className="mt-6 space-y-4">
                      {visibleFoodRows.map((row) => (
                        <div key={row.key} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3">
                          <p className="text-xs font-semibold text-gray-800 leading-snug">{row.label}</p>
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            {(['daily', 'sometimes', 'rarely'] as const).map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setFoodFreq((f) => ({ ...f, [row.key]: v }))}
                                className={`rounded-xl py-2 text-xs font-semibold capitalize transition ${
                                  foodFreq[row.key] === v ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-700'
                                }`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={!foodComplete()}
                      onClick={goNext}
                      className="mt-8 w-full rounded-full bg-emerald-500 py-3.5 text-sm font-bold text-black transition hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
                    >
                      Next
                    </button>
                  </div>
                )}

                {currentKey === 'meal_timing' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">When do you typically eat?</h1>
                    <p className="mt-2 text-sm text-gray-500">This shapes your 7-day meal timing.</p>
                    <div className="mt-6 space-y-2">
                      {MEAL_TIMING_OPTIONS.map((opt) => (
                        <SingleChoiceButton
                          key={opt}
                          label={opt}
                          selected={mealTiming === opt}
                          onClick={() => {
                            setMealTiming(opt)
                            scheduleAdvance()
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentKey === 'cooking_habit' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">How do you usually get your meals?</h1>
                    <p className="mt-2 text-sm text-gray-500">So your plan matches real cooking time.</p>
                    <div className="mt-6 space-y-2">
                      {COOKING_HABIT_OPTIONS.map((opt) => (
                        <SingleChoiceButton
                          key={opt}
                          label={opt}
                          selected={cookingHabit === opt}
                          onClick={() => {
                            setCookingHabit(opt)
                            scheduleAdvance()
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentKey === 'food_dislikes' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">Any foods you&apos;d rather skip?</h1>
                    <p className="mt-2 text-sm text-gray-500">We&apos;ll keep these out of your meal plan.</p>
                    <div className="mt-6 grid grid-cols-1 gap-2">
                      {FOOD_DISLIKE_OPTIONS.map((opt) => (
                        <MultiChoiceButton
                          key={opt.value}
                          label={opt.label}
                          selected={foodDislikes.includes(opt.value)}
                          onClick={() => toggleFoodDislike(opt.value)}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={foodDislikes.length === 0}
                      onClick={goNext}
                      className="mt-8 w-full rounded-full bg-emerald-500 py-3.5 text-sm font-bold text-black transition hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
                    >
                      Next
                    </button>
                  </div>
                )}

                {currentKey === 'supplement_preference' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">How do you feel about supplements?</h1>
                    <p className="mt-2 text-sm text-gray-500">Your report will match this preference.</p>
                    <div className="mt-6 space-y-2">
                      {SUPPLEMENT_PREF_OPTIONS.map((opt) => (
                        <SingleChoiceButton
                          key={opt}
                          label={opt}
                          selected={supplementPreference === opt}
                          onClick={() => {
                            setSupplementPreference(opt)
                            scheduleAdvance()
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentKey === 'medical_conditions' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">Do you have any of these medical conditions?</h1>
                    <p className="mt-2 text-sm text-gray-500">Select all that apply — this helps us keep your plan safe.</p>
                    <div className="mt-6 grid grid-cols-1 gap-2">
                      {MEDICAL_CONDITION_OPTIONS.map((opt) => (
                        <MultiChoiceButton
                          key={opt.value}
                          label={opt.label}
                          selected={medicalConditions.includes(opt.value)}
                          onClick={() => toggleMedicalCondition(opt.value)}
                        />
                      ))}
                    </div>
                    <AnimatePresence>
                      {medicalConditions.includes('other') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 overflow-hidden"
                        >
                          <input
                            type="text"
                            value={medicalConditionsOtherText}
                            onChange={(e) => setMedicalConditionsOtherText(e.target.value)}
                            placeholder="Please specify"
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button
                      type="button"
                      disabled={!medicalConditionsComplete()}
                      onClick={goNext}
                      className="mt-8 w-full rounded-full bg-emerald-500 py-3.5 text-sm font-bold text-black transition hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
                    >
                      Next
                    </button>
                  </div>
                )}

                {currentKey === 'pcos_followup' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">
                      Are you currently on any hormonal treatment or Metformin?
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">For your PCOS/PCOD management.</p>
                    <div className="mt-6 space-y-2">
                      {PCOS_FOLLOWUP_OPTIONS.map((opt) => (
                        <SingleChoiceButton
                          key={opt.value}
                          label={opt.label}
                          selected={pcosFollowup === opt.value}
                          onClick={() => {
                            setPcosFollowup(opt.value)
                            scheduleAdvance()
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentKey === 'diabetes_followup' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">What type of diabetes do you have?</h1>
                    <div className="mt-6 space-y-2">
                      {DIABETES_TYPE_OPTIONS.map((opt) => (
                        <SingleChoiceButton
                          key={opt.value}
                          label={opt.label}
                          selected={diabetesType === opt.value}
                          onClick={() => {
                            setDiabetesType(opt.value)
                            scheduleAdvance()
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentKey === 'allergies' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">Do you have any food allergies?</h1>
                    <p className="mt-2 text-sm text-gray-500">Select all that apply — we&apos;ll exclude these from your meal plan.</p>
                    <div className="mt-6 grid grid-cols-1 gap-2">
                      {ALLERGY_OPTIONS.map((opt) => (
                        <MultiChoiceButton
                          key={opt.value}
                          label={opt.label}
                          selected={allergiesSelected.includes(opt.value)}
                          onClick={() => toggleAllergy(opt.value)}
                        />
                      ))}
                    </div>
                    <AnimatePresence>
                      {allergiesSelected.includes('other') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 overflow-hidden"
                        >
                          <input
                            type="text"
                            value={allergiesOtherText}
                            onChange={(e) => setAllergiesOtherText(e.target.value)}
                            placeholder="Please specify"
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button
                      type="button"
                      disabled={!allergiesComplete()}
                      onClick={goNext}
                      className="mt-8 w-full rounded-full bg-emerald-500 py-3.5 text-sm font-bold text-black transition hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
                    >
                      Next
                    </button>
                  </div>
                )}

                {currentKey === 'stress' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">How would you rate your day-to-day stress?</h1>
                    <div className="mt-6 space-y-2">
                      {STRESS_OPTIONS.map((opt) => (
                        <SingleChoiceButton
                          key={opt.value}
                          label={opt.label}
                          selected={stress === opt.value}
                          onClick={() => {
                            setStress(opt.value)
                            scheduleAdvance()
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentKey === 'sun' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">How much direct sunlight do you get daily?</h1>
                    <div className="mt-6 space-y-2">
                      {[
                        'Almost none — mostly indoors all day',
                        'Less than 15 minutes',
                        'Around 15-30 minutes',
                        'More than 30 minutes',
                      ].map((opt) => (
                        <SingleChoiceButton
                          key={opt}
                          label={opt}
                          selected={sun === opt}
                          onClick={() => {
                            setSun(opt)
                            scheduleAdvance()
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentKey === 'symptoms' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">Which of these do you experience?</h1>
                    <p className="mt-2 text-sm text-gray-500">Select all that apply.</p>
                    <div className="mt-6 grid grid-cols-1 gap-2">
                      {SYMPTOM_OPTIONS.map((opt) => (
                        <MultiChoiceButton
                          key={opt.id}
                          label={opt.label}
                          selected={symptoms.includes(opt.id)}
                          onClick={() => toggleSymptom(opt.id)}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={symptoms.length === 0}
                      onClick={goNext}
                      className="mt-8 w-full rounded-full bg-emerald-500 py-3.5 text-sm font-bold text-black transition hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
                    >
                      Next
                    </button>
                  </div>
                )}

                {currentKey === 'energy' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">Which best describes how you feel most days?</h1>
                    <div className="mt-6 space-y-2">
                      {[
                        'Exhausted all day even after full sleep',
                        'Okay in morning but crashes by afternoon',
                        'Anxious, low, or emotionally drained often',
                        'Brain fog — hard to think or focus clearly',
                        'Irritable or short-tempered without reason',
                        'Feeling mostly fine and energetic',
                      ].map((opt) => (
                        <SingleChoiceButton
                          key={opt}
                          label={opt}
                          selected={energy === opt}
                          onClick={() => {
                            setEnergy(opt)
                            scheduleAdvance()
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentKey === 'sleep' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">How would you describe your sleep?</h1>
                    <div className="mt-6 space-y-2">
                      {[
                        'Fall asleep easily and wake up refreshed',
                        'Take a long time to fall asleep',
                        'Wake up multiple times through the night',
                        'Sleep long hours but still wake up tired',
                        'Very light sleeper — disturbed easily',
                      ].map((opt) => (
                        <SingleChoiceButton
                          key={opt}
                          label={opt}
                          selected={sleep === opt}
                          onClick={() => {
                            setSleep(opt)
                            scheduleAdvance()
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentKey === 'digestion' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">How is your digestion and gut health?</h1>
                    <div className="mt-6 space-y-2">
                      {[
                        'No issues at all',
                        'Bloating or gas after meals often',
                        'Constipation most days',
                        'Acidity or heartburn frequently',
                        'Loose stools or inconsistent digestion',
                      ].map((opt) => (
                        <SingleChoiceButton
                          key={opt}
                          label={opt}
                          selected={digestion === opt}
                          onClick={() => {
                            setDigestion(opt)
                            scheduleAdvance()
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentKey === 'exercise' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">How physically active are you?</h1>
                    <div className="mt-6 space-y-2">
                      {[
                        'Very active — exercise daily',
                        'Moderately active — 3 to 4 times a week',
                        'Lightly active — once or twice a week',
                        'Mostly sedentary — desk job, minimal movement',
                        'No exercise at all currently',
                      ].map((opt) => (
                        <SingleChoiceButton
                          key={opt}
                          label={opt}
                          selected={exercise === opt}
                          onClick={() => {
                            setExercise(opt)
                            scheduleAdvance()
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentKey === 'goal_followup' && goalFollowupType === 'weight_loss' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">How much weight would you like to lose?</h1>
                    <p className="mt-2 text-sm text-gray-500">A realistic target helps us plan the right calorie deficit.</p>
                    <div className="mt-6">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Target weight loss (kg)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={1}
                        max={100}
                        value={weightLossTargetKg}
                        onChange={(e) => setWeightLossTargetKg(e.target.value)}
                        placeholder="e.g. 5"
                        className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!goalFollowupComplete()}
                      onClick={goNext}
                      className="mt-8 w-full rounded-full bg-emerald-500 py-3.5 text-sm font-bold text-black transition hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
                    >
                      Continue
                    </button>
                  </div>
                )}

                {currentKey === 'goal_followup' && goalFollowupType === 'muscle_gain' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">How often do you train currently?</h1>
                    <p className="mt-2 text-sm text-gray-500">This helps us set the right protein and calorie targets.</p>
                    <div className="mt-6 space-y-2">
                      {TRAINING_FREQUENCY_OPTIONS.map((opt) => (
                        <SingleChoiceButton
                          key={opt.value}
                          label={opt.label}
                          selected={trainingFrequency === opt.value}
                          onClick={() => {
                            setTrainingFrequency(opt.value)
                            scheduleAdvance()
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentKey === 'water' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">How much water do you drink daily?</h1>
                    <div className="mt-6 space-y-2">
                      {['Less than 1 litre (very low)', 'Around 1 to 2 litres', 'Around 2 to 3 litres', 'More than 3 litres'].map((opt) => (
                        <SingleChoiceButton
                          key={opt}
                          label={opt}
                          selected={water === opt}
                          onClick={() => {
                            setWater(opt)
                            scheduleAdvance()
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentKey === 'menstrual' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">How would you describe your menstrual health?</h1>
                    <div className="mt-6 space-y-2">
                      {[
                        'Regular and manageable',
                        'Irregular cycles',
                        'Very painful or very heavy periods',
                        'Periods have stopped or skipped months',
                        'Not applicable (post-menopausal)',
                      ].map((opt) => (
                        <SingleChoiceButton
                          key={opt}
                          label={opt}
                          selected={menstrual === opt}
                          onClick={() => {
                            setMenstrual(opt)
                            scheduleAdvance()
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
                  </AnimatePresence>
                </div>
              </>
            )}

            {phase === 'summary' && (
              <>
                <div className="hidden lg:block mb-6 text-center lg:text-left">
                  <h2 className="text-2xl font-black text-gray-900">Almost there</h2>
                  <p className="text-gray-500 text-sm mt-1">Confirm to generate your doctor-reviewed PDF.</p>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-emerald-950/5 p-6 sm:p-8">
                  <button
                    type="button"
                    onClick={() => {
                      setPhase('quiz')
                      setIndex(keys.length - 1)
                    }}
                    className="mb-6 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                  <div className="text-center sm:text-left">
                    <p className="text-emerald-600 font-bold text-sm">Assessment Complete ✓</p>
                    <h1 className="mt-2 text-2xl font-black text-gray-900">Your deeper plan is ready to unlock</h1>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                      We combined your free assessment with these extra details — meal timing, cooking, and preferences — to build your 7-day plan.
                    </p>
                  </div>
                  {topTags.length > 0 && (
                    <div className="mt-8 flex flex-wrap justify-center sm:justify-start gap-2">
                      {topTags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-900"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-gray-50/80 border border-gray-100 px-4 py-3">
                    {TRUST_BADGES.map((badge) => (
                      <span key={badge.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <badge.icon className="h-3.5 w-3.5 text-emerald-600" />
                        {badge.label}
                      </span>
                    ))}
                  </div>
                  {freeQuizOnFile === false && !genError ? (
                    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                      <p className="font-semibold">Free quiz not found</p>
                      <p className="mt-1 text-amber-900/90">
                        Finish the{' '}
                        <button
                          type="button"
                          className="font-bold underline"
                          onClick={() => router.push('/assessment')}
                        >
                          free assessment
                        </button>{' '}
                        on this browser, view your results, then come back to pay ₹39.
                      </p>
                    </div>
                  ) : null}
                  {genError && <p className="mt-6 text-center sm:text-left text-sm text-red-600">{genError}</p>}
                  <button
                    type="button"
                    onClick={handleGenerateReport}
                    disabled={freeQuizOnFile === false || isCheckoutLoading}
                    className="mt-10 w-full rounded-full bg-[#14532d] py-4 text-base font-bold text-white shadow-lg transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isCheckoutLoading ? 'Opening secure payment…' : 'Confirm & pay ₹39 (PayU)'}
                  </button>
                  <p className="mt-3 text-center sm:text-left text-xs text-gray-500">
                    You&apos;ll complete secure payment on PayU (₹39) before your personalised PDF is generated.
                  </p>
                  <p className="mt-8 text-center sm:text-left text-xs text-gray-400">
                    Signed in as {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-[#0A1A10]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900&auto=format&fit=crop&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="relative z-10 flex flex-col justify-center px-10 xl:px-12 py-16">
            <span className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-widest uppercase rounded-full px-3 py-1 mb-6 w-fit">
              Personalised PDF
            </span>
            <h2 className="text-white font-black text-3xl leading-tight">
              Your recovery plan
              <br />
              <span className="text-emerald-400">tailored to you.</span>
            </h2>
            <p className="text-gray-400 text-sm mt-4 leading-relaxed max-w-sm">
              Answers you give here are combined with your free deficiency report so the final document matches your
              diet, lifestyle, and goals.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                '7-day Indian meal framework',
                'Supplement guidance with brands',
                'Daily routine you can actually follow',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                  <span className="text-gray-300 text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-4">
              {TRUST_BADGES.map((badge) => (
                <span key={badge.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-300">
                  <badge.icon className="h-3.5 w-3.5 text-emerald-400" />
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
