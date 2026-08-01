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

export type SessionSlotState = 'completed' | 'confirmed' | 'pending' | 'active_empty' | 'locked'

export type SessionSlotAppointment = {
  id: string
  session_number: number
  status: string
  scheduled_date: string
  scheduled_time: string
  meet_link?: string | null
  google_event_id?: string | null
  notes?: string | null
}

export type SessionSlot = {
  sessionNumber: number
  state: SessionSlotState
  appointment: SessionSlotAppointment | null
}

/**
 * Turns a client's raw appointment rows into a fixed 1..sessionsTotal sequence where
 * only one slot is ever "active" at a time — everything before it is completed,
 * everything after is locked. This is what powers the nutritionist's per-client
 * "Session 1 / Session 2 / …" dashboard and the one-click "Generate Meet Link" flow.
 */
export function computeSessionSlots(
  sessionsTotal: number,
  sessionsUsed: number,
  appointments: SessionSlotAppointment[],
): SessionSlot[] {
  const total = Math.max(0, Math.min(Number(sessionsTotal) || 0, 24))
  const activeNumber = Math.max(1, (Number(sessionsUsed) || 0) + 1)
  const relevant = appointments.filter((a) => ['pending', 'confirmed', 'completed'].includes(a.status))

  const slots: SessionSlot[] = []
  for (let n = 1; n <= total; n++) {
    const row =
      relevant
        .filter((a) => a.session_number === n)
        .sort((a, b) =>
          `${b.scheduled_date}T${b.scheduled_time}`.localeCompare(`${a.scheduled_date}T${a.scheduled_time}`),
        )[0] ?? null

    let state: SessionSlotState
    if (n < activeNumber) {
      state = 'completed'
    } else if (n === activeNumber) {
      state = row ? (row.status as SessionSlotState) : 'active_empty'
    } else {
      state = 'locked'
    }
    slots.push({ sessionNumber: n, state, appointment: row })
  }
  return slots
}

/** Inline HTML snippet with a real Join button when a Meet link exists, else a "coming shortly" note. */
export function meetLinkEmailSection(meetLink: string | null): string {
  if (meetLink) {
    return `
      <a href="${meetLink}" style="background:#10B981;color:black;padding:16px 32px;border-radius:50px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:8px;">
        Join Google Meet →
      </a>
      <p style="color:#6B7280;font-size:12px;margin-top:12px;word-break:break-all;">Meet link: ${meetLink}</p>
    `
  }
  return `<p style="color:#F59E0B;">Your Google Meet link is being generated and will appear on your Beetamin dashboard shortly.</p>`
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
