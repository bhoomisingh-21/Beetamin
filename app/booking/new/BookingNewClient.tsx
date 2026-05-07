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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1.5">{children}</label>
}

/** Only mounted when session booking tier (₹3999 Full Plan) validated on the server. */
export default function BookingNewClient() {
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

  useEffect(() => {
    if (!isLoaded || !user) return
    checkClientEligibility(user.id).then((r) => {
      if (!r.eligible) router.push('/booking')
      else setIsVerifying(false)
    })
  }, [isLoaded, user, router])

  useEffect(() => {
    getNutritionists().then(setNutritionists)
  }, [])

  useEffect(() => {
    if (!selectedNutritionist) return
    setSelectedDate(null)
    setSelectedTime(null)
    setTimeSlots([])
    getAvailabilityDays(selectedNutritionist.id).then(setAvailableDays)
  }, [selectedNutritionist])

  useEffect(() => {
    if (!selectedNutritionist || !selectedDate) return
    setSelectedTime(null)
    setIsLoadingSlots(true)
    getAvailableSlots(selectedNutritionist.id, selectedDate.toISOString().split('T')[0])
      .then(setTimeSlots)
      .finally(() => setIsLoadingSlots(false))
  }, [selectedDate, selectedNutritionist])

  async function handleSubmit() {
    if (!selectedNutritionist || !selectedDate || !selectedTime) return
    setIsSubmitting(true)
    setError('')
    try {
      await requestAppointment({
        nutritionistId: selectedNutritionist.id,
        scheduledDate: selectedDate.toISOString().split('T')[0],
        scheduledTime: selectedTime,
        reason: [reason, notes].filter(Boolean).join(' | ') || undefined,
      })
      const params = new URLSearchParams({
        nutritionist: selectedNutritionist.name,
        date: selectedDate.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    )
  }

  const dateDisplay = selectedDate
    ? `${selectedDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })}${selectedTime ? ` – ${formatTime(selectedTime)}` : ''}`
    : null

  const canSubmit = !!(selectedNutritionist && selectedDate && selectedTime)

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm bg-white placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar — match profile setup */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push('/sessions')}
          className="flex items-center gap-2 text-left"
        >
          <Leaf className="text-emerald-500 shrink-0" size={18} />
          <span className="text-gray-900 font-bold">TheBeetamin</span>
        </button>
        <div className="flex items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => router.push('/sessions')}
            className="text-gray-400 hover:text-gray-600 text-sm transition"
          >
            ← My Sessions
          </button>
          {user?.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt="" className="w-8 h-8 rounded-full ring-2 ring-gray-100" />
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Form column — centered on mobile */}
        <div className="flex-1 flex flex-col items-center px-4 py-8 sm:py-10 lg:py-12 lg:justify-center">
          <div className="w-full max-w-xl mx-auto text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <h1 className="text-gray-900 font-black text-2xl sm:text-3xl tracking-tight">Book a session</h1>
              <p className="text-gray-500 mt-1 text-sm max-w-md mx-auto lg:mx-0">
                Choose your nutritionist, pick an open slot, and send your request in one go.
              </p>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 mt-6 sm:mt-8 text-left">
                <div className="space-y-6">
                  {/* Nutritionist */}
                  <div>
                    <FieldLabel>Nutritionist</FieldLabel>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setNutritionistOpen(!nutritionistOpen)}
                        className={`w-full flex items-center justify-between rounded-xl px-4 py-3.5 text-sm text-left transition ${inputClass}`}
                      >
                        <span className={selectedNutritionist ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                          {selectedNutritionist ? selectedNutritionist.name : 'Select a nutritionist'}
                        </span>
                        <ChevronDown
                          className={`text-gray-400 shrink-0 transition-transform ${nutritionistOpen ? 'rotate-180' : ''}`}
                          size={18}
                        />
                      </button>
                      {nutritionistOpen && (
                        <div className="absolute top-full left-0 right-0 z-20 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                          {nutritionists.map((n) => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => {
                                setSelectedNutritionist(n)
                                setNutritionistOpen(false)
                              }}
                              className={`w-full text-left px-4 py-3.5 text-sm flex items-center gap-3 hover:bg-gray-50 transition ${
                                selectedNutritionist?.id === n.id ? 'bg-emerald-50' : ''
                              }`}
                            >
                              <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200/80 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                                {n.name.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900">{n.name}</p>
                                {n.bio && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{n.bio}</p>}
                              </div>
                              {selectedNutritionist?.id === n.id && (
                                <CheckCircle className="text-emerald-600 shrink-0" size={18} />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date + time */}
                  <div>
                    <FieldLabel>Date & time</FieldLabel>
                    <button
                      type="button"
                      disabled={!selectedNutritionist}
                      onClick={() => setCalOpen(!calOpen)}
                      className={`w-full flex items-center justify-center sm:justify-start gap-3 rounded-xl px-4 py-3.5 text-sm transition disabled:opacity-45 disabled:cursor-not-allowed ${inputClass}`}
                    >
                      <CalendarDays className="text-emerald-600 shrink-0" size={18} />
                      <span className={dateDisplay ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                        {dateDisplay || (selectedNutritionist ? 'Select date & time' : 'Choose a nutritionist first')}
                      </span>
                    </button>

                    {calOpen && selectedNutritionist && (
                      <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50/80 p-4 sm:p-5 space-y-4">
                        <div className="flex justify-center">
                          <CalendarPicker
                            selected={selectedDate}
                            onSelect={(date) => {
                              setSelectedDate(date)
                              setSelectedTime(null)
                            }}
                            availableDays={availableDays}
                          />
                        </div>
                        {availableDays.length === 0 && (
                          <p className="text-amber-700 text-xs text-center">No availability set — try another nutritionist.</p>
                        )}

                        {selectedDate && (
                          <div className="border-t border-gray-200 pt-4">
                            <p className="text-gray-500 text-xs font-medium mb-3 text-center sm:text-left">
                              Available on{' '}
                              {selectedDate.toLocaleDateString('en-IN', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'short',
                              })}
                            </p>
                            {isLoadingSlots ? (
                              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm py-2">
                                <Loader2 className="animate-spin text-emerald-600" size={16} /> Loading slots…
                              </div>
                            ) : timeSlots.length === 0 ? (
                              <p className="text-gray-500 text-sm text-center">No slots that day. Try another date.</p>
                            ) : (
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-w-md mx-auto sm:max-w-none">
                                {timeSlots.map((slot) => (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => {
                                      setSelectedTime(slot)
                                      setCalOpen(false)
                                    }}
                                    className={`rounded-xl py-2.5 px-1 text-xs font-semibold transition border ${
                                      selectedTime === slot
                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50/50'
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

                  {/* Notes */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>
                        Reason <span className="text-gray-400 font-normal">(optional)</span>
                      </FieldLabel>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. follow-up on iron levels"
                        rows={3}
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                    <div>
                      <FieldLabel>
                        Notes <span className="text-gray-400 font-normal">(optional)</span>
                      </FieldLabel>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Anything your nutritionist should know"
                        rows={3}
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 text-center sm:text-left">
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                    className="w-full max-w-sm mx-auto lg:max-w-none flex bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base rounded-2xl py-3.5 sm:py-4 transition items-center justify-center gap-2 shadow-sm shadow-emerald-500/20"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} /> Submitting…
                      </>
                    ) : (
                      'Submit request'
                    )}
                  </button>
                </div>
              </div>

              <p className="text-center text-gray-400 text-xs mt-5">
                <button
                  type="button"
                  onClick={() => router.push('/sessions')}
                  className="hover:text-gray-600 transition underline underline-offset-2"
                >
                  ← Back to My Sessions
                </button>
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right panel — desktop only, aligned with onboard */}
        <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-[#0A1A10]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1517245386807-bb43f82e33f4?w=900&auto=format&fit=crop&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="relative z-10 flex flex-col justify-center px-12 py-16">
            <span className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-widest uppercase rounded-full px-3 py-1 mb-6 w-fit">
              📅 Schedule a session
            </span>
            <h2 className="text-white font-black text-3xl leading-tight">
              Your next check-in
              <br />
              <span className="text-emerald-400">starts here.</span>
            </h2>
            <p className="text-gray-400 text-sm mt-4 leading-relaxed max-w-sm">
              Pick a nutritionist, choose a slot that fits your calendar, and we&apos;ll notify them right away.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                'Live availability from your nutritionist',
                'One request — no back-and-forth',
                'Session counts toward your plan',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                  <span className="text-gray-300 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
