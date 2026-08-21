'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { ArrowRight, CheckCircle, Leaf, Loader2, ShieldCheck } from 'lucide-react'

import { UpgradePlanButton } from '@/components/payment/UpgradePlanButton'

type FormState = {
  name: string
  email: string
  phone: string
  age: string
  addressLine: string
  city: string
  state: string
  pincode: string
}

type Step = 'details' | 'verify' | 'pay'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
]

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}
      {required ? <span className="text-red-500 ml-0.5">*</span> : null}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 placeholder:text-gray-400 ${props.className ?? ''}`}
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 ${props.className ?? ''}`}
    />
  )
}

export function FullPlanCheckoutClient() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [step, setStep] = useState<Step>('details')
  const [verifyChannel, setVerifyChannel] = useState<'phone' | 'email'>('phone')
  const [otpCode, setOtpCode] = useState('')
  const [otpDestination, setOtpDestination] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [checkoutError, setCheckoutError] = useState('')

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    age: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
  })

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace('/sign-in?redirect_after_auth=%2Fbooking%2Fcheckout')
      return
    }
    setForm((f) => ({
      ...f,
      name: f.name || user?.fullName?.trim() || user?.firstName?.trim() || '',
      email: f.email || user?.primaryEmailAddress?.emailAddress?.trim() || '',
    }))
  }, [isLoaded, isSignedIn, user, router])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function profilePayload() {
    return {
      ...form,
      age: Number(form.age),
    }
  }

  function detailsValid() {
    return (
      form.name.trim() !== '' &&
      form.email.trim() !== '' &&
      form.phone.replace(/\D/g, '').length >= 10 &&
      form.age.trim() !== '' &&
      Number(form.age) >= 10 &&
      Number(form.age) <= 120 &&
      form.addressLine.trim() !== '' &&
      form.city.trim() !== '' &&
      form.state.trim() !== '' &&
      form.pincode.trim().length >= 4
    )
  }

  async function sendOtp() {
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/full-plan/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profilePayload(), channel: verifyChannel }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        error?: string
        destinationMasked?: string
        code?: string
      }
      if (!res.ok) {
        if (json.code === 'OTP_DELIVERY_FAILED' && verifyChannel === 'phone') {
          setVerifyChannel('email')
          setError(`${json.error ?? 'SMS failed.'} Switched to email verification — tap Send code again.`)
          setBusy(false)
          return
        }
        throw new Error(json.error || 'Could not send verification code.')
      }
      setOtpDestination(json.destinationMasked || (verifyChannel === 'phone' ? 'your phone' : form.email))
      setStep('verify')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send verification code.')
    } finally {
      setBusy(false)
    }
  }

  async function verifyOtp() {
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/full-plan/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otpCode }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Verification failed.')
      setStep('pay')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed.')
    } finally {
      setBusy(false)
    }
  }

  async function continueFromDetails() {
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/full-plan/checkout-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload()),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Could not save your details.')
      await sendOtp()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your details.')
      setBusy(false)
    }
  }

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <Leaf className="text-emerald-500" size={18} />
          <span className="text-gray-900 font-bold">TheBeetamin</span>
        </a>
        <a href="/booking" className="text-gray-400 hover:text-gray-600 text-sm transition">
          ← Plan details
        </a>
      </div>

      <div className="flex-1 px-4 py-10 max-w-xl mx-auto w-full">
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold tracking-widest uppercase rounded-full px-3 py-1">
            Full Recovery Plan · ₹3,999
          </span>
          <h1 className="mt-4 text-gray-900 font-black text-3xl">Complete your details</h1>
          <p className="mt-2 text-gray-500 text-sm leading-relaxed">
            Step {step === 'details' ? 1 : step === 'verify' ? 2 : 3} of 3 — verify your contact, then secure PayU checkout.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-5">
          {step === 'details' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Full name</FieldLabel>
                  <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Bhoomi Singh" />
                </div>
                <div>
                  <FieldLabel required>Age</FieldLabel>
                  <Input type="number" min={10} max={120} value={form.age} onChange={(e) => update('age', e.target.value)} placeholder="28" />
                </div>
              </div>
              <div>
                <FieldLabel required>Email</FieldLabel>
                <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <FieldLabel required>Phone (India)</FieldLabel>
                <Input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div>
                <FieldLabel required>Address</FieldLabel>
                <Input value={form.addressLine} onChange={(e) => update('addressLine', e.target.value)} placeholder="Flat 12, Green Park" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>City</FieldLabel>
                  <Input value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Mumbai" />
                </div>
                <div>
                  <FieldLabel required>State</FieldLabel>
                  <Select value={form.state} onChange={(e) => update('state', e.target.value)}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <FieldLabel required>PIN code</FieldLabel>
                <Input value={form.pincode} onChange={(e) => update('pincode', e.target.value)} placeholder="400001" maxLength={8} />
              </div>

              <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-900">
                <p className="font-semibold">Verify before payment</p>
                <p className="mt-1 text-emerald-800/90">We&apos;ll send a 6-digit code to your phone (or email if SMS isn&apos;t available).</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyChannel('phone')}
                  className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition ${verifyChannel === 'phone' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-200 text-gray-600'}`}
                >
                  Verify phone
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyChannel('email')}
                  className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition ${verifyChannel === 'email' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-200 text-gray-600'}`}
                >
                  Verify email
                </button>
              </div>
            </>
          ) : null}

          {step === 'verify' ? (
            <>
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-700">
                Code sent to <span className="font-semibold text-gray-900">{otpDestination}</span>
              </div>
              <div>
                <FieldLabel required>6-digit code</FieldLabel>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="tracking-[0.35em] text-center text-lg font-bold"
                />
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void sendOtp()}
                className="text-sm font-semibold text-emerald-700 underline underline-offset-2 disabled:opacity-50"
              >
                Resend code
              </button>
            </>
          ) : null}

          {step === 'pay' ? (
            <>
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-4 flex items-start gap-3">
                <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-bold text-emerald-900">Contact verified</p>
                  <p className="text-sm text-emerald-800 mt-1">
                    {form.name} · {form.phone} · {form.city}, {form.state}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                You&apos;re ready for secure PayU checkout (₹3,999 one-time). Card, UPI, and net banking supported.
              </p>
              <UpgradePlanButton
                onError={setCheckoutError}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg rounded-2xl py-4 transition flex items-center justify-center gap-2"
              >
                Continue to PayU — ₹3,999
                <ArrowRight size={20} />
              </UpgradePlanButton>
              {checkoutError ? (
                <p className="text-sm text-red-600 font-medium text-center">{checkoutError}</p>
              ) : null}
            </>
          ) : null}

          {error ? (
            <p className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          {step !== 'pay' ? (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                type="button"
                disabled={step === 'details' || busy}
                onClick={() => setStep(step === 'verify' ? 'details' : 'verify')}
                className="text-sm text-gray-500 hover:text-gray-700 disabled:invisible"
              >
                ← Back
              </button>
              {step === 'details' ? (
                <button
                  type="button"
                  disabled={!detailsValid() || busy}
                  onClick={() => void continueFromDetails()}
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold rounded-xl px-6 py-3 text-sm"
                >
                  {busy ? <Loader2 className="animate-spin" size={16} /> : null}
                  Send verification code
                </button>
              ) : (
                <button
                  type="button"
                  disabled={otpCode.length !== 6 || busy}
                  onClick={() => void verifyOtp()}
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold rounded-xl px-6 py-3 text-sm"
                >
                  {busy ? <Loader2 className="animate-spin" size={16} /> : null}
                  Verify & continue
                </button>
              )}
            </div>
          ) : null}
        </div>

        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
          <ShieldCheck size={14} className="text-emerald-500" />
          Encrypted · Doctor-reviewed programme · No subscription
        </p>
      </div>
    </div>
  )
}
