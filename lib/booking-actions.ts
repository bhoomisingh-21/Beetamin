'use server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from './supabase-admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientRow = {
  id: string
  clerk_user_id: string
  name: string
  email: string
  phone: string
  plan_start_date: string
  plan_end_date: string
  sessions_total: number
  sessions_used: number
  sessions_remaining: number
  status: 'active' | 'expired' | 'completed'
  assessment_goal?: string
  assessment_result?: unknown
  assessment_meta?: unknown
  height_cm?: number | null
}

export type CreateClientProfileResult =
  | { success: true; client: ClientRow }
  | { success: false; message: string }

const CREATE_CLIENT_PROFILE_ERROR_MESSAGE =
  'We could not save your profile. Please try again in a moment.'

export type AppointmentRow = {
  id: string
  client_id: string
  nutritionist_id: string
  session_number: number
  scheduled_date: string
  scheduled_time: string
  reason?: string
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled'
  notes?: string
  reminder_24h_sent: boolean
  reminder_1h_sent: boolean
  created_at: string
  nutritionists?: { name: string; email: string }
}

export type NutritionistRow = {
  id: string
  clerk_user_id: string
  name: string
  email: string
  bio?: string
}

// ─── Client helpers ───────────────────────────────────────────────────────────

export async function getClientByClerkId(clerkUserId: string): Promise<ClientRow | null> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as ClientRow | null
}

export async function checkClientEligibility(clerkUserId: string) {
  const client = await getClientByClerkId(clerkUserId)
  if (!client) return { eligible: false, reason: 'no_plan', client: null }

  const now = new Date()
  const endDate = new Date(client.plan_end_date)

  if (now > endDate) {
    await supabaseAdmin.from('clients').update({ status: 'expired' }).eq('id', client.id)
    return { eligible: false, reason: 'expired', client }
  }
  if (client.sessions_remaining <= 0) {
    await supabaseAdmin.from('clients').update({ status: 'completed' }).eq('id', client.id)
    return { eligible: false, reason: 'no_sessions', client }
  }
  return { eligible: true, reason: 'ok', client }
}

export async function saveAssessmentToProfile(input: {
  clerkUserId: string
  assessmentResult: unknown
  assessmentMeta: unknown | null
}) {
  const { userId } = await auth()
  if (!userId || userId !== input.clerkUserId) throw new Error('Not authenticated')

  const existing = await getClientByClerkId(userId)
  const patch = {
    assessment_result: input.assessmentResult,
    assessment_meta: input.assessmentMeta,
  }

  if (existing) {
    const { error } = await supabaseAdmin.from('clients').update(patch).eq('clerk_user_id', userId)
    if (error) throw new Error(error.message)
    return
  }

  const clerkUser = await currentUser()
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? `noemail_${userId}@beetamin.internal`
  const startDate = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 3)

  const { error } = await supabaseAdmin.from('clients').upsert(
    {
      clerk_user_id: userId,
      name: clerkUser?.fullName || clerkUser?.firstName || 'User',
      email,
      phone: '',
      ...patch,
      plan_start_date: startDate.toISOString().split('T')[0],
      plan_end_date: endDate.toISOString().split('T')[0],
      status: 'active',
      sessions_total: 6,
      sessions_used: 0,
      sessions_remaining: 6,
    },
    { onConflict: 'email' },
  )
  if (error) throw new Error(error.message)
}

