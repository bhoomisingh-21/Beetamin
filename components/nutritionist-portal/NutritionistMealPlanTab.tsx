'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
} from 'lucide-react'
import {
  createMealPlan,
  deleteMealPlan,
  duplicateMealPlan,
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
import type { MealPlan, MealPlanDay, MealPlanListItem } from '@/lib/meal-plan-types'
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
        next.push(emptyDay(next.length + 1, iso))
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
          next.push(emptyDay(next.length + 1, iso))
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
    startTemplate(async () => {
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
      const res = await duplicateMealPlan({ planId: initialPlan.id, title })
      if (!res.ok) {
        setActionError(res.error)
        return
      }
      setSuccess('template')
    })
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
          next.push(emptyDay(next.length + 1, iso))
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
    <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
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

      {/* Horizontal calendar grid */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-emerald-200 bg-white">
              {/* Sticky left: week nav + copy actions */}
              <th className="sticky left-0 z-30 w-[148px] min-w-[148px] border-r border-emerald-200 bg-white p-2 align-top">
                <div className="flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/60 px-1 py-1.5">
                  <button
                    type="button"
                    onClick={goPrevWeek}
                    disabled={!canGoPrevWeek}
                    className="rounded p-1 text-emerald-700 hover:bg-white disabled:opacity-30"
                    aria-label="Previous week"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="min-w-[72px] text-center text-[10px] font-bold text-emerald-900">
                    {weekRangeLabel}
                  </span>
                  <button
                    type="button"
                    onClick={goNextWeek}
                    disabled={!canGoNextWeek}
                    className="rounded p-1 text-emerald-700 hover:bg-white disabled:opacity-30"
                    aria-label="Next week"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                {!isPublished && (
                  <div className="mt-2 space-y-1.5">
                    <div className="space-y-1">
                      <select
                        value={templateId}
                        onChange={(e) => setTemplateId(e.target.value)}
                        className="w-full rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[10px] text-slate-700"
                      >
                        <option value="">Template…</option>
                        {otherPlans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void copyFromTemplate()}
                        disabled={copyingTemplate || !templateId}
                        className="w-full rounded-lg bg-emerald-600 px-2 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {copyingTemplate ? 'Copying…' : 'Copy from template'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={copyPreviousWeek}
                      disabled={weekPage === 0}
                      className="w-full rounded-lg bg-emerald-600 px-2 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-500 disabled:opacity-40"
                    >
                      Copy previous week
                    </button>
                  </div>
                )}
              </th>

              {/* Day column headers */}
              {visibleColumns.map((d, localIdx) => {
                const abs = absoluteDayIndex(localIdx)
                const date = planDates[abs]
                return (
                  <th
                    key={`hdr-${abs}`}
                    className={`min-w-[118px] border-r border-emerald-100 p-2 text-left align-top last:border-r-0 ${
                      d?.skipped ? 'bg-slate-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
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
                      </div>
                    </div>

                    {!isPublished && d && (
                      <button
                        type="button"
                        onClick={() => toggleSkipDay(abs)}
                        className={`mt-1.5 w-full rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          d.skipped
                            ? 'bg-slate-200 text-slate-600'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {d.skipped ? 'Enable day' : 'Skip day'}
                      </button>
                    )}

                    {d?.skipped ? (
                      <div className="mt-2 rounded border border-dashed border-slate-300 bg-slate-100 p-2 text-center">
                        <p className="text-[9px] font-semibold text-slate-500">Day off</p>
                      </div>
                    ) : (
                      <div className="mt-2 rounded border border-rose-200 bg-rose-50/90 p-2">
                        <p className="font-bold text-rose-900">
                          {targetCalories.toLocaleString('en-IN')} Kcal
                        </p>
                        <p className="mt-1 text-[9px] leading-relaxed text-slate-600">
                          Carbs: {dailyMacros.carbs}gm | Fat: {dailyMacros.fat}gm
                        </p>
                        <p className="text-[9px] leading-relaxed text-slate-600">
                          Protein: {dailyMacros.protein}gm | Fiber: {dailyMacros.fiber}gm
                        </p>
                        <div className="mt-1.5 rounded border border-rose-100 bg-white/80 px-1.5 py-1">
                          <p className="text-[9px] text-slate-500">Eaten: 0 Kcal</p>
                        </div>
                      </div>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {MEAL_SLOT_META.map((slot) => (
              <tr key={slot.key} className="border-b border-emerald-100">
                <td className="sticky left-0 z-20 w-[148px] min-w-[148px] border-r border-emerald-200 bg-white p-2 align-middle">
                  <div className="flex items-center gap-1">
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
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold leading-tight text-emerald-900">{slot.label}</p>
                      <p className="text-[9px] text-slate-400">{slot.time}</p>
                    </div>
                    {!isPublished && (
                      <button
                        type="button"
                        className="shrink-0 rounded p-0.5 text-emerald-600 hover:bg-emerald-50"
                        title="Add note in cell"
                        aria-hidden
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                </td>
                {visibleColumns.map((day, localIdx) => {
                  const abs = absoluteDayIndex(localIdx)
                  return (
                    <td
                      key={`${slot.key}-${abs}`}
                      className={`min-w-[118px] border-r border-emerald-100 p-1.5 last:border-r-0 ${
                        day?.skipped ? 'bg-slate-50' : ''
                      }`}
                    >
                      {!day || day.skipped ? (
                        <div className="flex min-h-[48px] items-center justify-center rounded border border-dashed border-slate-200 bg-slate-100 text-[10px] text-slate-400">
                          —
                        </div>
                      ) : (
                        <MealCell
                          label={slot.label}
                          value={day.meals[slot.key]}
                          disabled={isPublished}
                          onChange={(v) => updateMealCell(abs, slot.key, v)}
                        />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
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

      {actionError && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{actionError}</div>
      )}

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
                Create Template
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
                Create Template
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MealCell({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string
  value: string
  disabled: boolean
  onChange: (v: string) => void
}) {
  const [hover, setHover] = useState(false)
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const display = value.trim() || '—'
  const hasContent = value.trim().length > 0

  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {editing && !disabled ? (
        <textarea
          ref={inputRef}
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
          placeholder={`${label}…`}
          className="min-h-[52px] w-full resize-none rounded border border-emerald-400 bg-white px-2 py-1.5 text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setEditing(true)}
          className={`min-h-[52px] w-full rounded border px-2 py-1.5 text-left text-[11px] leading-snug transition ${
            hasContent
              ? 'border-emerald-300 bg-white text-slate-800 hover:border-emerald-400'
              : 'border-emerald-200 bg-slate-50 text-slate-400 hover:border-emerald-300'
          } disabled:cursor-default`}
        >
          <span className="line-clamp-3">{display}</span>
        </button>
      )}

      {hover && hasContent && !editing && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 max-w-[200px] -translate-x-1/2 rounded bg-slate-800 px-2.5 py-1.5 text-[10px] leading-relaxed text-white shadow-lg">
          {value}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  )
}
