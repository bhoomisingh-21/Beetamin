'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Zap, Shield, ChevronRight, ChevronLeft, Loader2, FlaskConical } from 'lucide-react'

const HEX_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='70' viewBox='0 0 60 70'>
  <path d='M30 0L60 17.5V52.5L30 70L0 52.5V17.5L30 0Z' fill='none' stroke='#22C55E' stroke-width='0.5' stroke-opacity='0.18'/>
</svg>`
const HEX_URL = `data:image/svg+xml,${encodeURIComponent(HEX_SVG)}`

const TOTAL_STEPS = 7

export default function AssessmentPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState<'next' | 'back'>('next')
  const [isLoading, setIsLoading] = useState(false)
  const [answers, setAnswers] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
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

  async function handleSubmit() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: answers.name,
          age: answers.age,
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
      localStorage.setItem('assessmentResult', JSON.stringify(result))
      localStorage.setItem('assessmentMeta', JSON.stringify({ name: answers.name, email: answers.email, phone: answers.phone, goal: answers.goal }))
      if (answers.email) {
        fetch('/api/save-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: answers.name, email: answers.email, phone: answers.phone, source: 'assessment' }),
        }).catch(() => {})
      }
      router.push('/assessment/results')
    } catch (e) {
      console.error(e)
      setIsLoading(false)
    }
  }

  const isStepValid = () => {
    if (currentStep === 1) return answers.name !== '' && answers.email !== '' && answers.phone !== '' && answers.age !== ''
    if (currentStep === 2) return answers.diet !== '' && answers.goal !== ''
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
    <div className="min-h-screen bg-[#0A0F14] overflow-x-hidden flex flex-col">

      {/* Announcement Bar */}
      <div className="bg-emerald-950 text-white text-xs tracking-widest uppercase text-center py-2 px-4 flex-shrink-0">
        🧬 TAKES ONLY 2 MINUTES · 100% FREE · NO SIGNUP REQUIRED
      </div>

      {/* Two-column layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 items-center">

        {/* ── LEFT: Hero ── */}
        <div
          className="relative flex items-center justify-center px-6 py-10 lg:py-16 lg:min-h-full text-center"
          style={{
            backgroundImage: `url("${HEX_URL}")`,
            backgroundSize: '60px 70px',
            backgroundRepeat: 'repeat',
            backgroundColor: '#0A0F14',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/15 via-[#0A0F14]/70 to-[#0A0F14] pointer-events-none" />
          <div className="relative z-10 max-w-md w-full">
            {/* Back to home */}
            <a href="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-6 transition">
              <ChevronLeft size={14} />
              Back to home
            </a>

            <span className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs tracking-widest uppercase rounded-full px-3 py-1 inline-flex items-center gap-2">
              <FlaskConical size={12} />
              CLINICAL DEFICIENCY ASSESSMENT
            </span>

            <h1 className="mt-4 font-black text-3xl md:text-4xl lg:text-5xl xl:text-6xl max-w-5xl mx-auto leading-tight text-center">
              <span className="text-white block">Uncover Your Hidden</span>
              <span className="text-[#00E676] block">Nutrient Deficiencies</span>
            </h1>
            <p className="mt-4 text-gray-400 text-sm md:text-base lg:text-lg max-w-xl mx-auto">
              7 clinically-derived questions. AI-powered analysis. Personalized deficiency report in under 2 minutes.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3 md:gap-8">
              {[
                { Icon: Lock, label: '100% Private' },
                { Icon: Zap, label: 'Instant AI Results' },
                { Icon: Shield, label: 'Nutritionist-Reviewed' },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-gray-400 text-xs md:text-sm">
                  <Icon size={14} className="text-emerald-500" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Form ── */}
        <div className="flex flex-col items-center justify-center px-4 py-8 lg:py-12 bg-[#0A0F14]">
          <div className="w-full max-w-xl">
            <div className="bg-white rounded-2xl lg:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

              {isLoading ? (
                <div className="py-12 px-6 md:py-16 md:px-8 text-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-emerald-100 mx-auto relative">
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 size={28} className="text-emerald-500 animate-spin" />
                    </div>
                  </div>
                  <h2 className="mt-5 text-gray-900 font-bold text-lg md:text-xl">Analyzing Your Biology...</h2>
                  <p className="mt-2 text-gray-400 text-sm max-w-xs mx-auto">
                    Our AI is cross-referencing your answers against 50+ nutrient deficiency markers
                  </p>
                  <div className="mt-5 flex justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <p className="mt-4 text-gray-300 text-xs">This takes about 5–10 seconds</p>
                </div>
              ) : (
                <>
                  {/* Progress Header */}
                  <div className="bg-gray-50 border-b border-gray-100 px-5 md:px-8 py-3 md:py-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-xs md:text-sm font-medium">Step {currentStep} of {TOTAL_STEPS}</span>
                      <span className="text-emerald-600 text-xs md:text-sm font-semibold">
                        {Math.round((currentStep / TOTAL_STEPS) * 100)}% Complete
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-1.5 w-full mt-2 md:mt-3">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
                      />
                    </div>
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

                        {/* Step 1 — Personal info (with required email + phone) */}
                        {currentStep === 1 && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 mb-4 text-blue-600 text-[10px] md:text-xs font-semibold">
                              🔬 PERSONALIZING YOUR ANALYSIS
                            </span>
                            <h2 className="text-gray-900 font-bold text-lg md:text-xl lg:text-2xl mb-2">
                              Tell us a little about yourself
                            </h2>
                            <p className="text-gray-400 text-xs md:text-sm mb-5">
                              This personalizes your deficiency report to your biology
                            </p>
                            <div className="flex flex-col gap-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-gray-700 text-xs md:text-sm font-medium mb-1">Your first name *</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Priya"
                                    value={answers.name}
                                    onChange={e => setAnswers(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-700 text-xs md:text-sm font-medium mb-1">Your age *</label>
                                  <input
                                    type="number"
                                    placeholder="e.g. 28"
                                    min={10}
                                    max={90}
                                    value={answers.age}
                                    onChange={e => setAnswers(prev => ({ ...prev, age: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition bg-white"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-gray-700 text-xs md:text-sm font-medium mb-1">Email address *</label>
                                <input
                                  type="email"
                                  placeholder="priya@example.com"
                                  value={answers.email}
                                  onChange={e => setAnswers(prev => ({ ...prev, email: e.target.value }))}
                                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-gray-700 text-xs md:text-sm font-medium mb-1">Phone number *</label>
                                <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition bg-white">
                                  <select
                                    className="bg-transparent pl-3 pr-2 py-2.5 text-sm text-gray-600 border-r border-gray-200 focus:outline-none shrink-0"
                                    onChange={e => setAnswers(prev => ({ ...prev, phone: e.target.value + ' ' + prev.phone.split(' ').slice(1).join(' ') }))}
                                    defaultValue="+91"
                                  >
                                    <option value="+91">🇮🇳 +91</option>
                                    <option value="+1">🇺🇸 +1</option>
                                    <option value="+44">🇬🇧 +44</option>
                                    <option value="+971">🇦🇪 +971</option>
                                    <option value="+65">🇸🇬 +65</option>
                                    <option value="+61">🇦🇺 +61</option>
                                  </select>
                                  <input
                                    type="tel"
                                    placeholder="98765 43210"
                                    className="flex-1 bg-transparent px-3 py-2.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none min-w-0"
                                    onChange={e => setAnswers(prev => ({
                                      ...prev,
                                      phone: (prev.phone.split(' ')[0] || '+91') + ' ' + e.target.value
                                    }))}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Step 2 — Diet & Health Goal */}
                        {currentStep === 2 && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 mb-4 text-blue-600 text-[10px] md:text-xs font-semibold">
                              🔬 DIETARY PATTERN ANALYSIS
                            </span>
                            <h2 className="text-gray-900 font-bold text-lg md:text-xl lg:text-2xl mb-5">
                              Your diet &amp; health goal
                            </h2>
                            <div className="flex flex-col gap-4">
                              <div>
                                <label className="block text-gray-700 text-xs md:text-sm font-medium mb-2">Diet type *</label>
                                <select
                                  value={answers.diet}
                                  onChange={e => setAnswers(prev => ({ ...prev, diet: e.target.value }))}
                                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 md:py-3 text-gray-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition bg-white"
                                >
                                  <option value="" disabled>Select your diet...</option>
                                  <option value="vegetarian">🥗 Vegetarian</option>
                                  <option value="vegan">🌱 Vegan</option>
                                  <option value="mixed">🍱 Mixed (veg + non-veg)</option>
                                  <option value="non_veg">🍖 Non-vegetarian</option>
                                  <option value="irregular">⏰ Irregular / skip meals often</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-gray-700 text-xs md:text-sm font-medium mb-2">Primary health goal *</label>
                                <select
                                  value={answers.goal}
                                  onChange={e => setAnswers(prev => ({ ...prev, goal: e.target.value }))}
                                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 md:py-3 text-gray-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition bg-white"
                                >
                                  <option value="" disabled>Select your goal...</option>
                                  <option value="energy">⚡ Fix fatigue &amp; get more energy</option>
                                  <option value="focus">🧠 Improve focus &amp; mental clarity</option>
                                  <option value="skin_hair">💇 Better skin, hair &amp; nails</option>
                                  <option value="recovery">💪 Faster recovery &amp; performance</option>
                                  <option value="immunity">🛡️ Strengthen immunity</option>
                                  <option value="hormones">⚖️ Hormonal balance &amp; mood</option>
                                  <option value="wellness">🌿 Overall wellness</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Step 3 — Energy */}
                        {currentStep === 3 && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 mb-4 text-blue-600 text-[10px] md:text-xs font-semibold">
                              🔬 TESTING: B-VITAMINS · IRON · ADRENAL FUNCTION
                            </span>
                            <h2 className="text-gray-900 font-bold text-lg md:text-xl lg:text-2xl mb-5 md:mb-6">
                              It&apos;s 2:30 PM. Which best describes your energy right now?
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                              {energyOptions.map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => setAnswers(prev => ({ ...prev, metabolicRhythm: opt.value }))}
                                  className={`cursor-pointer rounded-xl md:rounded-2xl border-2 p-3 md:p-4 transition-all duration-200 flex items-start gap-3 text-left w-full ${answers.metabolicRhythm === opt.value
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30'
                                    }`}
                                >
                                  <span className="text-xl md:text-2xl flex-shrink-0">{opt.emoji}</span>
                                  <div>
                                    <div className="text-gray-900 text-sm font-semibold">{opt.title}</div>
                                    <div className="text-gray-400 text-xs mt-0.5">{opt.subtitle}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Step 4 — Sleep */}
                        {currentStep === 4 && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 mb-4 text-blue-600 text-[10px] md:text-xs font-semibold">
                              🔬 TESTING: MAGNESIUM · CORTISOL BALANCE · MELATONIN
                            </span>
                            <h2 className="text-gray-900 font-bold text-lg md:text-xl lg:text-2xl mb-5 md:mb-6">
                              After 7–8 hours of sleep, how do you feel 10 minutes after waking?
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                              {sleepOptions.map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => setAnswers(prev => ({ ...prev, sleepArchitecture: opt.value }))}
                                  className={`cursor-pointer rounded-xl md:rounded-2xl border-2 p-3 md:p-4 transition-all duration-200 flex items-start gap-3 text-left w-full ${answers.sleepArchitecture === opt.value
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30'
                                    }`}
                                >
                                  <span className="text-xl md:text-2xl flex-shrink-0">{opt.emoji}</span>
                                  <div>
                                    <div className="text-gray-900 text-sm font-semibold">{opt.title}</div>
                                    <div className="text-gray-400 text-xs mt-0.5">{opt.subtitle}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Step 5 — Physical symptoms */}
                        {currentStep === 5 && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 mb-4 text-blue-600 text-[10px] md:text-xs font-semibold">
                              🔬 TESTING: ZINC · BIOTIN · OMEGA-3 · COLLAGEN · VITAMIN C
                            </span>
                            <h2 className="text-gray-900 font-bold text-lg md:text-xl lg:text-2xl mb-2">
                              Which of these have you noticed recently?
                            </h2>
                            <p className="text-gray-400 text-xs md:text-sm mb-4 md:mb-6">Select all that apply — even minor signs count</p>
                            <div className="grid grid-cols-2 gap-2 md:gap-3">
                              {dermalOptions.map(opt => {
                                const selected = answers.dermalMarkers.includes(opt.value)
                                return (
                                  <button
                                    key={opt.value}
                                    onClick={() => toggleDermalMarker(opt.value)}
                                    className={`cursor-pointer rounded-xl md:rounded-2xl border-2 p-2.5 md:p-3 transition-all duration-200 relative text-left w-full ${selected
                                      ? 'border-emerald-500 bg-emerald-50'
                                      : 'border-gray-200 hover:border-emerald-300'
                                      }`}
                                  >
                                    {selected && (
                                      <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-emerald-500 rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center">
                                        <span className="text-white text-[10px]">✓</span>
                                      </div>
                                    )}
                                    <div className="text-lg md:text-xl mb-1">{opt.emoji}</div>
                                    <div className="text-gray-800 text-xs md:text-sm font-medium leading-tight">{opt.label}</div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Step 6 — Mental clarity */}
                        {currentStep === 6 && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 mb-4 text-blue-600 text-[10px] md:text-xs font-semibold">
                              🔬 TESTING: VITAMIN D3 · B12 · OMEGA-3 FATTY ACIDS
                            </span>
                            <h2 className="text-gray-900 font-bold text-lg md:text-xl lg:text-2xl mb-5 md:mb-6">
                              During deep focus work, what happens to your mental clarity?
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                              {clarityOptions.map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => setAnswers(prev => ({ ...prev, cognitiveClarity: opt.value }))}
                                  className={`cursor-pointer rounded-xl md:rounded-2xl border-2 p-3 md:p-4 transition-all duration-200 flex items-start gap-3 text-left w-full ${answers.cognitiveClarity === opt.value
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30'
                                    }`}
                                >
                                  <span className="text-xl md:text-2xl flex-shrink-0">{opt.emoji}</span>
                                  <div>
                                    <div className="text-gray-900 text-sm font-semibold">{opt.title}</div>
                                    <div className="text-gray-400 text-xs mt-0.5">{opt.subtitle}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Step 7 — Recovery & immunity */}
                        {currentStep === 7 && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 mb-4 text-blue-600 text-[10px] md:text-xs font-semibold">
                              🔬 TESTING: VITAMIN C · D · AMINO ACIDS · ELECTROLYTES
                            </span>
                            <h2 className="text-gray-900 font-bold text-lg md:text-xl lg:text-2xl mb-5 md:mb-6">
                              Two quick questions about your recovery &amp; immunity
                            </h2>

                            <div className="mt-2 mb-6 md:mb-8">
                              <p className="text-gray-700 font-semibold text-sm md:text-base mb-3">
                                Muscle soreness 24 hours after light activity:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {muscleOptions.map(opt => (
                                  <button
                                    key={opt.value}
                                    onClick={() => setAnswers(prev => ({ ...prev, muscleRecovery: opt.value }))}
                                    className={`border-2 rounded-full px-3 md:px-4 py-2 text-xs md:text-sm cursor-pointer font-medium transition-all ${answers.muscleRecovery === opt.value
                                      ? 'bg-emerald-500 text-black border-emerald-500'
                                      : 'border-gray-300 text-gray-600 hover:border-emerald-400'
                                      }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-gray-100 my-4" />

                            <div>
                              <p className="text-gray-700 font-semibold text-sm md:text-base mb-3">
                                Colds, flu, or infections in the last 6 months:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {immuneOptions.map(opt => (
                                  <button
                                    key={opt.value}
                                    onClick={() => setAnswers(prev => ({ ...prev, immuneResilience: opt.value }))}
                                    className={`border-2 rounded-full px-3 md:px-4 py-2 text-xs md:text-sm cursor-pointer font-medium transition-all ${answers.immuneResilience === opt.value
                                      ? 'bg-emerald-500 text-black border-emerald-500'
                                      : 'border-gray-300 text-gray-600 hover:border-emerald-400'
                                      }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="px-5 md:px-8 pb-6 md:pb-8 flex items-center justify-between gap-3">
                    <button
                      onClick={() => { setDirection('back'); setCurrentStep(p => p - 1) }}
                      className={`border border-gray-200 text-gray-500 rounded-full px-4 md:px-6 py-2.5 md:py-3 hover:border-gray-400 transition flex items-center gap-2 text-sm font-medium flex-shrink-0 ${currentStep === 1 ? 'invisible' : ''}`}
                    >
                      <ChevronLeft size={16} />
                      Back
                    </button>

                    {currentStep < TOTAL_STEPS ? (
                      <button
                        onClick={() => { setDirection('next'); setCurrentStep(p => p + 1) }}
                        disabled={!isStepValid()}
                        className={`bg-emerald-500 text-black rounded-full px-6 md:px-8 py-2.5 md:py-3 font-bold text-sm flex items-center gap-2 transition-all flex-shrink-0 ${isStepValid()
                          ? 'hover:bg-emerald-400 hover:scale-105 cursor-pointer'
                          : 'opacity-40 cursor-not-allowed'
                          }`}
                      >
                        Continue
                        <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={!isStepValid()}
                        className={`bg-emerald-500 text-black rounded-full px-5 md:px-8 py-2.5 md:py-3 font-bold text-xs md:text-sm flex items-center gap-2 transition-all flex-shrink-0 ${isStepValid()
                          ? 'hover:bg-emerald-400 hover:scale-105 cursor-pointer'
                          : 'opacity-40 cursor-not-allowed'
                          }`}
                      >
                        Get My Deficiency Report 🧬
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Bottom Trust Bar */}
            <p className="text-center mt-4 text-gray-500 text-xs px-4">
              🔒 Your answers are private and never shared · Used only to generate your personal report
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
