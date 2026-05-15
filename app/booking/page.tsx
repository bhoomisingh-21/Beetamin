import { auth } from '@clerk/nextjs/server'
import type { Metadata } from 'next'

import BookingPageClient from '@/app/booking/BookingPageClient'
import { getSessionBookingAccess } from '@/lib/session-booking-access'

export const metadata: Metadata = {
  title: 'Your Recovery Plan',
  description:
    'Start your 3-month nutrition recovery with 6 expert sessions, WhatsApp support, and a personalised vitamin plan. ₹3,999 only.',
  alternates: { canonical: 'https://thebeetamin.com/booking' },
}

export default async function BookingPage() {
  const { userId } = await auth()
  const access = userId ? await getSessionBookingAccess(userId) : null
  const canScheduleSessions = access?.allowed ?? false

  return <BookingPageClient canScheduleSessions={canScheduleSessions} />
}
