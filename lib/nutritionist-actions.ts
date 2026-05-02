'use server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { markAppointmentCompleteById } from './booking-actions'
import { supabaseAdmin } from './supabase-admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── Types ────────────────────────────────────────────────────────────────────

export type AvailabilitySlot = {
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

export type AppointmentWithClient = {
  id: string
  session_number: number
  scheduled_date: string
  scheduled_time: string
  reason?: string
  status: string
  notes?: string
  created_at: string
  clients: {
    id: string
    name: string
    email: string
    phone: string
    sessions_used: number
    sessions_remaining: number
    plan_end_date: string
  }
}

// ─── Nutritionist profile ─────────────────────────────────────────────────────
// Role detection is email-based: add emails to the nutritionists table in Supabase.
// No Clerk metadata needed. On first login the clerk_user_id is auto-linked.

export async function getOrCreateNutritionist() {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  // Already linked by Clerk user ID?
  const { data: byId } = await supabaseAdmin
    .from('nutritionists')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  if (byId) return byId

  // Not linked yet — find by email and link
  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress
  if (!email) return null

  const { data: byEmail } = await supabaseAdmin
    .from('nutritionists')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (!byEmail) return null // not a registered nutritionist

  // Link Clerk user ID to this nutritionist
  await supabaseAdmin
    .from('nutritionists')
    .update({
      clerk_user_id: userId,
      name: clerkUser?.fullName || byEmail.name,
    })
    .eq('id', byEmail.id)

  return { ...byEmail, clerk_user_id: userId }
}

// ─── Dashboard stats + appointments ───────────────────────────────────────────

export async function getNutritionistDashboard() {
  const nutritionist = await getOrCreateNutritionist()

  if (!nutritionist) return null

  const { data: appointments } = await supabaseAdmin
    .from('appointments')
    .select(`
      id, session_number, scheduled_date, scheduled_time, reason, status, notes, created_at,
      clients(id, name, email, phone, sessions_used, sessions_remaining, plan_end_date)
    `)
    .eq('nutritionist_id', nutritionist.id)
    .order('scheduled_date', { ascending: true })

  const all = (appointments || []) as unknown as AppointmentWithClient[]
  const today = new Date().toISOString().split('T')[0]

  const confirmed = all.filter((a) => a.status === 'confirmed')
  const sortBySlot = (a: AppointmentWithClient, b: AppointmentWithClient) =>
    `${a.scheduled_date}T${a.scheduled_time}`.localeCompare(`${b.scheduled_date}T${b.scheduled_time}`)

  return {
    nutritionist,
    pending: all.filter((a) => a.status === 'pending'),
    today: all.filter((a) => a.scheduled_date === today && a.status === 'confirmed'),
    // All confirmed sessions (including past dates not yet marked complete) so nothing disappears from Scheduled.
    upcoming: [...confirmed].sort(sortBySlot),
    past: all.filter((a) => a.status === 'completed'),
    stats: {
      pending: all.filter((a) => a.status === 'pending').length,
      todayCount: all.filter((a) => a.scheduled_date === today && a.status === 'confirmed').length,
      completed: all.filter((a) => a.status === 'completed').length,
    },
  }
}

// ─── Availability ─────────────────────────────────────────────────────────────

export async function getAvailability(): Promise<AvailabilitySlot[]> {
  const nutritionist = await getOrCreateNutritionist()
  if (!nutritionist) return []

  const { data } = await supabaseAdmin
    .from('availability')
    .select('day_of_week, start_time, end_time, is_active')
    .eq('nutritionist_id', nutritionist.id)
    .order('day_of_week')
    .order('start_time')

  return (data || []) as AvailabilitySlot[]
}

export async function saveAvailability(slots: AvailabilitySlot[]) {
  const nutritionist = await getOrCreateNutritionist()
  if (!nutritionist) throw new Error('Nutritionist profile not found')

  // Replace all existing slots
  await supabaseAdmin.from('availability').delete().eq('nutritionist_id', nutritionist.id)

  if (slots.length > 0) {
    const rows = slots.map((s) => ({
      nutritionist_id: nutritionist.id,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      is_active: s.is_active,
    }))
    const { error } = await supabaseAdmin.from('availability').insert(rows)
    if (error) throw error
  }
}

// ─── Email-based functions (Supabase auth nutritionists, no Clerk dep) ────────

async function getNutritionistByEmailDirect(email: string) {
  const { data } = await supabaseAdmin
    .from('nutritionists')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single()
  return data as { id: string; name: string; email: string; clerk_user_id: string | null } | null
}

export async function getNutritionistDashboardByEmail(email: string) {
  const nutritionist = await getNutritionistByEmailDirect(email)
  if (!nutritionist) return null

  const { data: appointments } = await supabaseAdmin
    .from('appointments')
    .select(`
      id, session_number, scheduled_date, scheduled_time, reason, status, notes, created_at,
      clients(id, name, email, phone, sessions_used, sessions_remaining, plan_end_date)
    `)
    .eq('nutritionist_id', nutritionist.id)
    .order('scheduled_date', { ascending: true })

  const all = (appointments || []) as unknown as AppointmentWithClient[]
  const today = new Date().toISOString().split('T')[0]

  const confirmed = all.filter((a) => a.status === 'confirmed')
  const sortBySlot = (a: AppointmentWithClient, b: AppointmentWithClient) =>
    `${a.scheduled_date}T${a.scheduled_time}`.localeCompare(`${b.scheduled_date}T${b.scheduled_time}`)

  return {
    nutritionist,
    pending:  all.filter((a) => a.status === 'pending'),
    today:    all.filter((a) => a.scheduled_date === today && a.status === 'confirmed'),
    upcoming: [...confirmed].sort(sortBySlot),
    past:     all.filter((a) => a.status === 'completed' || a.status === 'rejected' || a.status === 'cancelled'),
    stats: {
      pending:    all.filter((a) => a.status === 'pending').length,
      todayCount: all.filter((a) => a.scheduled_date === today && a.status === 'confirmed').length,
      completed:  all.filter((a) => a.status === 'completed').length,
    },
  }
}

export async function getAvailabilityByEmail(email: string): Promise<AvailabilitySlot[]> {
  const nutritionist = await getNutritionistByEmailDirect(email)
  if (!nutritionist) return []
  const { data } = await supabaseAdmin
    .from('availability')
    .select('day_of_week, start_time, end_time, is_active')
    .eq('nutritionist_id', nutritionist.id)
    .order('day_of_week')
    .order('start_time')
  return (data || []) as AvailabilitySlot[]
}

export async function saveAvailabilityByEmail(slots: AvailabilitySlot[], email: string) {
  const nutritionist = await getNutritionistByEmailDirect(email)
  if (!nutritionist) throw new Error('Nutritionist profile not found')
  await supabaseAdmin.from('availability').delete().eq('nutritionist_id', nutritionist.id)
  if (slots.length > 0) {
    const rows = slots.map((s) => ({
      nutritionist_id: nutritionist.id,
      day_of_week:  s.day_of_week,
      start_time:   s.start_time,
      end_time:     s.end_time,
      is_active:    s.is_active,
    }))
    const { error } = await supabaseAdmin.from('availability').insert(rows)
    if (error) throw error
  }
}

export async function confirmAppointmentByEmail(appointmentId: string, nutEmail: string) {
  const nutritionist = await getNutritionistByEmailDirect(nutEmail)
  if (!nutritionist) throw new Error('Not a nutritionist')
  const appt = await getAppointmentWithClient(appointmentId)
  if (!appt) throw new Error('Appointment not found')
  await supabaseAdmin.from('appointments').update({ status: 'confirmed' }).eq('id', appointmentId)
  const sessionDate = new Date(`${appt.scheduled_date}T${appt.scheduled_time}`)
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: appt.clients.email,
      subject: `Session ${appt.session_number} Confirmed — ${sessionDate.toLocaleDateString('en-IN')} 🗓️`,
      html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0A0F14;color:white;padding:40px;border-radius:16px;">
        <h1 style="color:#10B981;">Session ${appt.session_number} Confirmed! ✅</h1>
        <p style="color:#9CA3AF;">Your session request has been accepted by ${nutritionist.name}.</p>
        <div style="background:#111820;border-radius:12px;padding:24px;margin:24px 0;">
          <p style="color:white;margin:0;">📅 Date: <strong>${sessionDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
          <p style="color:white;margin:8px 0;">⏰ Time: <strong>${appt.scheduled_time}</strong></p>
          <p style="color:white;margin:0;">👤 Nutritionist: <strong>${nutritionist.name}</strong></p>
        </div>
        <a href="https://thebeetamin.com/sessions" style="background:#10B981;color:black;padding:16px 32px;border-radius:50px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:16px;">View My Sessions →</a>
      </div>
    `,
    })
  } catch (e) {
    console.error('[confirmAppointmentByEmail] Resend failed:', e)
  }
}

export async function rejectAppointmentByEmail(appointmentId: string, nutEmail: string, reason?: string) {
  const nutritionist = await getNutritionistByEmailDirect(nutEmail)
  if (!nutritionist) throw new Error('Not a nutritionist')
  const appt = await getAppointmentWithClient(appointmentId)
  if (!appt) throw new Error('Appointment not found')
  await supabaseAdmin.from('appointments').update({ status: 'rejected', notes: reason }).eq('id', appointmentId)
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: appt.clients.email,
      subject: `Session Request Update — Please Reschedule`,
      html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0A0F14;color:white;padding:40px;border-radius:16px;">
        <h1 style="color:#F59E0B;">Session Request Update</h1>
        <p style="color:#9CA3AF;">${nutritionist.name} is unavailable for your requested slot on ${new Date(appt.scheduled_date).toLocaleDateString('en-IN')} at ${appt.scheduled_time}.</p>
        ${reason ? `<p style="color:#9CA3AF;">Note: ${reason}</p>` : ''}
        <a href="https://thebeetamin.com/booking/new" style="background:#10B981;color:black;padding:16px 32px;border-radius:50px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:16px;">Book a New Slot →</a>
      </div>
    `,
    })
  } catch (e) {
    console.error('[rejectAppointmentByEmail] Resend failed:', e)
  }
}

