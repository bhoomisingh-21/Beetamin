import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import ReportsRouteClient from '@/components/profile/ReportsRouteClient'
import { getDashboardBundle } from '@/lib/booking-actions'

export default async function ProfileReportsPage() {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in?after=' + encodeURIComponent('/profile/reports'))
  }

  const bundle = await getDashboardBundle(user.id)

  return (
    <ReportsRouteClient
      paidReports={bundle.paidReports}
      assessmentDates={bundle.assessmentDates}
    />
  )
}
