'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Loader2, Leaf } from 'lucide-react'
import { ReportGeneratingLoader } from '@/components/ReportGeneratingLoader'
import type { DetailedAssessmentPayload, FoodFrequency, FoodFrequencyKey } from '@/lib/recovery-report-types'

const FOOD_ROWS: { key: FoodFrequencyKey; label: string }[] = [
  { key: 'green_vegetables', label: 'Green vegetables (palak, methi, broccoli)' },
  { key: 'dairy', label: 'Dairy products (milk, curd, paneer)' },
  { key: 'eggs_or_nonveg', label: 'Eggs or non-veg (chicken, fish)' },
  { key: 'nuts_seeds', label: 'Nuts and seeds (almonds, walnuts, seeds)' },
  { key: 'fresh_fruits', label: 'Fresh fruits' },
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

const CATEGORY_NAMES: Record<number, string> = {
  1: 'Your Diet',
  2: 'Food Habits',
  3: 'Sunlight',
  4: 'Physical Symptoms',
  5: 'Energy & Mood',
  6: 'Sleep',
  7: 'Digestion',
  8: 'Activity Level',
  9: 'Hydration',
  10: 'For Women',
}

type QuizKey = 'diet' | 'food' | 'sun' | 'symptoms' | 'energy' | 'sleep' | 'digestion' | 'exercise' | 'water' | 'menstrual'

function emptyFoodFreq(): FoodFrequency {
  return {
    green_vegetables: '',
    dairy: '',
    eggs_or_nonveg: '',
    nuts_seeds: '',
    fresh_fruits: '',
  }
}

export default function DetailedAssessmentPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()
  const [showMenstrual, setShowMenstrual] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const g = localStorage.getItem('beetamin_profile_gender')
    setShowMenstrual(g === 'Female')
  }, [])

  const keys = useMemo<QuizKey[]>(() => {
    const base: QuizKey[] = ['diet', 'food', 'sun', 'symptoms', 'energy', 'sleep', 'digestion', 'exercise', 'water']
    return showMenstrual ? [...base, 'menstrual'] : base
  }, [showMenstrual])

  const [index, setIndex] = useState(0)
  const indexRef = useRef(0)
  useEffect(() => {
    indexRef.current = index
  }, [index])

  const [phase, setPhase] = useState<'quiz' | 'summary' | 'generating'>('quiz')
  const [direction, setDirection] = useState<'next' | 'back'>('next')

  const [diet, setDiet] = useState('')
  const [foodFreq, setFoodFreq] = useState<FoodFrequency>(emptyFoodFreq)
  const [sun, setSun] = useState('')
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [energy, setEnergy] = useState('')
  const [sleep, setSleep] = useState('')
  const [digestion, setDigestion] = useState('')
  const [exercise, setExercise] = useState('')
  const [water, setWater] = useState('')
  const [menstrual, setMenstrual] = useState('')

  const [genError, setGenError] = useState('')

  const currentKey = keys[index] ?? keys[keys.length - 1]
  const questionNumber = index + 1
  const totalQuestions = keys.length

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

  function foodComplete() {
    return FOOD_ROWS.every((r) => foodFreq[r.key] === 'daily' || foodFreq[r.key] === 'sometimes' || foodFreq[r.key] === 'rarely')
  }

  function buildPayload(): DetailedAssessmentPayload {
    return {
      diet_type: diet,
      food_frequency: foodFreq,
      sun_exposure: sun,
      physical_symptoms: symptoms.filter((s) => s !== 'none'),
      energy_mood: energy,
      sleep_quality: sleep,
      digestion,
      exercise_level: exercise,
      water_intake: water,
      menstrual_health: showMenstrual ? menstrual || null : null,
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
    // TODO: Add Razorpay "Confirm & pay" step here before calling generate-report (purchase page flow).
    setGenError('')
    if (!isSignedIn) {
      router.push('/sign-in?after=' + encodeURIComponent('/detailed-assessment'))
      return
    }
    setPhase('generating')
    try {
      const saveRes = await fetch('/api/save-detailed-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      const saveJson = await saveRes.json().catch(() => ({}))
      if (!saveRes.ok) {
        throw new Error(saveJson.error || 'Could not save your answers')
      }
      const detailedAssessmentId = saveJson.id as string

      let freeAssessmentResult: unknown = null
      try {
        const raw = localStorage.getItem('assessmentResult')
        if (raw) freeAssessmentResult = JSON.parse(raw)
      } catch {
        /* ignore */
      }

      const genRes = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detailedAssessmentId, freeAssessmentResult }),
      })
      const genJson = (await genRes.json().catch(() => ({}))) as {
        reportId?: string
        alreadyExists?: boolean
        error?: string
      }
      if (!genRes.ok) {
        throw new Error(genJson.error || 'Could not generate your report')
      }
      const rid = genJson.reportId
      if (!rid) {
        throw new Error('Could not generate your report')
      }
      const q = genJson.alreadyExists ? '?notice=already-have-report' : ''
      router.push(`/report/${encodeURIComponent(rid)}${q}`)
    } catch (e) {
      setPhase('summary')
      setGenError(e instanceof Error ? e.message : 'Something went wrong')
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
          <a href="/" className="flex items-center gap-2">
            <Leaf className="text-emerald-500 shrink-0" size={18} />
            <span className="text-gray-900 font-bold">TheBeetamin</span>
          </a>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-gray-800 font-semibold">Sign in to continue</p>
          <p className="mt-2 text-sm text-gray-500 max-w-sm">
            We need your account to save and email your personalised recovery PDF.
          </p>
          <button
            type="button"
            onClick={() => router.push('/sign-in?after=' + encodeURIComponent('/detailed-assessment'))}
            className="mt-6 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm"
          >
            Sign in
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'generating') {
    return <ReportGeneratingLoader />
  }

  const variants = {
    enter: (dir: 'next' | 'back') => ({ opacity: 0, x: dir === 'next' ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: 'next' | 'back') => ({ opacity: 0, x: dir === 'next' ? -40 : 40 }),
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <a href="/" className="flex items-center gap-2">
          <Leaf className="text-emerald-500 shrink-0" size={18} />
          <span className="text-gray-900 font-bold">TheBeetamin</span>
        </a>
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
                    A few follow-up questions — same calm layout as your profile setup.
                  </p>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
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
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                          style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                        />
                      </div>
                      <p className="mt-1 text-center text-[11px] font-medium text-gray-500 sm:text-xs">
                        Question {questionNumber} of {totalQuestions}
                      </p>
                    </div>
                  </div>
                  <p className="text-center sm:text-left text-xs font-bold uppercase tracking-widest text-emerald-700">
                    {CATEGORY_NAMES[questionNumber] ?? 'Assessment'}
                  </p>

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
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setDiet(opt)
                            scheduleAdvance()
                          }}
                          className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition ${
                            diet === opt ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentKey === 'food' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">How often do you eat these foods?</h1>
                    <p className="mt-2 text-sm text-gray-500">Choose Daily, Sometimes, or Rarely for each row.</p>
                    <div className="mt-6 space-y-4">
                      {FOOD_ROWS.map((row) => (
                        <div key={row.key} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3">
                          <p className="text-xs font-semibold text-gray-800 leading-snug">{row.label}</p>
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            {(['daily', 'sometimes', 'rarely'] as const).map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setFoodFreq((f) => ({ ...f, [row.key]: v }))}
                                className={`rounded-xl py-2 text-xs font-semibold capitalize ${
                                  foodFreq[row.key] === v ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-700'
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
                      className="mt-8 w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white disabled:opacity-40"
                    >
                      Next
                    </button>
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
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setSun(opt)
                            scheduleAdvance()
                          }}
                          className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition ${
                            sun === opt ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
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
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleSymptom(opt.id)}
                          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                            symptoms.includes(opt.id) ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-gray-200 bg-white text-gray-800'
                          }`}
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-gray-300 text-[10px]">
                            {symptoms.includes(opt.id) ? '✓' : ''}
                          </span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={symptoms.length === 0}
                      onClick={goNext}
                      className="mt-8 w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white disabled:opacity-40"
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
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setEnergy(opt)
                            scheduleAdvance()
                          }}
                          className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition ${
                            energy === opt ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
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
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setSleep(opt)
                            scheduleAdvance()
                          }}
                          className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition ${
                            sleep === opt ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
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
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setDigestion(opt)
                            scheduleAdvance()
                          }}
                          className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition ${
                            digestion === opt ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
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
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setExercise(opt)
                            scheduleAdvance()
                          }}
                          className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition ${
                            exercise === opt ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentKey === 'water' && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-snug">How much water do you drink daily?</h1>
                    <div className="mt-6 space-y-2">
                      {['Less than 1 litre (very low)', 'Around 1 to 2 litres', 'Around 2 to 3 litres', 'More than 3 litres'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setWater(opt)
                            scheduleAdvance()
                          }}
                          className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition ${
                            water === opt ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
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
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setMenstrual(opt)
                            scheduleAdvance()
                          }}
                          className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition ${
                            menstrual === opt ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                          }`}
                        >
                          {opt}
                        </button>
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
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
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
                    <h1 className="mt-2 text-2xl font-black text-gray-900">We&apos;re ready to build your plan</h1>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                      We have everything we need to build your personalised recovery plan.
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
                  {genError && <p className="mt-6 text-center sm:text-left text-sm text-red-600">{genError}</p>}
                  <button
                    type="button"
                    onClick={handleGenerateReport}
                    className="mt-10 w-full rounded-2xl bg-[#14532d] py-4 text-base font-bold text-white shadow-lg"
                  >
                    Confirm &amp; get my PDF
                  </button>
                  <p className="mt-3 text-center sm:text-left text-xs text-gray-500">
                    For now we prepare your report immediately. Secure checkout will appear here before payment goes live.
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
          </div>
        </div>
      </div>
    </div>
  )
}
