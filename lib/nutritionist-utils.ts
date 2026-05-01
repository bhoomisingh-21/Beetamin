import type { SlotStatus } from '@/lib/nutritionist-types'

export function isoTodayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function mondayWeekBounds(): { start: string; end: string } {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  mon.setHours(0, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmt = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
  return { start: fmt(mon), end: fmt(sun) }
}

export function computeSlotStatus(appt: {
  scheduled_date: string
  scheduled_time: string
  status: string
}): SlotStatus {
  if (appt.status === 'completed') return 'Completed'
  const today = isoTodayLocal()
  if (appt.scheduled_date !== today) {
    return 'Upcoming'
  }
  const startMs = new Date(`${appt.scheduled_date}T${appt.scheduled_time}`).getTime()
  const endMs = startMs + 45 * 60 * 1000
  const now = Date.now()
  if (now >= startMs && now <= endMs) return 'In Progress'
  return 'Upcoming'
}
