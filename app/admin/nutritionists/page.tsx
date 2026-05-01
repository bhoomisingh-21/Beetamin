'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getNutritionistStats, type NutritionistWithAppointmentStats } from '@/lib/admin-queries'

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function AdminNutritionistsPage() {
  const router = useRouter()
  const [items, setItems] = useState<NutritionistWithAppointmentStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getNutritionistStats()
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-black text-3xl text-white">Nutritionists</h1>
        <span className="inline-flex w-fit rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-sm font-bold text-emerald-400">
          {loading ? '…' : `${items.length} active nutritionists`}
        </span>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-3xl bg-[#1a2535]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-12 text-center text-gray-500">No nutritionists in the database yet 🌿</p>
      ) : (
        <motion.div
          className="mt-8 grid gap-6 md:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        >
          {items.map((n) => {
            const initials = n.name
              .split(/\s+/)
              .map((w) => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
            const rate = n.total > 0 ? Math.round((n.completed / n.total) * 100) : 0
            return (
              <motion.div
                key={n.id}
                variants={cardVariants}
                transition={{ duration: 0.35 }}
                className="rounded-3xl border border-white/[0.08] bg-[#111820] p-6 transition hover:border-emerald-500/30"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-black text-2xl text-black">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-xl text-white">{n.name}</p>
                    <p className="truncate text-sm text-gray-400">{n.email}</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Total', value: n.total },
                    { label: 'Completed', value: n.completed },
                    { label: 'Upcoming', value: n.upcoming },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-[#0d1520] px-2 py-3">
                      <p className="font-black text-2xl tabular-nums text-white">{s.value}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-500">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <p className="text-xs text-gray-400">Completion rate {rate}%</p>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#0d1520]">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${rate}%` }} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/admin/appointments?nutritionist=${n.id}`)}
                  className="mt-4 w-full rounded-full border border-white/10 py-2 text-center text-sm text-gray-300 transition hover:border-emerald-500 hover:text-emerald-400"
                >
                  View Appointments
                </button>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
