import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import ProfilePersonalClient from '@/components/profile/ProfilePersonalClient'
import { getDashboardBundle } from '@/lib/booking-actions'

export const metadata: Metadata = {
  title: 'Your Profile',
  robots: { index: false, follow: false },
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>
}) {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in?after=' + encodeURIComponent('/profile'))
  }

  const sp = await searchParams
  const showOnboardingBanner = sp.onboarding === 'true'

  const bundle = await getDashboardBundle(user.id)

  return (
    <ProfilePersonalClient
      initialBundle={bundle}
      showOnboardingBanner={showOnboardingBanner}
    />
  )
}
