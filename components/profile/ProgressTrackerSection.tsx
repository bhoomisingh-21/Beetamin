'use client'

import { useEffect, useMemo, useState } from 'react'
import { upsertProgressLog, type ClientRow, type ProgressLogRow } from '@/lib/booking-actions'
import { WeightProgressChart, type WeightChartPoint } from './WeightProgressChart'
import { EnergyProgressChart, type EnergyChartPoint } from './EnergyProgressChart'
import { bmiMeta } from './profile-helpers'

type Props = {
  userId: string
  client: ClientRow | null
  progressLogs: ProgressLogRow[]
  onReload: () => Promise<void>
  onToast: (msg: string) => void
}

function sortLogsAsc(logs: ProgressLogRow[]) {
  return [...logs].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
}

export function ProgressTrackerSection({
  userId,
  client,
  progressLogs,
  onReload,
  onToast,
}: Props) {
  const [weightKg, setWeightKg] = useState('')
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [energy, setEnergy] = useState(5)
  const [notes, setNotes] = useState('')
  const [heightCm, setHeightCm] = useState(client?.height_cm != null ? String(client.height_cm) : '')
  const [logSaving, setLogSaving] = useState(false)

  useEffect(() => {
    if (client?.height_cm != null) setHeightCm(String(client.height_cm))
  }, [client?.height_cm])

  const sortedAsc = useMemo(() => sortLogsAsc(progressLogs), [progressLogs])

  const latestWeightLog = useMemo(() => {
    const withW = progressLogs.filter((l) => l.weight_kg != null)
    if (!withW.length) return null
    return withW.reduce((a, b) => (new Date(a.logged_at) > new Date(b.logged_at) ? a : b))
  }, [progressLogs])

  const weightTableRows = useMemo(() => {
    return progressLogs
      .filter((l) => l.weight_kg != null)
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
      .slice(0, 5)
  }, [progressLogs])

  const weightChartData: WeightChartPoint[] = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000
    return sortedAsc
      .filter((l) => l.weight_kg != null && new Date(l.logged_at).getTime() >= cutoff)
      .map((l) => ({
        date: l.logged_at,
        label: l.logged_at.slice(5),
        kg: Number(l.weight_kg),
      }))
  }, [sortedAsc])

  const energyChartData: EnergyChartPoint[] = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000
    return sortedAsc
      .filter((l) => l.energy_level != null && new Date(l.logged_at).getTime() >= cutoff)
      .map((l) => ({
        day: l.logged_at.slice(5),
        energy: Number(l.energy_level),
      }))
  }, [sortedAsc])

  const todayStr = new Date().toISOString().slice(0, 10)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  const yesterdayNote = useMemo(() => {
    const row = progressLogs.find((l) => l.logged_at === yesterdayStr)
    return row?.notes?.trim() || null
  }, [progressLogs, yesterdayStr])

  const heightNum = parseFloat(heightCm)
  const latestWeight =
    latestWeightLog?.weight_kg != null ? Number(latestWeightLog.weight_kg) : null
  const bmiNum =
    latestWeight != null && heightNum > 0 ? latestWeight / Math.pow(heightNum / 100, 2) : null
  const bmiDisplay = bmiNum != null ? bmiNum.toFixed(1) : null
  const bmiInfo = bmiNum != null ? bmiMeta(bmiNum) : null

  async function handleLogWeight() {
    setLogSaving(true)
    try {
      const w = weightKg.trim() === '' ? null : parseFloat(weightKg)
      if (w == null || Number.isNaN(w) || w < 20 || w > 300) {
        onToast('Enter a valid weight in kg.')
        return
      }
      const h = heightCm.trim() === '' ? null : parseFloat(heightCm)
      if (!client?.height_cm && (h == null || Number.isNaN(h) || h < 50 || h > 280)) {
        onToast('Please enter your height in cm.')
        return
      }
      await upsertProgressLog({
        clerkUserId: userId,
        weight_kg: w,
        logged_at: logDate,
        height_cm: h,
      })
      setWeightKg('')
      onToast('Weight saved.')
      await onReload()
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setLogSaving(false)
    }
  }

  async function handleLogEnergy() {
    setLogSaving(true)
    try {
      await upsertProgressLog({
        clerkUserId: userId,
        energy_level: energy,
        logged_at: todayStr,
      })
      onToast('Energy level saved.')
      await onReload()
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setLogSaving(false)
    }
  }

  async function handleSaveNotes() {
    const n = notes.slice(0, 280)
    setLogSaving(true)
    try {
      await upsertProgressLog({
        clerkUserId: userId,
        notes: n,
        logged_at: todayStr,
      })
      setNotes('')
      onToast('Notes saved.')
      await onReload()
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setLogSaving(false)
    }
  }

  return (
    <section className="space-y-8">
      <h2 className="text-lg font-bold text-stone-900">Progress Tracker</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-stone-900">Weight</h3>
          <label className="block text-xs font-bold uppercase text-stone-500">Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            placeholder="e.g. 65.5"
          />
          <label className="block text-xs font-bold uppercase text-stone-500">Date</label>
          <input
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
          />
          <label className="block text-xs font-bold uppercase text-stone-500">
            Height (cm)
            {!client?.height_cm && (
              <span className="ml-1 font-bold normal-case text-amber-700">
                — required on first weight log
              </span>
            )}
          </label>
          <input
            type="number"
            step="0.1"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            placeholder={client?.height_cm ? String(client.height_cm) : 'e.g. 165'}
          />
          <button
            type="button"
            disabled={logSaving}
            onClick={() => void handleLogWeight()}
            className="w-full rounded-xl bg-[#1a472a] py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            Log Weight
          </button>

          {weightTableRows.length > 0 && (
            <div className="overflow-x-auto pt-2">
              <p className="mb-2 text-xs font-bold uppercase text-stone-500">Recent weights</p>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-500">
                    <th className="pb-2 pr-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold">kg</th>
                  </tr>
                </thead>
                <tbody>
                  {weightTableRows.map((row) => (
                    <tr key={row.id} className="border-b border-stone-50">
                      <td className="py-2 text-stone-700">
                        {new Date(row.logged_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-2 font-semibold text-[#1a472a]">
                        {Number(row.weight_kg).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div
          className={`space-y-3 rounded-3xl border bg-white p-6 shadow-sm ${bmiInfo?.card ?? 'border-stone-200'}`}
        >
          <h3 className="font-bold text-stone-900">BMI</h3>
          <p className="text-3xl font-black text-[#1a472a]">{bmiDisplay ?? '—'}</p>
          {bmiInfo && (
            <p className={`text-sm font-bold ${bmiInfo.cls}`}>{bmiInfo.label}</p>
          )}
          <p className="text-xs text-stone-500">
            Uses your latest logged weight and height from your profile.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-stone-900">Energy Level Tracker</h3>
        <p className="text-sm text-stone-600">How&apos;s your energy today?</p>
        <input
          type="range"
          min={1}
          max={10}
          value={energy}
          onChange={(e) => setEnergy(Number(e.target.value))}
          className="w-full accent-emerald-600"
        />
        <p className="text-sm font-semibold text-stone-800">{energy} / 10</p>
        <button
          type="button"
          disabled={logSaving}
          onClick={() => void handleLogEnergy()}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          Log Energy
        </button>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-stone-900 mb-4">Weight (last 30 days)</h3>
        {weightChartData.length >= 2 ? (
          <WeightProgressChart data={weightChartData} />
        ) : (
          <p className="text-sm text-stone-500">Log weight on at least two days to see your chart.</p>
        )}
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-stone-900 mb-4">Energy (last 7 days)</h3>
        {energyChartData.length >= 2 ? (
          <EnergyProgressChart data={energyChartData} />
        ) : (
          <p className="text-sm text-stone-500">Log energy on at least two days to see your chart.</p>
        )}
      </div>

      <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-stone-900">Daily Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, 280))}
          rows={4}
          placeholder="How are you feeling today?"
          className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
        />
        <p className="text-xs text-stone-400">{notes.length}/280</p>
        {yesterdayNote && (
          <div className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-sm text-stone-600">
            <p className="text-[10px] font-bold uppercase text-stone-400">Yesterday</p>
            <p className="mt-1 whitespace-pre-wrap">{yesterdayNote}</p>
          </div>
        )}
        <button
          type="button"
          disabled={logSaving}
          onClick={() => void handleSaveNotes()}
          className="rounded-xl bg-[#1a472a] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#143622] disabled:opacity-60"
        >
          Save Note
        </button>
      </div>
    </section>
  )
}
