import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import ProfileDietPlanRouteClient from '@/components/profile/ProfileDietPlanRouteClient'
import { getDashboardBundle, hydrateClientProfileFromMeta } from '@/lib/booking-actions'

export const metadata: Metadata = {
  title: 'Diet Plan',
  robots: { index: false, follow: false },
}

export default async function ProfileDietPlanPage() {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in?after=' + encodeURIComponent('/profile/diet-plan'))
  }

  await hydrateClientProfileFromMeta(user.id)
  const bundle = await getDashboardBundle(user.id)

  return (
    <ProfileDietPlanRouteClient
      dietPlans={bundle.dietPlans ?? []}
      mealPlans={bundle.mealPlans ?? []}
    />
  )
}
