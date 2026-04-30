import { redirect } from 'next/navigation'
import NutritionistClientsPageClient from '@/components/nutritionist-portal/NutritionistClientsPageClient'
import {
  ensureNutritionistPortalAccess,
  getNutritionistPortalClients,
} from '@/lib/nutritionist-portal-actions'

export default async function NutritionistClientsPage() {
  const ok = await ensureNutritionistPortalAccess()
  if (!ok) redirect('/sign-in?message=not-authorized')
  const clients = await getNutritionistPortalClients()
  return <NutritionistClientsPageClient clients={clients} />
}
