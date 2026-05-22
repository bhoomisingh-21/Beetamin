import { auth } from '@clerk/nextjs/server'
import type { Metadata } from 'next'

import BookingPageClient from '@/app/booking/BookingPageClient'
import { getSessionBookingAccess } from '@/lib/session-booking-access'

export const metadata: Metadata = {
  title: 'Personalised Recovery Plan',
  description:
    'Core Transformation — 6 expert nutrition sessions over 3 months, WhatsApp support, and a personalised vitamin plan with Indian meal guidance. ₹3,999.',
  alternates: { canonical: 'https://www.thebeetamin.com/booking' },
}

export default async function BookingPage() {
  const { userId } = await auth()
  const access = userId ? await getSessionBookingAccess(userId) : null
  const canScheduleSessions = access?.allowed ?? false

  return <BookingPageClient canScheduleSessions={canScheduleSessions} />
}
