'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { verifySignedCookieAsync } from '@/lib/nut-session-crypto-edge'
import { isAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function requireAdmin(): Promise<void> {
  const { userId } = await auth()
  if (userId) {
    try {
      const cc = await clerkClient()
      const u = await cc.users.getUser(userId)
      const email =
        u.primaryEmailAddress?.emailAddress ??
        u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ??
        u.emailAddresses?.[0]?.emailAddress ??
        ''
      if (isAdmin(email)) return
    } catch {
      /* fall through */
    }
  }
  const secret = process.env.COOKIE_SECRET
  if (secret) {
    const cookie = (await cookies()).get('nut-session')
    if (cookie?.value) {
      const raw = await verifySignedCookieAsync(cookie.value, secret)
      const email = raw?.toLowerCase().trim() ?? ''
      if (email && isAdmin(email)) return
    }
  }
  throw new Error('Unauthorized')
}

export type NutritionistWithAppointmentStats = {
  id: string
  clerk_user_id: string | null
  name: string
  email: string
  bio: string | null
  created_at: string
  total: number
  completed: number
  upcoming: number
  cancelled: number
}

export type AdminAppointmentRow = {
  id: string
  client_id: string
  nutritionist_id: string
  session_number: number
  scheduled_date: string
  scheduled_time: string
  reason: string | null
  status: string
  notes: string | null
  created_at: string
  clients: { id: string; name: string; email: string; phone: string | null } | null
  nutritionists: { id: string; name: string; email: string; bio: string | null } | null
}

export type PlatformAnalytics = {
  totalSessions: number
  completedSessions: number
  upcomingSessions: number
  totalClients: number
  totalLeads: number
  weekSessions: number
  todaySessions: number
}

export type ClientRowAdmin = {
  id: string
  clerk_user_id: string | null
  name: string
  email: string
  phone: string | null
  plan_start_date: string | null
  plan_end_date: string | null
  sessions_total: number | null
  sessions_used: number | null
  sessions_remaining: number | null
  status: string | null
  created_at: string | null
}

export type LeadRowAdmin = {
  id?: string
  name: string
  email: string
  phone: string | null
  source: string | null
  created_at: string | null
}

export type FunnelMetrics = {
  assessmentTakers: number
  leadsGenerated: number
  plansPurchased: number
}

export type DayCount = { date: string; label: string; count: number }

function todayDateIST(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Nutritionists with appointment counts (schema: appointments + nutritionists). */
export async function getNutritionistStats(): Promise<NutritionistWithAppointmentStats[]> {
  await requireAdmin()
  const { data: nutritionists, error } = await supabaseAdmin.from('nutritionists').select('*').order('name')
  if (error) throw error
  const rows = nutritionists ?? []

  const stats = await Promise.all(
    rows.map(async (n) => {
      const id = n.id as string
      const [{ count: total }, { count: completed }, { count: upcoming }, { count: cancelled }] =
        await Promise.all([
          supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true }).eq('nutritionist_id', id),
          supabaseAdmin
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('nutritionist_id', id)
            .eq('status', 'completed'),
          supabaseAdmin
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('nutritionist_id', id)
            .in('status', ['pending', 'confirmed']),
          supabaseAdmin
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('nutritionist_id', id)
            .in('status', ['cancelled', 'rejected']),
        ])
      return {
        ...(n as object),
        id,
        clerk_user_id: (n as { clerk_user_id?: string | null }).clerk_user_id ?? null,
        name: (n as { name: string }).name,
        email: (n as { email: string }).email,
        bio: (n as { bio?: string | null }).bio ?? null,
        created_at: (n as { created_at: string }).created_at,
        total: total ?? 0,
        completed: completed ?? 0,
        upcoming: upcoming ?? 0,
        cancelled: cancelled ?? 0,
      } as NutritionistWithAppointmentStats
    })
  )
  return stats
}

