'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Loader2, Plus, Trash2, X } from 'lucide-react'
import {
  addMealPlanFoodEntry,
  deleteMealPlanEntry,
  updateMealPlanEntryQty,
} from '@/lib/meal-plan-entry-actions'
import type { MealPlanEntryRow } from '@/lib/meal-plan-entry-types'
import type { FoodRow } from '@/lib/food-db-types'
import { FoodSearchInput } from '@/components/nutritionist-portal/FoodSearchInput'

type Props = {
  mealPlanId: string
  entryDate: string
  mealSlot: string
  slotLabel: string
  entries: MealPlanEntryRow[]
  /** Free-text meal from plan JSON (shown until replaced with a food item). */
  legacyText?: string
  suggestions?: string[]
  disabled?: boolean
  onEntriesChange: (entries: MealPlanEntryRow[]) => void
  onLegacyChange?: (text: string) => void
}

export function MealPlanFoodCell({
  mealPlanId,
  entryDate,
  mealSlot,
  slotLabel,
  entries,
  legacyText = '',
  suggestions = [],
  disabled = false,
  onEntriesChange,
  onLegacyChange,
}: Props) {
  const [open, setOpen] = useState(false)
  const [pendingFood, setPendingFood] = useState<FoodRow | null>(null)
  const [qty, setQty] = useState('100')
  const [localQty, setLocalQty] = useState<Record<string, string>>({})
  const [editingLegacy, setEditingLegacy] = useState(false)
  const [legacyDraft, setLegacyDraft] = useState(legacyText)
  const [error, setError] = useState('')
  const [saving, startSaving] = useTransition()
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const legacy = legacyText.trim()
  const hasLegacy = legacy.length > 0
  const hasContent = entries.length > 0 || hasLegacy

  useEffect(() => {
    setLegacyDraft(legacyText)
  }, [legacyText])

  useEffect(() => {
    const next: Record<string, string> = {}
    for (const e of entries) {
      next[e.id] = String(e.qty_grams)
    }
    setLocalQty(next)
  }, [entries])

  useEffect(() => {
    const timers = debounceRef.current
    return () => {
      for (const t of Object.values(timers)) clearTimeout(t)
    }
  }, [])

  const replaceEntry = useCallback(
    (updated: MealPlanEntryRow) => {
      onEntriesChange(entries.map((e) => (e.id === updated.id ? updated : e)))
    },
    [entries, onEntriesChange],
  )

  function handleAddFood(food: FoodRow) {
    setPendingFood(food)
    setQty(String(food.default_qty_grams ?? 100))
    setError('')
  }

  function confirmAdd() {
    if (!pendingFood) return
    const grams = Number(qty)
    if (!Number.isFinite(grams) || grams <= 0) {
      setError('Enter a valid quantity in grams')
      return
    }
    startSaving(async () => {
      const res = await addMealPlanFoodEntry({
        mealPlanId,
        entryDate,
        mealSlot,
        foodId: pendingFood.id,
        qtyGrams: grams,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      onEntriesChange([...entries, res.entry])
      setPendingFood(null)
      if (onLegacyChange && legacy) onLegacyChange('')
      setOpen(true)
    })
  }

  function handleQtyChange(entry: MealPlanEntryRow, value: string) {
    setLocalQty((prev) => ({ ...prev, [entry.id]: value }))
    const grams = Number(value)
    if (!Number.isFinite(grams) || grams <= 0) return

    const ratio = grams / entry.qty_grams
    const optimistic: MealPlanEntryRow = {
      ...entry,
      qty_grams: grams,
      kcal: entry.kcal != null ? entry.kcal * ratio : null,
      carbs_g: entry.carbs_g != null ? entry.carbs_g * ratio : null,
      protein_g: entry.protein_g != null ? entry.protein_g * ratio : null,
      fat_g: entry.fat_g != null ? entry.fat_g * ratio : null,
    }
    replaceEntry(optimistic)

    if (debounceRef.current[entry.id]) clearTimeout(debounceRef.current[entry.id])
    debounceRef.current[entry.id] = setTimeout(() => {
      void (async () => {
        const res = await updateMealPlanEntryQty({
          entryId: entry.id,
          mealPlanId,
          qtyGrams: grams,
        })
        if (res.ok) replaceEntry(res.entry)
      })()
    }, 500)
  }

  function handleRemove(entryId: string) {
    startSaving(async () => {
      const res = await deleteMealPlanEntry({ entryId, mealPlanId })
      if (!res.ok) {
        setError(res.error)
        return
      }
      onEntriesChange(entries.filter((e) => e.id !== entryId))
    })
  }

  function saveLegacyDraft() {
    onLegacyChange?.(legacyDraft.trim())
    setEditingLegacy(false)
  }

  function applySuggestion(label: string) {
    onLegacyChange?.(label)
    setLegacyDraft(label)
    setEditingLegacy(false)
  }

  const cellKcal = entries.reduce((s, e) => s + (e.kcal ?? 0), 0)

  return (
    <div className="relative min-h-[52px]">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`min-h-[52px] w-full rounded border px-1.5 py-1 text-left transition ${
          hasContent
            ? 'border-emerald-300 bg-white hover:border-emerald-400'
            : 'border-emerald-200 bg-slate-50 hover:border-emerald-300'
        } disabled:cursor-default`}
      >
        {!hasContent ? (
          <span className="text-[10px] text-slate-400">Tap to add meal</span>
        ) : (
          <ul className="space-y-0.5">
            {hasLegacy ? (
              <li className="line-clamp-2 text-[10px] leading-tight text-slate-700">{legacy}</li>
            ) : null}
            {entries.slice(0, 2).map((e) => (
              <li key={e.id} className="truncate text-[10px] leading-tight text-slate-800">
                {e.foods?.name ?? 'Food'} · {Math.round(e.qty_grams)}g
              </li>
            ))}
            {entries.length > 2 ? (
              <li className="text-[9px] text-emerald-700">+{entries.length - 2} more</li>
            ) : null}
            {entries.length > 0 ? (
              <li className="text-[9px] font-semibold text-rose-700">{Math.round(cellKcal)} kcal</li>
            ) : (
              <li className="text-[9px] text-slate-500">Text meal · tap to edit or swap food</li>
            )}
          </ul>
        )}
      </button>

      {open && !disabled ? (
        <div className="absolute left-0 top-full z-40 mt-1 w-[min(280px,85vw)] rounded-xl border border-emerald-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">{slotLabel}</p>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setPendingFood(null)
                setError('')
              }}
              className="rounded p-1 text-slate-400 hover:bg-slate-100"
            >
              <X size={14} />
            </button>
          </div>

          {hasLegacy || editingLegacy ? (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50/50 p-2">
              <p className="text-[9px] font-bold uppercase tracking-wide text-amber-900">Current meal</p>
              {editingLegacy ? (
                <div className="mt-1 space-y-2">
                  <textarea
                    rows={2}
                    value={legacyDraft}
                    onChange={(e) => setLegacyDraft(e.target.value)}
                    className="w-full resize-none rounded border border-amber-200 px-2 py-1 text-[11px]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveLegacyDraft}
                      className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white"
                    >
                      Save text
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLegacy(false)
                        setLegacyDraft(legacyText)
                      }}
                      className="text-[10px] text-slate-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-start justify-between gap-2">
                  <p className="text-[11px] leading-snug text-slate-800">{legacy}</p>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingLegacy(true)}
                      className="text-[10px] font-semibold text-emerald-700 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onLegacyChange?.('')}
                      className="text-[10px] text-red-600 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
              <p className="mt-2 text-[9px] text-slate-500">Or search below to swap for an IFCT food with macros.</p>
            </div>
          ) : null}

          {entries.length > 0 ? (
            <ul className="mb-3 max-h-36 space-y-2 overflow-y-auto">
              {entries.map((e) => (
                <li key={e.id} className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-2">
                  <div className="flex items-start justify-between gap-1">
                    <p className="min-w-0 flex-1 text-[11px] font-semibold text-slate-800">
                      {e.foods?.name ?? 'Food'}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemove(e.id)}
                      className="shrink-0 text-slate-400 hover:text-red-500"
                      aria-label="Remove"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={localQty[e.id] ?? e.qty_grams}
                      onChange={(ev) => handleQtyChange(e, ev.target.value)}
                      className="w-14 rounded border border-emerald-200 px-1 py-0.5 text-[10px]"
                    />
                    <span className="text-[10px] text-slate-500">g</span>
                    <span className="ml-auto text-[10px] font-semibold text-emerald-700">
                      {Math.round(e.kcal ?? 0)} kcal
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {pendingFood ? (
            <div className="mb-3 rounded-lg border border-emerald-200 bg-white p-2">
              <p className="text-[11px] font-semibold text-slate-800">{pendingFood.name}</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-16 rounded border border-emerald-200 px-2 py-1 text-xs"
                />
                <span className="text-xs text-slate-500">grams</span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={confirmAdd}
                  className="ml-auto rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : 'Add'}
                </button>
              </div>
            </div>
          ) : (
            <FoodSearchInput placeholder="Search food to add or replace…" onSelect={handleAddFood} className="mb-2" />
          )}

          {!pendingFood && suggestions.length > 0 && !hasLegacy && entries.length === 0 ? (
            <div className="mb-2">
              <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Quick picks</p>
              <div className="flex flex-wrap gap-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-medium text-emerald-900 hover:bg-emerald-100"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <p className="text-[10px] text-red-600">{error}</p> : null}

          {!pendingFood && (
            <p className="mt-1 flex items-center gap-1 text-[9px] text-slate-500">
              <Plus size={10} /> {hasLegacy ? 'Search to swap for a tracked food' : 'Pick a quick meal or search IFCT'}
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}
