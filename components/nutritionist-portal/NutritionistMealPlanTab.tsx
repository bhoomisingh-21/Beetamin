'use client'

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  LayoutTemplate,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
} from 'lucide-react'
import {
  createMealPlan,
  deleteMealPlan,
  getMealPlan,
  listMealPlansForClient,
  publishMealPlan,
  updateMealPlan,
} from '@/lib/meal-plan-actions'
import {
  datesForPlanDays,
  estimateDailyMacros,
  formatGridDayColumn,
  formatWeekRangeLabel,
  initialWeekDays,
  parseMealPlanMeta,
  serializeMealPlanMeta,
} from '@/lib/meal-plan-meta'
import { defaultMealLabelForSlot, defaultMealsForDay, estimateDayTotalsFromMeals } from '@/lib/meal-slot-suggestions'
import type { MealPlan, MealPlanDay, MealPlanListItem, MealSlots } from '@/lib/meal-plan-types'
import {
  MEAL_SLOT_META,
  activePlanDayCount,
  emptyDay,
  nextIsoDate,
  renumberPlanDays,
  todayIsoDate,
} from '@/lib/meal-plan-types'
import type { ClientRow, ProgressLogRow } from '@/lib/booking-types'
import type { PortalClientBundle } from '@/lib/nutritionist-types'
import { copyMealPlanCell, listMealPlanEntries, seedDefaultMealPlanEntries } from '@/lib/meal-plan-entry-actions'
import {
  entryCellKey,
  sumDayTotals,
  type MealPlanEntryRow,
} from '@/lib/meal-plan-entry-types'
import {
  applyTemplateToMealPlan,
  listNutritionistTemplates,
  saveMealPlanAsTemplate,
} from '@/lib/template-actions'
import { TEMPLATE_CONDITION_TAGS, type TemplateListItem } from '@/lib/template-types'
import { MealPlanFoodCell } from '@/components/nutritionist-portal/MealPlanFoodCell'

