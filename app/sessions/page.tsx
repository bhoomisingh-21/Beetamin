import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { getClientDashboard } from '@/lib/booking-actions'
import { buildPageMetadata } from '@/lib/seo-metadata'

import SessionsPageClient from './SessionsPageClient'

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: 'Book Nutritionist Session — Online India',
    description:
      'Schedule 1-on-1 video sessions with a certified nutritionist. Structured follow-ups, WhatsApp support, and plans tailored to Indian diets.',
    path: '/sessions',
    noIndex: true,
  })
}

export default async function SessionsPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in?after=' + encodeURIComponent('/sessions'))
  }

  const initialDashboard = await getClientDashboard(userId)

  return <SessionsPageClient initialDashboard={initialDashboard} />
}
