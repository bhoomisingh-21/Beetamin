'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Zap, Shield, ChevronRight, ChevronLeft, FlaskConical, Check, ShieldCheck, UserCheck, Clock } from 'lucide-react'
import { writeAssessmentBundle } from '@/lib/assessment-local-storage'
import { normalizeFreeAssessment } from '@/lib/assessment-profile-fields'
import { trackEvent } from '@/lib/analytics'
import PremiumLoadingScreen, { TEASER_LOADING_MESSAGES } from '@/components/PremiumLoadingScreen'
import { AssessmentLeadGate, type LeadGatePhase } from '@/components/assessment/AssessmentLeadGate'
import {
  getOrCreateAssessmentSessionId,
  hasVerifiedAssessmentOtp,
  markAssessmentOtpVerified,
} from '@/lib/assessment-otp-session'

const HEX_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='70' viewBox='0 0 60 70'>
  <path d='M30 0L60 17.5V52.5L30 70L0 52.5V17.5L30 0Z' fill='none' stroke='#22C55E' stroke-width='0.5' stroke-opacity='0.18'/>
</svg>`
const HEX_URL = `data:image/svg+xml,${encodeURIComponent(HEX_SVG)}`

const TOTAL_STEPS = 7

const CATEGORY_NAMES: Record<number, string> = {
  1: 'Eating Habits',
  2: 'Your Goals',
  3: 'Lifestyle & Energy',
  4: 'Sleep Quality',
  5: 'Physical Symptoms',
  6: 'Cognitive Health',
  7: 'Physical Activity & Immunity',
}

function StepBadge({ step, science }: { step: number; science: string }) {
  return (
    <span className="inline-flex flex-col items-start gap-1 rounded-2xl border border-blue-200 bg-blue-50 px-3.5 py-2 mb-4">
      <span className="text-blue-700 text-xs md:text-sm font-black uppercase tracking-widest">{CATEGORY_NAMES[step]}</span>
      <span className="text-blue-500 text-[11px] md:text-xs font-semibold tracking-wide">{science}</span>
    </span>
  )
}

function SelectedCheck() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 24 }}
      className="absolute top-2 right-2 md:top-2.5 md:right-2.5 bg-emerald-500 rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center shadow-md shadow-emerald-500/40"
    >
      <Check size={12} className="text-black" strokeWidth={3} />
    </motion.div>
  )
}

export default function AssessmentPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState<'next' | 'back'>('next')
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [gatePhase, setGatePhase] = useState<LeadGatePhase | null>(null)
  const [otpBusy, setOtpBusy] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpDestination, setOtpDestination] = useState('')
  const advancingRef = useRef(false)
  const [answers, setAnswers] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    heightCm: '',
    weightKg: '',
    diet: '',
    goal: '',
    metabolicRhythm: '',
    sleepArchitecture: '',
    dermalMarkers: [] as string[],
    cognitiveClarity: '',
    muscleRecovery: '',
    immuneResilience: '',
  })
  const router = useRouter()

  async function handleSubmit(verified?: { email?: string; name?: string; age?: string }) {
    trackEvent('quiz_completed')
    setSubmitError(null)
    setIsLoading(true)
    try {
      const name = verified?.name?.trim() || answers.name
      const age = verified?.age?.trim() || answers.age
      const email = (verified?.email?.trim() || answers.email).toLowerCase()
      const phoneDigits = answers.phone.replace(/\D/g, '').slice(-10)
      const phoneForLead = phoneDigits ? `+91 ${phoneDigits}` : answers.phone
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          age,
          diet: answers.diet,
          goal: answers.goal,
          answers: {
            energyLevel: answers.metabolicRhythm,
            sleepQuality: answers.sleepArchitecture,
            physicalSymptoms: answers.dermalMarkers,
            mentalClarity: answers.cognitiveClarity,
            muscleRecovery: answers.muscleRecovery,
            immuneHealth: answers.immuneResilience,
          },
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(typeof result?.error === 'string' ? result.error : 'Could not generate your report. Please try again.')
      }
      const normalized = normalizeFreeAssessment(result)
      if (!normalized) {
        throw new Error('We received an invalid report. Please try again.')
      }
      const meta = {
        name,
        email,
        phone: phoneForLead,
        goal: answers.goal,
        diet: answers.diet,
        age,
        gender: answers.gender,
        heightCm: answers.heightCm,
        weightKg: answers.weightKg,
        metabolicRhythm: answers.metabolicRhythm,
        sleepArchitecture: answers.sleepArchitecture,
        dermalMarkers: answers.dermalMarkers,
        answers: {
          energyLevel: answers.metabolicRhythm,
          sleepQuality: answers.sleepArchitecture,
          physicalSymptoms: answers.dermalMarkers,
          mentalClarity: answers.cognitiveClarity,
          muscleRecovery: answers.muscleRecovery,
          immuneHealth: answers.immuneResilience,
          diet: answers.diet,
        },
      }
      writeAssessmentBundle({
        assessmentResult: normalized,
        assessmentMeta: meta,
      })
      fetch('/api/save-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: phoneForLead, source: 'assessment' }),
      }).catch(() => {})
      if (email) {
        fetch('/api/guest-free-assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            assessmentResult: normalized,
            assessmentMeta: meta,
          }),
        }).catch(() => {})
      }
      router.push('/assessment/results')
    } catch (e) {
      console.error(e)
      setSubmitError(e instanceof Error ? e.message : 'Could not generate your report. Please try again.')
      setIsLoading(false)
    }
  }

  const isStepValid = () => {
    if (currentStep === 1) return answers.diet !== ''
    if (currentStep === 2) return answers.goal !== ''
    if (currentStep === 3) return answers.metabolicRhythm !== ''
    if (currentStep === 4) return answers.sleepArchitecture !== ''
    if (currentStep === 5) return answers.dermalMarkers.length > 0
    if (currentStep === 6) return answers.cognitiveClarity !== ''
    if (currentStep === 7) return answers.muscleRecovery !== '' && answers.immuneResilience !== ''
    return false
  }

  function toggleDermalMarker(value: string) {
    setAnswers(prev => {
      if (value === 'none' || value === 'unsure') {
        return { ...prev, dermalMarkers: [value] }
      }
      const without = prev.dermalMarkers.filter(v => v !== 'none' && v !== 'unsure')
      if (without.includes(value)) {
        return { ...prev, dermalMarkers: without.filter(v => v !== value) }
      }
      return { ...prev, dermalMarkers: [...without, value] }
    })
  }

  function scheduleAdvance() {
    if (advancingRef.current) return
    advancingRef.current = true
    window.setTimeout(() => {
      setDirection('next')
      setCurrentStep((p) => {
        if (p >= TOTAL_STEPS) {
          setGatePhase('ready')
          advancingRef.current = false
          return p
        }
        advancingRef.current = false
        return p + 1
      })
    }, 220)
  }

  async function sendAssessmentOtp() {
    setOtpError(null)
    setOtpBusy(true)
    try {
      if (hasVerifiedAssessmentOtp()) {
        await handleSubmit()
        return
      }
      const sessionId = getOrCreateAssessmentSessionId()
      const res = await fetch('/api/assessment/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          name: answers.name,
          age: answers.age,
          email: answers.email,
          leadSnapshot: {
            goal: answers.goal,
            diet: answers.diet,
            energy: answers.metabolicRhythm,
            sleep: answers.sleepArchitecture,
            concerns: answers.dermalMarkers,
            gender: answers.gender,
            heightCm: answers.heightCm,
            weightKg: answers.weightKg,
          },
        }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        error?: string
        destinationMasked?: string
        code?: string
      }
      if (!res.ok) {
        throw new Error(json.error || 'Could not send verification code.')
      }
      setOtpDestination(json.destinationMasked || answers.email)
      setGatePhase('otp')
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : 'Could not send verification code.')
    } finally {
      setOtpBusy(false)
    }
  }

  async function verifyAssessmentOtp(code: string) {
    setOtpError(null)
    setOtpBusy(true)
    try {
      const sessionId = getOrCreateAssessmentSessionId()
      const res = await fetch('/api/assessment/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, code }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        error?: string
        email?: string | null
        name?: string | null
        age?: string | null
      }
      if (!res.ok) throw new Error(json.error || 'Verification failed.')
      const verified = {
        email: typeof json.email === 'string' ? json.email.trim().toLowerCase() : answers.email,
        name: typeof json.name === 'string' && json.name.trim() ? json.name.trim() : answers.name,
        age: typeof json.age === 'string' && json.age.trim() ? json.age.trim() : answers.age,
      }
      setAnswers((prev) => ({ ...prev, ...verified }))
      markAssessmentOtpVerified()
      setOtpBusy(false)
      await handleSubmit(verified)
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : 'Verification failed.')
      setOtpBusy(false)
    }
  }

  const dietOptions = [
    { emoji: '🥗', title: 'Pure Vegetarian', subtitle: 'No eggs, no meat', value: 'vegetarian' },
    { emoji: '🥚', title: 'Vegetarian + Eggs', subtitle: 'Eggs are okay', value: 'lacto_ovo' },
    { emoji: '🍖', title: 'Non-Vegetarian', subtitle: 'Includes chicken, fish, meat', value: 'non_veg' },
    { emoji: '🌱', title: 'Vegan', subtitle: 'No dairy, eggs, or meat', value: 'vegan' },
    { emoji: '⏰', title: 'Irregular', subtitle: 'Often skip meals or eat randomly', value: 'irregular' },
  ]

  const goalOptions = [
    { emoji: '⚡', title: 'More energy', subtitle: 'Fix fatigue, beat afternoon crashes', value: 'energy' },
    { emoji: '🧠', title: 'Better focus', subtitle: 'Improve mental clarity and memory', value: 'focus' },
    { emoji: '💇', title: 'Skin, hair & nails', subtitle: 'Reduce hair fall, improve glow', value: 'skin_hair' },
    { emoji: '💪', title: 'Strength & recovery', subtitle: 'Faster muscle recovery, performance', value: 'recovery' },
    { emoji: '🛡️', title: 'Build immunity', subtitle: 'Fewer colds, stronger defenses', value: 'immunity' },
    { emoji: '⚖️', title: 'Hormonal balance', subtitle: 'Better mood, cycle health', value: 'hormones' },
    { emoji: '🌿', title: 'Overall wellness', subtitle: 'General health improvement', value: 'wellness' },
    { emoji: '🔥', title: 'Weight Loss', subtitle: 'Sustainable fat loss, portion control', value: 'weight_loss' },
    { emoji: '🏋️', title: 'Muscle Gain', subtitle: 'Build lean muscle, higher protein', value: 'muscle_gain' },
  ]

  const stepVariants = {
    enter: (dir: 'next' | 'back') => ({ opacity: 0, x: dir === 'next' ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: 'next' | 'back') => ({ opacity: 0, x: dir === 'next' ? -60 : 60 }),
  }

  const energyOptions = [
    { emoji: '⚡', title: 'Fully alert', subtitle: 'Consistent energy all day', value: 'fully_alert' },
    { emoji: '😐', title: 'Slight afternoon dip', subtitle: 'Need caffeine or snack', value: 'slight_dip' },
    { emoji: '😴', title: 'Major energy crash', subtitle: 'Struggling to stay awake', value: 'major_crash' },
    { emoji: '🌀', title: 'Completely unpredictable', subtitle: 'Never know what to expect', value: 'unpredictable' },
  ]

  const sleepOptions = [
    { emoji: '🌟', title: 'Refreshed & clear-headed', subtitle: 'Ready to go immediately', value: 'refreshed' },
    { emoji: '😶', title: 'Takes 30+ minutes', subtitle: 'Need time to feel human', value: 'slow_start' },
    { emoji: '🧱', title: 'Still completely exhausted', subtitle: 'Could easily sleep more', value: 'exhausted' },
    { emoji: '😤', title: 'Wired but tired', subtitle: 'Anxious tension on waking', value: 'wired_tired' },
  ]

  const dermalOptions = [
    { emoji: '💇', label: 'Hair thinning or excess shedding', value: 'hair_loss' },
    { emoji: '💅', label: 'Brittle or ridged nails', value: 'brittle_nails' },
    { emoji: '🧴', label: 'Dry or dull skin', value: 'dry_skin' },
    { emoji: '👁️', label: 'Dry or puffy eyes on waking', value: 'dry_eyes' },
    { emoji: '🦷', label: 'Bleeding gums or slow healing', value: 'gum_issues' },
    { emoji: '🦴', label: 'Joint stiffness or cracking', value: 'joint_issues' },
    { emoji: '🌿', label: 'None of the above', value: 'none' },
    { emoji: '❓', label: "Not sure / haven't checked", value: 'unsure' },
  ]

  const clarityOptions = [
    { emoji: '🎯', title: 'Sharp & locked in', subtitle: 'Concentration comes naturally', value: 'sharp' },
    { emoji: '🌫️', title: 'Occasional brain fog', subtitle: 'Loses focus after 30–45 min', value: 'occasional_fog' },
    { emoji: '🌪️', title: 'Frequent fog', subtitle: 'Hard to string thoughts together', value: 'frequent_fog' },
    { emoji: '📵', title: 'Severe difficulty', subtitle: "Can't focus even 10 minutes", value: 'severe' },
  ]

  const muscleOptions = [
    { label: 'No soreness', value: 'none' },
    { label: 'Mild', value: 'mild' },
    { label: 'Moderate', value: 'moderate' },
    { label: 'Severe for days', value: 'severe' },
  ]

  const immuneOptions = [
    { label: 'Zero', value: 'zero' },
    { label: '1–2 times', value: 'one_two' },
    { label: '3–4 times', value: 'three_four' },
    { label: '5+ times', value: 'five_plus' },
  ]

  return (
    <div className="min-h-screen bg-[#0A0F14] flex flex-col">

      {/* Announcement Bar */}
      <div className="bg-emerald-950 text-white text-xs tracking-widest uppercase text-center py-2 px-4 flex-shrink-0">
        🧬 TAKES ONLY 2 MINUTES · 100% FREE · NO SIGNUP REQUIRED
      </div>

      {/* Two-column layout — items-start keeps left hero from dropping when quiz grows */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 items-start">

        {/* ── LEFT: Hero (desktop only — mobile jumps straight into the quiz) ── */}
        <div
          className="relative hidden lg:flex items-start justify-center px-6 pt-16 pb-10 sm:pt-20 lg:sticky lg:top-0 lg:self-start lg:h-[calc(100dvh-2rem)] lg:overflow-hidden lg:px-10 lg:pt-24 lg:pb-16 text-center"
          style={{
            backgroundImage: `url("${HEX_URL}")`,
            backgroundSize: '60px 70px',
            backgroundRepeat: 'repeat',
            backgroundColor: '#0A0F14',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,_rgba(16,185,129,0.18)_0%,_transparent_55%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#0A0F14]/75 to-[#0A0F14] pointer-events-none" />
          <Link
            href="/"
            className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0A0F14]/80 px-3 py-2 text-sm font-medium text-zinc-400 backdrop-blur-sm transition hover:border-white/20 hover:text-white sm:left-6 sm:top-6"
          >
            <ChevronLeft size={14} aria-hidden />
            Back to home
          </Link>
          <div className="relative z-10 max-w-md w-full flex flex-col items-center">
            <span className="border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 text-xs tracking-[0.2em] uppercase rounded-full px-4 py-1.5 inline-flex items-center gap-2 shadow-[0_0_24px_-4px_rgba(16,185,129,0.45)]">
              <FlaskConical size={12} className="text-emerald-400" />
              CLINICAL DEFICIENCY ASSESSMENT
            </span>

            <span className="mt-3 border border-white/10 bg-white/[0.04] text-gray-300 text-xs tracking-widest uppercase rounded-full px-3.5 py-1 inline-flex items-center gap-2">
              <Clock size={12} className="text-emerald-500" />
              Takes about 2 minutes
            </span>

            <h1 className="mt-7 font-black text-2xl md:text-3xl lg:text-4xl max-w-sm mx-auto leading-[1.15] text-balance text-center">
              <span className="text-white">Find Your Nutrient Deficiencies</span>
              <span className="block mt-1.5 text-emerald-400">— Free Assessment</span>
            </h1>
            <p className="mt-5 text-gray-400 text-sm md:text-base lg:text-lg max-w-sm mx-auto leading-relaxed">
              7 clinically-derived questions. Expert-reviewed analysis. Personalized deficiency report in under 2 minutes.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 md:gap-x-8">
              {[
                { Icon: Lock, label: '100% Private' },
                { Icon: Zap, label: 'Instant Results' },
                { Icon: Shield, label: 'Nutritionist-Reviewed' },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-gray-400 text-sm md:text-base">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10">
                    <Icon size={13} className="text-emerald-500" />
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Form ── */}
        <div className="flex flex-col items-center justify-start px-4 pt-4 pb-8 lg:py-12 bg-[#0A0F14]">
          <p className={`lg:hidden mb-3 text-center text-white font-semibold text-base ${isLoading || gatePhase ? 'hidden' : ''}`}>
            Let&apos;s understand your health better 👇
          </p>
          <div className="w-full max-w-xl">
            <div className="rounded-2xl lg:rounded-3xl bg-gradient-to-b from-emerald-500/40 via-emerald-500/10 to-transparent p-[1.5px] shadow-[0_25px_70px_-20px_rgba(16,185,129,0.35)]">
              <div className="bg-white rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden">

              {isLoading ? (
                <div className="py-8 px-4 md:py-10 md:px-6">
                  <PremiumLoadingScreen
                    embedded
                    messages={TEASER_LOADING_MESSAGES}
                    title="Analyzing your answers"
                    subtitle="Building your snapshot — this usually takes a few seconds."
                  />
                </div>
              ) : gatePhase ? (
                <AssessmentLeadGate
                  phase={gatePhase}
                  values={{
                    name: answers.name,
                    age: answers.age,
                    email: answers.email,
                    gender: answers.gender,
                    heightCm: answers.heightCm,
                    weightKg: answers.weightKg,
                  }}
                  onChange={(patch) => setAnswers((prev) => ({ ...prev, ...patch }))}
                  onReveal={() => { setOtpError(null); setGatePhase('lead') }}
                  onBack={() => {
                    if (gatePhase === 'otp') setGatePhase('lead')
                    else if (gatePhase === 'lead') setGatePhase('ready')
                    else setGatePhase(null)
                  }}
                  onSendOtp={() => void sendAssessmentOtp()}
                  onVerify={(code) => void verifyAssessmentOtp(code)}
                  onResend={() => void sendAssessmentOtp()}
                  busy={otpBusy}
                  error={otpError || submitError}
                  otpDestination={otpDestination}
                />
              ) : (
                <>
                  {/* Progress Header */}
                  <div className="bg-gray-50 border-b border-gray-100 px-5 md:px-8 py-3 md:py-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm md:text-base font-medium">Step {currentStep} of {TOTAL_STEPS}</span>
                      <span className="text-emerald-600 text-sm md:text-base font-semibold">
                        {Math.round((currentStep / TOTAL_STEPS) * 100)}% Complete
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-1.5 w-full mt-2 md:mt-3">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
                      />
                    </div>
                    {currentStep >= TOTAL_STEPS && !gatePhase && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 md:mt-3 text-emerald-600 text-sm md:text-base font-semibold flex items-center gap-1.5"
                      >
                        You&apos;re almost there 👀
                      </motion.p>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="px-5 md:px-8 py-6 md:py-8 overflow-hidden">
                    <AnimatePresence mode="wait" custom={direction}>
                      <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >

                        {/* Step 1 — Diet type */}
                        {currentStep === 1 && (
                          <div>
                            <StepBadge step={1} science="🔬 DIETARY PATTERN ANALYSIS" />
                            <h2 className="text-gray-900 font-bold text-xl md:text-2xl lg:text-3xl mb-5">
                              What best describes your diet?
                            </h2>
                            <div className="grid grid-cols-1 gap-2 md:gap-3">
                              {dietOptions.map(opt => (
                                <motion.button
                                  key={opt.value}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    if (!answers.diet) trackEvent('quiz_started')
                                    setAnswers(prev => ({ ...prev, diet: opt.value }))
                                    scheduleAdvance()
                                  }}
                                  className={`relative cursor-pointer rounded-xl md:rounded-2xl border-2 p-3 md:p-4 transition-all duration-200 flex items-center gap-3 text-left w-full ${answers.diet === opt.value
                                    ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/15'
                                    : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-md'
                                    }`}
                                >
                                  {answers.diet === opt.value && <SelectedCheck />}
                                  <span className="text-xl md:text-2xl flex-shrink-0">{opt.emoji}</span>
                                  <div>
                                    <div className="text-gray-900 text-base font-semibold">{opt.title}</div>
                                    <div className="text-gray-500 text-sm mt-0.5">{opt.subtitle}</div>
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Step 2 — Health goal */}
                        {currentStep === 2 && (
                          <div>
                            <StepBadge step={2} science="🎯 YOUR PRIMARY GOAL" />
                            <h2 className="text-gray-900 font-bold text-xl md:text-2xl lg:text-3xl mb-5">
                              What&apos;s your #1 health goal right now?
                            </h2>
                            <div className="grid grid-cols-1 gap-2 md:gap-3">
                              {goalOptions.map(opt => (
                                <motion.button
                                  key={opt.value}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setAnswers(prev => ({ ...prev, goal: opt.value }))
                                    scheduleAdvance()
                                  }}
                                  className={`relative cursor-pointer rounded-xl md:rounded-2xl border-2 p-3 md:p-4 transition-all duration-200 flex items-center gap-3 text-left w-full ${answers.goal === opt.value
                                    ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/15'
                                    : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-md'
                                    }`}
                                >
                                  {answers.goal === opt.value && <SelectedCheck />}
                                  <span className="text-xl md:text-2xl flex-shrink-0">{opt.emoji}</span>
                                  <div>
                                    <div className="text-gray-900 text-base font-semibold">{opt.title}</div>
                                    <div className="text-gray-500 text-sm mt-0.5">{opt.subtitle}</div>
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Step 3 — Energy */}
                        {currentStep === 3 && (
                          <div>
                            <StepBadge step={3} science="🔬 TESTING: B-VITAMINS · IRON · ADRENAL FUNCTION" />
                            <h2 className="text-gray-900 font-bold text-xl md:text-2xl lg:text-3xl mb-5 md:mb-6">
                              It&apos;s 2:30 PM. Which best describes your energy right now?
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                              {energyOptions.map(opt => (
                                <motion.button
                                  key={opt.value}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setAnswers(prev => ({ ...prev, metabolicRhythm: opt.value }))
                                    scheduleAdvance()
                                  }}
                                  className={`relative cursor-pointer rounded-xl md:rounded-2xl border-2 p-3 md:p-4 transition-all duration-200 flex items-start gap-3 text-left w-full ${answers.metabolicRhythm === opt.value
                                    ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/15'
                                    : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-md'
                                    }`}
                                >
                                  {answers.metabolicRhythm === opt.value && <SelectedCheck />}
                                  <span className="text-xl md:text-2xl flex-shrink-0">{opt.emoji}</span>
                                  <div>
                                    <div className="text-gray-900 text-base font-semibold">{opt.title}</div>
                                    <div className="text-gray-500 text-sm mt-0.5">{opt.subtitle}</div>
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Step 4 — Sleep */}
                        {currentStep === 4 && (
                          <div>
                            <StepBadge step={4} science="🔬 TESTING: MAGNESIUM · CORTISOL BALANCE · MELATONIN" />
                            <h2 className="text-gray-900 font-bold text-xl md:text-2xl lg:text-3xl mb-5 md:mb-6">
                              After 7–8 hours of sleep, how do you feel 10 minutes after waking?
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                              {sleepOptions.map(opt => (
                                <motion.button
                                  key={opt.value}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setAnswers(prev => ({ ...prev, sleepArchitecture: opt.value }))
                                    scheduleAdvance()
                                  }}
                                  className={`relative cursor-pointer rounded-xl md:rounded-2xl border-2 p-3 md:p-4 transition-all duration-200 flex items-start gap-3 text-left w-full ${answers.sleepArchitecture === opt.value
                                    ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/15'
                                    : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-md'
                                    }`}
                                >
                                  {answers.sleepArchitecture === opt.value && <SelectedCheck />}
                                  <span className="text-xl md:text-2xl flex-shrink-0">{opt.emoji}</span>
                                  <div>
                                    <div className="text-gray-900 text-base font-semibold">{opt.title}</div>
                                    <div className="text-gray-500 text-sm mt-0.5">{opt.subtitle}</div>
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Step 5 — Physical symptoms */}
                        {currentStep === 5 && (
                          <div>
                            <StepBadge step={5} science="🔬 TESTING: ZINC · BIOTIN · OMEGA-3 · COLLAGEN · VITAMIN C" />
                            <h2 className="text-gray-900 font-bold text-xl md:text-2xl lg:text-3xl mb-2">
                              Which of these have you noticed recently?
                            </h2>
                            <p className="text-gray-500 text-sm md:text-base mb-4 md:mb-6">Select all that apply — even minor signs count</p>
                            <div className="grid grid-cols-2 gap-2 md:gap-3">
                              {dermalOptions.map(opt => {
                                const selected = answers.dermalMarkers.includes(opt.value)
                                return (
                                  <motion.button
                                    key={opt.value}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => toggleDermalMarker(opt.value)}
                                    className={`cursor-pointer rounded-xl md:rounded-2xl border-2 p-2.5 md:p-3 transition-all duration-200 relative text-left w-full ${selected
                                      ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/15'
                                      : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                                      }`}
                                  >
                                    {selected && <SelectedCheck />}
                                    <div className="text-lg md:text-xl mb-1">{opt.emoji}</div>
                                    <div className="text-gray-800 text-sm md:text-base font-medium leading-tight">{opt.label}</div>
                                  </motion.button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Step 6 — Mental clarity */}
                        {currentStep === 6 && (
                          <div>
                            <StepBadge step={6} science="🔬 TESTING: VITAMIN D3 · B12 · OMEGA-3 FATTY ACIDS" />
                            <h2 className="text-gray-900 font-bold text-xl md:text-2xl lg:text-3xl mb-5 md:mb-6">
                              During deep focus work, what happens to your mental clarity?
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                              {clarityOptions.map(opt => (
                                <motion.button
                                  key={opt.value}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setAnswers(prev => ({ ...prev, cognitiveClarity: opt.value }))
                                    scheduleAdvance()
                                  }}
                                  className={`relative cursor-pointer rounded-xl md:rounded-2xl border-2 p-3 md:p-4 transition-all duration-200 flex items-start gap-3 text-left w-full ${answers.cognitiveClarity === opt.value
                                    ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/15'
                                    : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-md'
                                    }`}
                                >
                                  {answers.cognitiveClarity === opt.value && <SelectedCheck />}
                                  <span className="text-xl md:text-2xl flex-shrink-0">{opt.emoji}</span>
                                  <div>
                                    <div className="text-gray-900 text-base font-semibold">{opt.title}</div>
                                    <div className="text-gray-500 text-sm mt-0.5">{opt.subtitle}</div>
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Step 7 — Recovery & immunity */}
                        {currentStep === 7 && (
                          <div>
                            <StepBadge step={7} science="🔬 TESTING: VITAMIN C · D · AMINO ACIDS · ELECTROLYTES" />
                            <h2 className="text-gray-900 font-bold text-xl md:text-2xl lg:text-3xl mb-5 md:mb-6">
                              Two quick questions about your recovery &amp; immunity
                            </h2>

                            <div className="mt-2 mb-6 md:mb-8">
                              <p className="text-gray-700 font-semibold text-base md:text-lg mb-3">
                                Muscle soreness 24 hours after light activity:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {muscleOptions.map(opt => (
                                  <motion.button
                                    key={opt.value}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      const willComplete = Boolean(answers.immuneResilience)
                                      setAnswers(prev => ({ ...prev, muscleRecovery: opt.value }))
                                      if (willComplete) scheduleAdvance()
                                    }}
                                    className={`border-2 rounded-full px-3 md:px-4 py-2 text-sm md:text-base cursor-pointer font-medium transition-all ${answers.muscleRecovery === opt.value
                                      ? 'bg-emerald-500 text-black border-emerald-500 shadow-md shadow-emerald-500/30'
                                      : 'border-gray-300 text-gray-600 hover:border-emerald-400'
                                      }`}
                                  >
                                    {opt.label}
                                  </motion.button>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-gray-100 my-4" />

                            <div>
                              <p className="text-gray-700 font-semibold text-base md:text-lg mb-3">
                                Colds, flu, or infections in the last 6 months:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {immuneOptions.map(opt => (
                                  <motion.button
                                    key={opt.value}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      const willComplete = Boolean(answers.muscleRecovery)
                                      setAnswers(prev => ({ ...prev, immuneResilience: opt.value }))
                                      if (willComplete) scheduleAdvance()
                                    }}
                                    className={`border-2 rounded-full px-3 md:px-4 py-2 text-sm md:text-base cursor-pointer font-medium transition-all ${answers.immuneResilience === opt.value
                                      ? 'bg-emerald-500 text-black border-emerald-500 shadow-md shadow-emerald-500/30'
                                      : 'border-gray-300 text-gray-600 hover:border-emerald-400'
                                      }`}
                                  >
                                    {opt.label}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Navigation Buttons — Continue only when auto-next isn't enough */}
                  <div className="px-5 md:px-8 pb-6 md:pb-8">
                    {submitError ? (
                      <p className="mb-4 text-sm text-red-600 text-center font-medium">{submitError}</p>
                    ) : null}
                    <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => { setDirection('back'); advancingRef.current = false; setCurrentStep(p => p - 1) }}
                      className={`border border-gray-200 text-gray-500 rounded-full px-4 md:px-6 py-2.5 md:py-3 hover:border-gray-400 transition flex items-center gap-2 text-base font-medium flex-shrink-0 ${currentStep === 1 ? 'invisible' : ''}`}
                    >
                      <ChevronLeft size={16} />
                      Back
                    </button>

                    {(currentStep === 5 || currentStep === 7) && (
                      <button
                        onClick={() => {
                          if (currentStep === 7) {
                            setGatePhase('ready')
                            return
                          }
                          setDirection('next')
                          setCurrentStep((p) => p + 1)
                        }}
                        disabled={!isStepValid()}
                        className={`bg-emerald-500 text-black rounded-full px-6 md:px-8 py-2.5 md:py-3 font-bold text-base flex items-center gap-2 transition-all flex-shrink-0 ${isStepValid()
                          ? 'hover:bg-emerald-400 hover:scale-105 cursor-pointer'
                          : 'opacity-40 cursor-not-allowed'
                          }`}
                      >
                        {currentStep === 7 ? 'See My Results' : 'Continue'}
                        <ChevronRight size={16} />
                      </button>
                    )}
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>

            {/* Bottom Trust Bar */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4">
              {[
                { Icon: UserCheck, label: 'Nutritionist Approved' },
                { Icon: ShieldCheck, label: '100% Personalized' },
                { Icon: Lock, label: 'Data is Secure' },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-gray-500 text-sm">
                  <Icon size={14} className="text-emerald-500" />
                  {label}
                </div>
              ))}
            </div>
            <p className="text-center mt-2 text-gray-500 text-sm px-4">
              🔒 Your answers are private and never shared · Used only to generate your personal report
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
