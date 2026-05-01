'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import {
  Activity,
  ArrowLeft,
  ChevronRight,
  Pin,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { parseDeficiencySummaryPayload } from '@/lib/deficiency-profile-parse'
import type { PortalClientBundle } from '@/lib/nutritionist-types'
import type { AppointmentWithClient } from '@/lib/nutritionist-actions'
import { NutritionistNotesTab } from '@/components/nutritionist-portal/NutritionistNotesTab'
import { NutritionistDocumentsTab } from '@/components/nutritionist-portal/NutritionistDocumentsTab'
import { NutritionistProgressCharts } from '@/components/nutritionist/NutritionistProgressCharts'
import { NutritionistWeightSparkline } from '@/components/nutritionist/NutritionistWeightSparkline'
import { toggleNutritionistNotePin } from '@/lib/nutritionist-portal-actions'
import { avatarPaletteFromName } from '@/lib/nutritionist-utils'
import { severityPillDark } from '@/components/profile/profile-dark-styles'

const DEFAULT_GOALS = [
  'Seven-day wellness logging streak',
  'Hydration goal every day for one week',
  'Sleep 7+ hours on five nights',
  'Complete first nutrition session',
  'Track weight twice weekly for a month',
]

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

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

type Tab = 'overview' | 'notes' | 'documents' | 'progress'

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
  const [tab, setTab] = useState<Tab>('overview')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [notesMount, setNotesMount] = useState<{ key: number; session: string }>({
    key: 0,
    session: 'all',
  })

  const { client, appointments, notes, documents, latestReadyReport } = bundle

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
    { id: 'overview', label: 'Overview' },
    { id: 'notes', label: 'Notes' },
    { id: 'documents', label: 'Documents' },
    { id: 'progress', label: 'Progress' },
  ]

  function statusDot(a: AppointmentWithClient) {
    if (a.status === 'completed') return 'bg-emerald-500'
    if (a.status === 'confirmed') return 'bg-blue-400'
    if (a.status === 'pending') return 'bg-gray-400'
    return 'bg-[#4B5563]'
  }

  return (
    <div className="space-y-6">
      <Link
        href="/nutritionist/clients"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#8B9AB0] hover:text-emerald-400"
      >
        <ArrowLeft size={16} />
        Back to clients
      </Link>

      {firstSessionEmpty && (
        <div className="rounded-2xl border border-transparent bg-gradient-to-br from-emerald-500/30 via-emerald-500/5 to-[#0F1623] p-[1px] shadow-[0_0_40px_rgba(16,185,129,0.08)]">
          <div className="rounded-2xl bg-[#0F1623] px-6 py-10 text-center sm:px-10">
            <p className="text-xl font-black text-[#F0F4F8]">👋 First session with {client.name}</p>
            <p className="mx-auto mt-3 max-w-lg text-sm text-[#8B9AB0]">
              Get started by adding your initial notes or uploading their intake form.
            </p>
            <div className="mx-auto mt-8 grid max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setTab('notes')
                  setComposerKick((k) => k + 1)
                }}
                className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-5 py-4 text-sm font-bold text-emerald-400 hover:bg-emerald-500/15"
              >
                📝 Add First Note
              </button>
              <button
                type="button"
                onClick={() => setTab('documents')}
                className="rounded-2xl border border-white/[0.08] bg-[#060910] px-5 py-4 text-sm font-bold text-[#F0F4F8] hover:border-emerald-500/25"
              >
                📎 Upload Document
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Sidebar */}
        <aside className="w-full shrink-0 space-y-6 lg:w-[320px]">
          <div>
            {pinned ? (
              <div className="group relative rounded-2xl border border-amber-500/40 bg-[#1a1500] p-4">
                <Pin className="absolute right-3 top-3 fill-amber-400 text-amber-400" size={18} aria-hidden />
                <p className="pr-8 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  📌 Quick Reminder
                </p>
                <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-[#F0F4F8]">{pinned.content}</p>
                <button
                  type="button"
                  disabled={pinBusy}
                  onClick={() =>
                    startPin(async () => {
                      await toggleNutritionistNotePin(pinned.id, clientId, client.email)
                      router.refresh()
                    })
                  }
                  className="mt-3 text-[11px] font-semibold text-[#8B9AB0] opacity-0 transition group-hover:opacity-100 hover:text-[#F0F4F8] disabled:opacity-40"
                >
                  Unpin
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setTab('notes')}
                className="w-full rounded-2xl border border-dashed border-white/[0.12] bg-transparent px-4 py-6 text-center text-xs italic text-[#8B9AB0] hover:border-emerald-500/25"
              >
                Pin a note as a quick reminder →
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-[#0F1623] p-5">
            <div className="flex flex-col items-center text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-black text-white"
                style={{ backgroundColor: avatarPaletteFromName(client.name) }}
              >
                {initials(client.name)}
              </div>
              <h2 className="mt-4 text-xl font-black text-[#F0F4F8]">{client.name}</h2>
              <p className="mt-1 break-all text-xs text-[#8B9AB0]">{client.email}</p>
              {client.phone ? <p className="mt-1 text-xs text-[#8B9AB0]">{client.phone}</p> : null}
              <span
                className={`mt-4 rounded-full border px-3 py-1 text-xs font-bold ${
                  client.status === 'active'
                    ? 'border-emerald-500/35 text-emerald-400'
                    : client.status === 'expired'
                      ? 'border-red-500/35 text-red-400'
                      : 'border-blue-500/35 text-blue-300'
                }`}
              >
                {client.status}
              </span>
              <p className="mt-3 text-[11px] text-[#8B9AB0]">
                Client since {formatDate(client.plan_start_date)}
              </p>
            </div>

            <div className="mt-6 space-y-2.5 border-t border-white/[0.06] pt-5 text-[13px] leading-snug">
              <div className="flex justify-between gap-2">
                <span className="text-[#8B9AB0]">🎯 Goal</span>
                <span className="text-right font-medium text-[#F0F4F8]">{client.assessment_goal || '—'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#8B9AB0]">📅 Plan expires</span>
                <span className="text-[#F0F4F8]">{formatDate(client.plan_end_date)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#8B9AB0]">💪 Sessions</span>
                <span className="font-medium text-emerald-400">
                  {client.sessions_used} used / {client.sessions_total} total
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#8B9AB0]">⚖️ Latest weight</span>
                <span className="text-[#F0F4F8]">
                  {stats.latestWeight != null ? `${stats.latestWeight.toFixed(1)} kg` : '—'}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#8B9AB0]">📊 BMI</span>
                <span className="text-[#F0F4F8]">
                  {stats.currentBmi != null ? stats.currentBmi.toFixed(1) : '—'}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#8B9AB0]">⚡ Latest energy</span>
                <span className="text-[#F0F4F8]">
                  {bundle.progressLogs.find((l) => l.energy_level != null)?.energy_level ?? '—'}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#060910]/90 px-4 py-3 text-center text-[11px] text-[#8B9AB0]">
              👁 Client can see {bundle.visibleNotesCount} of {notes.length} notes
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-[#0F1623] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#8B9AB0]">Session history</p>
            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
              {sortedAppts.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('notes')
                      setNotesMount({ key: Date.now(), session: String(a.session_number) })
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs hover:bg-white/[0.04]"
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot(a)}`} />
                    <span className="font-bold text-emerald-400">Session {a.session_number}</span>
                    <span className="text-[#8B9AB0]">{formatDate(a.scheduled_date)}</span>
                    <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase text-[#8B9AB0]">
                      {a.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1 space-y-6">
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-bold transition ${
                  tab === t.id
                    ? 'bg-emerald-500 text-black'
                    : 'border border-white/[0.08] bg-[#0F1623] text-[#8B9AB0] hover:border-emerald-500/25'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/[0.06] bg-[#0F1623] p-5">
                  <div className="flex items-center gap-2">
                    <Target className="text-emerald-400" size={18} />
                    <h3 className="font-black text-[#F0F4F8]">Deficiency profile</h3>
                  </div>
                  {latestReadyReport ? (
                    <>
                      {deficiency.overallScore != null && (
                        <div className="mt-4 flex items-center gap-3">
                          <span className="text-3xl font-black text-emerald-400">{deficiency.overallScore}</span>
                          <span className="text-sm text-[#8B9AB0]">/ 100</span>
                        </div>
                      )}
                      <div className="mt-4 space-y-3">
                        {deficiency.deficiencies.slice(0, 3).map((d, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-white/[0.06] bg-[#060910] px-4 py-3"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-[#F0F4F8]">{d.nutrient}</span>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${severityPillDark(d.severity)}`}
                              >
                                {d.severity}
                              </span>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-[#8B9AB0]">{d.reason}</p>
                          </div>
                        ))}
                      </div>
                      <Link
                        href={`/report/${encodeURIComponent(latestReadyReport.report_id)}`}
                        className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-400 hover:underline"
                      >
                        View full report
                        <ChevronRight size={16} />
                      </Link>
                    </>
                  ) : (
                    <p className="mt-4 text-sm text-[#8B9AB0]">No paid report yet.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-[#0F1623] p-5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-amber-400" size={18} />
                    <h3 className="font-black text-[#F0F4F8]">Free assessment summary</h3>
                  </div>
                  {free.score != null || free.top.length > 0 ? (
                    <div className="mt-4 space-y-3 text-sm">
                      {free.score != null && (
                        <p className="text-[#F0F4F8]">
                          Score: <span className="font-black text-emerald-400">{free.score}</span>
                        </p>
                      )}
                      {free.top.length > 0 && (
                        <ul className="list-inside list-disc text-[#8B9AB0]">
                          {free.top.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-[#8B9AB0]">No free assessment data on file.</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-white/[0.06] bg-[#0F1623] p-5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-emerald-400" size={18} />
                    <h3 className="font-black text-[#F0F4F8]">Recent progress</h3>
                  </div>
                  <div className="mt-4 space-y-4 text-sm">
                    <div className="grid gap-3 border-b border-white/[0.06] pb-4 sm:grid-cols-2">
                      <div className="text-[#8B9AB0]">
                        <p className="font-semibold text-[#F0F4F8]">
                          Latest weight:{' '}
                          <span className="text-emerald-400">
                            {stats.latestWeight != null ? `${stats.latestWeight.toFixed(1)} kg` : '—'}
                          </span>
                        </p>
                        {stats.latestWeightLoggedAt ? (
                          <p className="mt-1 text-xs">Logged {formatDate(stats.latestWeightLoggedAt)}</p>
                        ) : null}
                      </div>
                      <p className="text-[#8B9AB0]">
                        Avg energy last 7 days:{' '}
                        <span className="font-bold text-[#F0F4F8]">
                          {stats.avgEnergy7 != null ? `${stats.avgEnergy7.toFixed(1)}/10` : '—'}
                        </span>
                      </p>
                      <p className="text-[#8B9AB0]">
                        Avg sleep last 7 days:{' '}
                        <span className="font-bold text-[#F0F4F8]">
                          {stats.avgSleep7 != null ? `${stats.avgSleep7.toFixed(1)}h` : '—'}
                        </span>
                      </p>
                      <p className="text-[#8B9AB0]">
                        Water goal hit{' '}
                        <span className="font-bold text-emerald-400">{stats.waterHits7}</span> of last 7 days
                      </p>
                    </div>

                    <NutritionistWeightSparkline logs={bundle.progressLogs} />

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B9AB0]">Recent weights</p>
                      <ul className="mt-2 space-y-1">
                        {stats.weights3.map((l) => (
                          <li key={l.id} className="flex justify-between text-[#F0F4F8]">
                            <span>{formatDate(l.logged_at)}</span>
                            <span>{Number(l.weight_kg).toFixed(1)} kg</span>
                          </li>
                        ))}
                        {stats.weights3.length === 0 && (
                          <li className="text-[#8B9AB0]">No entries</li>
                        )}
                      </ul>
                    </div>
                    <div className="flex justify-between border-t border-white/[0.06] pt-4">
                      <span className="text-[#8B9AB0]">BMI</span>
                      <span className="font-bold text-[#F0F4F8]">
                        {stats.currentBmi != null ? stats.currentBmi.toFixed(1) : '—'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B9AB0]">
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
                              <span className="text-[10px] text-[#8B9AB0]">{formatDate(l.logged_at)}</span>
                            </div>
                          )
                        })}
                        {stats.energy3.length === 0 && (
                          <span className="text-[#8B9AB0]">No data</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#8B9AB0]">Water today</p>
                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#060910]">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{
                            width: `${Math.min(100, ((stats.waterToday ?? 0) / 2000) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-[#8B9AB0]">
                        {stats.waterToday != null ? `${stats.waterToday} ml` : '—'} / 2000 ml
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B9AB0]">Sleep (latest)</span>
                      <span className="text-[#F0F4F8]">
                        {stats.sleepLast != null ? `${stats.sleepLast.toFixed(1)} h` : '—'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab('progress')}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-400 hover:underline"
                  >
                    View full progress
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-[#0F1623] p-5">
                  <div className="flex items-center gap-2">
                    <Activity className="text-emerald-400" size={18} />
                    <h3 className="font-black text-[#F0F4F8]">Wellness Goals</h3>
                  </div>
                  <p className="mt-2 text-xs text-[#8B9AB0]">
                    {DEFAULT_GOALS.reduce((n, _, i) => (goals[String(i)] ? n + 1 : n), 0)} of 5 completed
                  </p>
                  <ul className="mt-4 space-y-3">
                    {DEFAULT_GOALS.map((text, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                            goals[String(i)]
                              ? 'border-emerald-500 bg-emerald-500 text-black'
                              : 'border-[#4B5563]'
                          }`}
                        >
                          {goals[String(i)] ? '✓' : ''}
                        </span>
                        <span
                          className={`text-sm ${goals[String(i)] ? 'text-[#8B9AB0] line-through' : 'text-[#F0F4F8]'}`}
                        >
                          {text}
                        </span>
                      </li>
                    ))}
                  </ul>
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
                <p className="rounded-2xl border border-white/[0.06] bg-[#0F1623] px-6 py-12 text-center text-sm text-[#8B9AB0]">
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
