import type { ClientRow, ProgressLogRow } from '@/lib/booking-actions'
import type { AppointmentWithClient } from '@/lib/nutritionist-actions'

export type SlotStatus = 'Completed' | 'In Progress' | 'Upcoming'

export type NutritionistNoteDTO = {
  id: string
  nutritionist_id: string
  client_id: string | null
  client_email: string
  session_number: number | null
  content: string
  is_pinned: boolean
  is_visible_to_client: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

export type ClientDocumentDTO = {
  id: string
  nutritionist_id: string
  client_email: string
  storage_path: string
  file_name: string
  file_url: string | null
  file_type: string | null
  file_size_kb: number | null
  description: string | null
  session_number: number | null
  uploaded_at: string
}

export type PortalHomePayload = {
  nutritionist: { id: string; name: string; email: string }
  stats: {
    activeClients: number
    sessionsThisWeek: number
    sessionsToday: number
    pendingBookings: number
  }
  todaySessions: (AppointmentWithClient & { slotStatus: SlotStatus })[]
  upcomingSevenDays: {
    id: string
    scheduled_date: string
    scheduled_time: string
    session_number: number
    clientName: string
    clientId: string
  }[]
  pendingRequests: AppointmentWithClient[]
}

export type SessionDotState = 'completed' | 'confirmed' | 'pending' | null

export type PortalClientListRow = ClientRow & {
  nextSession?: string | null
  /** Session slot 1–6 → strongest appointment status for this nutritionist */
  sessionStates?: Partial<Record<number, SessionDotState>>
}

export type PortalClientBundle = {
  client: ClientRow
  appointments: AppointmentWithClient[]
  notes: NutritionistNoteDTO[]
  documents: ClientDocumentDTO[]
  paidReports: { report_id: string; status: string; deficiency_summary?: unknown; created_at?: string }[]
  latestReadyReport: { report_id: string; status: string; deficiency_summary?: unknown } | null
  detailedAssessment: {
    id: string
    user_id: string
    email: string | null
    created_at: string
    diet_type?: string | null
  } | null
  progressLogs: ProgressLogRow[]
  visibleNotesCount: number
}
