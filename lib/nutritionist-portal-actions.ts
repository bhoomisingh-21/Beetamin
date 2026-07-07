'use server'

import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { markAppointmentCompleteById } from '@/lib/booking-actions'
import type { ClientRow, ProgressLogRow } from '@/lib/booking-types'
import { isNutritionistEmail } from '@/lib/nutritionist-config'
import { getOrCreateNutritionist, type AppointmentWithClient } from '@/lib/nutritionist-actions'
import { verifySignedCookie } from '@/lib/nut-session-crypto-node'
import type {
  ClientDocumentDTO,
  DietPlanDTO,
  NutritionistNoteDTO,
  PortalClientBundle,
  PortalClientListRow,
  PortalHomePayload,
} from '@/lib/nutritionist-types'
import { sendDietPlanReadyEmail } from '@/lib/send-diet-plan-email'
import {
  computeSlotStatus,
  isoTodayLocal,
  mondayWeekBounds,
  sessionStatesFromAppointments,
} from '@/lib/nutritionist-utils'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function portalNutritionist() {
  const { userId } = await auth()
  if (userId) {
    try {
      return await getOrCreateNutritionist()
    } catch {
      return null
    }
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('nut-session')?.value
  const secret = process.env.COOKIE_SECRET
  if (!token || !secret) return null
  const rawEmail = verifySignedCookie(token, secret)
  const email = rawEmail?.toLowerCase().trim() ?? ''
  if (!email || !isNutritionistEmail(email)) return null

  const { data } = await supabaseAdmin.from('nutritionists').select('*').eq('email', email).maybeSingle()
  return data ?? null
}

async function assertAppointmentOwnedByNutritionist(
  appointmentId: string,
  nutritionistId: string,
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('appointments')
    .select('id')
    .eq('id', appointmentId)
    .eq('nutritionist_id', nutritionistId)
    .maybeSingle()
  return !!data
}

/** Appointment statuses that make someone a genuine client (excludes ghost rejected/cancelled requests). */
const OWNERSHIP_STATUSES = ['pending', 'confirmed', 'completed'] as const

/**
 * A nutritionist "owns" a client only if they have at least one real appointment
 * together (pending / confirmed / completed). A request that was rejected or
 * cancelled does not make that person a client.
 */
async function nutritionistOwnsClient(nutritionistId: string, clientId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('appointments')
    .select('id')
    .eq('nutritionist_id', nutritionistId)
    .eq('client_id', clientId)
    .in('status', OWNERSHIP_STATUSES as unknown as string[])
    .limit(1)
    .maybeSingle()
  return !!data
}

export async function getNutritionistPortalHome(): Promise<PortalHomePayload | null> {
  try {
    const nutritionist = await portalNutritionist()
    if (!nutritionist) return null

    const { data: apptsRaw } = await supabaseAdmin
      .from('appointments')
      .select(
        `id, client_id, nutritionist_id, session_number, scheduled_date, scheduled_time, reason, status, notes, created_at,
        clients(id, name, email, phone, sessions_used, sessions_remaining, plan_end_date, status, sessions_total)`,
      )
      .eq('nutritionist_id', nutritionist.id)
      .order('scheduled_date', { ascending: true })

    const all = (apptsRaw || []) as unknown as AppointmentWithClient[]
    const today = isoTodayLocal()
    const { start: wStart, end: wEnd } = mondayWeekBounds()

    const clientIds = [...new Set(all.map((a) => a.clients?.id).filter(Boolean))] as string[]
    let activeClients = 0
    if (clientIds.length > 0) {
      const { data: clientsRows } = await supabaseAdmin
        .from('clients')
        .select('id, status')
        .in('id', clientIds)
      activeClients = (clientsRows || []).filter((c) => c.status === 'active').length
    }

    const sessionsThisWeek = all.filter(
      (a) => a.scheduled_date >= wStart && a.scheduled_date <= wEnd,
    ).length

    const sessionsToday = all.filter((a) => a.scheduled_date === today).length

    const pendingBookings = all.filter((a) => a.status === 'confirmed' && a.scheduled_date >= today).length

    const todaySessions = all
      .filter(
        (a) =>
          a.scheduled_date === today &&
          (a.status === 'confirmed' ||
            a.status === 'pending' ||
            a.status === 'completed'),
      )
      .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
      .map((a) => ({
        ...a,
        slotStatus: computeSlotStatus(a),
      }))

    const horizonEnd = new Date()
    horizonEnd.setDate(horizonEnd.getDate() + 8)
    const horizonEndStr = `${horizonEnd.getFullYear()}-${String(horizonEnd.getMonth() + 1).padStart(2, '0')}-${String(horizonEnd.getDate()).padStart(2, '0')}`

    const upcomingSevenDays = all
      .filter(
        (a) =>
          a.scheduled_date > today &&
          a.scheduled_date < horizonEndStr &&
          a.status === 'confirmed',
      )
      .slice(0, 40)
      .map((a) => ({
        id: a.id,
        scheduled_date: a.scheduled_date,
        scheduled_time: a.scheduled_time,
        session_number: a.session_number,
        clientName: a.clients.name,
        clientId: a.clients.id,
      }))

    const pendingRequests = all.filter((a) => a.status === 'pending')

    return {
      nutritionist: {
        id: nutritionist.id,
        name: nutritionist.name,
        email: nutritionist.email,
      },
      stats: {
        activeClients,
        sessionsThisWeek,
        sessionsToday,
        pendingBookings,
      },
      todaySessions,
      upcomingSevenDays,
      pendingRequests,
    }
  } catch (e) {
    console.error('[getNutritionistPortalHome]', e)
    return null
  }
}

export async function getNutritionistPortalClients(): Promise<PortalClientListRow[]> {
  try {
    const nutritionist = await portalNutritionist()
    if (!nutritionist) return []

    const { data: appts } = await supabaseAdmin
      .from('appointments')
      .select('client_id, session_number, scheduled_date, scheduled_time, status')
      .eq('nutritionist_id', nutritionist.id)
      .in('status', OWNERSHIP_STATUSES as unknown as string[])

    const rows = appts || []

    // Only clients this nutritionist genuinely booked — pending/confirmed/completed.
    // Ghost rejected/cancelled-only requests are excluded above, and report-only /
    // free-assessment users (no appointment at all) never appear here.
    const myClientIds = [...new Set(rows.map((r) => r.client_id as string).filter(Boolean))]
    if (myClientIds.length === 0) return []

    const { data: allClients } = await supabaseAdmin
      .from('clients')
      .select('*')
      .in('id', myClientIds)
      .order('name', { ascending: true })
    const byClient = new Map<string, { session_number: number; status: string }[]>()
    for (const r of rows) {
      const cid = r.client_id as string
      if (!cid) continue
      if (!byClient.has(cid)) byClient.set(cid, [])
      byClient.get(cid)!.push({
        session_number: r.session_number as number,
        status: String(r.status),
      })
    }

    function nextSlot(cid: string): string | null {
      const related = rows.filter((r) => r.client_id === cid && r.status === 'confirmed')
      const sorted = related.sort((a, b) =>
        `${a.scheduled_date}T${a.scheduled_time}`.localeCompare(
          `${b.scheduled_date}T${b.scheduled_time}`,
        ),
      )
      const fut = sorted.find((r) => `${r.scheduled_date}T${r.scheduled_time}` >= `${isoTodayLocal()}T00:00`)
      return fut ? `${fut.scheduled_date} ${fut.scheduled_time}` : null
    }

    const list = (allClients || []) as ClientRow[]
    return list.map((c) => ({
      ...c,
      nextSession: nextSlot(c.id),
      sessionStates: sessionStatesFromAppointments(byClient.get(c.id) || []),
    }))
  } catch (e) {
    console.error('[getNutritionistPortalClients]', e)
    return []
  }
}

export async function getNutritionistPortalAppointments(): Promise<AppointmentWithClient[]> {
  try {
    const nutritionist = await portalNutritionist()
    if (!nutritionist) return []

    const { data } = await supabaseAdmin
      .from('appointments')
      .select(
        `id, client_id, nutritionist_id, session_number, scheduled_date, scheduled_time, reason, status, notes, created_at,
        clients(id, name, email, phone, sessions_used, sessions_remaining, plan_end_date, status, sessions_total)`,
      )
      .eq('nutritionist_id', nutritionist.id)
      .order('scheduled_date', { ascending: false })
      .order('scheduled_time', { ascending: false })

    return ((data || []) as unknown as AppointmentWithClient[]) ?? []
  } catch (e) {
    console.error('[getNutritionistPortalAppointments]', e)
    return []
  }
}

export async function getNutritionistClientBundle(clientId: string): Promise<PortalClientBundle | null> {
  try {
    const nutritionist = await portalNutritionist()
    if (!nutritionist) return null

    // Access control: nutritionists can only open clients they have an appointment with.
    const owns = await nutritionistOwnsClient(nutritionist.id, clientId)
    if (!owns) return null

    const { data: client } = await supabaseAdmin.from('clients').select('*').eq('id', clientId).maybeSingle()
    if (!client) return null

    const { data: appointments } = await supabaseAdmin
      .from('appointments')
      .select(
        `id, session_number, scheduled_date, scheduled_time, reason, status, notes, created_at,
        clients(id, name, email, phone, sessions_used, sessions_remaining, plan_end_date, status, sessions_total)`,
      )
      .eq('nutritionist_id', nutritionist.id)
      .eq('client_id', clientId)
      .order('scheduled_date', { ascending: false })

    const apList = (appointments || []) as unknown as AppointmentWithClient[]

    const email = String(client.email || '').toLowerCase()

    const { data: notes } = await supabaseAdmin
      .from('nutritionist_notes')
      .select('*')
      .eq('nutritionist_id', nutritionist.id)
      .eq('client_email', email)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    const { data: documents } = await supabaseAdmin
      .from('client_documents')
      .select('*')
      .eq('nutritionist_id', nutritionist.id)
      .eq('client_email', email)
      .order('uploaded_at', { ascending: false })

    const { data: dietPlansRaw } = await supabaseAdmin
      .from('diet_plans')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    const clerkUid = String(client.clerk_user_id || '')

    let paidReports: {
      report_id: string
      status: string
      deficiency_summary?: unknown
      created_at?: string
    }[] = []

    if (clerkUid) {
      const { data: byUser } = await supabaseAdmin
        .from('paid_reports')
        .select('report_id, status, deficiency_summary, created_at')
        .eq('user_id', clerkUid)
        .order('created_at', { ascending: false })
        .limit(25)
      paidReports.push(...(byUser || []))
    }
    const { data: byEmail } = await supabaseAdmin
      .from('paid_reports')
      .select('report_id, status, deficiency_summary, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(25)
    paidReports.push(...(byEmail || []))

    const seenReport = new Set<string>()
    paidReports = paidReports.filter((r) => {
      if (seenReport.has(r.report_id)) return false
      seenReport.add(r.report_id)
      return true
    }).sort((a, b) =>
      String(b.created_at || '').localeCompare(String(a.created_at || '')),
    )

    const latestReadyReport =
      paidReports.find((r) => r.status === 'ready' || r.status === 'generated') || null

    let detailedAssessment: PortalClientBundle['detailedAssessment'] = null
    if (clerkUid) {
      const { data: daUser } = await supabaseAdmin
        .from('detailed_assessments')
        .select('id, user_id, created_at, diet_type, exercise_level, physical_symptoms, energy_mood, sleep_quality, digestion, sun_exposure, water_intake, menstrual_health')
        .eq('user_id', clerkUid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      detailedAssessment = daUser
    }
    if (!detailedAssessment) {
      const { data: daEmail } = await supabaseAdmin
        .from('detailed_assessments')
        .select('id, user_id, created_at, diet_type, exercise_level, physical_symptoms, energy_mood, sleep_quality, digestion, sun_exposure, water_intake, menstrual_health')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      detailedAssessment = daEmail
    }

    const { data: logsByEmail } = await supabaseAdmin
      .from('progress_logs')
      .select('*')
      .eq('client_email', email)
      .order('logged_at', { ascending: false })
      .limit(400)

    let progressLogs = (logsByEmail || []) as ProgressLogRow[]
    if (progressLogs.length === 0 && clerkUid) {
      const { data: logsByUser } = await supabaseAdmin
        .from('progress_logs')
        .select('*')
        .eq('user_id', clerkUid)
        .order('logged_at', { ascending: false })
        .limit(400)
      progressLogs = (logsByUser || []) as ProgressLogRow[]
    }

    const noteRows = (notes || []) as NutritionistNoteDTO[]
    const visibleNotesCount = noteRows.filter((n) => n.is_visible_to_client).length

    return {
      client: client as ClientRow,
      appointments: apList,
      notes: noteRows,
      documents: (documents || []) as ClientDocumentDTO[],
      dietPlans: (dietPlansRaw || []) as DietPlanDTO[],
      paidReports,
      latestReadyReport,
      detailedAssessment,
      progressLogs,
      visibleNotesCount,
    }
  } catch (e) {
    console.error('[getNutritionistClientBundle]', e)
    return null
  }
}

export async function saveNutritionistClientHra(
  clientId: string,
  form: import('@/lib/nutritionist-hra-types').NutritionistHraForm,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const nutritionist = await portalNutritionist()
    if (!nutritionist) return { ok: false, error: 'Unauthorized' }

    const owned = await nutritionistOwnsClient(nutritionist.id, clientId)
    if (!owned) return { ok: false, error: 'Client not found' }

    const hraPayload = {
      gender: form.gender?.trim() || '',
      age: form.age ?? null,
      actual_weight_kg: form.actual_weight_kg ?? null,
      desired_weight_kg: form.desired_weight_kg ?? null,
      height_cm: form.height_cm ?? null,
      country: form.country?.trim() || 'India',
      community: form.community?.trim() || '',
      activity_level: form.activity_level?.trim() || '',
      goal: form.goal?.trim() || '',
      food_preference: form.food_preference?.trim() || '',
      allergies: form.allergies?.trim() || '',
      diseases: form.diseases?.trim() || '',
      clinical_notes: form.clinical_notes?.trim() || '',
      updated_at: new Date().toISOString(),
    }

    const clientUpdates: Record<string, unknown> = {
      nutritionist_hra: hraPayload,
    }
    if (form.height_cm != null && form.height_cm > 0) {
      clientUpdates.height_cm = Math.round(form.height_cm)
    }
    if (form.goal?.trim()) {
      clientUpdates.assessment_goal = form.goal.trim()
    }

    const { error } = await supabaseAdmin.from('clients').update(clientUpdates).eq('id', clientId)

    if (error) {
      console.error('[saveNutritionistClientHra]', error)
      return { ok: false, error: error.message }
    }

    revalidatePath(`/nutritionist/clients/${clientId}`)
    return { ok: true }
  } catch (e) {
    console.error('[saveNutritionistClientHra]', e)
    return { ok: false, error: 'Failed to save HRA' }
  }
}

export async function completePortalAppointment(
  appointmentId: string,
  notes?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const nutritionist = await portalNutritionist()
    if (!nutritionist) return { ok: false, error: 'Unauthorized' }
    const owned = await assertAppointmentOwnedByNutritionist(appointmentId, nutritionist.id)
    if (!owned) return { ok: false, error: 'Not found' }

    const result = await markAppointmentCompleteById(appointmentId, notes ?? null)
    if (!result.ok) return { ok: false, error: result.reason }

    const { data: apptRow } = await supabaseAdmin
      .from('appointments')
      .select('session_number, client_id, clients(email)')
      .eq('id', appointmentId)
      .eq('nutritionist_id', nutritionist.id)
      .maybeSingle()

    const trimmed = String(notes ?? '').trim()
    if (trimmed.length > 0 && apptRow?.client_id != null && apptRow.session_number != null) {
      const rawClients = apptRow.clients as unknown
      const ce = (Array.isArray(rawClients) ? rawClients[0] : rawClients) as { email: string } | null
      const clientEmail = ce?.email ? String(ce.email).toLowerCase() : ''
      const cid = apptRow.client_id as string
      if (clientEmail) {
        const { error: insErr } = await supabaseAdmin.from('nutritionist_notes').insert({
          nutritionist_id: nutritionist.id,
          client_id: cid,
          client_email: clientEmail,
          session_number: apptRow.session_number as number,
          content: trimmed,
          tags: [],
          is_visible_to_client: false,
          is_pinned: false,
        })
        if (insErr) console.error('[completePortalAppointment] nutritionist_notes', insErr)
      }
    }

    const pathClientId = apptRow?.client_id as string | undefined
    if (pathClientId) revalidatePath(`/nutritionist/clients/${pathClientId}`)

    revalidatePath('/nutritionist')
    revalidatePath('/nutritionist/appointments')
    revalidatePath('/nutritionist/clients')
    return { ok: true }
  } catch (e) {
    console.error('[completePortalAppointment]', e)
    return { ok: false, error: 'failed' }
  }
}

export async function createNutritionistNote(input: {
  clientId: string
  clientEmail: string
  content: string
  sessionNumber: number | null
  tags: string[]
  isVisibleToClient: boolean
  isPinned: boolean
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const nutritionist = await portalNutritionist()
    if (!nutritionist) return { ok: false, error: 'Unauthorized' }
    const okClient = await nutritionistOwnsClient(nutritionist.id, input.clientId)
    if (!okClient) return { ok: false, error: 'Client not found' }

    if (input.isPinned) {
      await supabaseAdmin
        .from('nutritionist_notes')
        .update({ is_pinned: false })
        .eq('nutritionist_id', nutritionist.id)
        .eq('client_email', input.clientEmail.toLowerCase())
    }

    const { error } = await supabaseAdmin.from('nutritionist_notes').insert({
      nutritionist_id: nutritionist.id,
      client_id: input.clientId,
      client_email: input.clientEmail.toLowerCase(),
      session_number: input.sessionNumber,
      content: input.content.trim(),
      tags: input.tags,
      is_visible_to_client: input.isVisibleToClient,
      is_pinned: input.isPinned,
    })
    if (error) {
      console.error('[createNutritionistNote]', error)
      return { ok: false, error: error.message }
    }
    revalidatePath(`/nutritionist/clients/${input.clientId}`)
    return { ok: true }
  } catch (e) {
    console.error('[createNutritionistNote]', e)
    return { ok: false, error: 'failed' }
  }
}

export async function updateNutritionistNote(input: {
  noteId: string
  clientId: string
  clientEmail: string
  content: string
  sessionNumber: number | null
  tags: string[]
  isVisibleToClient: boolean
  isPinned: boolean
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const nutritionist = await portalNutritionist()
    if (!nutritionist) return { ok: false, error: 'Unauthorized' }

    const { data: existing } = await supabaseAdmin
      .from('nutritionist_notes')
      .select('id')
      .eq('id', input.noteId)
      .eq('nutritionist_id', nutritionist.id)
      .maybeSingle()
    if (!existing) return { ok: false, error: 'Not found' }

    if (input.isPinned) {
      await supabaseAdmin
        .from('nutritionist_notes')
        .update({ is_pinned: false })
        .eq('nutritionist_id', nutritionist.id)
        .eq('client_email', input.clientEmail.toLowerCase())
        .neq('id', input.noteId)
    }

    const { error } = await supabaseAdmin
      .from('nutritionist_notes')
      .update({
        content: input.content.trim(),
        session_number: input.sessionNumber,
        tags: input.tags,
        is_visible_to_client: input.isVisibleToClient,
        is_pinned: input.isPinned,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.noteId)
      .eq('nutritionist_id', nutritionist.id)

    if (error) return { ok: false, error: error.message }
    revalidatePath(`/nutritionist/clients/${input.clientId}`)
    return { ok: true }
  } catch (e) {
    console.error('[updateNutritionistNote]', e)
    return { ok: false, error: 'failed' }
  }
}

export async function deleteNutritionistNote(
  noteId: string,
  clientId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const nutritionist = await portalNutritionist()
    if (!nutritionist) return { ok: false, error: 'Unauthorized' }

    const { error } = await supabaseAdmin
      .from('nutritionist_notes')
      .delete()
      .eq('id', noteId)
      .eq('nutritionist_id', nutritionist.id)

    if (error) return { ok: false, error: error.message }
    revalidatePath(`/nutritionist/clients/${clientId}`)
    return { ok: true }
  } catch (e) {
    console.error('[deleteNutritionistNote]', e)
    return { ok: false, error: 'failed' }
  }
}

export async function toggleNutritionistNotePin(
  noteId: string,
  clientId: string,
  clientEmail: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const nutritionist = await portalNutritionist()
    if (!nutritionist) return { ok: false, error: 'Unauthorized' }

    const { data: row } = await supabaseAdmin
      .from('nutritionist_notes')
      .select('is_pinned')
      .eq('id', noteId)
      .eq('nutritionist_id', nutritionist.id)
      .maybeSingle()
    if (!row) return { ok: false, error: 'Not found' }

    const next = !row.is_pinned
    if (next) {
      await supabaseAdmin
        .from('nutritionist_notes')
        .update({ is_pinned: false })
        .eq('nutritionist_id', nutritionist.id)
        .eq('client_email', clientEmail.toLowerCase())
        .neq('id', noteId)
    }

    await supabaseAdmin
      .from('nutritionist_notes')
      .update({ is_pinned: next, updated_at: new Date().toISOString() })
      .eq('id', noteId)
      .eq('nutritionist_id', nutritionist.id)

    revalidatePath(`/nutritionist/clients/${clientId}`)
    return { ok: true }
  } catch (e) {
    console.error('[toggleNutritionistNotePin]', e)
    return { ok: false, error: 'failed' }
  }
}

