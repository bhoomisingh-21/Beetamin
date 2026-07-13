'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Loader2, Save, User } from 'lucide-react'
import type { PortalClientBundle } from '@/lib/nutritionist-types'
import { buildHraFormDefaults } from '@/lib/nutritionist-hra-defaults'
import {
  HRA_ACTIVITY_OPTIONS,
  HRA_FOOD_OPTIONS,
  HRA_GENDER_OPTIONS,
  HRA_GOAL_OPTIONS,
  HRA_LIFESTYLE_DISORDER_OPTIONS,
  type NutritionistHraForm,
} from '@/lib/nutritionist-hra-types'
import { saveNutritionistClientHra } from '@/lib/nutritionist-portal-actions'
import { portal } from '@/components/nutritionist-portal/portal-theme'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof User
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-start gap-3 border-b border-emerald-100 px-5 py-4 md:px-6">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
        <Icon size={18} aria-hidden />
      </div>
      <div>
        <h3 className="font-black text-slate-900">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  )
}

export function NutritionistHraTab({
  clientId,
  clientName,
  bundle,
}: {
  clientId: string
  clientName: string
  bundle: PortalClientBundle
}) {
  const router = useRouter()
  const defaults = useMemo(() => buildHraFormDefaults(bundle), [bundle])
  const [form, setForm] = useState<NutritionistHraForm>(defaults)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [saving, startSave] = useTransition()

  function set<K extends keyof NutritionistHraForm>(key: K, value: NutritionistHraForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startSave(async () => {
      const res = await saveNutritionistClientHra(clientId, form)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setToast('HRA saved successfully.')
      setTimeout(() => setToast(''), 3500)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {toast ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {toast}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className={`${portal.card} overflow-hidden`}>
        <SectionHeader
          icon={User}
          title="Basic information"
          subtitle={`Personal details and body metrics for ${clientName}`}
        />
        <div className="grid gap-5 p-5 sm:grid-cols-2 md:p-6">
          <Field label="Name">
            <input
              type="text"
              value={clientName}
              disabled
              className={`${portal.input} bg-slate-50 text-slate-500`}
            />
          </Field>
          <Field label="Gender" required>
            <select
              value={form.gender ?? ''}
              onChange={(e) => set('gender', e.target.value)}
              className={portal.input}
              required
            >
              <option value="">Select…</option>
              {HRA_GENDER_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Age" required>
            <input
              type="number"
              min={1}
              max={120}
              value={form.age ?? ''}
              onChange={(e) => set('age', e.target.value ? Number(e.target.value) : null)}
              className={portal.input}
              required
            />
          </Field>
          <Field label="Country">
            <input
              type="text"
              value={form.country ?? 'India'}
              onChange={(e) => set('country', e.target.value)}
              className={portal.input}
            />
          </Field>
          <Field label="Actual weight (kg)" required>
            <input
              type="number"
              min={20}
              max={300}
              step={0.1}
              value={form.actual_weight_kg ?? ''}
              onChange={(e) =>
                set('actual_weight_kg', e.target.value ? Number(e.target.value) : null)
              }
              className={portal.input}
              required
            />
          </Field>
          <Field label="Desired weight (kg)">
            <input
              type="number"
              min={20}
              max={300}
              step={0.1}
              value={form.desired_weight_kg ?? ''}
              onChange={(e) =>
                set('desired_weight_kg', e.target.value ? Number(e.target.value) : null)
              }
              className={portal.input}
            />
          </Field>
          <Field label="Height (cm)" required>
            <input
              type="number"
              min={100}
              max={250}
              value={form.height_cm ?? ''}
              onChange={(e) => set('height_cm', e.target.value ? Number(e.target.value) : null)}
              className={portal.input}
              required
            />
          </Field>
          <Field label="Community / State">
            <input
              type="text"
              value={form.community ?? ''}
              onChange={(e) => set('community', e.target.value)}
              placeholder="e.g. Andhra Pradesh, North India"
              className={portal.input}
            />
          </Field>
        </div>
      </div>

      <div className={`${portal.card} overflow-hidden`}>
        <SectionHeader
          icon={Heart}
          title="Health & diet"
          subtitle="Activity, preferences, and clinical information"
        />
        <div className="grid gap-5 p-5 sm:grid-cols-2 md:p-6">
          <Field label="Activity level" required>
            <select
              value={form.activity_level ?? ''}
              onChange={(e) => set('activity_level', e.target.value)}
              className={portal.input}
              required
            >
              <option value="">Select…</option>
              {HRA_ACTIVITY_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Goal" required>
            <select
              value={form.goal ?? ''}
              onChange={(e) => set('goal', e.target.value)}
              className={portal.input}
              required
            >
              <option value="">Select…</option>
              {HRA_GOAL_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Food preference" required>
            <select
              value={form.food_preference ?? ''}
              onChange={(e) => set('food_preference', e.target.value)}
              className={portal.input}
              required
            >
              <option value="">Select…</option>
              {HRA_FOOD_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Allergies">
            <input
              type="text"
              value={form.allergies ?? ''}
              onChange={(e) => set('allergies', e.target.value)}
              placeholder="No allergy"
              className={portal.input}
            />
          </Field>
          <Field label="Lifestyle disorders">
            <select
              value={form.diseases ?? ''}
              onChange={(e) => set('diseases', e.target.value)}
              className={portal.input}
            >
              <option value="">Select lifestyle disorder…</option>
              {HRA_LIFESTYLE_DISORDER_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Clinical notes">
              <textarea
                rows={4}
                value={form.clinical_notes ?? ''}
                onChange={(e) => set('clinical_notes', e.target.value)}
                placeholder="Medications, lab notes, lifestyle context…"
                className={`${portal.input} resize-y`}
              />
            </Field>
          </div>
        </div>
      </div>

      {bundle.detailedAssessment ? (
        <div className={`${portal.cardMuted} px-5 py-4 text-xs text-slate-600`}>
          <p className="font-semibold text-slate-700">From client assessment (read-only)</p>
          <ul className="mt-2 space-y-1">
            {bundle.detailedAssessment.energy_mood ? (
              <li>Energy: {bundle.detailedAssessment.energy_mood}</li>
            ) : null}
            {bundle.detailedAssessment.sleep_quality ? (
              <li>Sleep: {bundle.detailedAssessment.sleep_quality}</li>
            ) : null}
            {bundle.detailedAssessment.digestion ? (
              <li>Digestion: {bundle.detailedAssessment.digestion}</li>
            ) : null}
            {bundle.detailedAssessment.water_intake ? (
              <li>Water: {bundle.detailedAssessment.water_intake}</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div className="flex justify-end pb-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save profile
        </button>
      </div>
    </form>
  )
}
