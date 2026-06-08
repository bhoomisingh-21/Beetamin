import { auth, clerkClient, currentUser } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'

import { isAdmin } from '@/lib/admin'
import { verifySignedCookie } from '@/lib/nut-session-crypto-node'

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

/** Admin email from a verified nut-session cookie (parity with middleware/admin pages). */
async function getNutSessionAdminEmail(): Promise<string | null> {
  const secret = process.env.COOKIE_SECRET
  if (!secret) return null
  try {
    const store = await cookies()
    const token = store.get('nut-session')?.value
    if (!token) return null
    const raw = verifySignedCookie(token, secret)
    const email = raw?.toLowerCase().trim() ?? ''
    return email && isAdmin(email) ? email : null
  } catch {
    return null
  }
}

export async function requireAdminApi(): Promise<{ ok: true; email: string } | { ok: false; status: number; error: string }> {
  const email = (await getAuthenticatedAdminEmail()) ?? (await getNutSessionAdminEmail())
  if (!email) {
    return { ok: false, status: 403, error: 'Admin access required.' }
  }
  return { ok: true, email }
}
