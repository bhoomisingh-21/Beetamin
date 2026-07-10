'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Plus, Trash2, X } from 'lucide-react'
import { FoodSearchInput } from '@/components/nutritionist-portal/FoodSearchInput'
import { AddCustomFoodForm } from '@/components/nutritionist-portal/AddCustomFoodForm'
import {
  addMealPlanFoodEntry,
  deleteMealPlanEntry,
  updateMealPlanEntryQty,
} from '@/lib/meal-plan-entry-actions'
import type { MealPlanEntryRow } from '@/lib/meal-plan-entry-types'
import { searchFoods } from '@/lib/food-actions'
import type { FoodRow } from '@/lib/food-db-types'
import { MEAL_SLOT_QUICK_FOODS, type QuickFoodPick } from '@/lib/meal-slot-suggestions'
import type { MealSlots } from '@/lib/meal-plan-types'

type Props = {
  mealPlanId: string
  entryDate: string
  mealSlot: keyof MealSlots
  slotLabel: string
  displayLabel: string
  entries: MealPlanEntryRow[]
  disabled?: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onEntriesChange: (entries: MealPlanEntryRow[]) => void
  onLegacyChange: (text: string) => void
}

function formatKcal(kcal: number | null | undefined): string {
  if (kcal == null || Number.isNaN(kcal)) return '—'
  return `${Math.round(kcal)} kcal`
}

function entryNames(entries: MealPlanEntryRow[]): string {
  return entries
    .map((e) => e.foods?.name)
    .filter(Boolean)
    .join(', ')
}

