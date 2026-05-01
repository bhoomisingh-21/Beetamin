import { redirect } from 'next/navigation'
import NutritionistAppointmentsPageClient from '@/components/nutritionist-portal/NutritionistAppointmentsPageClient'
import {
  ensureNutritionistPortalAccess,
  getNutritionistPortalAppointments,
} from '@/lib/nutritionist-portal-actions'

export default async function NutritionistAppointmentsPage() {
  const ok = await ensureNutritionistPortalAccess()
  if (!ok) redirect('/sign-in?message=not-authorized')
  const appointments = await getNutritionistPortalAppointments()
  return <NutritionistAppointmentsPageClient appointments={appointments} />
}
