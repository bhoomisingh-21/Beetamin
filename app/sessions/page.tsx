import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { getClientDashboard } from '@/lib/booking-actions'

import SessionsPageClient from './SessionsPageClient'

export const metadata: Metadata = {
  title: 'Expert Nutritionist Consultation',
  description:
    'Book online nutrition sessions from home — structured follow-ups, WhatsApp support, and a clear path from report to habit change. Dr. Priya Sharma. Built for India.',
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