export async function updateDocumentDescription(
  docId: string,
  clientId: string,
  description: string | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const nutritionist = await portalNutritionist()
    if (!nutritionist) return { ok: false, error: 'Unauthorized' }

    const { error } = await supabaseAdmin
      .from('client_documents')
      .update({ description })
      .eq('id', docId)
      .eq('nutritionist_id', nutritionist.id)

    if (error) return { ok: false, error: error.message }
    revalidatePath(`/nutritionist/clients/${clientId}`)
    return { ok: true }
  } catch (e) {
    console.error('[updateDocumentDescription]', e)
    return { ok: false, error: 'failed' }
  }
}

export async function deleteClientDocument(
  docId: string,
  clientId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const nutritionist = await portalNutritionist()
    if (!nutritionist) return { ok: false, error: 'Unauthorized' }

    const { data: row } = await supabaseAdmin
      .from('client_documents')
      .select('storage_path')
      .eq('id', docId)
      .eq('nutritionist_id', nutritionist.id)
      .maybeSingle()
    if (!row?.storage_path) return { ok: false, error: 'Not found' }

    await supabaseAdmin.storage.from('client-documents').remove([row.storage_path])
    const { error } = await supabaseAdmin.from('client_documents').delete().eq('id', docId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/nutritionist/clients/${clientId}`)
    return { ok: true }
  } catch (e) {
    console.error('[deleteClientDocument]', e)
    return { ok: false, error: 'failed' }
  }
}

export async function getSignedDocumentUrl(
  docId: string,
): Promise<{ url: string | null; error?: string }> {
  try {
    const nutritionist = await portalNutritionist()
    if (!nutritionist) return { url: null, error: 'Unauthorized' }

    const { data: row } = await supabaseAdmin
      .from('client_documents')
      .select('storage_path')
      .eq('id', docId)
      .eq('nutritionist_id', nutritionist.id)
      .maybeSingle()
    if (!row?.storage_path) return { url: null, error: 'Not found' }

    const { data: signed, error } = await supabaseAdmin.storage
      .from('client-documents')
      .createSignedUrl(row.storage_path, 60)
    if (error || !signed?.signedUrl) return { url: null, error: error?.message || 'sign_failed' }
    return { url: signed.signedUrl }
  } catch (e) {
    console.error('[getSignedDocumentUrl]', e)
    return { url: null, error: 'failed' }
  }
}

export async function uploadClientDocument(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  try {
    const nutritionist = await portalNutritionist()
    if (!nutritionist) return { ok: false, error: 'Unauthorized' }

    const clientId = String(formData.get('clientId') || '')
    const clientEmail = String(formData.get('clientEmail') || '').toLowerCase()
    const sessionNumberRaw = formData.get('sessionNumber')
    const sessionNumber =
      sessionNumberRaw === '' || sessionNumberRaw === null
        ? null
        : Number(sessionNumberRaw)
    const description = (formData.get('description') as string | null) || null
    const file = formData.get('file') as File | null
    if (!clientId || !clientEmail || !file || file.size <= 0) {
      return { ok: false, error: 'Missing file or client' }
    }

    const okClient = await nutritionistOwnsClient(nutritionist.id, clientId)
    if (!okClient) return { ok: false, error: 'Client not found' }

    const max = 10 * 1024 * 1024
    if (file.size > max) return { ok: false, error: 'Max 10MB' }

    const safeEmail = clientEmail.replace(/[^a-zA-Z0-9.@_-]/g, '_')
    const origName = file.name.replace(/[^\w.\- ]+/g, '_').slice(0, 180)
    const storagePath = `${nutritionist.id}/${safeEmail}/${Date.now()}_${origName}`

    const buf = Buffer.from(await file.arrayBuffer())
    const { error: upErr } = await supabaseAdmin.storage.from('client-documents').upload(storagePath, buf, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })
    if (upErr) {
      console.error('[uploadClientDocument]', upErr)
      return { ok: false, error: upErr.message }
    }

    const ext = origName.split('.').pop()?.toLowerCase() || ''
    let fileType = ext
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) fileType = 'image'
    else if (ext === 'pdf') fileType = 'pdf'
    else if (ext === 'doc' || ext === 'docx') fileType = 'doc'

    const { error: insErr } = await supabaseAdmin.from('client_documents').insert({
      nutritionist_id: nutritionist.id,
      client_id: clientId,
      client_email: clientEmail,
      storage_path: storagePath,
      file_name: file.name,
      file_url: null,
      file_type: fileType,
      file_size_kb: Math.round(file.size / 1024),
      description,
      session_number: Number.isFinite(sessionNumber as number) ? sessionNumber : null,
    })

    if (insErr) {
      await supabaseAdmin.storage.from('client-documents').remove([storagePath])
      return { ok: false, error: insErr.message }
    }

    revalidatePath(`/nutritionist/clients/${clientId}`)
    return { ok: true }
  } catch (e) {
    console.error('[uploadClientDocument]', e)
    return { ok: false, error: 'failed' }
  }
}

export async function uploadDietPlan(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  try {
    const nutritionist = await portalNutritionist()
    if (!nutritionist) return { ok: false, error: 'Unauthorized' }

    const clientId = String(formData.get('clientId') || '')
    const clientEmail = String(formData.get('clientEmail') || '').toLowerCase()
    const title = String(formData.get('title') || '').trim() || 'Personalised Diet Plan'
    const file = formData.get('file') as File | null
    if (!clientId || !clientEmail || !file || file.size <= 0) {
      return { ok: false, error: 'Missing file or client' }
    }

    const okClient = await nutritionistOwnsClient(nutritionist.id, clientId)
    if (!okClient) return { ok: false, error: 'Client not found' }

    const ext = (file.name.split('.').pop() || '').toLowerCase()
    if (ext !== 'pdf') return { ok: false, error: 'Diet plan must be a PDF' }
    const max = 10 * 1024 * 1024
    if (file.size > max) return { ok: false, error: 'Max 10MB' }

    const safeEmail = clientEmail.replace(/[^a-zA-Z0-9.@_-]/g, '_')
    const origName = file.name.replace(/[^\w.\- ]+/g, '_').slice(0, 180)
    const storagePath = `${nutritionist.id}/${safeEmail}/${Date.now()}_${origName}`

    const buf = Buffer.from(await file.arrayBuffer())
    const { error: upErr } = await supabaseAdmin.storage.from('diet-plans').upload(storagePath, buf, {
      contentType: 'application/pdf',
      upsert: false,
    })
    if (upErr) {
      console.error('[uploadDietPlan] storage', upErr)
      return { ok: false, error: upErr.message }
    }

    const { count } = await supabaseAdmin
      .from('diet_plans')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
    const version = (count ?? 0) + 1

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('diet_plans')
      .insert({
        client_id: clientId,
        nutritionist_id: nutritionist.id,
        client_email: clientEmail,
        title,
        storage_path: storagePath,
        file_name: file.name,
        file_size_kb: Math.round(file.size / 1024),
        status: 'published',
        version,
        published_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insErr) {
      await supabaseAdmin.storage.from('diet-plans').remove([storagePath])
      console.error('[uploadDietPlan] insert', insErr)
      return { ok: false, error: insErr.message }
    }

    // Notify the customer their plan is ready (best-effort, does not block upload).
    if (!clientEmail.endsWith('@beetamin.internal')) {
      try {
        const { data: signed } = await supabaseAdmin.storage
          .from('diet-plans')
          .createSignedUrl(storagePath, 60 * 60 * 24 * 7)
        const { data: clientRow } = await supabaseAdmin
          .from('clients')
          .select('name')
          .eq('id', clientId)
          .maybeSingle()
        if (signed?.signedUrl) {
          const res = await sendDietPlanReadyEmail({
            to: clientEmail,
            name: (clientRow?.name as string) || 'there',
            nutritionistName: nutritionist.name,
            planTitle: title,
            downloadUrl: signed.signedUrl,
          })
          if (res.ok && inserted?.id) {
            await supabaseAdmin
              .from('diet_plans')
              .update({ notified_at: new Date().toISOString() })
              .eq('id', inserted.id)
          } else if (!res.ok) {
            console.error('[uploadDietPlan] email', res.error)
          }
        }
      } catch (notifyErr) {
        console.error('[uploadDietPlan] notify', notifyErr)
      }
    }

    revalidatePath(`/nutritionist/clients/${clientId}`)
    return { ok: true }
  } catch (e) {
    console.error('[uploadDietPlan]', e)
    return { ok: false, error: 'failed' }
  }
}

export async function getSignedDietPlanUrl(planId: string): Promise<{ url: string | null; error?: string }> {
  try {
    const nutritionist = await portalNutritionist()
    if (!nutritionist) return { url: null, error: 'Unauthorized' }

    const { data: row } = await supabaseAdmin
      .from('diet_plans')
      .select('storage_path')
      .eq('id', planId)
      .eq('nutritionist_id', nutritionist.id)
      .maybeSingle()
    if (!row?.storage_path) return { url: null, error: 'Not found' }

    const { data: signed, error } = await supabaseAdmin.storage
      .from('diet-plans')
      .createSignedUrl(row.storage_path, 60)
    if (error || !signed?.signedUrl) return { url: null, error: error?.message || 'sign_failed' }
    return { url: signed.signedUrl }
  } catch (e) {
    console.error('[getSignedDietPlanUrl]', e)
    return { url: null, error: 'failed' }
  }
}

export async function deleteDietPlan(
  planId: string,
  clientId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const nutritionist = await portalNutritionist()
    if (!nutritionist) return { ok: false, error: 'Unauthorized' }

    const { data: row } = await supabaseAdmin
      .from('diet_plans')
      .select('storage_path')
      .eq('id', planId)
      .eq('nutritionist_id', nutritionist.id)
      .maybeSingle()
    if (!row?.storage_path) return { ok: false, error: 'Not found' }

    await supabaseAdmin.storage.from('diet-plans').remove([row.storage_path])
    const { error } = await supabaseAdmin
      .from('diet_plans')
      .delete()
      .eq('id', planId)
      .eq('nutritionist_id', nutritionist.id)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/nutritionist/clients/${clientId}`)
    return { ok: true }
  } catch (e) {
    console.error('[deleteDietPlan]', e)
    return { ok: false, error: 'failed' }
  }
}

export async function ensureNutritionistPortalAccess(): Promise<boolean> {
  const n = await portalNutritionist()
  return !!n
}
