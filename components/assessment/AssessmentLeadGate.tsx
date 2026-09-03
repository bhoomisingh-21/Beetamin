'use client'

import { useState } from 'react'
import { ChevronLeft, Loader2 } from 'lucide-react'

export type LeadGatePhase = 'ready' | 'lead' | 'otp'

export type LeadValues = {
  name: string
  age: string
  email: string
  gender: string
  heightCm: string
  weightKg: string
}

export function AssessmentLeadGate({
  phase,
  values,
  onChange,
  onReveal,
  onBack,
  onSendOtp,
  onVerify,
  onResend,
  busy,
  error,
  otpDestination,
}: {
  phase: LeadGatePhase
  values: LeadValues
  onChange: (patch: Partial<LeadValues>) => void
  onReveal: () => void
  onBack: () => void
  onSendOtp: () => void
  onVerify: (code: string) => void
  onResend: () => void
  busy: boolean
  error: string | null
  otpDestination: string
}) {
  const [otp, setOtp] = useState('')
  const heightNum = Number(values.heightCm)
  const weightNum = Number(values.weightKg)
  const leadValid =
    values.name.trim().length > 0 &&
    Number(values.age) >= 10 &&
    Number(values.age) <= 120 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) &&
    (values.gender === 'male' || values.gender === 'female' || values.gender === 'other') &&
    Number.isFinite(heightNum) &&
    heightNum >= 50 &&
    heightNum <= 250 &&
    Number.isFinite(weightNum) &&
    weightNum >= 20 &&
    weightNum <= 300

  if (phase === 'ready') {
    return (
      <div className="px-5 md:px-8 py-10 md:py-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Almost there</p>
        <h2 className="mt-3 text-2xl md:text-3xl font-black text-gray-900 leading-tight">
          Your results are almost ready 🔍
        </h2>
        <p className="mt-3 text-gray-500 text-sm md:text-base max-w-sm mx-auto leading-relaxed">
          Let&apos;s reveal what your answers say about your health.
        </p>
        <button
          type="button"
          onClick={onReveal}
          className="mt-8 w-full rounded-full bg-emerald-500 py-3.5 text-base font-black text-black hover:bg-emerald-400 hover:scale-[1.02] transition"
        >
          Reveal My Results →
        </button>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ChevronLeft size={14} />
          Back
        </button>
      </div>
    )
  }

  if (phase === 'otp') {
    return (
      <div className="px-5 md:px-8 py-8 md:py-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Verify</p>
        <h2 className="mt-2 text-2xl font-black text-gray-900 leading-tight">Enter OTP</h2>
        <p className="mt-2 text-sm text-gray-500">
          We sent a 6-digit code to {otpDestination || 'your email'}.
        </p>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          className="mt-6 w-full rounded-xl border border-gray-200 px-4 py-3.5 text-center text-2xl font-black tracking-[0.4em] text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
        {error ? <p className="mt-3 text-sm font-medium text-red-600 text-center">{error}</p> : null}
        <button
          type="button"
          disabled={busy || otp.length !== 6}
          onClick={() => onVerify(otp)}
          className="mt-6 w-full rounded-full bg-emerald-500 py-3.5 text-base font-black text-black disabled:opacity-40 hover:bg-emerald-400 transition"
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </span>
          ) : (
            'Verify & See My Results →'
          )}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onResend}
          className="mt-3 w-full text-sm font-semibold text-emerald-700"
        >
          Resend code
        </button>
        <button
          type="button"
          onClick={onBack}
          className="mt-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ChevronLeft size={14} />
          Back
        </button>
      </div>
    )
  }

  return (
    <div className="px-5 md:px-8 py-8 md:py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Your results are ready 👀</p>
      <h2 className="mt-2 text-2xl font-black text-gray-900 leading-tight">
        Enter a few details to see your results
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        We&apos;ll send a one-time code so we can securely show your personalized results.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First name *</label>
          <input
            type="text"
            value={values.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Priya"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
          <input
            type="number"
            min={10}
            max={90}
            value={values.age}
            onChange={(e) => onChange({ age: e.target.value })}
            placeholder="e.g. 28"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            value={values.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="priya@example.com"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ gender: opt.value })}
                className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                  values.gender === opt.value
                    ? 'bg-emerald-500 text-black shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm) *</label>
            <input
              type="number"
              inputMode="decimal"
              min={50}
              max={250}
              value={values.heightCm}
              onChange={(e) => onChange({ heightCm: e.target.value })}
              placeholder="e.g. 165"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg) *</label>
            <input
              type="number"
              inputMode="decimal"
              min={20}
              max={300}
              value={values.weightKg}
              onChange={(e) => onChange({ weightKg: e.target.value })}
              placeholder="e.g. 62"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm font-medium text-red-600 text-center">{error}</p> : null}

      <button
        type="button"
        disabled={busy || !leadValid}
        onClick={onSendOtp}
        className="mt-6 w-full rounded-full bg-emerald-500 py-3.5 text-base font-black text-black disabled:opacity-40 hover:bg-emerald-400 transition"
      >
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending code…
          </span>
        ) : (
          'Send OTP'
        )}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="mt-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
      >
        <ChevronLeft size={14} />
        Back
      </button>
    </div>
  )
}