export async function createClientProfile(data: {
  name: string
  phone: string
  goal?: string
}): Promise<CreateClientProfileResult> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, message: 'Please sign in again to complete setup.' }
    }

    const existing = await getClientByClerkId(userId)
    const clerkUser = await currentUser()
    const nameFromForm = data.name?.trim()
    const displayName =
      nameFromForm || clerkUser?.fullName || clerkUser?.firstName || existing?.name || 'User'

    if (existing) {
      const { data: updated, error } = await supabaseAdmin
        .from('clients')
        .update({
          name: displayName,
          phone: data.phone,
          ...(data.goal !== undefined && data.goal !== '' ? { assessment_goal: data.goal } : {}),
        })
        .eq('clerk_user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('[createClientProfile] update', error)
        return { success: false, message: CREATE_CLIENT_PROFILE_ERROR_MESSAGE }
      }
      return { success: true, client: updated as ClientRow }
    }

    // Fetch the actual email from Clerk so we don't violate the unique constraint
    const email = clerkUser?.primaryEmailAddress?.emailAddress ?? `noemail_${userId}@beetamin.internal`

    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 3)

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .upsert(
        {
          clerk_user_id: userId,
          name: displayName,
          email,
          phone: data.phone,
          plan_start_date: startDate.toISOString().split('T')[0],
          plan_end_date: endDate.toISOString().split('T')[0],
          assessment_goal: data.goal,
          status: 'active',
          sessions_total: 6,
          sessions_used: 0,
          sessions_remaining: 6,
        },
        { onConflict: 'email' },
      )
      .select()
      .single()

    if (error) {
      console.error('[createClientProfile] upsert', error)
      return { success: false, message: CREATE_CLIENT_PROFILE_ERROR_MESSAGE }
    }
    if (!client) {
      return { success: false, message: CREATE_CLIENT_PROFILE_ERROR_MESSAGE }
    }
    return { success: true, client: client as ClientRow }
  } catch (e) {
    console.error('[createClientProfile]', e)
    return { success: false, message: CREATE_CLIENT_PROFILE_ERROR_MESSAGE }
  }
}

// ─── Check if current user is a nutritionist ──────────────────────────────────
export async function checkIfNutritionist(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const clerkUser = await currentUser()
  const email = clerkUser?.primaryEmailAddress?.emailAddress
  if (!email) return false
  const { data } = await supabaseAdmin
    .from('nutritionists')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  return !!data
}

// ─── Nutritionists ────────────────────────────────────────────────────────────

export async function getNutritionists(): Promise<NutritionistRow[]> {
  const { data } = await supabaseAdmin
    .from('nutritionists')
    .select('id, clerk_user_id, name, email, bio')
    .order('name')
  return data || []
}

// ─── Availability ─────────────────────────────────────────────────────────────

type AvailabilityRow = {
  day_of_week: number
  start_time: string
  end_time: string
}

function generateSlots(start: string, end: string): string[] {
  const slots: string[] = []
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let h = sh
  let m = sm
  while (h < eh || (h === eh && m < em)) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    m += 30
    if (m >= 60) { h++; m -= 60 }
  }
  return slots
}

export async function getAvailableSlots(
  nutritionistId: string,
  date: string
): Promise<string[]> {
  const dayOfWeek = new Date(date).getDay()

  const { data: avail } = await supabaseAdmin
    .from('availability')
    .select('start_time, end_time')
    .eq('nutritionist_id', nutritionistId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)

  if (!avail || avail.length === 0) return []

  const allSlots: string[] = []
  for (const block of avail as AvailabilityRow[]) {
    allSlots.push(...generateSlots(block.start_time, block.end_time))
  }

  const { data: booked } = await supabaseAdmin
    .from('appointments')
    .select('scheduled_time')
    .eq('nutritionist_id', nutritionistId)
    .eq('scheduled_date', date)
    .in('status', ['pending', 'confirmed'])

  const bookedTimes = new Set((booked || []).map((b: { scheduled_time: string }) => b.scheduled_time.slice(0, 5)))
  return allSlots.filter((s) => !bookedTimes.has(s))
}

// ─── Appointment request (CarePulse style) ────────────────────────────────────

