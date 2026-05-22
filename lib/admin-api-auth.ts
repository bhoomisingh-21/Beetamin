import { auth, clerkClient, currentUser } from '@clerk/nextjs/server'

import { isAdmin } from '@/lib/admin'

export async function getAuthenticatedAdminEmail(): Promise<string | null> {
  const { userId } = await auth()
  if (!userId) return null

  try {
    const cc = await clerkClient()
    const u = await cc.users.getUser(userId)
    const email =
      u.primaryEmailAddress?.emailAddress ??
      u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ??
      u.emailAddresses?.[0]?.emailAddress ??
      ''
    if (!email || !isAdmin(email)) return null
    return email.toLowerCase().trim()
  } catch {
    const cu = await currentUser()
    const email = cu?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? ''
    if (!email || !isAdmin(email)) return null
    return email
  }
}

export async function requireAdminApi(): Promise<{ ok: true; email: string } | { ok: false; status: number; error: string }> {
  const email = await getAuthenticatedAdminEmail()
  if (!email) {
    return { ok: false, status: 403, error: 'Admin access required.' }
  }
  return { ok: true, email }
}
