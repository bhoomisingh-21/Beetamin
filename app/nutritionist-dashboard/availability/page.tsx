'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, Save, Plus, Trash2, ChevronLeft, CheckCircle } from 'lucide-react'
import {
  getAvailabilityByEmail,
  saveAvailabilityByEmail,
  type AvailabilitySlot,
} from '@/lib/nutritionist-actions'
import { isNutritionistEmail } from '@/lib/nutritionist-config'
import { supabase } from '@/lib/supabase'

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
  const router = useRouter()
  const [nutEmail, setNutEmail] = useState<string | null>(null)
  const [slots, setSlots] = useState<AvailabilitySlot[]>(DEFAULT_SLOTS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/sign-in'); return }
      const email = session.user.email ?? ''
      if (!isNutritionistEmail(email)) { router.replace('/sign-in'); return }
      setNutEmail(email)
      const data = await getAvailabilityByEmail(email)
      setSlots(data.length > 0 ? data : DEFAULT_SLOTS)
      setIsLoading(false)
    })
  }, [router])

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
    if (!nutEmail) return
    setIsSaving(true)
    try {
      await saveAvailabilityByEmail(slots, nutEmail)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    )
  }

  const slotsByDay = DAYS.map((_, dow) => ({
    dow,
    daySlots: slots.map((s, idx) => ({ ...s, idx })).filter((s) => s.day_of_week === dow),
  }))

  return (
    <div className="min-h-screen bg-[#0A0F14] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push('/nutritionist-dashboard')}
          className="mb-6 flex min-h-[48px] w-full max-w-xs items-center gap-2 rounded-xl px-2 text-gray-400 transition hover:text-white sm:w-auto sm:max-w-none"
        >
          <ChevronLeft size={18} aria-hidden />
          Back to quick dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase">AVAILABILITY</p>
          <h1 className="text-white font-black text-3xl mt-2">Set Your Schedule</h1>
          <p className="text-gray-400 mt-1">
            Clients will only be able to book sessions during these time blocks. Each session is 30 minutes.
          </p>
        </motion.div>

        <div className="mt-8 space-y-4">
          {slotsByDay.map(({ dow, daySlots }) => (
            <motion.div
              key={dow}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: dow * 0.04 }}
              className="bg-[#111820] border border-white/[0.08] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold">{DAYS[dow]}</h3>
                <button
                  onClick={() => addSlot(dow)}
                  className="flex items-center gap-1.5 text-emerald-400 text-sm hover:text-emerald-300 transition"
                >
                  <Plus size={14} /> Add block
                </button>
              </div>

              {daySlots.length === 0 ? (
                <p className="text-gray-600 text-sm">No availability — click &quot;Add block&quot; to add one</p>
              ) : (
                <div className="space-y-3">
                  {daySlots.map(({ idx, is_active, start_time, end_time }) => (
                    <div key={idx} className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => updateSlot(idx, 'is_active', !is_active)}
                        className={`w-10 h-5 rounded-full transition-colors shrink-0 ${is_active ? 'bg-emerald-500' : 'bg-gray-700'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                      <select
                        value={start_time}
                        onChange={(e) => updateSlot(idx, 'start_time', e.target.value)}
                        disabled={!is_active}
                        className="bg-[#0A0F14] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none disabled:opacity-40"
                      >
                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{formatTimeLabel(t)}</option>)}
                      </select>
                      <span className="text-gray-500 text-sm">to</span>
                      <select
                        value={end_time}
                        onChange={(e) => updateSlot(idx, 'end_time', e.target.value)}
                        disabled={!is_active}
                        className="bg-[#0A0F14] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none disabled:opacity-40"
                      >
                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{formatTimeLabel(t)}</option>)}
                      </select>
                      <button onClick={() => removeSlot(idx)} className="text-gray-600 hover:text-red-400 transition ml-auto">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-8 pb-8">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg rounded-2xl py-5 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSaving ? <><Loader2 className="animate-spin" size={20} />Saving...</>
              : saved ? <><CheckCircle size={20} />Saved!</>
              : <><Save size={20} />Save Availability</>}
          </button>
        </div>
      </div>
    </div>
  )
}
