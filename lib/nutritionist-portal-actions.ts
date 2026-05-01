'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { markAppointmentCompleteById, type ClientRow, type ProgressLogRow } from '@/lib/booking-actions'
import { getOrCreateNutritionist, type AppointmentWithClient } from '@/lib/nutritionist-actions'
import type {
  ClientDocumentDTO,
  NutritionistNoteDTO,
  PortalClientBundle,
  PortalClientListRow,
  PortalHomePayload,
} from '@/lib/nutritionist-types'
import { computeSlotStatus, isoTodayLocal, mondayWeekBounds } from '@/lib/nutritionist-utils'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function portalNutritionist() {
  const { userId } = await auth()
  if (!userId) return null
  return getOrCreateNutritionist()
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

async function assertClientAssigned(nutritionistId: string, clientId: string): Promise<boolean> {
  const { count } = await supabaseAdmin
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('nutritionist_id', nutritionistId)
    .eq('client_id', clientId)
  return (count ?? 0) > 0
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
          (a.status === 'confirmed' || a.status === 'pending'),
      )
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
      .select('client_id, scheduled_date, scheduled_time, status')
      .eq('nutritionist_id', nutritionist.id)

    const rows = appts || []
    const clientIds = [...new Set(rows.map((r) => r.client_id).filter(Boolean))] as string[]
    if (clientIds.length === 0) return []

    const { data: clients } = await supabaseAdmin.from('clients').select('*').in('id', clientIds)
    const list = (clients || []) as ClientRow[]

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

    return list.map((c) => ({ ...c, nextSession: nextSlot(c.id) }))
  } catch (e) {
    console.error('[getNutritionistPortalClients]', e)
    return []
  }
}

export async function getNutritionistClientBundle(clientId: string): Promise<PortalClientBundle | null> {
  try {
    const nutritionist = await portalNutritionist()
    if (!nutritionist) return null
    const ok = await assertClientAssigned(nutritionist.id, clientId)
    if (!ok) return null

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

    const clerkUid = String(client.clerk_user_id || '')

    const { data: paidRows } = await supabaseAdmin
      .from('paid_reports')
      .select('report_id, status, deficiency_summary, created_at')
      .eq('user_id', clerkUid)
      .order('created_at', { ascending: false })
      .limit(25)

    const paidReports = paidRows || []
    const latestReadyReport =
      paidReports.find((r) => r.status === 'ready' || r.status === 'generated') || null

    const { data: detailedAssessment } = await supabaseAdmin
      .from('detailed_assessments')
      .select('id, user_id, email, created_at')
      .eq('user_id', clerkUid)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

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
    revalidatePath('/nutritionist')
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
    const ok = await assertClientAssigned(nutritionist.id, input.clientId)
    if (!ok) return { ok: false, error: 'Client not found' }

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
      .createSignedUrl(row.storage_path, 120)
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

    const ok = await assertClientAssigned(nutritionist.id, clientId)
    if (!ok) return { ok: false, error: 'Client not assigned' }

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

export async function ensureNutritionistPortalAccess(): Promise<boolean> {
  const n = await portalNutritionist()
  return !!n
}