export async function completeAppointmentByEmail(appointmentId: string, nutEmail: string, notes: string) {
  const nutritionist = await getNutritionistByEmailDirect(nutEmail)
  if (!nutritionist) throw new Error('Not a nutritionist')
  const appt = await getAppointmentWithClient(appointmentId)
  if (!appt) throw new Error('Appointment not found')

  const done = await markAppointmentCompleteById(appointmentId, notes, { allowPending: true })
  if (!done.ok) {
    throw new Error(done.reason === 'not_found' ? 'Appointment not found' : 'Could not complete appointment')
  }
  if (done.alreadyDone) {
    return
  }

  const newRemaining = Math.max(0, appt.clients.sessions_remaining - 1)

  const safeNotes = notes
    ? notes.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    : ''

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: appt.clients.email,
      subject: `Session ${appt.session_number} marked complete — thank you`,
      html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0A0F14;color:white;padding:40px;border-radius:16px;">
        <h1 style="color:#10B981;">Session logged ✅</h1>
        <p style="color:#9CA3AF;">${nutritionist.name} has marked your session ${appt.session_number} as complete.</p>
        <p style="color:#9CA3AF;">Sessions remaining on your plan: <strong>${newRemaining}</strong></p>
        ${safeNotes ? `<p style="color:#E5E7EB;margin-top:16px;">Notes from your session:<br/>${safeNotes}</p>` : ''}
        <a href="https://thebeetamin.com/sessions" style="background:#10B981;color:black;padding:16px 32px;border-radius:50px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:16px;">View My Sessions →</a>
      </div>
    `,
    })
  } catch (e) {
    console.error('[completeAppointmentByEmail] Resend failed:', e)
  }
}

// ─── Appointment actions ──────────────────────────────────────────────────────

async function getAppointmentWithClient(appointmentId: string) {
  const { data } = await supabaseAdmin
    .from('appointments')
    .select('*, clients(id, name, email, sessions_used, sessions_remaining, plan_end_date)')
    .eq('id', appointmentId)
    .single()
  return data as AppointmentWithClient & { nutritionist_id: string } | null
}

export async function confirmAppointment(appointmentId: string) {
  const nutritionist = await getOrCreateNutritionist()
  if (!nutritionist) throw new Error('Not a nutritionist')

  const appt = await getAppointmentWithClient(appointmentId)
  if (!appt) throw new Error('Appointment not found')

  await supabaseAdmin
    .from('appointments')
    .update({ status: 'confirmed' })
    .eq('id', appointmentId)

  const sessionDate = new Date(`${appt.scheduled_date}T${appt.scheduled_time}`)

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: appt.clients.email,
      subject: `Session ${appt.session_number} Confirmed — ${sessionDate.toLocaleDateString('en-IN')} 🗓️`,
      html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0A0F14;color:white;padding:40px;border-radius:16px;">
        <h1 style="color:#10B981;">Session ${appt.session_number} Confirmed! ✅</h1>
        <p style="color:#9CA3AF;">Your session request has been accepted by ${nutritionist.name}.</p>
        <div style="background:#111820;border-radius:12px;padding:24px;margin:24px 0;">
          <p style="color:white;margin:0;">📅 Date: <strong>${sessionDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
          <p style="color:white;margin:8px 0;">⏰ Time: <strong>${appt.scheduled_time}</strong></p>
          <p style="color:white;margin:0;">👤 Nutritionist: <strong>${nutritionist.name}</strong></p>
          <p style="color:white;margin:8px 0;">⏱️ Duration: <strong>30 minutes</strong></p>
          <p style="color:white;margin:0;">📊 Sessions remaining after this: <strong>${appt.clients.sessions_remaining - 1}</strong></p>
        </div>
        <p style="color:#9CA3AF;">You will receive a Google Meet link 30 minutes before your session.</p>
        <a href="https://thebeetamin.com/sessions"
           style="background:#10B981;color:black;padding:16px 32px;border-radius:50px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:16px;">
          View My Sessions →
        </a>
        <p style="color:#6B7280;font-size:12px;margin-top:32px;">TheBeetamin · India's #1 Personalized Nutrition System</p>
      </div>
    `,
    })
  } catch (e) {
    console.error('[confirmAppointment] Resend failed:', e)
  }
}

