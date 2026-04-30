import { notFound, redirect } from 'next/navigation'
import NutritionistClientProfileClient from '@/components/nutritionist-portal/NutritionistClientProfileClient'
import {
  ensureNutritionistPortalAccess,
  getNutritionistClientBundle,
} from '@/lib/nutritionist-portal-actions'

type Props = { params: Promise<{ clientId: string }> }

export default async function NutritionistClientDetailPage({ params }: Props) {
  const ok = await ensureNutritionistPortalAccess()
  if (!ok) redirect('/sign-in?message=not-authorized')

  const { clientId } = await params
  const bundle = await getNutritionistClientBundle(clientId)
  if (!bundle) notFound()

  return <NutritionistClientProfileClient bundle={bundle} clientId={clientId} />
}
