import { auth } from '@clerk/nextjs/server'
import type { Metadata } from 'next'

import BookingPageClient from '@/app/booking/BookingPageClient'
import { getSessionBookingAccess } from '@/lib/session-booking-access'
import { buildPageMetadata } from '@/lib/seo-metadata'

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: 'Recovery Plans & Pricing — ₹3,999 Full Plan',
    description:
      'Core Transformation: 6 expert sessions over 3 months, WhatsApp support & personalised vitamin plan. Single Booster session ₹499. One-time payment.',
    path: '/booking',
    keywords: ['nutrition plan price India', 'online dietitian plan ₹3999', 'nutrition session ₹499'],
  })
}

export default async function BookingPage() {
  const { userId } = await auth()
  const access = userId ? await getSessionBookingAccess(userId) : null
  const canScheduleSessions = access?.allowed ?? false

  return <BookingPageClient canScheduleSessions={canScheduleSessions} />
}
