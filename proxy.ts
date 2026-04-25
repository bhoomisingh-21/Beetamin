import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { ALLOWED_NUTRITIONIST_EMAILS } from '@/lib/nutritionist-config'
import { verifySignedCookieAsync } from '@/lib/nut-session-crypto-edge'

// ── Nutritionist session helper ──────────────────────────────────────────────
// HttpOnly `nut-session` cookie is set by POST /api/auth/nutritionist-session
// after Supabase login; value is HMAC-signed server-side (see nut-session-crypto-*).
async function getVerifiedNutEmailFromCookies(req: NextRequest): Promise<string | null> {
  const secret = process.env.COOKIE_SECRET
  if (!secret) return null
  const cookie = req.cookies.get('nut-session')
  if (!cookie?.value) return null
  const email = await verifySignedCookieAsync(cookie.value, secret)
  if (!email) return null
  const normalized = email.toLowerCase().trim()
  if (!ALLOWED_NUTRITIONIST_EMAILS.includes(normalized)) return null
  return normalized
}

// ── Clerk-protected user routes ──────────────────────────────────────────────
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/booking/dashboard(.*)',
  '/booking/new(.*)',
  '/booking/onboard(.*)',
  '/booking/profile(.*)',
  '/booking/success(.*)',
  '/detailed-assessment(.*)',
  '/report(.*)',
  '/nutritionist(.*)',
  // /nutritionist-dashboard is protected by Supabase session (see below), not Clerk
])

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname

  // ── Nutritionist gate (Supabase session) ──
  // Skip if Clerk has authenticated this request — that means it's a patient, not a nutritionist.
  const { userId } = await auth()
  const nutEmail = await getVerifiedNutEmailFromCookies(req)
  if (!userId && nutEmail) {
    // Allow: dashboard, sign-in (for logout redirect), and internal Next.js paths
    const allowed =
      path.startsWith('/nutritionist-dashboard') ||
      path.startsWith('/sign-in') ||
      path.startsWith('/sign-up') ||
      path.startsWith('/nutritionist-update-password') ||
      path.startsWith('/api/') ||
      path.startsWith('/_next/')
    if (!allowed) {
      return NextResponse.redirect(new URL('/nutritionist-dashboard', req.url))
    }
    // Skip Clerk auth for nutritionist-owned paths
    return
  }

  // ── Regular user routes (Clerk-protected) ──
  if (isProtectedRoute(req)) await auth.protect()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jinja2|txt|xml|icon|image/[\\w.]+)).*)',
    '/(api|trpc)(.*)',
  ],
}
