'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, Save, Plus, Trash2, ChevronLeft, CheckCircle } from 'lucide-react'
import {
  getAvailability,
  saveAvailability,
  type AvailabilitySlot,
} from '@/lib/nutritionist-actions'
import { portal } from '@/components/nutritionist-portal/portal-theme'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DEFAULT_SLOTS: AvailabilitySlot[] = [
  { day_of_week: 1, start_time: '10:00', end_time: '13:00', is_active: true },
  { day_of_week: 2, start_time: '10:00', end_time: '13:00', is_active: true },
  { day_of_week: 3, start_time: '10:00', end_time: '13:00', is_active: true },
  { day_of_week: 4, start_time: '10:00', end_time: '13:00', is_active: true },
  { day_of_week: 5, start_time: '10:00', end_time: '13:00', is_active: true },
]

function generateHalfHours(): string[] {
  const times: string[] = []
  for (let h = 7; h <= 21; h++) {
    for (const m of [0, 30]) {
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return times
}
const TIME_OPTIONS = generateHalfHours()

function formatTimeLabel(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`
}

export default function AvailabilityPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [slots, setSlots] = useState<AvailabilitySlot[]>(DEFAULT_SLOTS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!isLoaded || !user) return
    getAvailability().then((data) => {
      if (data.length > 0) setSlots(data)
      else setSlots(DEFAULT_SLOTS)
      setIsLoading(false)
    }).catch(() => {
      router.push('/nutritionist')
    })
  }, [isLoaded, user, router])

  function addSlot(dayOfWeek: number) {
    setSlots((prev) => [
      ...prev,
      { day_of_week: dayOfWeek, start_time: '09:00', end_time: '12:00', is_active: true },
    ])
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index))
  }

  function updateSlot(index: number, field: keyof AvailabilitySlot, value: string | boolean | number) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      await saveAvailability(slots)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    )
  }

  const slotsByDay = DAYS.map((_, dow) => ({
    dow,
    daySlots: slots
      .map((s, idx) => ({ ...s, idx }))
      .filter((s) => s.day_of_week === dow),
  }))

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={() => router.push('/nutritionist')}
        className={portal.backBtn}
      >
        <ChevronLeft size={18} aria-hidden />
        Back to portal dashboard
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
          AVAILABILITY
        </p>
        <h1 className={`mt-2 text-3xl font-black ${portal.textH}`}>Set Your Schedule</h1>
        <p className={`mt-1 ${portal.textMuted}`}>
          Clients will only be able to book sessions during these time blocks.
          Each session is 30 minutes.
        </p>
        <div className={portal.accentBar} aria-hidden />
      </motion.div>

      <div className="space-y-4">
        {slotsByDay.map(({ dow, daySlots }) => (
          <motion.div
            key={dow}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: dow * 0.04 }}
            className={`${portal.card} p-5`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className={`font-bold ${portal.textH}`}>{DAYS[dow]}</h3>
              <button
                onClick={() => addSlot(dow)}
                className="flex items-center gap-1.5 text-sm text-emerald-700 transition hover:text-emerald-600"
              >
                <Plus size={14} />
                Add block
              </button>
            </div>

            {daySlots.length === 0 ? (
              <p className={`text-sm ${portal.textMuted}`}>No availability — click &quot;Add block&quot; to add one</p>
            ) : (
              <div className="space-y-3">
                {daySlots.map(({ idx, is_active, start_time, end_time }) => (
                  <div key={idx} className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => updateSlot(idx, 'is_active', !is_active)}
                      className={`h-5 w-10 shrink-0 rounded-full transition-colors ${
                        is_active ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`mx-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                        is_active ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>

                    <select
                      value={start_time}
                      onChange={(e) => updateSlot(idx, 'start_time', e.target.value)}
                      disabled={!is_active}
                      className={`rounded-xl px-3 py-2 text-sm disabled:opacity-40 ${portal.input}`}
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{formatTimeLabel(t)}</option>
                      ))}
                    </select>

                    <span className={`text-sm ${portal.textMuted}`}>to</span>

                    <select
                      value={end_time}
                      onChange={(e) => updateSlot(idx, 'end_time', e.target.value)}
                      disabled={!is_active}
                      className={`rounded-xl px-3 py-2 text-sm disabled:opacity-40 ${portal.input}`}
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{formatTimeLabel(t)}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => removeSlot(idx)}
                      className="ml-auto text-slate-400 transition hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="pb-8">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-5 text-lg font-black text-white transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle size={20} />
              Saved!
            </>
          ) : (
            <>
              <Save size={20} />
              Save Availability
            </>
          )}
        </button>
      </div>
    </div>
  )
}
