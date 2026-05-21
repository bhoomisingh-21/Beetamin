import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { getClientDashboard } from '@/lib/booking-actions'

import SessionsPageClient from './SessionsPageClient'

export const metadata: Metadata = {
  title: 'Book a Nutrition Session',
  description:
    'Book 1-on-1 expert nutrition sessions with Dr. Priya Sharma. Personalised guidance to fix Vitamin D, Iron, B12 and Omega-3 deficiencies. Built for India.',
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
