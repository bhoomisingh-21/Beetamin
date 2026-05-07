import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSessionBookingAccess } from '@/lib/session-booking-access'
import BookingNewClient from './BookingNewClient'
import { BookingNewLocked } from './BookingNewLocked'

export default async function NewBookingPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in?after=%2Fbooking%2Fnew')
  }

  const access = await getSessionBookingAccess(userId)
  if (!access.allowed) {
    return <BookingNewLocked />
  }

  return <BookingNewClient />
}
