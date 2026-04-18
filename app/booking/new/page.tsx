'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { Loader2, Leaf, CalendarDays, ChevronDown, CheckCircle } from 'lucide-react'
import {
  getNutritionists,
  getAvailableSlots,
  getAvailabilityDays,
  requestAppointment,
  checkClientEligibility,
  type NutritionistRow,
} from '@/lib/booking-actions'
import CalendarPicker from '@/components/ui/CalendarPicker'

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`
}

export default function NewBookingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const [isVerifying, setIsVerifying] = useState(true)
  const [nutritionists, setNutritionists] = useState<NutritionistRow[]>([])
  const [selectedNutritionist, setSelectedNutritionist] = useState<NutritionistRow | null>(null)
  const [nutritionistOpen, setNutritionistOpen] = useState(false)

  const [availableDays, setAvailableDays] = useState<number[]>([])
  const [calOpen, setCalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Guard: verify eligibility
  useEffect(() => {
    if (!isLoaded || !user) return
    checkClientEligibility(user.id).then((r) => {
      if (!r.eligible) router.push('/booking')
      else setIsVerifying(false)
    })
  }, [isLoaded, user, router])

  // Load nutritionists
  useEffect(() => {
    getNutritionists().then(setNutritionists)
  }, [])

  // Load availability days when nutritionist selected
  useEffect(() => {
    if (!selectedNutritionist) return
    setSelectedDate(null); setSelectedTime(null); setTimeSlots([])
    getAvailabilityDays(selectedNutritionist.id).then(setAvailableDays)
  }, [selectedNutritionist])

  // Load time slots when date changes
  useEffect(() => {
    if (!selectedNutritionist || !selectedDate) return
    setSelectedTime(null); setIsLoadingSlots(true)
    getAvailableSlots(selectedNutritionist.id, selectedDate.toISOString().split('T')[0])
      .then(setTimeSlots)
      .finally(() => setIsLoadingSlots(false))
  }, [selectedDate, selectedNutritionist])

  async function handleSubmit() {
    if (!selectedNutritionist || !selectedDate || !selectedTime) return
    setIsSubmitting(true); setError('')
    try {
      await requestAppointment({
        nutritionistId: selectedNutritionist.id,
        scheduledDate: selectedDate.toISOString().split('T')[0],
        scheduledTime: selectedTime,
        reason: [reason, notes].filter(Boolean).join(' | ') || undefined,
      })
      const params = new URLSearchParams({
        nutritionist: selectedNutritionist.name,
        date: selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }),
        time: formatTime(selectedTime),
      })
      router.push(`/booking/success?${params.toString()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsSubmitting(false)
    }
  }

  if (!isLoaded || isVerifying) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    )
  }

  const dateDisplay = selectedDate
    ? `${selectedDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}${selectedTime ? ` – ${formatTime(selectedTime)}` : ''}`
    : null

  const canSubmit = !!(selectedNutritionist && selectedDate && selectedTime)

  return (
    <div className="min-h-screen bg-[#0A0F14] flex flex-col">
      {/* Top bar */}
      <div className="bg-[#0A0F14]/90 border-b border-white/5 px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => router.push('/booking/dashboard')}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition"
        >
          <Leaf className="text-emerald-500" size={16} />
          <span className="text-white font-bold">TheBeetamin</span>
        </button>
        <span className="text-gray-700">/</span>
        <button
          onClick={() => router.push('/booking/dashboard')}
          className="text-gray-400 hover:text-white text-sm transition"
        >
          My Sessions
        </button>
        <span className="text-gray-700">/</span>
        <span className="text-gray-400 text-sm">New Appointment</span>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <h1 className="text-white font-black text-3xl">New Appointment</h1>
            <p className="text-gray-400 mt-1 text-sm">Request a new session in seconds.</p>

            {/* Main form card */}
            <div className="bg-[#111820] border border-white/[0.08] rounded-3xl p-7 mt-6 space-y-6">

              {/* ─ Nutritionist dropdown ─ */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">Nutritionist</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNutritionistOpen(!nutritionistOpen)}
                    className="w-full flex items-center justify-between bg-[#0A0F14] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-left transition hover:border-white/20 focus:border-emerald-500 focus:outline-none"
                  >
                    <span className={selectedNutritionist ? 'text-white' : 'text-gray-500'}>
                      {selectedNutritionist ? selectedNutritionist.name : 'Select a nutritionist'}
                    </span>
                    <ChevronDown className={`text-gray-500 transition-transform ${nutritionistOpen ? 'rotate-180' : ''}`} size={16} />
                  </button>
                  {nutritionistOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a2330] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl">
                      {nutritionists.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => { setSelectedNutritionist(n); setNutritionistOpen(false) }}
                          className={`w-full text-left px-4 py-3.5 text-sm flex items-center gap-3 hover:bg-white/5 transition ${
                            selectedNutritionist?.id === n.id ? 'text-emerald-400' : 'text-white'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                            {n.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{n.name}</p>
                            {n.bio && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{n.bio}</p>}
                          </div>
                          {selectedNutritionist?.id === n.id && <CheckCircle className="text-emerald-400 ml-auto shrink-0" size={14} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ─ Date + Time ─ */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">Expected appointment date</label>
                <button
                  type="button"
                  disabled={!selectedNutritionist}
                  onClick={() => setCalOpen(!calOpen)}
                  className="w-full flex items-center gap-3 bg-[#0A0F14] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-left transition hover:border-white/20 focus:border-emerald-500 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CalendarDays className="text-gray-500 shrink-0" size={16} />
                  <span className={dateDisplay ? 'text-white' : 'text-gray-500'}>
                    {dateDisplay || (selectedNutritionist ? 'Select date & time' : 'Choose a nutritionist first')}
                  </span>
                </button>

                {/* Calendar dropdown */}
                {calOpen && selectedNutritionist && (
                  <div className="mt-2 bg-[#0A0F14] border border-white/10 rounded-2xl p-4">
                    <CalendarPicker
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date)
                        setSelectedTime(null)
                      }}
                      availableDays={availableDays}
                    />
                    {availableDays.length === 0 && (
                      <p className="text-amber-400 text-xs mt-2">No availability set — try another nutritionist.</p>
                    )}

                    {/* Time slots */}
                    {selectedDate && (
                      <div className="mt-4 border-t border-white/5 pt-4">
                        <p className="text-gray-400 text-xs font-medium mb-3">Available times on{' '}
                          {selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                        {isLoadingSlots ? (
                          <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <Loader2 className="animate-spin" size={12} /> Loading slots...
                          </div>
                        ) : timeSlots.length === 0 ? (
                          <p className="text-gray-500 text-xs">No slots available. Pick another day.</p>
                        ) : (
                          <div className="grid grid-cols-4 gap-2">
                            {timeSlots.map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => { setSelectedTime(slot); setCalOpen(false) }}
                                className={`rounded-xl py-2.5 text-xs font-medium transition border ${
                                  selectedTime === slot
                                    ? 'bg-emerald-500 border-emerald-500 text-black font-bold'
                                    : 'bg-[#111820] border-white/10 text-gray-300 hover:border-emerald-500/50'
                                }`}
                              >
                                {formatTime(slot)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ─ Reason + Notes ─ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Appointment reason
                    <span className="text-gray-600 font-normal ml-1">(optional)</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Annual monthly check-up..."
                    rows={3}
                    className="w-full bg-[#0A0F14] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Comments / notes
                    <span className="text-gray-600 font-normal ml-1">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Prefer afternoon appointments, if possible..."
                    rows={3}
                    className="w-full bg-[#0A0F14] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* ─ Error ─ */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {/* ─ Submit ─ */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-base rounded-2xl py-4 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="animate-spin" size={18} /> Submitting...</>
                ) : (
                  'Submit Appointment'
                )}
              </button>
            </div>

            {/* Back link */}
            <p className="text-center text-gray-600 text-xs mt-4">
              <button onClick={() => router.push('/booking/dashboard')} className="hover:text-gray-400 transition underline">
                ← Back to My Sessions
              </button>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