export async function requestAppointment(data: {
  nutritionistId: string
  scheduledDate: string
  scheduledTime: string
  reason?: string
}) {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const client = await getClientByClerkId(userId)
  if (!client) throw new Error('No active plan found')
  if (client.status !== 'active') throw new Error('Plan is not active')
  if (client.sessions_remaining <= 0) throw new Error('No sessions remaining')

  // Block if there's already a pending/confirmed appointment
  const { data: existing } = await supabaseAdmin
    .from('appointments')
    .select('id')
    .eq('client_id', client.id)
    .in('status', ['pending', 'confirmed'])
    .single()

  if (existing) throw new Error('You already have an active session request. Wait for it to complete before booking another.')

  const sessionNumber = client.sessions_used + 1

  const { data: appt, error } = await supabaseAdmin
    .from('appointments')
    .insert({
      client_id: client.id,
      nutritionist_id: data.nutritionistId,
      session_number: sessionNumber,
      scheduled_date: data.scheduledDate,
      scheduled_time: data.scheduledTime,
      reason: data.reason,
      status: 'pending',
    })
    .select('*, nutritionists(name, email)')
    .single()

  if (error) throw new Error(error.message)

  // Email the nutritionist
  const { data: nutritionist } = await supabaseAdmin
    .from('nutritionists')
    .select('name, email')
    .eq('id', data.nutritionistId)
    .single()

  if (nutritionist) {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: nutritionist.email,
      subject: `New Session Request from ${client.name} — ${new Date(data.scheduledDate).toLocaleDateString('en-IN')}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0A0F14;color:white;padding:40px;border-radius:16px;">
          <h1 style="color:#10B981;">New Session Request 📅</h1>
          <div style="background:#111820;border-radius:12px;padding:24px;margin:24px 0;">
            <p style="color:white;margin:0;">👤 Client: <strong>${client.name}</strong></p>
            <p style="color:white;margin:8px 0;">📅 Date: <strong>${new Date(data.scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
            <p style="color:white;margin:0;">⏰ Time: <strong>${data.scheduledTime}</strong></p>
            <p style="color:white;margin:8px 0;">📋 Session: <strong>#${sessionNumber}</strong></p>
            ${data.reason ? `<p style="color:white;margin:0;">💬 Reason: <em>${data.reason}</em></p>` : ''}
          </div>
          <a href="https://thebeetamin.com/nutritionist"
             style="background:#10B981;color:black;padding:16px 32px;border-radius:50px;text-decoration:none;font-weight:bold;display:inline-block;">
            Review in Dashboard →
          </a>
          <p style="color:#6B7280;font-size:12px;margin-top:32px;">TheBeetamin · Nutritionist Portal</p>
        </div>
      `,
    })
  }

  return appt
}

// ─── Availability days (server-safe, no client-side supabase) ────────────────

export async function getAvailabilityDays(nutritionistId: string): Promise<number[]> {
  const { data } = await supabaseAdmin
    .from('availability')
    .select('day_of_week')
    .eq('nutritionist_id', nutritionistId)
    .eq('is_active', true)
  return (data || []).map((r: { day_of_week: number }) => r.day_of_week)
}

// ─── Client dashboard ─────────────────────────────────────────────────────────

export type PaidReportSummary = {
  report_id: string
  status: string
  created_at?: string
  assessment_id?: string | null
  deficiency_summary?: unknown
}

export type ProgressLogRow = {
  id: string
  user_id: string
  weight_kg: number | null
  height_cm: number | null
  bmi: number | null
  energy_level: number | null
  notes: string | null
  logged_at: string
  created_at: string
}