export async function getAllAppointments(filters?: {
  nutritionist_id?: string
  status?: string
  search?: string
  date?: string
}): Promise<AdminAppointmentRow[]> {
  await requireAdmin()
  let query = supabaseAdmin
    .from('appointments')
    .select(
      `
      *,
      clients(id, name, email, phone),
      nutritionists(id, name, email, bio)
    `
    )
    .order('scheduled_date', { ascending: false })
    .order('scheduled_time', { ascending: false })

  if (filters?.nutritionist_id) query = query.eq('nutritionist_id', filters.nutritionist_id)
  if (filters?.status && filters.status !== 'all') {
    const s = filters.status
    if (s === 'upcoming') query = query.in('status', ['pending', 'confirmed'])
    else if (s === 'cancelled') query = query.in('status', ['cancelled', 'rejected'])
    else query = query.eq('status', s)
  }
  if (filters?.date) {
    query = query.eq('scheduled_date', filters.date)
  }

  const { data, error } = await query
  if (error) throw error
  let rows = (data ?? []) as AdminAppointmentRow[]

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim()
    if (q) {
      rows = rows.filter((row) => {
        const c = row.clients
        const n = row.nutritionists
        const dt = `${row.scheduled_date} ${row.scheduled_time}`
        return (
          Boolean(c?.name?.toLowerCase().includes(q)) ||
          Boolean(c?.email?.toLowerCase().includes(q)) ||
          Boolean(n?.name?.toLowerCase().includes(q)) ||
          Boolean(n?.email?.toLowerCase().includes(q)) ||
          dt.includes(q)
        )
      })
    }
  }

  return rows
}

export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  await requireAdmin()
  const [{ count: totalSessions }, { count: completedSessions }, { count: upcomingSessions }] = await Promise.all([
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true }).in('status', ['pending', 'confirmed']),
  ])

  const { count: totalClients } = await supabaseAdmin.from('clients').select('*', { count: 'exact', head: true })

  const { count: totalLeads } = await supabaseAdmin.from('leads').select('*', { count: 'exact', head: true })

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { count: weekSessions } = await supabaseAdmin
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString())

  const today = todayDateIST()
  const { count: todaySessions } = await supabaseAdmin
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('scheduled_date', today)

  return {
    totalSessions: totalSessions ?? 0,
    completedSessions: completedSessions ?? 0,
    upcomingSessions: upcomingSessions ?? 0,
    totalClients: totalClients ?? 0,
    totalLeads: totalLeads ?? 0,
    weekSessions: weekSessions ?? 0,
    todaySessions: todaySessions ?? 0,
  }
}

export async function getAllClients(): Promise<ClientRowAdmin[]> {
  await requireAdmin()
  const { data, error } = await supabaseAdmin.from('clients').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ClientRowAdmin[]
}

export async function getAllLeads(): Promise<LeadRowAdmin[]> {
  await requireAdmin()
  const { data, error } = await supabaseAdmin.from('leads').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as LeadRowAdmin[]
}

const ALLOWED_APPOINTMENT_STATUS = new Set(['pending', 'confirmed', 'rejected', 'completed', 'cancelled'])

export async function updateAppointmentStatus(appointmentId: string, status: string): Promise<AdminAppointmentRow> {
  await requireAdmin()
  if (!ALLOWED_APPOINTMENT_STATUS.has(status)) throw new Error('Invalid status')
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)
    .select(
      `
      *,
      clients(id, name, email, phone),
      nutritionists(id, name, email, bio)
    `
    )
    .single()
  if (error) throw error
  return data as AdminAppointmentRow
}

export async function getAppointmentCountsLast7Days(): Promise<DayCount[]> {
  await requireAdmin()
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const result: DayCount[] = []
  const now = new Date()

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000)
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d)

    const { count } = await supabaseAdmin
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('scheduled_date', dateStr)

    const parts = dateStr.split('-').map(Number)
    const y = parts[0]!
    const m = parts[1]!
    const day = parts[2]!
    const dow = new Date(Date.UTC(y, m - 1, day)).getUTCDay()

    result.push({
      date: dateStr,
      label: labels[dow] ?? '—',
      count: count ?? 0,
    })
  }

  return result
}

export async function getFunnelMetrics(): Promise<FunnelMetrics> {
  await requireAdmin()
  const [{ count: assessmentTakers }, { count: leadsGenerated }, { count: plansPurchased }] = await Promise.all([
    supabaseAdmin.from('detailed_assessments').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('leads').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('paid_reports').select('*', { count: 'exact', head: true }),
  ])

  return {
    assessmentTakers: assessmentTakers ?? 0,
    leadsGenerated: leadsGenerated ?? 0,
    plansPurchased: plansPurchased ?? 0,
  }
}

export async function getTodaysAppointmentsAdmin(): Promise<AdminAppointmentRow[]> {
  await requireAdmin()
  const today = todayDateIST()
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select(
      `
      *,
      clients(id, name, email, phone),
      nutritionists(id, name, email, bio)
    `
    )
    .eq('scheduled_date', today)
    .order('scheduled_time', { ascending: true })

  if (error) throw error
  return (data ?? []) as AdminAppointmentRow[]
}
