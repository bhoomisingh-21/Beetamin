'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle, ChevronRight, ChevronLeft, Leaf } from 'lucide-react'
import { createClientProfile } from '@/lib/booking-actions'

// ─── Form data ────────────────────────────────────────────────────────────────

type FormData = {
  // Step 1 — Personal
  phone: string
  dateOfBirth: string
  gender: string
  address: string
  // Step 2 — Health
  primaryConcern: string
  knownConditions: string[]
  currentMedications: string
  knownDeficiencies: string[]
  primaryGoal: string
  // Step 3 — Consent
  consentTreatment: boolean
  consentPrivacy: boolean
}

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

const PRIMARY_CONCERNS = [
  'Vitamin / Mineral Deficiency',
  'Chronic Fatigue & Low Energy',
  'Weight Management',
  'Gut Health Issues',
  'Hair Loss & Skin Problems',
  'Sleep Disorders',
  'Immunity & Frequent Illness',
  'Sports & Fitness Nutrition',
  'Hormonal Imbalance',
  'Diabetes / Blood Sugar Management',
  'Thyroid Issues',
  'General Wellness',
]

const CONDITIONS = [
  'Diabetes', 'Thyroid (Hypo/Hyper)', 'PCOD / PCOS', 'Anaemia',
  'Hypertension', 'High Cholesterol', 'IBS / IBD', 'None of the above',
]

const DEFICIENCIES = [
  'Vitamin B12', 'Vitamin D', 'Iron', 'Calcium', 'Zinc',
  'Magnesium', 'Folate', 'Omega-3', "I don't know yet",
]

const GOALS = [
  'Fix specific deficiency', 'Boost energy & focus',
  'Improve sleep quality', 'Lose weight healthily',
  'Build muscle & strength', 'Improve gut health',
  'Manage a health condition', 'Overall wellness',
]

const STEPS = ['Personal Details', 'Medical Details', 'Consent Form']

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm
        focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100
        placeholder:text-gray-400 ${props.className ?? ''}`}
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm bg-white
        focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 ${props.className ?? ''}`}
    />
  )
}