export async function rejectAppointment(appointmentId: string, reason?: string) {
  const nutritionist = await getOrCreateNutritionist()
  if (!nutritionist) throw new Error('Not a nutritionist')

  const appt = await getAppointmentWithClient(appointmentId)
  if (!appt) throw new Error('Appointment not found')

  await supabaseAdmin
    .from('appointments')
    .update({ status: 'rejected', notes: reason })
    .eq('id', appointmentId)

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: appt.clients.email,
      subject: `Session Request Update — Please Reschedule`,
      html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0A0F14;color:white;padding:40px;border-radius:16px;">
        <h1 style="color:#F59E0B;">Session Request Update</h1>
        <p style="color:#9CA3AF;">Unfortunately, ${nutritionist.name} is unavailable for your requested time slot on ${new Date(appt.scheduled_date).toLocaleDateString('en-IN')} at ${appt.scheduled_time}.</p>
        ${reason ? `<p style="color:#9CA3AF;">Note: ${reason}</p>` : ''}
        <p style="color:#9CA3AF;">Please book a different time slot.</p>
        <a href="https://thebeetamin.com/booking/new"
           style="background:#10B981;color:black;padding:16px 32px;border-radius:50px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:16px;">
          Book a New Slot →
        </a>
        <p style="color:#6B7280;font-size:12px;margin-top:32px;">TheBeetamin · India's #1 Personalized Nutrition System</p>
      </div>
    `,
    })
  } catch (e) {
    console.error('[rejectAppointment] Resend failed:', e)
  }
}

export async function completeAppointment(appointmentId: string, notes: string) {
  const nutritionist = await getOrCreateNutritionist()
  if (!nutritionist) throw new Error('Not a nutritionist')

  const appt = await getAppointmentWithClient(appointmentId)
  if (!appt) throw new Error('Appointment not found')

  const done = await markAppointmentCompleteById(appointmentId, notes ?? null)
  if (!done.ok) {
    throw new Error(done.reason === 'not_found' ? 'Appointment not found' : 'Could not complete appointment')
  }
}
