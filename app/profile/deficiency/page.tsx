import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import DeficiencyRouteClient from '@/components/profile/DeficiencyRouteClient'
import { getDashboardBundle } from '@/lib/booking-actions'

export default async function DeficiencyProfilePage() {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in?after=' + encodeURIComponent('/profile/deficiency'))
  }

  const bundle = await getDashboardBundle(user.id)

  return <DeficiencyRouteClient paidReports={bundle.paidReports} />
}
