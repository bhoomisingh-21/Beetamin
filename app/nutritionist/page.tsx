import { redirect } from 'next/navigation'
import NutritionistHomePageClient from '@/components/nutritionist-portal/NutritionistHomePageClient'
import { getNutritionistPortalHome } from '@/lib/nutritionist-portal-actions'

export default async function NutritionistPortalHomePage() {
  const data = await getNutritionistPortalHome()
  if (!data) redirect('/sign-in?message=not-authorized')
  return <NutritionistHomePageClient initial={data} />
}
