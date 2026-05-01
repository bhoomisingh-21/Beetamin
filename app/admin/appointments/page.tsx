'use client'

import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import {
  getAllAppointments,
  getNutritionistStats,
  updateAppointmentStatus,
  type AdminAppointmentRow,
  type NutritionistWithAppointmentStats,
} from '@/lib/admin-queries'

function formatDate(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const hh = h ?? 0
  const mm = m ?? 0
  return `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh >= 12 ? 'PM' : 'AM'}`
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function statusBadgeClass(status: string) {
  const s = status.toLowerCase()
  if (s === 'completed')
    return 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
  if (s === 'pending' || s === 'confirmed')
    return 'border border-blue-500/30 bg-blue-500/20 text-blue-400'
  return 'border border-red-500/30 bg-red-500/20 text-red-400'
}

function displayStatus(status: string) {
  if (status === 'confirmed') return 'Scheduled'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function AdminAppointmentsInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [nutOptions, setNutOptions] = useState<NutritionistWithAppointmentStats[]>([])
  const [appointments, setAppointments] = useState<AdminAppointmentRow[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterNutritionist, setFilterNutritionist] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)

  useEffect(() => {
    const n = searchParams.get('nutritionist')
    if (n) setFilterNutritionist(n)
  }, [searchParams])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const load = useCallback(async () => {
    await Promise.resolve()
    setIsLoading(true)
    try {
      const filters: {
        nutritionist_id?: string
        status?: string
        search?: string
        date?: string
      } = {}
      if (filterNutritionist) filters.nutritionist_id = filterNutritionist
      if (filterStatus !== 'all') filters.status = filterStatus
      if (filterDate) filters.date = filterDate
      if (debouncedSearch.trim()) filters.search = debouncedSearch.trim()
      const rows = await getAllAppointments(filters)
      setAppointments(rows)
    } catch {
      setAppointments([])
    } finally {
      setIsLoading(false)
    }
  }, [filterNutritionist, filterStatus, filterDate, debouncedSearch])

  useEffect(() => {
    getNutritionistStats()
      .then(setNutOptions)
      .catch(() => setNutOptions([]))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function onStatusUpdate(id: string, status: string) {
    setActingId(id)
    try {
      await updateAppointmentStatus(id, status)
      await load()
    } finally {
      setActingId(null)
    }
  }

  function clearFilters() {
    setSearchInput('')
    setDebouncedSearch('')
    setFilterNutritionist('')
    setFilterStatus('all')
    setFilterDate('')
    router.replace('/admin/appointments')
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-black text-3xl text-white">All Appointments</h1>
        <span className="inline-flex w-fit rounded-full border border-white/10 bg-[#111820] px-4 py-1.5 text-sm font-bold text-emerald-400">
          {isLoading ? '…' : appointments.length} total
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-white/[0.08] bg-[#111820] p-4">
        <div className="relative flex min-w-[200px] flex-1 items-center md:max-w-xs md:flex-none lg:w-72">
          <Search className="pointer-events-none absolute left-3 text-gray-500" size={16} />
          <input
            type="search"
            placeholder="Search client, nutritionist, date…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0d1520] py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/40 focus:outline-none"
          />
        </div>
        <select
          value={filterNutritionist}
          onChange={(e) => setFilterNutritionist(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#0d1520] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
        >
          <option value="">All nutritionists</option>
          {nutOptions.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#0d1520] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
        >
          <option value="all">All statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#0d1520] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
        />
        <button
          type="button"
          onClick={clearFilters}
          className="text-sm text-gray-400 underline decoration-gray-600 underline-offset-2 hover:text-white"
        >
          Clear filters
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111820]">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-[#1a2535]" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-4xl">📭</p>
            <p className="mt-3 text-gray-500">No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full">
              <thead>
                <tr className="border-b border-white/5 bg-[#0d1520] text-left text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Nutritionist</th>
                  <th className="px-6 py-4">Date &amp; Time</th>
                  <th className="px-6 py-4">Session #</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((row) => {
                  const canAct = row.status === 'pending' || row.status === 'confirmed'
                  const busy = actingId === row.id
                  return (
                    <tr key={row.id} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-bold text-emerald-400">
                            {initials(row.clients?.name ?? '?')}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">{row.clients?.name ?? '—'}</p>
                            <p className="truncate text-xs text-gray-500">{row.clients?.email ?? ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{row.nutritionists?.name ?? '—'}</p>
                        <span className="mt-1 inline-block rounded-full border border-white/10 bg-[#0d1520] px-2 py-0.5 text-[10px] text-gray-400">
                          {(row.nutritionists?.bio || 'Nutritionist').slice(0, 48)}
                          {(row.nutritionists?.bio?.length ?? 0) > 48 ? '…' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{formatDate(row.scheduled_date)}</p>
                        <p className="text-sm text-gray-500">{formatTime(row.scheduled_time)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-400">
                          Session {row.session_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(row.status)}`}
                        >
                          {displayStatus(row.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {canAct ? (
                            <>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void onStatusUpdate(row.id, 'completed')}
                                className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                              >
                                Mark Complete
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void onStatusUpdate(row.id, 'cancelled')}
                                className="rounded-xl border border-red-500/25 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-600">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function AdminAppointmentsFallback() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-[#1a2535]" />
      <div className="mt-6 h-24 animate-pulse rounded-2xl bg-[#1a2535]" />
      <div className="mt-6 h-64 animate-pulse rounded-2xl bg-[#1a2535]" />
    </div>
  )
}

export default function AdminAppointmentsPage() {
  return (
    <Suspense fallback={<AdminAppointmentsFallback />}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
        <AdminAppointmentsInner />
      </motion.div>
    </Suspense>
  )
}
