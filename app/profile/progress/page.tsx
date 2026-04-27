import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import ProgressRouteClient from '@/components/profile/ProgressRouteClient'
import { getDashboardBundle } from '@/lib/booking-actions'

export default async function ProfileProgressPage() {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in?after=' + encodeURIComponent('/profile/progress'))
  }

  const bundle = await getDashboardBundle(user.id)

  return <ProgressRouteClient initialBundle={bundle} />
}
