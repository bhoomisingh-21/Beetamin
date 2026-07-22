'use client'

import { useId, useState, useTransition } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { createCustomFood } from '@/lib/food-actions'
import type { CreateCustomFoodInput, FoodRow } from '@/lib/food-db-types'
import { FOOD_CATEGORY_SUGGESTIONS, formatFoodKcalLabel } from '@/lib/food-db-types'

type Props = {
  onCreated?: (food: FoodRow) => void
  onCancel?: () => void
  className?: string
}

type TextFields = {
  name: string
  category: string
  default_unit: string
}

/** Numeric fields are tracked as raw strings while typing so decimals/backspacing never get clobbered by re-renders. */
type NumericFields = {
  default_qty_grams: string
  kcal_per_100g: string
  carbs_g_per_100g: string
  protein_g_per_100g: string
  fat_g_per_100g: string
  fiber_g_per_100g: string
}

const emptyTextForm = (): TextFields => ({ name: '', category: '', default_unit: 'g' })
const emptyNumForm = (): NumericFields => ({
  default_qty_grams: '100',
  kcal_per_100g: '',
  carbs_g_per_100g: '',
  protein_g_per_100g: '',
  fat_g_per_100g: '',
  fiber_g_per_100g: '',
})

/** Allow only what a person typing a positive decimal would type: digits and at most one dot. */
function sanitizeNumericInput(raw: string): string {
  let v = raw.replace(/[^0-9.]/g, '')
  const firstDot = v.indexOf('.')
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '')
  }
  return v
}

function toOptionalNumber(raw: string): number | undefined {
  const v = raw.trim()
  if (!v || v === '.') return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

export function AddCustomFoodForm({ onCreated, onCancel, className = '' }: Props) {
  const formId = useId()
  const [text, setText] = useState<TextFields>(emptyTextForm)
  const [nums, setNums] = useState<NumericFields>(emptyNumForm)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function setTextField<K extends keyof TextFields>(key: K, value: TextFields[K]) {
    setText((prev) => ({ ...prev, [key]: value }))
  }

  function setNumField<K extends keyof NumericFields>(key: K, value: string) {
    setNums((prev) => ({ ...prev, [key]: sanitizeNumericInput(value) }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const form: CreateCustomFoodInput = {
      name: text.name,
      category: text.category,
      default_unit: text.default_unit,
      default_qty_grams: toOptionalNumber(nums.default_qty_grams),
      kcal_per_100g: toOptionalNumber(nums.kcal_per_100g),
      carbs_g_per_100g: toOptionalNumber(nums.carbs_g_per_100g),
      protein_g_per_100g: toOptionalNumber(nums.protein_g_per_100g),
      fat_g_per_100g: toOptionalNumber(nums.fat_g_per_100g),
      fiber_g_per_100g: toOptionalNumber(nums.fiber_g_per_100g),
    }
    startTransition(async () => {
      const res = await createCustomFood(form)
      if (!res.ok) {
        setError(res.error)
        return
      }
      onCreated?.(res.food)
      setText(emptyTextForm())
      setNums(emptyNumForm())
    })
  }

  const inputClass =
    'w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100'

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      <div>
        <label htmlFor={`${formId}-name`} className="mb-1 block text-xs font-semibold text-emerald-900">
          Name *
        </label>
        <input
          id={`${formId}-name`}
          required
          value={text.name}
          onChange={(e) => setTextField('name', e.target.value)}
          placeholder="e.g. Homemade dal"
          className={inputClass}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${formId}-category`} className="mb-1 block text-xs font-semibold text-emerald-900">
            Category
          </label>
          <input
            id={`${formId}-category`}
            list={`${formId}-categories`}
            value={text.category}
            onChange={(e) => setTextField('category', e.target.value)}
            placeholder="Pulse, cereal…"
            className={inputClass}
          />
          <datalist id={`${formId}-categories`}>
            {FOOD_CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor={`${formId}-unit`} className="mb-1 block text-xs font-semibold text-emerald-900">
            Default unit
          </label>
          <input
            id={`${formId}-unit`}
            value={text.default_unit}
            onChange={(e) => setTextField('default_unit', e.target.value)}
            placeholder="g, cup, bowl…"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${formId}-qty`} className="mb-1 block text-xs font-semibold text-emerald-900">
          Default qty (grams)
        </label>
        <input
          id={`${formId}-qty`}
          type="text"
          inputMode="decimal"
          value={nums.default_qty_grams}
          onChange={(e) => setNumField('default_qty_grams', e.target.value)}
          className={inputClass}
        />
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Macros per 100g</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {(
          [
            ['kcal_per_100g', 'Kcal'],
            ['carbs_g_per_100g', 'Carbs'],
            ['protein_g_per_100g', 'Protein'],
            ['fat_g_per_100g', 'Fat'],
            ['fiber_g_per_100g', 'Fiber'],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label htmlFor={`${formId}-${key}`} className="mb-1 block text-[10px] font-semibold text-slate-600">
              {label}
            </label>
            <input
              id={`${formId}-${key}`}
              type="text"
              inputMode="decimal"
              value={nums[key]}
              onChange={(e) => setNumField(key, e.target.value)}
              className={inputClass}
            />
          </div>
        ))}
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Save custom food
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-emerald-50"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}