function CheckboxChip({
  label, checked, onChange,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm border transition text-left ${
        checked
          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 font-medium'
          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
      }`}
    >
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
        checked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
      }`}>
        {checked && <CheckCircle className="text-white" size={12} />}
      </div>
      {label}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardPage() {
  const { user } = useUser()
  const router = useRouter()
  const [step, setStep] = useState(0)

  // Nutritionists use Supabase auth (not Clerk) and never reach this page.
  // The middleware (proxy.ts) is the sole routing authority — no redirects here.
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormData>({
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    primaryConcern: '',
    knownConditions: [],
    currentMedications: '',
    knownDeficiencies: [],
    primaryGoal: '',
    consentTreatment: false,
    consentPrivacy: false,
  })

  function update<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  function toggleArrayItem(key: 'knownConditions' | 'knownDeficiencies', item: string) {
    setForm((f) => {
      const arr = f[key] as string[]
      return {
        ...f,
        [key]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item],
      }
    })
  }

  function canProceed() {
    if (step === 0) return !!(form.phone && form.dateOfBirth && form.gender)
    if (step === 1) return !!(form.primaryConcern && form.primaryGoal)
    if (step === 2) return form.consentTreatment && form.consentPrivacy
    return false
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setError('')
    try {
      await createClientProfile({
        name: user?.fullName || user?.firstName || 'Friend',
        phone: form.phone,
        goal: form.primaryGoal,
      })
      router.push('/booking/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <Leaf className="text-emerald-500" size={18} />
          <span className="text-gray-900 font-bold">TheBeetamin</span>
        </a>
        <div className="flex items-center gap-3">
          <a href="/" className="text-gray-400 hover:text-gray-600 text-sm transition">← Back to home</a>
          {user?.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt="" className="w-8 h-8 rounded-full" />
          )}
        </div>
      </div>

      {/* Main content: 2-col on desktop */}
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* ── Left: form ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-gray-900 font-black text-3xl">
              Hi {user?.firstName} 👋
            </h1>
            <p className="text-gray-500 mt-1">
              Let&apos;s set up your health profile. It takes under 2 minutes.
            </p>
          </motion.div>

          {/* Stepper */}
          <div className="flex items-center gap-0 mb-8">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                    i < step ? 'bg-emerald-500 border-emerald-500 text-white' :
                    i === step ? 'bg-white border-emerald-500 text-emerald-600' :
                    'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {i < step ? <CheckCircle size={16} /> : i + 1}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${
                    i === step ? 'text-emerald-600' : i < step ? 'text-emerald-500' : 'text-gray-400'
                  }`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${
                    i < step ? 'bg-emerald-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Form card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <AnimatePresence mode="wait">
              {/* ── STEP 1: Personal ─────────────────────────────────── */}
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-gray-900 font-bold text-lg">Personal Information</h2>
                    <p className="text-gray-500 text-sm mt-0.5">Your basic details</p>
                  </div>

                  {/* Name — read only */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Full name</FieldLabel>
                      <Input value={user?.fullName || user?.firstName || ''} readOnly className="bg-gray-50 cursor-not-allowed text-gray-500" />
                    </div>
                    <div>
                      <FieldLabel>Email</FieldLabel>
                      <Input value={user?.primaryEmailAddress?.emailAddress || ''} readOnly className="bg-gray-50 cursor-not-allowed text-gray-500" />
                    </div>
                  </div>

                  <div>
                    <FieldLabel required>Phone number</FieldLabel>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel required>Date of birth</FieldLabel>
                      <Input
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) => update('dateOfBirth', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <FieldLabel required>Gender</FieldLabel>
                      <Select value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                        <option value="">Select gender</option>
                        {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </Select>
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Address / City</FieldLabel>
                    <Input
                      value={form.address}
                      onChange={(e) => update('address', e.target.value)}
                      placeholder="Mumbai, Maharashtra"
                    />
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: Health Profile ───────────────────────────── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-gray-900 font-bold text-lg">Health Profile</h2>
                    <p className="text-gray-500 text-sm mt-0.5">Help your nutritionist prepare for your session</p>
                  </div>

                  <div>
                    <FieldLabel required>Primary health concern</FieldLabel>
                    <Select value={form.primaryConcern} onChange={(e) => update('primaryConcern', e.target.value)}>
                      <option value="">Select your main concern</option>
                      {PRIMARY_CONCERNS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </div>

                  <div>
                    <FieldLabel>Known health conditions <span className="text-gray-400 font-normal">(select all that apply)</span></FieldLabel>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {CONDITIONS.map((c) => (
                        <CheckboxChip
                          key={c}
                          label={c}
                          checked={form.knownConditions.includes(c)}
                          onChange={() => toggleArrayItem('knownConditions', c)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Known deficiencies <span className="text-gray-400 font-normal">(select all that apply)</span></FieldLabel>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {DEFICIENCIES.map((d) => (
                        <CheckboxChip
                          key={d}
                          label={d}
                          checked={form.knownDeficiencies.includes(d)}
                          onChange={() => toggleArrayItem('knownDeficiencies', d)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Current medications / supplements</FieldLabel>
                    <Input
                      value={form.currentMedications}
                      onChange={(e) => update('currentMedications', e.target.value)}
                      placeholder="e.g. Vitamin D3, Metformin... or None"
                    />
                  </div>

                  <div>
                    <FieldLabel required>Primary goal from this program</FieldLabel>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {GOALS.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => update('primaryGoal', g)}
                          className={`rounded-xl px-3 py-2.5 text-sm border transition text-left ${
                            form.primaryGoal === g
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 font-medium'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: Consent ──────────────────────────────────── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-gray-900 font-bold text-lg">Consent & Privacy</h2>
                    <p className="text-gray-500 text-sm mt-0.5">Please read and agree to continue</p>
                  </div>

                  {/* Summary card */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                    <p className="text-emerald-800 font-bold text-sm mb-3">Your Profile Summary</p>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Name</p>
                        <p className="text-gray-800 font-medium">{user?.fullName || user?.firstName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Phone</p>
                        <p className="text-gray-800 font-medium">{form.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Primary Concern</p>
                        <p className="text-gray-800 font-medium">{form.primaryConcern}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Goal</p>
                        <p className="text-gray-800 font-medium">{form.primaryGoal}</p>
                      </div>
                    </div>
                  </div>

                  {/* Consent checkboxes */}
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div
                        onClick={() => update('consentTreatment', !form.consentTreatment)}
                        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                          form.consentTreatment ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                        }`}
                      >
                        {form.consentTreatment && <CheckCircle className="text-white" size={13} />}
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        I consent to receive personalized nutrition guidance, supplement recommendations, and wellness sessions from certified nutritionists at TheBeetamin.
                      </p>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <div
                        onClick={() => update('consentPrivacy', !form.consentPrivacy)}
                        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                          form.consentPrivacy ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                        }`}
                      >
                        {form.consentPrivacy && <CheckCircle className="text-white" size={13} />}
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        I agree to TheBeetamin&apos;s{' '}
                        <span className="text-emerald-600 underline cursor-pointer">Privacy Policy</span>{' '}
                        and consent to my health data being stored securely for the purpose of providing personalized care.
                      </p>
                    </label>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                      {error}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
                className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700 transition disabled:invisible"
              >
                <ChevronLeft size={16} />
                Back
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl px-6 py-3 text-sm transition disabled:opacity-40"
                >
                  Continue
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl px-6 py-3 text-sm transition disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Activating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Complete Setup
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-gray-400 text-xs mt-4">
            Your data is encrypted and never shared without your consent.
          </p>
        </div>
        </div>{/* end left form col */}

        {/* ── Right: image panel (desktop only) ── */}
        <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-[#0A1A10]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900&auto=format&fit=crop&q=80"
            alt="Healthy nutrition"
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="relative z-10 flex flex-col justify-center px-12 py-16">
            <span className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-widest uppercase rounded-full px-3 py-1 mb-6 w-fit">
              🌿 YOUR HEALTH JOURNEY
            </span>
            <h2 className="text-white font-black text-3xl leading-tight">
              Fix Your Deficiencies
              <br />
              <span className="text-emerald-400">In 90 Days.</span>
            </h2>
            <p className="text-gray-400 text-sm mt-4 leading-relaxed max-w-xs">
              Expert-led nutrition sessions, personalized supplement plans, and doctor-reviewed guidance.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                '6 expert 1-on-1 sessions',
                'Personalized supplement & diet plan',
                'WhatsApp nutritionist support',
                'Doctor-reviewed guidance',
                '3 months · ₹3,999 one-time',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                  <span className="text-gray-300 text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((n) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={n} src={`https://i.pravatar.cc/40?img=${n + 10}`} alt="" className="w-8 h-8 rounded-full border-2 border-white/20 object-cover" />
                ))}
              </div>
              <p className="text-gray-400 text-xs">Trusted by <span className="text-white font-bold">50,000+</span> Indians</p>
            </div>
          </div>
        </div>

      </div>{/* end 2-col wrapper */}
    </div>
  )
}