export async function getClientAssessmentFlags(clerkUserId: string) {
  const client = await getClientByClerkId(clerkUserId)
  const hasFreeAssessment =
    !!client?.assessment_result && typeof client.assessment_result === 'object'

  const { data: paidRows } = await supabaseAdmin
    .from('paid_reports')
    .select('report_id, status, created_at, assessment_id, deficiency_summary')
    .eq('user_id', clerkUserId)
    .order('created_at', { ascending: false })
    .limit(20)

  const rows = paidRows || []
  const recoveryReportReady = rows.find((r) => r.status === 'ready' || r.status === 'generated') || null
  const recoveryReportGenerating = rows.find((r) => r.status === 'generating') || null

  const { data: latestDetailed } = await supabaseAdmin
    .from('detailed_assessments')
    .select('id')
    .eq('user_id', clerkUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const latestDetailedId = latestDetailed?.id ? String(latestDetailed.id) : null
  let paidReportForLatestDetailed: { report_id: string; status: string } | null = null
  if (latestDetailedId) {
    const match = rows.find((r) => r.assessment_id && String(r.assessment_id) === latestDetailedId)
    if (match) {
      paidReportForLatestDetailed = { report_id: String(match.report_id), status: String(match.status) }
    }
  }

  return {
    hasFreeAssessment,
    recoveryReportReady: recoveryReportReady
      ? { report_id: String(recoveryReportReady.report_id), status: String(recoveryReportReady.status) }
      : null,
    recoveryReportGenerating: recoveryReportGenerating
      ? { report_id: String(recoveryReportGenerating.report_id) }
      : null,
    latestDetailedAssessmentId: latestDetailedId,
    paidReportForLatestDetailed,
  }
}

export async function getClientDashboard(clerkUserId: string) {
  const client = await getClientByClerkId(clerkUserId)
  if (!client) return null

  const { data: appointments } = await supabaseAdmin
    .from('appointments')
    .select('*, nutritionists(name)')
    .eq('client_id', client.id)
    .order('scheduled_date', { ascending: true })

  const { data: paidRows } = await supabaseAdmin
    .from('paid_reports')
    .select('report_id, status, created_at, assessment_id, deficiency_summary')
    .eq('user_id', clerkUserId)
    .order('created_at', { ascending: false })
    .limit(20)

  const rows = paidRows || []
  const recoveryReportReady = rows.find((r) => r.status === 'ready' || r.status === 'generated') || null
  const recoveryReportGenerating = rows.find((r) => r.status === 'generating') || null
  const paidReports: PaidReportSummary[] = rows.map((r) => ({
    report_id: String(r.report_id),
    status: String(r.status),
    created_at: r.created_at ? String(r.created_at) : undefined,
    assessment_id: r.assessment_id != null ? String(r.assessment_id) : null,
    deficiency_summary: r.deficiency_summary,
  }))

  return {
    client,
    appointments: appointments || [],
    paidReports,
    recoveryReportReady: recoveryReportReady
      ? { report_id: String(recoveryReportReady.report_id), status: String(recoveryReportReady.status) }
      : null,
    recoveryReportGenerating: recoveryReportGenerating
      ? { report_id: String(recoveryReportGenerating.report_id) }
      : null,
  }
}

// ─── Update client profile ────────────────────────────────────────────────────

export async function updateClientProfile(clerkUserId: string, data: {
  phone?: string
  assessment_goal?: string
  height_cm?: number | null
}) {
  const { error } = await supabaseAdmin
    .from('clients')
    .update(data)
    .eq('clerk_user_id', clerkUserId)
  if (error) throw new Error(error.message)
}

/** Idempotent completion: increments sessions_used / decrements sessions_remaining. */
export async function markAppointmentCompleteById(
  appointmentId: string,
  notes?: string | null,
  opts?: { allowPending?: boolean },
): Promise<{ ok: true; alreadyDone?: boolean } | { ok: false; reason: string }> {
  const { data: appt, error } = await supabaseAdmin
    .from('appointments')
    .select(
      'id, status, session_number, clients(id, sessions_used, sessions_remaining, email, name)',
    )
    .eq('id', appointmentId)
    .maybeSingle()

  if (error || !appt) {
    return { ok: false, reason: 'not_found' }
  }

  const status = String(appt.status)
  if (status === 'completed') {
    return { ok: true, alreadyDone: true }
  }
  const canComplete = status === 'confirmed' || (opts?.allowPending === true && status === 'pending')
  if (!canComplete) {
    return { ok: false, reason: 'not_confirmed' }
  }

  const rawClients = appt.clients as unknown
  const clients = (Array.isArray(rawClients) ? rawClients[0] : rawClients) as {
    id: string
    sessions_used: number
    sessions_remaining: number
    email: string
    name: string
  } | null
  if (!clients?.id) {
    return { ok: false, reason: 'not_found' }
  }

  const newUsed = clients.sessions_used + 1
  const newRemaining = clients.sessions_remaining - 1

  const { error: u1 } = await supabaseAdmin
    .from('appointments')
    .update({ status: 'completed', notes: notes ?? null })
    .eq('id', appointmentId)

  if (u1) {
    return { ok: false, reason: 'update_failed' }
  }

  const { error: u2 } = await supabaseAdmin
    .from('clients')
    .update({
      sessions_used: newUsed,
      sessions_remaining: newRemaining,
      status: newRemaining === 0 ? 'completed' : 'active',
    })
    .eq('id', clients.id)

  if (u2) {
    return { ok: false, reason: 'client_update_failed' }
  }

  return { ok: true }
}

export async function getDashboardBundle(clerkUserId: string) {
  const { userId } = await auth()
  if (!userId || userId !== clerkUserId) {
    throw new Error('Not authenticated')
  }

  const client = await getClientByClerkId(clerkUserId)

  const [{ data: paidRows }, { data: logRows }] = await Promise.all([
    supabaseAdmin
      .from('paid_reports')
      .select('report_id, status, created_at, assessment_id, deficiency_summary')
      .eq('user_id', clerkUserId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabaseAdmin
      .from('progress_logs')
      .select('*')
      .eq('user_id', clerkUserId)
      .order('logged_at', { ascending: true }),
  ])

  let appointments: AppointmentRow[] = []
  if (client) {
    const { data: appts } = await supabaseAdmin
      .from('appointments')
      .select('*, nutritionists(name)')
      .eq('client_id', client.id)
      .order('scheduled_date', { ascending: true })
    appointments = (appts || []) as AppointmentRow[]
  }

  const paidReports: PaidReportSummary[] = (paidRows || []).map((r) => ({
    report_id: String(r.report_id),
    status: String(r.status),
    created_at: r.created_at ? String(r.created_at) : undefined,
    assessment_id: r.assessment_id != null ? String(r.assessment_id) : null,
    deficiency_summary: r.deficiency_summary,
  }))

  const latestReadyReport = paidReports.find((p) => p.status === 'ready' || p.status === 'generated') || null

  const detailedIds = paidReports.map((p) => p.assessment_id).filter(Boolean) as string[]
  let assessmentDates: Record<string, string> = {}
  if (detailedIds.length > 0) {
    const { data: details } = await supabaseAdmin
      .from('detailed_assessments')
      .select('id, created_at')
      .in('id', detailedIds)
    for (const d of details || []) {
      assessmentDates[String((d as { id: string }).id)] = String((d as { created_at: string }).created_at)
    }
  }

  return {
    client,
    appointments,
    paidReports,
    progressLogs: (logRows || []) as ProgressLogRow[],
    latestReadyReport,
    assessmentDates,
  }
}

export async function upsertProgressLog(input: {
  clerkUserId: string
  weight_kg?: number | null
  energy_level?: number | null
  notes?: string | null
  logged_at: string
  height_cm?: number | null
}) {
  const { userId } = await auth()
  if (!userId || userId !== input.clerkUserId) throw new Error('Not authenticated')

  const energy =
    input.energy_level != null && input.energy_level !== undefined
      ? Math.min(10, Math.max(1, Math.round(Number(input.energy_level))))
      : null

  const weight =
    input.weight_kg != null && input.weight_kg !== undefined && !Number.isNaN(Number(input.weight_kg))
      ? Number(input.weight_kg)
      : null

  let height_cm: number | null = null
  if (input.height_cm != null && !Number.isNaN(Number(input.height_cm))) {
    height_cm = Number(input.height_cm)
    await supabaseAdmin.from('clients').update({ height_cm }).eq('clerk_user_id', userId)
  } else {
    const c = await getClientByClerkId(userId)
    height_cm = c?.height_cm != null ? Number(c.height_cm) : null
  }

  let bmi: number | null = null
  if (weight != null && height_cm != null && height_cm > 0) {
    const hM = height_cm / 100
    bmi = Math.round((weight / (hM * hM)) * 100) / 100
  }

  const row = {
    user_id: userId,
    weight_kg: weight,
    height_cm,
    bmi,
    energy_level: energy,
    notes: input.notes?.trim() || null,
    logged_at: input.logged_at.slice(0, 10),
  }

  const { error } = await supabaseAdmin.from('progress_logs').upsert(row, {
    onConflict: 'user_id,logged_at',
  })
  if (error) throw new Error(error.message)
}

// ─── Cancel appointment ───────────────────────────────────────────────────────

export async function cancelAppointment(appointmentId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')
  const client = await getClientByClerkId(userId)
  if (!client) throw new Error('Client not found')
  const { error } = await supabaseAdmin
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)
    .eq('client_id', client.id)
    .in('status', ['pending', 'confirmed'])
  if (error) throw new Error(error.message)
}

// ─── Lead capture ─────────────────────────────────────────────────────────────

export async function saveLead(data: {
  name: string
  email: string
  phone: string
  source: string
}) {
  await supabaseAdmin.from('leads').insert(data)

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: 'hi@thebeetamin.com',
    subject: `New Lead: ${data.name} wants The Core Transformation`,
    html: `
      <div style="font-family:Inter,sans-serif;padding:24px;background:#f9fafb;border-radius:12px;">
        <h2>New Plan Purchase Lead 🌿</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.phone}</p>
        <p><strong>Source:</strong> ${data.source}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN')}</p>
        <a href="https://wa.me/91${data.phone.replace(/\D/g, '')}"
           style="background:#25D366;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:16px;">
          Message on WhatsApp →
        </a>
      </div>
    `,
  })
}
