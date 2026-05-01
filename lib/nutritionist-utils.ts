import type { SessionDotState, SlotStatus } from '@/lib/nutritionist-types'

/** Map session slots 1–6 to strongest appointment state for UI dots. */
export function sessionStatesFromAppointments(
  rows: { session_number: number; status: string }[],
): Partial<Record<number, SessionDotState>> {
  const out: Partial<Record<number, SessionDotState>> = {}
  for (let i = 1; i <= 6; i++) out[i] = null
  for (const a of rows) {
    const n = a.session_number
    if (n < 1 || n > 6) continue
    const st = String(a.status)
    const prev = out[n]
    if (st === 'completed') {
      out[n] = 'completed'
    } else if (st === 'confirmed') {
      if (prev !== 'completed') out[n] = 'confirmed'
    } else if (st === 'pending') {
      if (prev == null) out[n] = 'pending'
    }
  }
  return out
}

/** Avatar background seeded by first character of name (nutritionist portal spec). */
export function avatarPaletteFromName(name: string): string {
  const colors = [
    '#10b981',
    '#3b82f6',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#f97316',
  ]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

/** Tailwind classes for tag pills (hash-stable per tag string). */
export function tagColorClass(tag: string): string {
  const colors = [
    'bg-red-500/20 text-red-400 border-red-500/30',
    'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'bg-gray-500/20 text-gray-400 border-gray-500/30',
  ]
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

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
