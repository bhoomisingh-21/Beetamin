'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Send,
  Trash2,
  X,
  CheckCircle2,
  Edit3,
  AlertCircle,
} from 'lucide-react'
import {
  createMealPlan,
  deleteMealPlan,
  getMealPlan,
  listMealPlansForClient,
  publishMealPlan,
  updateMealPlan,
} from '@/lib/meal-plan-actions'
import type { MealPlan, MealPlanDay, MealPlanListItem } from '@/lib/meal-plan-types'
import { MEAL_SLOT_META, emptyDay } from '@/lib/meal-plan-types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

type Props = {
  clientId: string
  clientEmail: string
  clientName: string
}

type ViewState = 'list' | 'builder'

export function NutritionistMealPlanTab({ clientId, clientEmail, clientName }: Props) {
  const router = useRouter()
  const [view, setView] = useState<ViewState>('list')
  const [plans, setPlans] = useState<MealPlanListItem[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState('')

  const [activePlan, setActivePlan] = useState<MealPlan | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newNumDays, setNewNumDays] = useState(7)
  const [creating, startCreating] = useTransition()

  const refreshList = useCallback(async () => {
    setLoadingList(true)
    setListError('')
    const res = await listMealPlansForClient(clientId)
    if (res.ok) {
      setPlans(res.plans)
    } else {
      setListError(res.error)
    }
    setLoadingList(false)
  }, [clientId])

  useEffect(() => {
    void refreshList()
  }, [refreshList])

  async function openPlan(planId: string) {
    setLoadingPlan(true)
    const res = await getMealPlan(planId)
    if (res.ok) {
      setActivePlan(res.plan)
      setView('builder')
    } else {
      alert(res.error)
    }
    setLoadingPlan(false)
  }

  function handleCreate() {
    startCreating(async () => {
      const res = await createMealPlan({
        clientId,
        clientEmail,
        title: newTitle.trim() || `${clientName}'s ${newNumDays}-Day Plan`,
        numDays: newNumDays,
      })
      if (res.ok) {
        setNewTitle('')
        setActivePlan(res.plan)
        setView('builder')
        void refreshList()
      } else {
        alert(res.error)
      }
    })
  }

  async function handleDelete(planId: string) {
    if (!confirm('Delete this plan? This cannot be undone.')) return
    const res = await deleteMealPlan(planId)
    if (res.ok) {
      void refreshList()
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  if (view === 'builder' && activePlan) {
    return (
      <PlanBuilder
        plan={activePlan}
        clientName={clientName}
        clientEmail={clientEmail}
        onBack={() => {
          setView('list')
          void refreshList()
          router.refresh()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Create new plan */}
      <div className="rounded-2xl border border-white/10 bg-[#0A0F14] p-5">
        <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-4">
          <Plus size={16} className="text-emerald-400" />
          Create New Meal Plan
        </h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-gray-400 text-xs mb-1">Plan title</label>
            <input
              type="text"
              placeholder={`${clientName}'s Diet Plan`}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-xl bg-[#111810] border border-white/10 text-white text-sm px-3 py-2 placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Duration</label>
            <select
              value={newNumDays}
              onChange={(e) => setNewNumDays(Number(e.target.value))}
              className="rounded-xl bg-[#111810] border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-emerald-500/50"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={21}>21 days</option>
              <option value={28}>28 days</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm px-5 py-2 transition disabled:opacity-50 flex items-center gap-2"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create Plan
          </button>
        </div>
      </div>

      {/* Existing plans */}
      <div className="rounded-2xl border border-white/10 bg-[#0A0F14] p-5">
        <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-emerald-400" />
          Meal Plans for {clientName}
        </h3>

        {loadingList || loadingPlan ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <Loader2 size={16} className="animate-spin" />
            Loading…
          </div>
        ) : listError ? (
          <p className="text-red-400 text-sm">{listError}</p>
        ) : plans.length === 0 ? (
          <p className="text-gray-500 text-sm py-2">No plans created yet. Create one above.</p>
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-[#111810] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{plan.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {plan.num_days} days
                    {plan.status === 'published' && plan.published_at
                      ? ` · Published ${formatDate(plan.published_at)}`
                      : ` · Draft — ${formatDate(plan.created_at)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      plan.status === 'published'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {plan.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  <button
                    type="button"
                    onClick={() => openPlan(plan.id)}
                    className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-white font-semibold transition flex items-center gap-1"
                  >
                    <Edit3 size={12} />
                    {plan.status === 'published' ? 'View' : 'Edit'}
                  </button>
                  {plan.status !== 'published' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(plan.id)}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 px-2 py-1.5 text-red-400 transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Plan Builder ──────────────────────────────────────────────────────────────

function PlanBuilder({
  plan: initialPlan,
  clientName,
  clientEmail,
  onBack,
}: {
  plan: MealPlan
  clientName: string
  clientEmail: string
  onBack: () => void
}) {
  const [title, setTitle] = useState(initialPlan.title)
  const [notes, setNotes] = useState(initialPlan.nutritionist_notes ?? '')
  const [days, setDays] = useState<MealPlanDay[]>(
    initialPlan.days.length > 0 ? initialPlan.days : [emptyDay(1)],
  )
  const [activeDay, setActiveDay] = useState(0)
  const [status, setStatus] = useState<'draft' | 'published'>(
    initialPlan.status === 'published' ? 'published' : 'draft',
  )

  const [saving, startSave] = useTransition()
  const [publishing, startPublish] = useTransition()
  const [saveMsg, setSaveMsg] = useState('')
  const [publishError, setPublishError] = useState('')

  const isPublished = status === 'published'

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleAutoSave(updatedDays: MealPlanDay[], updatedTitle: string, updatedNotes: string) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      startSave(async () => {
        const res = await updateMealPlan({
          planId: initialPlan.id,
          title: updatedTitle,
          nutritionist_notes: updatedNotes,
          days: updatedDays,
        })
        setSaveMsg(res.ok ? 'Saved' : res.error)
        setTimeout(() => setSaveMsg(''), 2000)
      })
    }, 1200)
  }

  function updateMealSlot(dayIdx: number, slot: keyof MealPlanDay['meals'], value: string) {
    const updated = days.map((d, i) =>
      i === dayIdx ? { ...d, meals: { ...d.meals, [slot]: value } } : d,
    )
    setDays(updated)
    if (!isPublished) scheduleAutoSave(updated, title, notes)
  }

  function updateDayField(dayIdx: number, field: 'water_target' | 'day_notes', value: string) {
    const updated = days.map((d, i) => (i === dayIdx ? { ...d, [field]: value } : d))
    setDays(updated)
    if (!isPublished) scheduleAutoSave(updated, title, notes)
  }

  function handleTitleChange(v: string) {
    setTitle(v)
    if (!isPublished) scheduleAutoSave(days, v, notes)
  }

  function handleNotesChange(v: string) {
    setNotes(v)
    if (!isPublished) scheduleAutoSave(days, title, v)
  }

  function handlePublish() {
    setPublishError('')
    startPublish(async () => {
      const saveRes = await updateMealPlan({ planId: initialPlan.id, title, nutritionist_notes: notes, days })
      if (!saveRes.ok) { setPublishError(saveRes.error); return }

      const pubRes = await publishMealPlan({ planId: initialPlan.id, clientName, clientEmail })
      if (!pubRes.ok) { setPublishError(pubRes.error); return }

      setStatus('published')
    })
  }

  const currentDay = days[activeDay]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition"
        >
          <X size={14} />
          Back to plans
        </button>
        <div className="flex items-center gap-2">
          {saving && <span className="text-gray-500 text-xs flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> Saving…</span>}
          {saveMsg === 'Saved' && <span className="text-emerald-400 text-xs flex items-center gap-1"><CheckCircle2 size={11} /> Saved</span>}
          {status === 'published' && (
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1">
              ✓ Published to {clientName}
            </span>
          )}
        </div>
      </div>

      {/* Plan title */}
      <div className="rounded-2xl border border-white/10 bg-[#0A0F14] p-5">
        <div className="flex flex-wrap gap-4 items-start">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-400 text-xs mb-1 font-medium">Plan Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={isPublished}
              className="w-full rounded-xl bg-[#111810] border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-400 text-xs mb-1 font-medium">Note to {clientName} (optional)</label>
            <input
              type="text"
              placeholder="e.g. Follow this plan strictly for best results"
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              disabled={isPublished}
              className="w-full rounded-xl bg-[#111810] border border-white/10 text-white text-sm px-3 py-2 placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Day selector tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {days.map((d, idx) => (
          <button
            key={d.day}
            type="button"
            onClick={() => setActiveDay(idx)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              idx === activeDay
                ? 'bg-emerald-500 text-black'
                : 'bg-[#111810] border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }`}
          >
            Day {d.day}
          </button>
        ))}
      </div>

      {/* Active day meals */}
      {currentDay && (
        <div className="rounded-2xl border border-white/10 bg-[#0A0F14] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold">Day {currentDay.day}</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveDay((p) => Math.max(0, p - 1))}
                disabled={activeDay === 0}
                className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-gray-400 hover:text-white disabled:opacity-30 transition"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => setActiveDay((p) => Math.min(days.length - 1, p + 1))}
                disabled={activeDay === days.length - 1}
                className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-gray-400 hover:text-white disabled:opacity-30 transition"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {MEAL_SLOT_META.map((slot) => (
            <div key={slot.key}>
              <label className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-1">
                <span>{slot.emoji}</span>
                <span>{slot.label}</span>
                <span className="text-gray-600">({slot.time})</span>
              </label>
              <textarea
                rows={2}
                value={currentDay.meals[slot.key]}
                onChange={(e) => updateMealSlot(activeDay, slot.key, e.target.value)}
                disabled={isPublished}
                placeholder={slotPlaceholder(slot.key)}
                className="w-full rounded-xl bg-[#111810] border border-white/8 text-white text-sm px-3 py-2 placeholder:text-gray-700 focus:outline-none focus:border-emerald-500/40 resize-none disabled:opacity-50"
              />
            </div>
          ))}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1">💧 Water target for day</label>
              <input
                type="text"
                value={currentDay.water_target}
                onChange={(e) => updateDayField(activeDay, 'water_target', e.target.value)}
                disabled={isPublished}
                placeholder="e.g. 3 litres / 10 glasses"
                className="w-full rounded-xl bg-[#111810] border border-white/8 text-white text-sm px-3 py-2 placeholder:text-gray-700 focus:outline-none focus:border-emerald-500/40 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1">📌 Day note</label>
              <input
                type="text"
                value={currentDay.day_notes}
                onChange={(e) => updateDayField(activeDay, 'day_notes', e.target.value)}
                disabled={isPublished}
                placeholder="e.g. Focus on iron today"
                className="w-full rounded-xl bg-[#111810] border border-white/8 text-white text-sm px-3 py-2 placeholder:text-gray-700 focus:outline-none focus:border-emerald-500/40 disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Publish strip */}
      {!isPublished && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          {publishError && (
            <div className="flex items-center gap-2 text-red-400 text-sm mb-3">
              <AlertCircle size={14} />
              {publishError}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm">Ready to send to {clientName}?</p>
              <p className="text-gray-500 text-xs mt-0.5">
                Publishing will notify {clientName} by email and make the plan visible in their dashboard.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm px-6 py-2.5 transition flex items-center gap-2 disabled:opacity-50 shrink-0"
            >
              {publishing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Publish to Client
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function slotPlaceholder(key: keyof MealPlanDay['meals']): string {
  const map: Record<keyof MealPlanDay['meals'], string> = {
    early_morning: 'e.g. Warm water + 2 soaked almonds + raw amla',
    breakfast: 'e.g. Poha with mungfali + nimbu + green chutney',
    mid_morning: 'e.g. 1 seasonal fruit + 1 glass chaas',
    lunch: 'e.g. Bajra roti × 2 + palak dal + curd + salad',
    evening_snack: 'e.g. Roasted chana + masala chai',
    dinner: 'e.g. Khichdi + ghee + papad + raita',
    bedtime: 'e.g. Warm haldi milk or soaked methi water',
  }
  return map[key] ?? ''
}
