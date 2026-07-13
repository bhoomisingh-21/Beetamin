'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { Activity, ChevronRight, Pin, Sparkles, Target, TrendingUp } from 'lucide-react'
import { parseDeficiencySummaryPayload } from '@/lib/deficiency-profile-parse'
import type { PortalClientBundle } from '@/lib/nutritionist-types'
import type { AppointmentWithClient } from '@/lib/nutritionist-actions'
import { NutritionistNotesTab } from '@/components/nutritionist-portal/NutritionistNotesTab'
import { NutritionistDocumentsTab } from '@/components/nutritionist-portal/NutritionistDocumentsTab'
import { NutritionistDietPlanTab } from '@/components/nutritionist-portal/NutritionistDietPlanTab'
import { NutritionistMealPlanTab } from '@/components/nutritionist-portal/NutritionistMealPlanTab'
import { NutritionistProgressCharts } from '@/components/nutritionist/NutritionistProgressCharts'
import { NutritionistWeightSparkline } from '@/components/nutritionist/NutritionistWeightSparkline'
import { ClientProfileHeader } from '@/components/nutritionist-portal/ClientProfileHeader'
import { NutritionistHraTab } from '@/components/nutritionist-portal/NutritionistHraTab'
import { toggleNutritionistNotePin } from '@/lib/nutritionist-portal-actions'
import { portal } from '@/components/nutritionist-portal/portal-theme'

