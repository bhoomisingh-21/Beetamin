'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Loader2, Plus, Search } from 'lucide-react'
import { searchFoods } from '@/lib/food-actions'
import type { FoodRow } from '@/lib/food-db-types'
import { formatFoodKcalLabel } from '@/lib/food-db-types'
import { AddCustomFoodForm } from '@/components/nutritionist-portal/AddCustomFoodForm'

type Props = {
  onSelect?: (food: FoodRow) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  defaultShowAddForm?: boolean
}

const DEBOUNCE_MS = 300

export function FoodSearchInput({
  onSelect,
  placeholder = 'Search foods (IFCT + your custom)…',
  disabled = false,
  className = '',
  defaultShowAddForm = false,
}: Props) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(defaultShowAddForm)
  const [highlightIndex, setHighlightIndex] = useState(-1)

  const runSearch = useCallback(async (term: string) => {
    if (term.trim().length < 1) {
      setResults([])
      setError('')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    const res = await searchFoods(term)
    setLoading(false)
    if (!res.ok) {
      setError(res.error)
      setResults([])
      return
    }
    setResults(res.foods)
    setHighlightIndex(res.foods.length > 0 ? 0 : -1)
  }, [])

  useEffect(() => {
    if (!open || showAddForm) return
    const handle = window.setTimeout(() => {
      void runSearch(query)
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [query, open, showAddForm, runSearch])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setShowAddForm(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function pickFood(food: FoodRow) {
    onSelect?.(food)
    setQuery(food.name)
    setOpen(false)
    setShowAddForm(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || showAddForm || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault()
      pickFood(results[highlightIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600/70"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setShowAddForm(false)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-emerald-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
        />
        {loading ? (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-600" />
        ) : null}
      </div>

      {open && !disabled ? (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-lg">
          {showAddForm ? (
            <div className="max-h-[min(420px,70vh)] overflow-y-auto p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-emerald-800">Add custom food</p>
              <AddCustomFoodForm
                onCreated={(food) => pickFood(food)}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          ) : (
            <>
              <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto py-1">
                {error ? (
                  <li className="px-3 py-2 text-xs text-red-600">{error}</li>
                ) : query.trim().length < 1 ? (
                  <li className="px-3 py-2 text-xs text-slate-500">Type to search the food database…</li>
                ) : loading ? (
                  <li className="px-3 py-2 text-xs text-slate-500">Searching…</li>
                ) : results.length === 0 ? (
                  <li className="px-3 py-2 text-xs text-slate-500">No foods found. Add a custom food below.</li>
                ) : (
                  results.map((food, index) => (
                    <li key={food.id} role="option" aria-selected={index === highlightIndex}>
                      <button
                        type="button"
                        onMouseEnter={() => setHighlightIndex(index)}
                        onClick={() => pickFood(food)}
                        className={`flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left text-sm transition ${
                          index === highlightIndex ? 'bg-emerald-50' : 'hover:bg-emerald-50/70'
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-800">{food.name}</span>
                          <span className="mt-0.5 block text-[11px] text-slate-500">
                            {[food.category, food.source === 'ifct' ? 'IFCT' : 'Custom'].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-emerald-700">
                          {formatFoodKcalLabel(food)}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <div className="border-t border-emerald-100 p-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
                >
                  <Plus size={14} />
                  Add custom food
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
