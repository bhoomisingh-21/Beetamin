import { currentUser } from '@clerk/nextjs/server'
import ProfileLayoutShell from '@/components/profile/ProfileLayoutShell'
import type { ProfilePlanStatus } from '@/components/profile/profile-plan'
import { getDashboardBundle } from '@/lib/booking-actions'

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  let planStatus: ProfilePlanStatus = 'none'
  const user = await currentUser()
  if (user?.id) {
    try {
      const bundle = await getDashboardBundle(user.id)
      const s = bundle.client?.status
      if (s === 'active') planStatus = 'active'
      else if (s === 'expired') planStatus = 'expired'
      else if (s === 'completed') planStatus = 'completed'
    } catch {
      planStatus = 'none'
    }
  }

  return <ProfileLayoutShell planStatus={planStatus}>{children}</ProfileLayoutShell>
}
