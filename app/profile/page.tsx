import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import ProfilePageClient from '@/components/profile/ProfilePageClient'
import { getDashboardBundle } from '@/lib/booking-actions'

export default async function ProfilePage() {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in?after=' + encodeURIComponent('/profile'))
  }

  const bundle = await getDashboardBundle(user.id)

  return <ProfilePageClient initialBundle={bundle} />
}
