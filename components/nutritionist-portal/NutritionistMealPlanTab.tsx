'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Copy,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
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
  formatGridDayHeader,
  formatHeight,
  parseMealPlanMeta,
  serializeMealPlanMeta,
  shortClientId,
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

function extractClientProfile(ctx: MealPlanClientContext) {
  const { client, progressLogs, detailedAssessment } = ctx
  const latestWeight = progressLogs.find((l) => l.weight_kg != null)?.weight_kg
  const height =
    client.height_cm ?? progressLogs.find((l) => l.height_cm != null)?.height_cm ?? null

  const meta =
    client.assessment_meta && typeof client.assessment_meta === 'object' && !Array.isArray(client.assessment_meta)
      ? (client.assessment_meta as Record<string, unknown>)
      : null
  const result =
    client.assessment_result && typeof client.assessment_result === 'object' && !Array.isArray(client.assessment_result)
      ? (client.assessment_result as Record<string, unknown>)
      : null

  const activity =
    (typeof meta?.activity === 'string' && meta.activity) ||
    (typeof meta?.activityLevel === 'string' && meta.activityLevel) ||
    (typeof result?.activityLevel === 'string' && result.activityLevel) ||
    '—'

  const diet =
    detailedAssessment?.diet_type ||
    (typeof result?.diet === 'string' && result.diet) ||
    (typeof result?.dietSummary === 'string' && result.dietSummary) ||
    '—'

  return {
    id: shortClientId(client.id),
    weight: latestWeight != null ? `${Number(latestWeight).toFixed(0)} kg` : '—',
    height: formatHeight(height),
    activity,
    goal: client.assessment_goal || '—',
    foodPreference: diet,
    country: 'India',
    community: '—',
    allergy: 'No Allergy',
    diseases: 'No Diseases',
  }
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

  const profile = extractClientProfile(clientContext)

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
        numDays: 1,
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
        profile={profile}
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
      <div className="rounded-xl border border-sky-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-sky-900">
          <Plus size={16} className="text-sky-600" />
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
              className="w-full rounded-lg border border-sky-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-sky-700 disabled:opacity-50"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create Diet Plan
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Starts with one day — add or skip days in the builder. Plan only the days you need.
        </p>
      </div>

      <div className="rounded-xl border border-sky-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-sky-900">
          <BookOpen size={16} className="text-sky-600" />
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
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-100 bg-slate-50 px-4 py-3"
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
                    className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
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

// ─── CRM Plan Builder ─────────────────────────────────────────────────────────

type ClientProfile = ReturnType<typeof extractClientProfile>

function PlanBuilder({
  plan: initialPlan,
  clientName,
  clientEmail,
  profile,
  onBack,
}: {
  plan: MealPlan
  clientName: string
  clientEmail: string
  profile: ClientProfile
  onBack: () => void
}) {
  const parsedMeta = parseMealPlanMeta(initialPlan.nutritionist_notes)
  const [title, setTitle] = useState(initialPlan.title)
  const [targetCalories, setTargetCalories] = useState(parsedMeta.targetCalories ?? 1800)
  const [days, setDays] = useState<MealPlanDay[]>(() => {
    if (initialPlan.days.length > 0) return initialPlan.days
    return [emptyDay(1, todayIsoDate())]
  })
  const [status, setStatus] = useState<'draft' | 'published'>(
    initialPlan.status === 'published' ? 'published' : 'draft',
  )

  const [saving, startSave] = useTransition()
  const [publishing, startPublish] = useTransition()
  const [templating, startTemplate] = useTransition()
  const [saveMsg, setSaveMsg] = useState('')
  const [actionError, setActionError] = useState('')

  const isPublished = status === 'published'
  const planDates = datesForPlanDays(days, new Date(initialPlan.created_at))
  const dailyMacros = estimateDailyMacros(targetCalories)
  const activeDays = activePlanDayCount(days)

  function buildMetaNote() {
    return serializeMealPlanMeta({ targetCalories, note: parsedMeta.note })
  }

  function handleSave() {
    setActionError('')
    startSave(async () => {
      const res = await updateMealPlan({
        planId: initialPlan.id,
        title,
        nutritionist_notes: buildMetaNote() ?? undefined,
        days,
      })
      setSaveMsg(res.ok ? 'Saved' : res.error)
      setTimeout(() => setSaveMsg(''), 2500)
      if (!res.ok) setActionError(res.error)
    })
  }

  function handlePublish() {
    setActionError('')
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
      setSaveMsg('Published to client')
      setTimeout(() => setSaveMsg(''), 2500)
    })
  }

  function handleCreateTemplate() {
    setActionError('')
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
      setSaveMsg('Template created')
      setTimeout(() => setSaveMsg(''), 2500)
    })
  }

  function updateMealCell(dayIdx: number, slot: keyof MealPlanDay['meals'], value: string) {
    const updated = days.map((d, i) =>
      i === dayIdx ? { ...d, meals: { ...d.meals, [slot]: value } } : d,
    )
    setDays(updated)
  }

  function clearMealRow(slot: keyof MealPlanDay['meals']) {
    if (!confirm('Clear this meal row across all active days?')) return
    const updated = days.map((d) =>
      d.skipped ? d : { ...d, meals: { ...d.meals, [slot]: '' } },
    )
    setDays(updated)
  }

  function addDay() {
    if (days.length >= 31) return
    const last = days[days.length - 1]
    const nextDate = last?.plan_date ? nextIsoDate(last.plan_date) : todayIsoDate()
    setDays(renumberPlanDays([...days, emptyDay(days.length + 1, nextDate)]))
  }

  function removeDay(dayIdx: number) {
    if (days.length <= 1) return
    if (!confirm('Remove this day from the plan?')) return
    setDays(renumberPlanDays(days.filter((_, i) => i !== dayIdx)))
  }

  function toggleSkipDay(dayIdx: number) {
    setDays(
      days.map((d, i) => {
        if (i !== dayIdx) return d
        const skipped = !d.skipped
        return {
          ...d,
          skipped,
          ...(skipped ? { meals: { early_morning: '', breakfast: '', mid_morning: '', lunch: '', evening_snack: '', dinner: '', bedtime: '' } } : {}),
        }
      }),
    )
  }

  function updateDayDate(dayIdx: number, plan_date: string) {
    setDays(days.map((d, i) => (i === dayIdx ? { ...d, plan_date } : d)))
  }

  return (
    <div className="overflow-hidden rounded-xl border border-sky-200 bg-white shadow-sm">
      {/* Back + status + title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 bg-slate-50 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-sky-700"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          {!isPublished ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="min-w-[180px] flex-1 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          ) : (
            <p className="truncate text-sm font-semibold text-slate-800">{title}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {saving && (
            <span className="flex items-center gap-1 text-slate-500">
              <Loader2 size={11} className="animate-spin" /> Saving…
            </span>
          )}
          {saveMsg === 'Saved' && (
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 size={11} /> Saved
            </span>
          )}
          {saveMsg === 'Published to client' && (
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 size={11} /> Published
            </span>
          )}
          {saveMsg === 'Template created' && (
            <span className="flex items-center gap-1 text-sky-600">
              <CheckCircle2 size={11} /> Template saved
            </span>
          )}
          {isPublished && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-bold text-emerald-700">
              Published
            </span>
          )}
        </div>
      </div>

      {/* Client info bar */}
      <div className="border-b border-sky-200 bg-[#e8f2fa] px-3 py-3">
        <div className="flex flex-wrap items-stretch gap-x-5 gap-y-3 text-[11px] sm:text-xs">
          <InfoField label="ID" value={profile.id} />
          <InfoField label="Weight" value={profile.weight} />
          <InfoField label="Height" value={profile.height} />
          <InfoField label="Activity Level" value={profile.activity} wide />
          <InfoField label="Goal" value={profile.goal} wide />
          <InfoField label="Food Preference" value={profile.foodPreference} wide />
          <InfoField label="Country" value={profile.country} />
          <InfoField label="Community" value={profile.community} />
          <InfoField label="Allergy" value={profile.allergy} />
          <InfoField label="Diseases" value={profile.diseases} />
          <div className="flex min-w-[120px] flex-col gap-0.5">
            <span className="font-semibold uppercase tracking-wide text-sky-800">Target Calories</span>
            <input
              type="number"
              min={800}
              max={5000}
              step={50}
              value={targetCalories}
              onChange={(e) => setTargetCalories(Number(e.target.value) || 1800)}
              disabled={isPublished}
              className="w-20 rounded border border-sky-300 bg-white px-2 py-0.5 text-sm font-bold text-slate-800 focus:border-sky-500 focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {/* Day controls */}
      {!isPublished && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 bg-white px-4 py-2.5">
          <p className="text-xs text-slate-600">
            <span className="font-semibold text-sky-800">{activeDays}</span> active day
            {activeDays === 1 ? '' : 's'}
            {days.length > activeDays && (
              <span className="text-slate-400"> · {days.length - activeDays} skipped</span>
            )}
          </p>
          <button
            type="button"
            onClick={addDay}
            disabled={days.length >= 31}
            className="flex items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100 disabled:opacity-40"
          >
            <Plus size={13} />
            Add Day
          </button>
        </div>
      )}

      {/* Weekly grid */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-sky-200 bg-slate-50">
              <th className="w-[100px] border-r border-sky-100 p-2 text-left text-[10px] font-semibold text-slate-500">
                Meal slot
              </th>
              {days.map((d, idx) => (
                <th
                  key={`${d.day}-${idx}`}
                  className={`min-w-[130px] border-r border-sky-100 p-2 text-left align-top last:border-r-0 ${
                    d.skipped ? 'bg-slate-100' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      {!isPublished ? (
                        <input
                          type="date"
                          value={d.plan_date ?? ''}
                          onChange={(e) => updateDayDate(idx, e.target.value)}
                          className="w-full rounded border border-sky-200 bg-white px-1 py-0.5 text-[10px] font-bold text-sky-900 focus:border-sky-400 focus:outline-none"
                        />
                      ) : (
                        <p className="font-bold text-sky-900">
                          {planDates[idx] ? formatGridDayHeader(planDates[idx]) : `Day ${d.day}`}
                        </p>
                      )}
                      {!isPublished && planDates[idx] && (
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {formatGridDayHeader(planDates[idx])}
                        </p>
                      )}
                    </div>
                    {!isPublished && (
                      <div className="flex shrink-0 flex-col gap-0.5">
                        {days.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDay(idx)}
                            className="rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                            title="Remove day"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {!isPublished && (
                    <button
                      type="button"
                      onClick={() => toggleSkipDay(idx)}
                      className={`mt-1.5 w-full rounded px-2 py-0.5 text-[10px] font-bold transition ${
                        d.skipped
                          ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          : 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                      }`}
                    >
                      {d.skipped ? 'Skipped — click to enable' : 'Skip this day'}
                    </button>
                  )}

                  {d.skipped ? (
                    <div className="mt-2 rounded border border-dashed border-slate-300 bg-slate-100 p-3 text-center">
                      <p className="text-[10px] font-semibold text-slate-500">Day off</p>
                      <p className="mt-0.5 text-[9px] text-slate-400">No meals planned</p>
                    </div>
                  ) : (
                    <div className="mt-2 rounded border border-sky-200 bg-[#eef5fc] p-2">
                      <p className="font-bold text-sky-900">
                        {targetCalories.toLocaleString('en-IN')} Kcal
                      </p>
                      <p className="mt-1 text-[10px] leading-relaxed text-slate-600">
                        Carbs: {dailyMacros.carbs}gm | Fat: {dailyMacros.fat}gm | Protein:{' '}
                        {dailyMacros.protein}gm | Fiber: {dailyMacros.fiber}gm
                      </p>
                      <div className="mt-2">
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full w-0 rounded-full bg-sky-400" />
                        </div>
                        <p className="mt-0.5 text-[10px] text-slate-500">Eaten: 0 Kcal</p>
                      </div>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEAL_SLOT_META.map((slot) => (
              <tr key={slot.key} className="border-b border-sky-100">
                <td className="border-r border-sky-100 p-1.5 align-middle">
                  <div className="flex items-center gap-1">
                    {!isPublished && (
                      <button
                        type="button"
                        onClick={() => clearMealRow(slot.key)}
                        className="shrink-0 rounded p-0.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                        title={`Clear ${slot.label} row`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold leading-tight text-sky-900">{slot.label}</p>
                      <p className="text-[9px] text-slate-400">{slot.time}</p>
                    </div>
                  </div>
                </td>
                {days.map((day, dayIdx) => (
                  <td
                    key={`${slot.key}-${day.day}-${dayIdx}`}
                    className={`border-r border-sky-100 p-1.5 last:border-r-0 ${
                      day.skipped ? 'bg-slate-50' : ''
                    }`}
                  >
                    {day.skipped ? (
                      <div className="flex min-h-[52px] items-center justify-center rounded border border-dashed border-slate-200 bg-slate-100 px-2 text-[10px] text-slate-400">
                        —
                      </div>
                    ) : (
                      <MealCell
                        label={slot.label}
                        value={day.meals[slot.key]}
                        disabled={isPublished}
                        onChange={(v) => updateMealCell(dayIdx, slot.key, v)}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center justify-center gap-4 border-t border-sky-200 bg-slate-50 px-4 py-5">
        {!isPublished ? (
          <>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || publishing}
              className="flex min-w-[160px] items-center justify-center gap-2 rounded-full bg-sky-600 px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Diet Plan
            </button>
            <button
              type="button"
              onClick={handleCreateTemplate}
              disabled={templating || saving}
              className="flex min-w-[160px] items-center justify-center gap-2 rounded-full bg-sky-600 px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
            >
              {templating ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
              Create Template
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing || saving}
              className="flex min-w-[160px] items-center justify-center gap-2 rounded-full border-2 border-sky-600 bg-white px-8 py-3 text-sm font-bold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
            >
              {publishing ? <Loader2 size={16} className="animate-spin" /> : null}
              Publish to Client
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleCreateTemplate}
            disabled={templating}
            className="flex min-w-[160px] items-center justify-center gap-2 rounded-full bg-sky-600 px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
          >
            {templating ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
            Create Template
          </button>
        )}
      </div>

      {actionError && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{actionError}</div>
      )}
    </div>
  )
}

function InfoField({
  label,
  value,
  wide,
}: {
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${wide ? 'min-w-[100px] max-w-[160px]' : 'min-w-[70px]'}`}>
      <span className="font-semibold uppercase tracking-wide text-sky-800">{label}</span>
      <span className="truncate font-medium text-slate-700" title={value}>
        {value}
      </span>
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
          className="min-h-[52px] w-full resize-none rounded border border-sky-400 bg-white px-2 py-1.5 text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setEditing(true)}
          className={`min-h-[52px] w-full rounded border px-2 py-1.5 text-left text-[11px] leading-snug transition ${
            hasContent
              ? 'border-sky-300 bg-white text-slate-800 hover:border-sky-400'
              : 'border-sky-200 bg-slate-50 text-slate-400 hover:border-sky-300'
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
