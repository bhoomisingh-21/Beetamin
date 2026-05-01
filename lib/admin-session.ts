import type { NextRequest } from 'next/server'
import { verifySignedCookieAsync } from '@/lib/nut-session-crypto-edge'

/** Verified nut-session email without nutritionist whitelist (for admin gate). */
export async function getVerifiedNutSessionEmail(req: NextRequest): Promise<string | null> {
  const secret = process.env.COOKIE_SECRET
  if (!secret) return null
  const cookie = req.cookies.get('nut-session')
  if (!cookie?.value) return null
  const email = await verifySignedCookieAsync(cookie.value, secret)
  return email ? email.toLowerCase().trim() : null
}