export function MealPlanFoodCell({
  mealPlanId,
  entryDate,
  mealSlot,
  slotLabel,
  displayLabel,
  entries,
  disabled = false,
  isOpen,
  onOpenChange,
  onEntriesChange,
  onLegacyChange,
}: Props) {
  const [mounted, setMounted] = useState(false)
  const [showCustomFood, setShowCustomFood] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [quickBusy, setQuickBusy] = useState<string | null>(null)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 320 })

  const quickPicks = MEAL_SLOT_QUICK_FOODS[mealSlot]
  const slotKcal = entries.reduce((sum, e) => sum + (e.kcal ?? 0), 0)
  const hasEntries = entries.length > 0
  const cellLabel = hasEntries ? entryNames(entries) : displayLabel

  useEffect(() => {
    setMounted(true)
  }, [])

  const updatePosition = useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const width = Math.min(360, Math.max(280, rect.width))
    let left = rect.left
    if (left + width > window.innerWidth - 12) {
      left = window.innerWidth - width - 12
    }
    left = Math.max(12, left)
    let top = rect.bottom + 6
    const maxH = 420
    if (top + maxH > window.innerHeight - 12) {
      top = Math.max(12, rect.top - maxH - 6)
    }
    setPos({ top, left, width })
  }, [])

  useEffect(() => {
    if (!isOpen) return
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, updatePosition])

  const close = () => {
    onOpenChange(false)
    setShowCustomFood(false)
  }

  const syncLegacy = (nextEntries: MealPlanEntryRow[]) => {
    onLegacyChange(nextEntries.length ? entryNames(nextEntries) : displayLabel)
  }

  const handleAddFood = async (food: FoodRow, qtyGrams = food.default_qty_grams ?? 100) => {
    setBusyId('add')
    try {
      const res = await addMealPlanFoodEntry({
        mealPlanId,
        entryDate,
        mealSlot,
        foodId: food.id,
        qtyGrams,
      })
      if (!res.ok) return
      const next = [...entries, res.entry]
      onEntriesChange(next)
      syncLegacy(next)
    } finally {
      setBusyId(null)
    }
  }

  const handleQuickPick = async (pick: QuickFoodPick) => {
    setQuickBusy(pick.label)
    try {
      const term = pick.ifctName ?? pick.searchTerm
      const res = await searchFoods(term)
      if (!res.ok || res.foods.length === 0) {
        onLegacyChange(pick.label)
        close()
        return
      }
      const food = res.foods[0]
      const addRes = await addMealPlanFoodEntry({
        mealPlanId,
        entryDate,
        mealSlot,
        foodId: food.id,
        qtyGrams: pick.defaultGrams,
      })
      if (!addRes.ok) return
      const next = [...entries, addRes.entry]
      onEntriesChange(next)
      syncLegacy(next)
    } finally {
      setQuickBusy(null)
    }
  }

  const handleDelete = async (entryId: string) => {
    setBusyId(entryId)
    try {
      const res = await deleteMealPlanEntry({ entryId, mealPlanId })
      if (!res.ok) return
      const next = entries.filter((e) => e.id !== entryId)
      onEntriesChange(next)
      syncLegacy(next)
    } finally {
      setBusyId(null)
    }
  }

  const handleGramsChange = async (entryId: string, qtyGrams: number) => {
    if (qtyGrams <= 0) return
    setBusyId(entryId)
    try {
      const res = await updateMealPlanEntryQty({ entryId, mealPlanId, qtyGrams })
      if (!res.ok) return
      const next = entries.map((e) => (e.id === entryId ? res.entry : e))
      onEntriesChange(next)
    } finally {
      setBusyId(null)
    }
  }

  const popover =
    isOpen && mounted && !disabled ? (
      <>
        <div className="fixed inset-0 z-[200] bg-black/20" aria-hidden onClick={close} />
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`Edit ${slotLabel}`}
          className="fixed z-[201] max-h-[min(420px,70vh)] overflow-y-auto rounded-xl border border-emerald-200 bg-white p-4 shadow-2xl"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">{slotLabel}</h4>
            <button
              type="button"
              onClick={close}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {hasEntries ? (
            <ul className="mb-3 space-y-2">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/50 p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {entry.foods?.name ?? 'Food'}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        defaultValue={entry.qty_grams}
                        disabled={busyId === entry.id}
                        onBlur={(e) => {
                          const g = Number(e.target.value)
                          if (g !== entry.qty_grams) void handleGramsChange(entry.id, g)
                        }}
                        className="w-16 rounded border border-gray-200 px-2 py-0.5 text-xs"
                      />
                      <span className="text-xs text-gray-500">g</span>
                      <span className="text-xs font-semibold text-emerald-700">{formatKcal(entry.kcal)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === entry.id}
                    onClick={() => void handleDelete(entry.id)}
                    className="shrink-0 rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove"
                  >
                    {busyId === entry.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <FoodSearchInput
            placeholder="Search food to add or replace"
            disabled={busyId === 'add'}
            onSelect={(food) => void handleAddFood(food)}
          />

          <div className="mt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Quick picks</p>
            <div className="flex flex-wrap gap-1.5">
              {quickPicks.map((pick) => (
                <button
                  key={pick.label}
                  type="button"
                  disabled={quickBusy !== null}
                  onClick={() => void handleQuickPick(pick)}
                  className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                >
                  {quickBusy === pick.label ? <Loader2 className="inline h-3 w-3 animate-spin" /> : pick.label}
                </button>
              ))}
            </div>
          </div>

          {showCustomFood ? (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <AddCustomFoodForm
                onCreated={(food) => {
                  setShowCustomFood(false)
                  void handleAddFood(food)
                }}
                onCancel={() => setShowCustomFood(false)}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustomFood(true)}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-emerald-200 py-2 text-xs text-emerald-700 hover:bg-emerald-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add custom food
            </button>
          )}

          {hasEntries ? (
            <p className="mt-3 text-center text-xs font-semibold text-emerald-700">
              Slot total: {formatKcal(slotKcal)}
            </p>
          ) : (
            <p className="mt-3 text-center text-xs text-gray-400">+ Pick a quick meal or search IFCT</p>
          )}
        </div>
      </>
    ) : null

  if (disabled) {
    return (
      <div className="flex min-h-[72px] flex-col justify-center rounded-lg border border-emerald-100/80 bg-slate-50 px-3 py-2">
        <span className="line-clamp-2 text-sm font-medium text-gray-700">{cellLabel}</span>
        {hasEntries ? (
          <span className="mt-1 text-xs font-semibold text-emerald-600">{formatKcal(slotKcal)}</span>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        className={`group flex min-h-[72px] w-full flex-col items-start justify-center rounded-lg border px-3 py-2 text-left transition ${
          isOpen
            ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200'
            : 'border-emerald-100/80 bg-white/60 hover:border-emerald-300 hover:bg-emerald-50/80'
        }`}
      >
        <span className="line-clamp-2 text-sm font-medium text-gray-800 group-hover:text-emerald-900">
          {cellLabel}
        </span>
        {hasEntries ? (
          <span className="mt-1 text-xs font-semibold text-emerald-600">{formatKcal(slotKcal)}</span>
        ) : (
          <span className="mt-1 text-xs text-gray-400">Tap to edit</span>
        )}
      </button>
      {popover && createPortal(popover, document.body)}
    </>
  )
}
