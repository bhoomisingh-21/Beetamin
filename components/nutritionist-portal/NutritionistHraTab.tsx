'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
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
      <span className="text-xs font-medium text-slate-600">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-slate-900">{children}</h3>
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {toast ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {toast}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className={`${portal.card} space-y-6 p-5 sm:p-6`}>
        <div className="space-y-4">
          <SectionTitle>Basic information</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
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

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <SectionTitle>Health &amp; diet</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
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
                  rows={3}
                  value={form.clinical_notes ?? ''}
                  onChange={(e) => set('clinical_notes', e.target.value)}
                  placeholder="Medications, lab notes, lifestyle context…"
                  className={`${portal.input} resize-y`}
                />
              </Field>
            </div>
          </div>
        </div>
      </div>

      {bundle.detailedAssessment ? (
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <p className="font-medium text-slate-700">From client assessment</p>
          <ul className="mt-1.5 space-y-0.5">
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
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save
        </button>
      </div>
    </form>
  )
}
