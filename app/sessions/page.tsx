import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { getClientDashboard } from '@/lib/booking-actions'

import SessionsPageClient from './SessionsPageClient'

export const metadata: Metadata = {
  title: 'Book a Nutrition Session',
  description:
    'Book a 1-on-1 expert nutrition consultation with Dr. Priya Sharma at TheBeetamin. Get personalised guidance to fix your deficiencies.',
  alternates: { canonical: 'https://thebeetamin.com/sessions' },
}

export default async function SessionsPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in?after=' + encodeURIComponent('/sessions'))
  }

  const initialDashboard = await getClientDashboard(userId)

  return <SessionsPageClient initialDashboard={initialDashboard} />
}