function severityPillLight(sev: string) {
  if (sev === 'high') return 'border-red-200 bg-red-50 text-red-700'
  if (sev === 'medium') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

const DEFAULT_GOALS = [
  'Seven-day wellness logging streak',
  'Hydration goal every day for one week',
  'Sleep 7+ hours on five nights',
  'Complete first nutrition session',
  'Track weight twice weekly for a month',
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function extractFreeAssessment(ar: unknown): { score: number | null; top: string[] } {
  if (!ar || typeof ar !== 'object') return { score: null, top: [] }
  const o = ar as Record<string, unknown>
  const score =
    typeof o.overallScore === 'number'
      ? o.overallScore
      : typeof o.score === 'number'
        ? o.score
        : typeof o.deficiencyScore === 'number'
          ? o.deficiencyScore
          : null
  let top: string[] = []
  const defs = o.deficiencies ?? o.topDeficiencies
  if (Array.isArray(defs)) {
    top = defs.slice(0, 2).map((x) => {
      if (x && typeof x === 'object' && 'nutrient' in x) return String((x as { nutrient: string }).nutrient)
      return String(x)
    })
  }
  return { score, top }
}

function deriveProgressStats(bundle: PortalClientBundle) {
  const logs = [...bundle.progressLogs].sort(
    (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime(),
  )
  const sevenAgo = Date.now() - 7 * 86400000
  const week = logs.filter((l) => new Date(l.logged_at).getTime() >= sevenAgo)
  const energies = week.filter((l) => l.energy_level != null).map((l) => Number(l.energy_level))
  const sleeps = week.filter((l) => l.sleep_hours != null).map((l) => Number(l.sleep_hours))
  const avgEnergy7 = energies.length ? energies.reduce((a, b) => a + b, 0) / energies.length : null
  const avgSleep7 = sleeps.length ? sleeps.reduce((a, b) => a + b, 0) / sleeps.length : null

  const latestWeightEntry = logs.find((l) => l.weight_kg != null)
  const latestWeight = latestWeightEntry?.weight_kg != null ? Number(latestWeightEntry.weight_kg) : null

  const h =
    bundle.client.height_cm ??
    latestWeightEntry?.height_cm ??
    null
  let bmi: number | null = latestWeightEntry?.bmi != null ? Number(latestWeightEntry.bmi) : null
  if (bmi == null && latestWeight != null && h && h > 0) {
    const m = h / 100
    bmi = latestWeight / (m * m)
  }

  const today = new Date().toISOString().slice(0, 10)
  const todayLog = logs.find((l) => l.logged_at.slice(0, 10) === today)
  const waterToday = todayLog?.water_ml != null ? Number(todayLog.water_ml) : null

  const lastSleep = logs.find((l) => l.sleep_hours != null && Number(l.sleep_hours) > 0)

  const weights3 = logs.filter((l) => l.weight_kg != null).slice(0, 3)
  const energy3 = logs.filter((l) => l.energy_level != null).slice(0, 3)

  const waterHits7 = week.filter((l) => Number(l.water_ml ?? 0) >= 2000).length

  return {
    avgEnergy7,
    avgSleep7,
    latestWeight,
    latestWeightLoggedAt: latestWeightEntry?.logged_at ?? null,
    currentBmi: bmi,
    waterToday,
    waterHits7,
    sleepLast: lastSleep?.sleep_hours != null ? Number(lastSleep.sleep_hours) : null,
    weights3,
    energy3,
  }
}

type Tab = 'hra' | 'overview' | 'notes' | 'mealPlan' | 'dietPlan' | 'documents' | 'progress'

export default function NutritionistClientProfileClient({
  bundle,
  clientId,
}: {
  bundle: PortalClientBundle
  clientId: string
}) {
  const router = useRouter()
  const [pinBusy, startPin] = useTransition()
  const [composerKick, setComposerKick] = useState(0)
  const [tab, setTab] = useState<Tab>('hra')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [notesMount, setNotesMount] = useState<{ key: number; session: string }>({
    key: 0,
    session: 'all',
  })

  const { client, appointments, notes, documents, dietPlans, latestReadyReport } = bundle

  const pinned = notes.find((n) => n.is_pinned)
  const firstSessionEmpty = notes.length === 0 && documents.length === 0

  const deficiency = useMemo(
    () => parseDeficiencySummaryPayload(latestReadyReport?.deficiency_summary),
    [latestReadyReport?.deficiency_summary],
  )

  const free = useMemo(() => extractFreeAssessment(client.assessment_result), [client.assessment_result])

  const stats = useMemo(() => deriveProgressStats(bundle), [bundle])

  const goals = client.goals_progress || {}

  const sortedAppts = [...appointments].sort(
    (a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime(),
  )

  const defaultNoteSession = useMemo(() => {
    const nums = appointments.map((a) => a.session_number).filter((n) => typeof n === 'number' && !Number.isNaN(n))
    return nums.length ? Math.max(...nums) : null
  }, [appointments])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'hra', label: 'HRA' },
    { id: 'overview', label: 'Summary' },
    { id: 'mealPlan', label: 'Diet plan' },
    { id: 'notes', label: 'Notes' },
    { id: 'dietPlan', label: 'PDFs' },
    { id: 'documents', label: 'Files' },
    { id: 'progress', label: 'Progress' },
  ]

  function statusDot(a: AppointmentWithClient) {
    if (a.status === 'completed') return 'bg-emerald-500'
    if (a.status === 'confirmed') return 'bg-blue-400'
    if (a.status === 'pending') return 'bg-slate-400'
    return 'bg-slate-500'
  }

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8">
      <ClientProfileHeader bundle={bundle} onEditHra={() => setTab('hra')} />

      <div className="flex flex-col">
        <nav className="border-b border-emerald-100 bg-white">
          <div className="mx-auto flex max-w-5xl gap-0 overflow-x-auto px-2 scrollbar-hide md:px-4">
            {tabs.map(({ id, label }) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition sm:px-4 ${
                    active
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </nav>

        {firstSessionEmpty && tab === 'hra' ? (
          <p className="border-b border-emerald-100 bg-emerald-50/60 px-4 py-2 text-center text-xs text-emerald-800">
            First session — fill in the HRA form below, then add notes or files from the other tabs.
          </p>
        ) : null}

        <div
          className={`mx-auto min-w-0 w-full max-w-5xl flex-1 ${tab === 'mealPlan' ? 'px-0 py-0' : 'px-4 py-5 md:px-6'}`}
        >
          {tab === 'hra' && (
            <NutritionistHraTab clientId={clientId} clientName={client.name} bundle={bundle} />
          )}

          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  {
                    label: 'Weight',
                    value: stats.latestWeight != null ? `${stats.latestWeight.toFixed(1)} kg` : '—',
                    sub: stats.latestWeightLoggedAt ? formatDate(stats.latestWeightLoggedAt) : 'No log',
                  },
                  {
                    label: 'BMI',
                    value: stats.currentBmi != null ? stats.currentBmi.toFixed(1) : '—',
                    sub: 'Current',
                  },
                  {
                    label: 'Avg energy',
                    value: stats.avgEnergy7 != null ? `${stats.avgEnergy7.toFixed(1)}/10` : '—',
                    sub: 'Last 7 days',
                  },
                  {
                    label: 'Avg sleep',
                    value: stats.avgSleep7 != null ? `${stats.avgSleep7.toFixed(1)}h` : '—',
                    sub: 'Last 7 days',
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">{s.label}</p>
                    <p className="mt-1 text-2xl font-black tabular-nums text-slate-900">{s.value}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{s.sub}</p>
                  </div>
                ))}
              </div>

              {pinned ? (
                <div className="group relative rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <Pin className="absolute right-3 top-3 fill-amber-500 text-amber-600" size={18} aria-hidden />
                  <p className="pr-8 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Quick reminder
                  </p>
                  <p className={`mt-2 line-clamp-4 text-sm leading-relaxed ${portal.textBody}`}>{pinned.content}</p>
                  <button
                    type="button"
                    disabled={pinBusy}
                    onClick={() =>
                      startPin(async () => {
                        await toggleNutritionistNotePin(pinned.id, clientId, client.email)
                        router.refresh()
                      })
                    }
                    className={`mt-3 text-[11px] font-semibold ${portal.textMuted} hover:text-slate-700 disabled:opacity-40`}
                  >
                    Unpin
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setTab('notes')}
                  className={`w-full rounded-2xl border border-dashed border-emerald-200 bg-white px-4 py-4 text-center text-xs italic ${portal.textMuted} hover:border-emerald-400`}
                >
                  Pin a note as a quick reminder →
                </button>
              )}

              <div className={`${portal.card} overflow-hidden`}>
                <div className="border-b border-emerald-100 bg-emerald-50/50 px-5 py-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Session history</p>
                </div>
                <ul className="max-h-56 divide-y divide-emerald-50 overflow-y-auto">
                  {sortedAppts.length === 0 ? (
                    <li className={`px-5 py-8 text-center text-sm ${portal.textMuted}`}>No sessions yet</li>
                  ) : (
                    sortedAppts.map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setTab('notes')
                            setNotesMount({ key: Date.now(), session: String(a.session_number) })
                          }}
                          className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-emerald-50/80"
                        >
                          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDot(a)}`} />
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-bold ${portal.textH}`}>Session {a.session_number}</p>
                            <p className={`text-xs ${portal.textMuted}`}>{formatDate(a.scheduled_date)}</p>
                          </div>
                          <span className="shrink-0 rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                            {a.status}
                          </span>
                          <ChevronRight size={16} className="shrink-0 text-emerald-400" />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-6">
                <div className={`${portal.card} overflow-hidden`}>
                  <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50/50 px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <Target size={18} />
                    </div>
                    <h3 className={`font-black ${portal.textH}`}>Deficiency profile</h3>
                  </div>
                  <div className="p-5">
                  {latestReadyReport ? (
                    <>
                      {deficiency.overallScore != null && (
                        <div className="mt-4 flex items-center gap-3">
                          <span className={`text-3xl font-black ${portal.textAccent}`}>{deficiency.overallScore}</span>
                          <span className={`text-sm ${portal.textMuted}`}>/ 100</span>
                        </div>
                      )}
                      <div className="mt-4 space-y-3">
                        {deficiency.deficiencies.slice(0, 3).map((d, i) => (
                          <div key={i} className={`${portal.cardMuted} px-4 py-3`}>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`font-semibold ${portal.textH}`}>{d.nutrient}</span>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${severityPillLight(d.severity)}`}
                              >
                                {d.severity}
                              </span>
                            </div>
                            <p className={`mt-2 text-xs leading-relaxed ${portal.textMuted}`}>{d.reason}</p>
                          </div>
                        ))}
                      </div>
                      <Link
                        href={`/report/${encodeURIComponent(latestReadyReport.report_id)}`}
                        className={`mt-4 inline-flex items-center gap-1 text-sm font-bold ${portal.textAccent} hover:underline`}
                      >
                        View full report
                        <ChevronRight size={16} />
                      </Link>
                    </>
                  ) : (
                    <p className={`mt-4 text-sm ${portal.textMuted}`}>No paid report yet.</p>
                  )}
                  </div>
                </div>

                <div className={`${portal.card} overflow-hidden`}>
                  <div className="flex items-center gap-3 border-b border-emerald-100 bg-amber-50/60 px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white">
                      <Sparkles size={18} />
                    </div>
                    <h3 className={`font-black ${portal.textH}`}>Free assessment</h3>
                  </div>
                  <div className="p-5">
                  {free.score != null || free.top.length > 0 ? (
                    <div className="mt-4 space-y-3 text-sm">
                      {free.score != null && (
                        <p className={portal.textH}>
                          Score: <span className={`font-black ${portal.textAccent}`}>{free.score}</span>
                        </p>
                      )}
                      {free.top.length > 0 && (
                        <ul className={`list-inside list-disc ${portal.textMuted}`}>
                          {free.top.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p className={`mt-4 text-sm ${portal.textMuted}`}>No free assessment data on file.</p>
                  )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className={`${portal.card} overflow-hidden`}>
                  <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50/50 px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <TrendingUp size={18} />
                    </div>
                    <h3 className={`font-black ${portal.textH}`}>Recent progress</h3>
                  </div>
                  <div className="p-5">
                  <div className="mt-4 space-y-4 text-sm">
                    <div className={`grid gap-3 border-b ${portal.divider} pb-4 sm:grid-cols-2`}>
                      <div className={portal.textMuted}>
                        <p className={`font-semibold ${portal.textH}`}>
                          Latest weight:{' '}
                          <span className={portal.textAccent}>
                            {stats.latestWeight != null ? `${stats.latestWeight.toFixed(1)} kg` : '—'}
                          </span>
                        </p>
                        {stats.latestWeightLoggedAt ? (
                          <p className="mt-1 text-xs">Logged {formatDate(stats.latestWeightLoggedAt)}</p>
                        ) : null}
                      </div>
                      <p className={portal.textMuted}>
                        Avg energy last 7 days:{' '}
                        <span className={`font-bold ${portal.textH}`}>
                          {stats.avgEnergy7 != null ? `${stats.avgEnergy7.toFixed(1)}/10` : '—'}
                        </span>
                      </p>
                      <p className={portal.textMuted}>
                        Avg sleep last 7 days:{' '}
                        <span className={`font-bold ${portal.textH}`}>
                          {stats.avgSleep7 != null ? `${stats.avgSleep7.toFixed(1)}h` : '—'}
                        </span>
                      </p>
                      <p className={portal.textMuted}>
                        Water goal hit{' '}
                        <span className={`font-bold ${portal.textAccent}`}>{stats.waterHits7}</span> of last 7 days
                      </p>
                    </div>

                    <NutritionistWeightSparkline logs={bundle.progressLogs} />

                    <div>
                      <p className={`text-[11px] font-bold uppercase tracking-wider ${portal.textMuted}`}>Recent weights</p>
                      <ul className="mt-2 space-y-1">
                        {stats.weights3.map((l) => (
                          <li key={l.id} className={`flex justify-between ${portal.textH}`}>
                            <span>{formatDate(l.logged_at)}</span>
                            <span>{Number(l.weight_kg).toFixed(1)} kg</span>
                          </li>
                        ))}
                        {stats.weights3.length === 0 && (
                          <li className={portal.textMuted}>No entries</li>
                        )}
                      </ul>
                    </div>
                    <div className={`flex justify-between border-t ${portal.divider} pt-4`}>
                      <span className={portal.textMuted}>BMI</span>
                      <span className={`font-bold ${portal.textH}`}>
                        {stats.currentBmi != null ? stats.currentBmi.toFixed(1) : '—'}
                      </span>
                    </div>
                    <div>
                      <p className={`text-[11px] font-bold uppercase tracking-wider ${portal.textMuted}`}>
                        Energy (last logs)
                      </p>
                      <div className="mt-2 flex gap-2">
                        {stats.energy3.map((l) => {
                          const v = Number(l.energy_level)
                          const color =
                            v <= 3 ? 'bg-red-500' : v <= 6 ? 'bg-amber-400' : 'bg-emerald-500'
                          return (
                            <div key={l.id} className="flex flex-col items-center gap-1">
                              <span className={`h-8 w-8 rounded-full ${color}`} title={`${v}/10`} />
                              <span className={`text-[10px] ${portal.textMuted}`}>{formatDate(l.logged_at)}</span>
                            </div>
                          )
                        })}
                        {stats.energy3.length === 0 && (
                          <span className={portal.textMuted}>No data</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className={`text-[11px] ${portal.textMuted}`}>Water today</p>
                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{
                            width: `${Math.min(100, ((stats.waterToday ?? 0) / 2000) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className={`mt-1 text-xs ${portal.textMuted}`}>
                        {stats.waterToday != null ? `${stats.waterToday} ml` : '—'} / 2000 ml
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <span className={portal.textMuted}>Sleep (latest)</span>
                      <span className={portal.textH}>
                        {stats.sleepLast != null ? `${stats.sleepLast.toFixed(1)} h` : '—'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab('progress')}
                    className={`mt-4 inline-flex items-center gap-1 text-sm font-bold ${portal.textAccent} hover:underline`}
                  >
                    View full progress
                    <ChevronRight size={16} />
                  </button>
                  </div>
                </div>

                <div className={`${portal.card} overflow-hidden`}>
                  <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50/50 px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <Activity size={18} />
                    </div>
                    <h3 className={`font-black ${portal.textH}`}>Wellness goals</h3>
                  </div>
                  <div className="p-5">
                  <p className={`mt-2 text-xs ${portal.textMuted}`}>
                    {DEFAULT_GOALS.reduce((n, _, i) => (goals[String(i)] ? n + 1 : n), 0)} of 5 completed
                  </p>
                  <ul className="mt-4 space-y-3">
                    {DEFAULT_GOALS.map((text, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                            goals[String(i)]
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {goals[String(i)] ? '✓' : ''}
                        </span>
                        <span
                          className={`text-sm ${goals[String(i)] ? `${portal.textMuted} line-through` : portal.textH}`}
                        >
                          {text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  </div>
                </div>
              </div>
            </div>
            </div>
          )}

          {tab === 'notes' && (
            <NutritionistNotesTab
              key={notesMount.key}
              initialSessionFilter={notesMount.session}
              composerKick={composerKick}
              clientId={clientId}
              clientEmail={client.email.toLowerCase()}
              clientName={client.name}
              defaultNoteSession={defaultNoteSession}
              sessionsTotal={client.sessions_total}
              notes={notes}
              tagFilter={tagFilter}
              onTagFilter={setTagFilter}
            />
          )}

          {tab === 'mealPlan' && (
            <NutritionistMealPlanTab
              clientId={clientId}
              clientEmail={client.email.toLowerCase()}
              clientName={client.name}
              clientContext={{
                clientId,
                client,
                progressLogs: bundle.progressLogs,
                detailedAssessment: bundle.detailedAssessment,
              }}
            />
          )}

          {tab === 'dietPlan' && (
            <NutritionistDietPlanTab
              clientId={clientId}
              clientEmail={client.email.toLowerCase()}
              clientName={client.name}
              dietPlans={dietPlans}
            />
          )}

          {tab === 'documents' && (
            <NutritionistDocumentsTab
              clientId={clientId}
              clientEmail={client.email.toLowerCase()}
              documents={documents}
            />
          )}

          {tab === 'progress' && (
            <div>
              {bundle.progressLogs.length === 0 ? (
                <p className={`${portal.card} px-6 py-12 text-center text-sm ${portal.textMuted}`}>
                  {client.name} hasn&apos;t logged any progress yet.
                </p>
              ) : (
                <NutritionistProgressCharts
                  logs={bundle.progressLogs}
                  latestWeight={stats.latestWeight}
                  currentBmi={stats.currentBmi}
                  avgEnergy7={stats.avgEnergy7}
                  avgSleep7={stats.avgSleep7}
                  clientName={client.name}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