function isoFromPlanDate(date: Date | undefined, fallback: string): string {
  if (!date) return fallback
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function entryDateForDay(day: MealPlanDay | undefined, columnDate: Date | undefined): string {
  if (day?.plan_date?.trim()) return day.plan_date.trim()
  return isoFromPlanDate(columnDate, todayIsoDate())
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export type MealPlanClientContext = {
  clientId: string
  client: ClientRow
  progressLogs: ProgressLogRow[]
  detailedAssessment: PortalClientBundle['detailedAssessment']
}

type Props = {
  clientId: string
  clientEmail: string
  clientName: string
  clientContext: MealPlanClientContext
}

type ViewState = 'list' | 'builder'

const WEEK_DAYS = 7

function isPreparedDishFood(food: { category: string | null } | null | undefined): boolean {
  const cat = food?.category?.toLowerCase() ?? ''
  return cat.includes('prepared')
}

function dayWithDefaultMeals(dayNumber: number, planDate?: string): MealPlanDay {
  const d = emptyDay(dayNumber, planDate)
  return { ...d, meals: defaultMealsForDay(dayNumber - 1) }
}

export function NutritionistMealPlanTab({ clientId, clientEmail, clientName, clientContext }: Props) {
  const router = useRouter()
  const [view, setView] = useState<ViewState>('list')
  const [plans, setPlans] = useState<MealPlanListItem[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState('')

  const [activePlan, setActivePlan] = useState<MealPlan | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(false)

  const [newTitle, setNewTitle] = useState('')
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
        title: newTitle.trim() || `${clientName}'s Diet Plan`,
        numDays: WEEK_DAYS,
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
        otherPlans={plans.filter((p) => p.id !== activePlan.id)}
        onBack={() => {
          setView('list')
          void refreshList()
          router.refresh()
        }}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-emerald-900">
          <Plus size={16} className="text-emerald-600" />
          Create New Diet Plan
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-500">Plan title</label>
            <input
              type="text"
              placeholder={`${clientName}'s Diet Plan`}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-lg border border-emerald-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create Diet Plan
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Opens a 7-day horizontal calendar — add more weeks with the arrow navigation in the builder.
        </p>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-emerald-900">
          <BookOpen size={16} className="text-emerald-600" />
          Diet Plans for {clientName}
        </h3>

        {loadingList || loadingPlan ? (
          <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Loading…
          </div>
        ) : listError ? (
          <p className="text-sm text-red-600">{listError}</p>
        ) : plans.length === 0 ? (
          <p className="py-2 text-sm text-slate-500">No plans created yet. Create one above.</p>
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-slate-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{plan.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {plan.num_days} day{plan.num_days === 1 ? '' : 's'} in plan
                    {plan.status === 'published' && plan.published_at
                      ? ` · Published ${formatDate(plan.published_at)}`
                      : ` · Draft — ${formatDate(plan.created_at)}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      plan.status === 'published'
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {plan.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  <button
                    type="button"
                    onClick={() => openPlan(plan.id)}
                    className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    {plan.status === 'published' ? 'View' : 'Edit'}
                  </button>
                  {plan.status !== 'published' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(plan.id)}
                      className="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-red-600 transition hover:bg-red-100"
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

type SuccessMode = 'saved' | 'template' | 'published'

function PlanActionSuccess({
  mode,
  clientName,
  isPublished,
  publishing,
  onBack,
  onPublish,
  onContinue,
}: {
  mode: SuccessMode
  clientName: string
  isPublished: boolean
  publishing: boolean
  onBack: () => void
  onPublish: () => void
  onContinue: () => void
}) {
  const copy =
    mode === 'saved'
      ? {
          title: 'Diet plan saved',
          body: `Your changes are saved. ${clientName} won't see this plan until you publish it.`,
        }
      : mode === 'template'
        ? {
            title: 'Template saved',
            body: 'A reusable copy was added to this client\'s plan list. You can publish the current plan when ready.',
          }
        : {
            title: `Published to ${clientName}`,
            body: 'They\'ll get an email and can view the plan on their sessions dashboard.',
          }

  return (
    <div className="border-t border-emerald-200 bg-emerald-50 px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="text-emerald-600" size={28} />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">{copy.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy.body}</p>

        <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center">
          <button
            type="button"
            onClick={onBack}
            className="flex min-w-[160px] items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to plans
          </button>

          {mode !== 'published' && !isPublished && (
            <button
              type="button"
              onClick={onPublish}
              disabled={publishing}
              className="flex min-w-[160px] items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {publishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Publish plan
            </button>
          )}

          {mode !== 'published' && (
            <button
              type="button"
              onClick={onContinue}
              className="flex min-w-[160px] items-center justify-center gap-2 rounded-full border-2 border-emerald-600 bg-white px-6 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
            >
              Keep editing
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── CRM Plan Builder ─────────────────────────────────────────────────────────

function PlanBuilder({
  plan: initialPlan,
  clientName,
  clientEmail,
  otherPlans,
  onBack,
}: {
  plan: MealPlan
  clientName: string
  clientEmail: string
  otherPlans: MealPlanListItem[]
  onBack: () => void
}) {
  const parsedMeta = parseMealPlanMeta(initialPlan.nutritionist_notes)
  const [title, setTitle] = useState(initialPlan.title)
  const [targetCalories, setTargetCalories] = useState(parsedMeta.targetCalories ?? 1800)
  const [days, setDays] = useState<MealPlanDay[]>(() =>
    initialWeekDays(initialPlan.days.length > 0 ? initialPlan.days : [], WEEK_DAYS),
  )
  const [weekPage, setWeekPage] = useState(0)
  const [status, setStatus] = useState<'draft' | 'published'>(
    initialPlan.status === 'published' ? 'published' : 'draft',
  )
  const [templateId, setTemplateId] = useState('')
  const [copyingTemplate, setCopyingTemplate] = useState(false)
  const [dbTemplates, setDbTemplates] = useState<TemplateListItem[]>([])
  const [planEntries, setPlanEntries] = useState<MealPlanEntryRow[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [openCellKey, setOpenCellKey] = useState<string | null>(null)
  const seedingRef = useRef(false)
  const lastSeedKeyRef = useRef('')
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateTags, setTemplateTags] = useState<string[]>(['general'])
  const [dragSource, setDragSource] = useState<{ dayIdx: number; slot: keyof MealSlots; date: string } | null>(
    null,
  )
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)
  const [copyBusyKey, setCopyBusyKey] = useState<string | null>(null)
  const [copyToast, setCopyToast] = useState('')

  const refreshEntries = useCallback(async () => {
    const res = await listMealPlanEntries(initialPlan.id)
    if (res.ok) setPlanEntries(res.entries)
  }, [initialPlan.id])

  useEffect(() => {
    void (async () => {
      setLoadingEntries(true)
      await refreshEntries()
      setLoadingEntries(false)
    })()
  }, [refreshEntries])

  useEffect(() => {
    void listNutritionistTemplates().then((res) => {
      if (res.ok) setDbTemplates(res.templates)
    })
  }, [])

  const entriesByCell = useMemo(() => {
    const map = new Map<string, MealPlanEntryRow[]>()
    for (const e of planEntries) {
      const key = entryCellKey(e.entry_date, e.meal_slot)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    return map
  }, [planEntries])

  function setCellEntries(entryDate: string, mealSlot: string, cellEntries: MealPlanEntryRow[]) {
    const key = entryCellKey(entryDate, mealSlot)
    setPlanEntries((prev) => {
      const rest = prev.filter((e) => entryCellKey(e.entry_date, e.meal_slot) !== key)
      return [...rest, ...cellEntries]
    })
  }

  function dayTotalsForDate(entryDate: string | undefined, day?: MealPlanDay, dayIndex?: number) {
    if (!entryDate) return sumDayTotals([])
    const fromDb = sumDayTotals(planEntries.filter((e) => e.entry_date === entryDate))
    if (fromDb.kcal > 0) return fromDb
    if (day && !day.skipped && dayIndex != null) {
      return estimateDayTotalsFromMeals(day.meals, dayIndex)
    }
    return fromDb
  }

  const [saving, startSave] = useTransition()
  const [publishing, startPublish] = useTransition()
  const [templating, startTemplate] = useTransition()
  const [success, setSuccess] = useState<SuccessMode | null>(null)
  const [actionError, setActionError] = useState('')

  const isPublished = status === 'published'
  const planDates = datesForPlanDays(days, new Date(initialPlan.created_at))
  const dailyMacros = estimateDailyMacros(targetCalories)
  const activeDays = activePlanDayCount(days)

  const weekStart = weekPage * WEEK_DAYS
  const weekEnd = weekStart + WEEK_DAYS - 1
  const weekRangeLabel =
    planDates[weekStart] && planDates[Math.min(weekEnd, days.length - 1)]
      ? formatWeekRangeLabel(planDates[weekStart], planDates[Math.min(weekEnd, days.length - 1)])
      : '—'

  const canGoPrevWeek = weekPage > 0
  const canGoNextWeek = weekEnd < days.length - 1 || (!isPublished && days.length < 31)

  /** Every editable (non-skipped) day in the plan, for the copy-to-day pickers. */
  const allDayOptions = useMemo(() => {
    const out: { date: string; label: string }[] = []
    days.forEach((d, idx) => {
      if (!d || d.skipped) return
      const date = entryDateForDay(d, planDates[idx])
      const columnLabel = planDates[idx] ? formatGridDayColumn(planDates[idx]) : date
      out.push({ date, label: `Day ${idx + 1} · ${columnLabel}` })
    })
    return out
  }, [days, planDates])

  async function copyCellTo(
    sourceDayIdx: number,
    slot: keyof MealSlots,
    sourceDate: string,
    targetDate: string,
  ) {
    if (sourceDate === targetDate || isPublished) return
    const key = entryCellKey(targetDate, slot)
    setCopyBusyKey(key)
    setActionError('')
    const res = await copyMealPlanCell({
      mealPlanId: initialPlan.id,
      sourceDate,
      targetDate,
      mealSlot: slot,
    })
    setCopyBusyKey(null)
    if (!res.ok) {
      setActionError(res.error)
      return
    }
    setCellEntries(targetDate, slot, res.entries)
    const targetDayIdx = days.findIndex(
      (d, idx) => !!d && !d.skipped && entryDateForDay(d, planDates[idx]) === targetDate,
    )
    const sourceLabel = days[sourceDayIdx]?.meals[slot] ?? ''
    if (targetDayIdx >= 0) updateMealCell(targetDayIdx, slot, sourceLabel)
    const slotLabel = MEAL_SLOT_META.find((s) => s.key === slot)?.label ?? 'Meal'
    setCopyToast(`Copied ${slotLabel} to ${formatDate(targetDate)}`)
    window.setTimeout(() => setCopyToast(''), 2500)
  }

  function handleCellDragStart(dayIdx: number, slot: keyof MealSlots, date: string) {
    if (isPublished) return
    setDragSource({ dayIdx, slot, date })
  }

  function handleCellDragEnd() {
    setDragSource(null)
    setDragOverKey(null)
  }

  function handleCellDragOver(slot: keyof MealSlots, date: string) {
    if (!dragSource || isPublished || dragSource.slot !== slot) return
    setDragOverKey(entryCellKey(date, slot))
  }

  function handleCellDragLeave(slot: keyof MealSlots, date: string) {
    setDragOverKey((k) => (k === entryCellKey(date, slot) ? null : k))
  }

  function handleCellDrop(slot: keyof MealSlots, date: string) {
    setDragOverKey(null)
    if (!dragSource || dragSource.slot !== slot) return
    const src = dragSource
    setDragSource(null)
    void copyCellTo(src.dayIdx, src.slot, src.date, date)
  }

  useEffect(() => {
    if (loadingEntries || isPublished || seedingRef.current) return

    const missing: { entryDate: string; mealSlot: keyof MealSlots; label: string; dayIndex: number }[] = []
    for (let abs = 0; abs < days.length; abs++) {
      const day = days[abs]
      if (!day || day.skipped) continue
      const entryDate = entryDateForDay(day, planDates[abs])
      for (const slot of MEAL_SLOT_META) {
        const key = entryCellKey(entryDate, slot.key)
        const cellEntries = entriesByCell.get(key) ?? []
        const hasPrepared = cellEntries.some((e) => isPreparedDishFood(e.foods))
        if (hasPrepared) continue
        missing.push({
          entryDate,
          mealSlot: slot.key,
          label: day.meals[slot.key]?.trim() || defaultMealLabelForSlot(slot.key, abs),
          dayIndex: abs,
        })
      }
    }

    if (missing.length === 0) return

    const seedKey = missing.map((m) => `${m.entryDate}|${m.mealSlot}`).sort().join(';')
    if (lastSeedKeyRef.current === seedKey) return
    lastSeedKeyRef.current = seedKey

    seedingRef.current = true
    void (async () => {
      try {
        const res = await seedDefaultMealPlanEntries({ mealPlanId: initialPlan.id, cells: missing })
        if (res.ok && res.added > 0) {
          lastSeedKeyRef.current = ''
          await refreshEntries()
        }
      } finally {
        seedingRef.current = false
      }
    })()
  }, [loadingEntries, isPublished, days, planDates, planEntries, entriesByCell, initialPlan.id, refreshEntries])

  function buildMetaNote() {
    return serializeMealPlanMeta({ targetCalories, note: parsedMeta.note })
  }

  function ensureDaysThrough(endIndex: number) {
    setDays((prev) => {
      if (prev.length > endIndex) return prev
      const next = [...prev]
      let iso =
        next[next.length - 1]?.plan_date != null
          ? nextIsoDate(next[next.length - 1].plan_date!)
          : todayIsoDate()
      while (next.length <= endIndex && next.length < 31) {
        next.push(dayWithDefaultMeals(next.length + 1, iso))
        iso = nextIsoDate(iso)
      }
      return renumberPlanDays(next)
    })
  }

  function goNextWeek() {
    const nextStart = (weekPage + 1) * WEEK_DAYS
    if (nextStart >= days.length) {
      if (isPublished || days.length >= 31) return
      setDays((prev) => {
        const next = [...prev]
        let iso =
          next[next.length - 1]?.plan_date != null
            ? nextIsoDate(next[next.length - 1].plan_date!)
            : todayIsoDate()
        while (next.length < nextStart + WEEK_DAYS && next.length < 31) {
          next.push(dayWithDefaultMeals(next.length + 1, iso))
          iso = nextIsoDate(iso)
        }
        return renumberPlanDays(next)
      })
    }
    setWeekPage((p) => p + 1)
  }

  function goPrevWeek() {
    if (weekPage > 0) setWeekPage((p) => p - 1)
  }

  function absoluteDayIndex(localIdx: number) {
    return weekStart + localIdx
  }

  function handleSave() {
    setActionError('')
    setSuccess(null)
    startSave(async () => {
      const res = await updateMealPlan({
        planId: initialPlan.id,
        title,
        nutritionist_notes: buildMetaNote() ?? undefined,
        days,
      })
      if (!res.ok) {
        setActionError(res.error)
        return
      }
      setSuccess('saved')
    })
  }

  function handlePublish() {
    setActionError('')
    setSuccess(null)
    startPublish(async () => {
      const saveRes = await updateMealPlan({
        planId: initialPlan.id,
        title,
        nutritionist_notes: buildMetaNote() ?? undefined,
        days,
      })
      if (!saveRes.ok) {
        setActionError(saveRes.error)
        return
      }
      const pubRes = await publishMealPlan({ planId: initialPlan.id, clientName, clientEmail })
      if (!pubRes.ok) {
        setActionError(pubRes.error)
        return
      }
      setStatus('published')
      setSuccess('published')
    })
  }

  function handleCreateTemplate() {
    setActionError('')
    setSuccess(null)
    setTemplateName(`${title} Template`)
    setTemplateTags(['general'])
    setShowSaveTemplate(true)
  }

  function submitSaveTemplate() {
    setActionError('')
    startTemplate(async () => {
      const res = await saveMealPlanAsTemplate({
        mealPlanId: initialPlan.id,
        name: templateName,
        conditionTags: templateTags,
        targetKcal: targetCalories,
      })
      if (!res.ok) {
        setActionError(res.error)
        return
      }
      setShowSaveTemplate(false)
      setSuccess('template')
      const list = await listNutritionistTemplates()
      if (list.ok) setDbTemplates(list.templates)
    })
  }

  async function applySelectedTemplate() {
    if (!templateId) {
      setActionError('Choose a template first.')
      return
    }
    const startDate = isoFromPlanDate(planDates[weekStart], todayIsoDate())
    setActionError('')
    setCopyingTemplate(true)
    const res = await applyTemplateToMealPlan({
      templateId,
      mealPlanId: initialPlan.id,
      startDate,
      scaleFactor: 1,
    })
    setCopyingTemplate(false)
    if (!res.ok) {
      setActionError(res.error)
      return
    }
    await refreshEntries()
  }

  function updateMealCell(dayIdx: number, slot: keyof MealPlanDay['meals'], value: string) {
    setDays((prev) =>
      prev.map((d, i) => (i === dayIdx ? { ...d, meals: { ...d.meals, [slot]: value } } : d)),
    )
  }

  function clearMealRow(slot: keyof MealPlanDay['meals']) {
    if (!confirm('Clear this meal row for the visible week?')) return
    setDays((prev) =>
      prev.map((d, i) =>
        i >= weekStart && i <= weekEnd && !d.skipped
          ? { ...d, meals: { ...d.meals, [slot]: '' } }
          : d,
      ),
    )
  }

  function toggleSkipDay(dayIdx: number) {
    setDays((prev) =>
      prev.map((d, i) => {
        if (i !== dayIdx) return d
        const skipped = !d.skipped
        return {
          ...d,
          skipped,
          ...(skipped
            ? {
                meals: {
                  early_morning: '',
                  breakfast: '',
                  mid_morning: '',
                  lunch: '',
                  evening_snack: '',
                  dinner: '',
                  bedtime: '',
                },
              }
            : {}),
        }
      }),
    )
  }

  function updateDayDate(dayIdx: number, plan_date: string) {
    setDays((prev) => prev.map((d, i) => (i === dayIdx ? { ...d, plan_date } : d)))
  }

  async function copyFromTemplate() {
    if (!templateId) {
      setActionError('Choose a template plan first.')
      return
    }
    setActionError('')
    setCopyingTemplate(true)
    const res = await getMealPlan(templateId)
    setCopyingTemplate(false)
    if (!res.ok) {
      setActionError(res.error)
      return
    }
    const source = res.plan.days
    setDays((prev) => {
      const next = [...prev]
      for (let i = 0; i < WEEK_DAYS; i++) {
        const abs = weekStart + i
        while (next.length <= abs) {
          const last = next[next.length - 1]
          const iso = last?.plan_date ? nextIsoDate(last.plan_date) : todayIsoDate()
          next.push(dayWithDefaultMeals(next.length + 1, iso))
        }
        const src = source[i]
        if (!src) continue
        next[abs] = {
          ...next[abs],
          meals: { ...src.meals },
          skipped: src.skipped,
          water_target: src.water_target,
          day_notes: src.day_notes,
        }
      }
      return renumberPlanDays(next)
    })
  }

  function copyPreviousWeek() {
    if (weekPage === 0) {
      setActionError('No previous week — go back one week first.')
      return
    }
    setActionError('')
    const prevStart = weekStart - WEEK_DAYS
    setDays((prev) => {
      const next = [...prev]
      for (let i = 0; i < WEEK_DAYS; i++) {
        const from = prevStart + i
        const to = weekStart + i
        if (!next[from] || !next[to]) continue
        next[to] = {
          ...next[to],
          meals: { ...next[from].meals },
          skipped: next[from].skipped,
        }
      }
      return next
    })
  }

  const visibleColumns = Array.from({ length: WEEK_DAYS }, (_, localIdx) => {
    const abs = weekStart + localIdx
    return days[abs] ?? null
  })

  return (
    <div className="overflow-hidden rounded-none border-0 border-t border-emerald-200 bg-white shadow-sm md:rounded-xl md:border">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 bg-slate-50 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-emerald-700"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          {!isPublished ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="min-w-[180px] flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          ) : (
            <p className="truncate text-sm font-semibold text-slate-800">{title}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-emerald-800">Calories</span>
            <input
              type="number"
              min={800}
              max={5000}
              step={50}
              value={targetCalories}
              onChange={(e) => setTargetCalories(Number(e.target.value) || 1800)}
              disabled={isPublished}
              className="w-16 rounded-lg border border-emerald-200 bg-white px-2 py-1 text-sm font-bold text-slate-800 disabled:opacity-60"
            />
          </label>
          {saving && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Loader2 size={11} className="animate-spin" /> Saving…
            </span>
          )}
          {isPublished && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              Published
            </span>
          )}
        </div>
      </div>

      {/* Horizontal week bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-emerald-200 bg-emerald-50/50 px-4 py-3">
        <div className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2 py-1">
          <button
            type="button"
            onClick={goPrevWeek}
            disabled={!canGoPrevWeek}
            className="rounded p-1 text-emerald-700 hover:bg-emerald-50 disabled:opacity-30"
            aria-label="Previous week"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[88px] text-center text-xs font-bold text-emerald-900">{weekRangeLabel}</span>
          <button
            type="button"
            onClick={goNextWeek}
            disabled={!canGoNextWeek}
            className="rounded p-1 text-emerald-700 hover:bg-emerald-50 disabled:opacity-30"
            aria-label="Next week"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {!isPublished && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-xs text-slate-700"
            >
              <option value="">Choose template…</option>
              {dbTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void applySelectedTemplate()}
              disabled={copyingTemplate || !templateId}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {copyingTemplate ? 'Applying…' : 'Apply template'}
            </button>
            <a
              href="/nutritionist/templates"
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
            >
              <LayoutTemplate size={12} />
              All templates
            </a>
            <button
              type="button"
              onClick={copyPreviousWeek}
              disabled={weekPage === 0}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40"
            >
              Copy previous week
            </button>
          </div>
        )}

        <span className="ml-auto text-[10px] text-slate-500">
          Week {weekPage + 1} · scroll → to see all 7 days
          {!isPublished ? ' · drag a meal cell onto another day to copy it' : ''}
        </span>
      </div>

      {loadingEntries ? (
        <div className="flex items-center gap-2 border-b border-emerald-100 px-4 py-2 text-xs text-slate-500">
          <Loader2 size={14} className="animate-spin" /> Loading meal foods…
        </div>
      ) : null}

      {/* Days as columns (horizontal calendar) */}
      <div className="overflow-x-auto overscroll-x-contain">
        <div
          className="grid min-w-[1080px] border-b border-emerald-200"
          style={{ gridTemplateColumns: `132px repeat(${WEEK_DAYS}, minmax(128px, 1fr))` }}
        >
          {/* Corner */}
          <div className="sticky left-0 z-20 border-r border-emerald-200 bg-emerald-50/80 px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
            Meal time
          </div>

          {/* Day headers — one column each, left → right */}
          {visibleColumns.map((d, localIdx) => {
            const abs = absoluteDayIndex(localIdx)
            const date = planDates[abs]
            return (
              <div
                key={`hdr-${abs}`}
                className={`border-r border-emerald-100 p-2 last:border-r-0 ${
                  d?.skipped ? 'bg-slate-50' : 'bg-white'
                }`}
              >
                {date ? (
                  <p className="text-[10px] font-bold leading-tight text-emerald-900">
                    {formatGridDayColumn(date)}
                  </p>
                ) : (
                  <p className="text-[10px] font-bold text-emerald-900">Day {abs + 1}</p>
                )}
                {!isPublished && d && (
                  <input
                    type="date"
                    value={d.plan_date ?? ''}
                    onChange={(e) => updateDayDate(abs, e.target.value)}
                    className="mt-1 w-full rounded border border-emerald-200 bg-white px-1 py-0.5 text-[9px] focus:border-emerald-400 focus:outline-none"
                  />
                )}
                {!isPublished && d && (
                  <button
                    type="button"
                    onClick={() => toggleSkipDay(abs)}
                    className={`mt-1 w-full rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      d.skipped ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {d.skipped ? 'Enable' : 'Skip'}
                  </button>
                )}
                {d?.skipped ? (
                  <div className="mt-2 rounded border border-dashed border-slate-300 bg-slate-100 p-2 text-center text-[9px] text-slate-500">
                    Day off
                  </div>
                ) : (
                  <div className="mt-2 rounded border border-rose-200 bg-rose-50/90 p-2">
                    {(() => {
                      const dateIso = entryDateForDay(d, date)
                      const eaten = dayTotalsForDate(dateIso, d, abs)
                      return (
                        <>
                          <p className="font-bold text-rose-900">
                            {Math.round(eaten.kcal).toLocaleString('en-IN')} /{' '}
                            {targetCalories.toLocaleString('en-IN')} Kcal
                          </p>
                          <p className="mt-1 text-[9px] text-slate-600">
                            C {Math.round(eaten.carbs)} · F {Math.round(eaten.fat)} · P{' '}
                            {Math.round(eaten.protein)}
                          </p>
                          <p className="mt-1 text-[9px] text-slate-500">
                            Target C {dailyMacros.carbs} · F {dailyMacros.fat} · P{' '}
                            {dailyMacros.protein}
                          </p>
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            )
          })}

          {/* Meal rows — label in col 1, meals across days */}
          {MEAL_SLOT_META.map((slot) => (
            <Fragment key={slot.key}>
              <div
                key={`${slot.key}-label`}
                className="sticky left-0 z-20 flex items-center gap-1 border-r border-t border-emerald-200 bg-white px-2 py-2"
              >
                {!isPublished && (
                  <button
                    type="button"
                    onClick={() => clearMealRow(slot.key)}
                    className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    title={`Clear ${slot.label}`}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                <div className="min-w-0">
                  <p className="text-[10px] font-bold leading-tight text-emerald-900">{slot.label}</p>
                  <p className="text-[9px] text-slate-400">{slot.time}</p>
                </div>
              </div>
              {visibleColumns.map((day, localIdx) => {
                const abs = absoluteDayIndex(localIdx)
                const columnDate = planDates[abs]
                const entryDateIso = entryDateForDay(day, columnDate)
                return (
                  <div
                    key={`${slot.key}-${abs}`}
                    className={`border-r border-t border-emerald-100 p-1.5 last:border-r-0 ${
                      day?.skipped ? 'bg-slate-50' : 'bg-white'
                    }`}
                  >
                    {!day || day.skipped ? (
                      <div className="flex min-h-[48px] items-center justify-center rounded border border-dashed border-slate-200 bg-slate-100 text-[10px] text-slate-400">
                        —
                      </div>
                    ) : (
                      <MealPlanFoodCell
                        mealPlanId={initialPlan.id}
                        entryDate={entryDateIso}
                        mealSlot={slot.key}
                        slotLabel={slot.label}
                        displayLabel={
                          day.meals[slot.key]?.trim() || defaultMealLabelForSlot(slot.key, abs)
                        }
                        entries={entriesByCell.get(entryCellKey(entryDateIso, slot.key)) ?? []}
                        disabled={isPublished}
                        isOpen={openCellKey === entryCellKey(entryDateIso, slot.key)}
                        onOpenChange={(open) =>
                          setOpenCellKey(open ? entryCellKey(entryDateIso, slot.key) : null)
                        }
                        onEntriesChange={(cellEntries) =>
                          setCellEntries(entryDateIso, slot.key, cellEntries)
                        }
                        onLegacyChange={(text) => updateMealCell(abs, slot.key, text)}
                        copyTargets={allDayOptions.filter((o) => o.date !== entryDateIso)}
                        onCopyTo={(targetDate) => void copyCellTo(abs, slot.key, entryDateIso, targetDate)}
                        copying={copyBusyKey === entryCellKey(entryDateIso, slot.key)}
                        draggable={!isPublished}
                        isDragOver={dragOverKey === entryCellKey(entryDateIso, slot.key)}
                        onDragStartCell={() => handleCellDragStart(abs, slot.key, entryDateIso)}
                        onDragEndCell={handleCellDragEnd}
                        onDragOverCell={() => handleCellDragOver(slot.key, entryDateIso)}
                        onDragLeaveCell={() => handleCellDragLeave(slot.key, entryDateIso)}
                        onDropCell={() => handleCellDrop(slot.key, entryDateIso)}
                      />
                    )}
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {!isPublished && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-emerald-100 bg-emerald-50/40 px-4 py-2 text-[10px] text-slate-600">
          <span>
            Week {weekPage + 1} · <span className="font-semibold text-emerald-800">{activeDays}</span> active
            days in plan
          </span>
          <button
            type="button"
            onClick={() => {
              ensureDaysThrough(days.length + WEEK_DAYS - 1)
              setWeekPage((p) => p + 1)
            }}
            disabled={days.length >= 31}
            className="font-semibold text-emerald-700 hover:underline disabled:opacity-40"
          >
            + Add another week
          </button>
        </div>
      )}

      {copyToast && !actionError && (
        <div className="flex items-center gap-2 border-t border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
          <Copy size={14} />
          {copyToast}
        </div>
      )}

      {actionError && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{actionError}</div>
      )}

      {showSaveTemplate && !isPublished ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => setShowSaveTemplate(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Save as template</h3>
            <p className="mt-1 text-sm text-slate-600">Saves current food grid to your template library.</p>
            <div className="mt-4 space-y-4">
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name"
                className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_CONDITION_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setTemplateTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                      )
                    }
                    className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                      templateTags.includes(tag)
                        ? 'bg-emerald-600 text-white'
                        : 'border border-emerald-200 text-emerald-800'
                    }`}
                  >
                    {tag.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaveTemplate(false)}
                  className="flex-1 rounded-full border border-slate-300 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={templating}
                  onClick={submitSaveTemplate}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {templating ? <Loader2 size={14} className="animate-spin" /> : null}
                  Save template
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {success ? (
        <PlanActionSuccess
          mode={success}
          clientName={clientName}
          isPublished={isPublished}
          publishing={publishing}
          onBack={onBack}
          onPublish={handlePublish}
          onContinue={() => setSuccess(null)}
        />
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-4 border-t border-emerald-200 bg-slate-50 px-4 py-5">
          {!isPublished ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || publishing || templating}
                className="flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Diet Plan
              </button>
              <button
                type="button"
                onClick={handleCreateTemplate}
                disabled={templating || saving || publishing}
                className="flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {templating ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
                Save as Template
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing || saving || templating}
                className="flex min-w-[160px] items-center justify-center gap-2 rounded-full border-2 border-emerald-600 bg-white px-6 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
              >
                {publishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Publish to Client
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onBack}
                className="flex min-w-[160px] items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-8 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Back to plans
              </button>
              <button
                type="button"
                onClick={handleCreateTemplate}
                disabled={templating}
                className="flex min-w-[160px] items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {templating ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
                Save as Template
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
