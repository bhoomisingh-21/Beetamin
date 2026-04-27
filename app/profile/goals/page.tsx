import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import GoalsRouteClient from '@/components/profile/GoalsRouteClient'
import { getDashboardBundle } from '@/lib/booking-actions'

export default async function ProfileGoalsPage() {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in?after=' + encodeURIComponent('/profile/goals'))
  }

  const bundle = await getDashboardBundle(user.id)

  return <GoalsRouteClient initialBundle={bundle} />
}
