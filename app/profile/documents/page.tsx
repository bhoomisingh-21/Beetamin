import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import ProfileDocumentsRouteClient from '@/components/profile/ProfileDocumentsRouteClient'
import { getDashboardBundle, hydrateClientProfileFromMeta } from '@/lib/booking-actions'

export const metadata: Metadata = {
  title: 'Documents',
  robots: { index: false, follow: false },
}

export default async function ProfileDocumentsPage() {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in?after=' + encodeURIComponent('/profile/documents'))
  }

  await hydrateClientProfileFromMeta(user.id)
  const bundle = await getDashboardBundle(user.id)

  return <ProfileDocumentsRouteClient documents={bundle.clientDocuments ?? []} />
}
