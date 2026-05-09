import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

import { getClientDashboard } from '@/lib/booking-actions'

import SessionsPageClient from './SessionsPageClient'

export default async function SessionsPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in?after=' + encodeURIComponent('/sessions'))
  }

  const initialDashboard = await getClientDashboard(userId)
  console.log('[sessions SSR] sessionBooking:', JSON.stringify(initialDashboard.sessionBooking))

  return <SessionsPageClient initialDashboard={initialDashboard} />
}
