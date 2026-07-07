import type { SessionBookingAccess } from '@/lib/session-booking-access'

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
  referral_code?: string | null
  referred_by?: string | null
  wallet_balance?: number | null
  total_referrals?: number | null
  successful_referrals?: number | null
  assessment_goal?: string
  assessment_result?: unknown
  assessment_meta?: unknown
  height_cm?: number | null
  goals_progress?: Record<string, boolean> | null
  nutritionist_hra?: unknown
}

export type CreateClientProfileResult =
  | { success: true; client: ClientRow }
  | { success: false; message: string }

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

export type PaidReportSummary = {
  report_id: string
  status: string
  created_at?: string
  assessment_id?: string | null
  deficiency_summary?: unknown
  amount?: number
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
  client_email?: string | null
  water_ml?: number | null
  sleep_hours?: number | null
  sleep_quality?: string | null
}

export type DashboardBundle = {
  client: ClientRow | null
  appointments: AppointmentRow[]
  paidReports: PaidReportSummary[]
  progressLogs: ProgressLogRow[]
  latestReadyReport: PaidReportSummary | null
  assessmentDates: Record<string, string>
  purchaseSessions?: {
    used: number
    total: number
    shortLabel: string
    detailLabel: string
  }
  dietPlans?: DietPlanCustomerDTO[]
  mealPlans?: import('@/lib/meal-plan-types').MealPlanCustomerDTO[]
}

export type DietPlanCustomerDTO = {
  id: string
  title: string
  file_name: string
  published_at: string
  nutritionistName: string | null
}

export type ClientSessionsDashboard = {
  client: ClientRow | null
  appointments: AppointmentRow[]
  paidReports: PaidReportSummary[]
  recoveryReportReady: { report_id: string; status: string } | null
  recoveryReportGenerating: { report_id: string } | null
  dietPlans: DietPlanCustomerDTO[]
  mealPlans: import('@/lib/meal-plan-types').MealPlanCustomerDTO[]
  sessionBooking: SessionBookingAccess
}
