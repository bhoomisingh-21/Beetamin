/**
 * Next.js 16 middleware entry for this app (build shows "Proxy (Middleware)").
 * Admin `/admin/*` gate lives here; signed nut-session emails use `lib/admin-session.ts` (no nutritionist whitelist).
 */
import { clerkClient, clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { getVerifiedNutSessionEmail } from '@/lib/admin-session'
import { ALLOWED_NUTRITIONIST_EMAILS } from '@/lib/nutritionist-config'
import { isRegisteredNutritionistClerkUser } from '@/lib/nutritionist-portal-access'
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
  '/profile(.*)',
  '/sessions(.*)',
  '/booking/dashboard(.*)',
  '/booking/new(.*)',
  '/booking/onboard(.*)',
  '/booking/profile(.*)',
  '/booking/success(.*)',
  '/detailed-assessment(.*)',
  '/report(.*)',
  // /nutritionist/* is handled below (Clerk + nutritionists table)
  // /nutritionist-dashboard stays on Supabase cookie session (see below)
])

function isNutritionistPortalRoute(path: string): boolean {
  return path.startsWith('/nutritionist') && !path.startsWith('/nutritionist-dashboard')
}

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname

  // ── Admin panel — Clerk account OR verified nut-session with admin email ────
  if (path.startsWith('/admin')) {
    const { userId: clerkUserId } = await auth()
    let authorized = false

    if (clerkUserId) {
      try {
        const cc = await clerkClient()
        const u = await cc.users.getUser(clerkUserId)
        const email =
          u.primaryEmailAddress?.emailAddress ??
          u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ??
          u.emailAddresses?.[0]?.emailAddress ??
          ''
        if (isAdmin(email)) authorized = true
      } catch {
        /* ignore */
      }
    }

    if (!authorized) {
      const rawNut = await getVerifiedNutSessionEmail(req)
      if (rawNut && isAdmin(rawNut)) authorized = true
    }

    if (!authorized) {
      const mightBeLoggedIn = Boolean(clerkUserId) || Boolean(req.cookies.get('nut-session')?.value)
      const url = req.nextUrl.clone()
      if (!mightBeLoggedIn) {
        url.pathname = '/login'
        url.searchParams.set('redirect', '/admin')
        return NextResponse.redirect(url)
      }
      url.pathname = '/'
      url.search = ''
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }

  // ── Nutritionist gate (Supabase session) ──
  // Skip if Clerk has authenticated this request — that means it's a patient, not a nutritionist.
  const { userId } = await auth()
  const nutEmail = await getVerifiedNutEmailFromCookies(req)
  if (!userId && nutEmail) {
    // Allow: legacy dashboard, full portal (/nutritionist/*), sign-in, APIs
    const allowed =
      path.startsWith('/nutritionist-dashboard') ||
      isNutritionistPortalRoute(path) ||
      path.startsWith('/sign-in') ||
      path.startsWith('/sign-up') ||
      path.startsWith('/login') ||
      path.startsWith('/nutritionist-update-password') ||
      path.startsWith('/api/') ||
      path.startsWith('/_next/')
    if (!allowed) {
      return NextResponse.redirect(new URL('/nutritionist-dashboard', req.url))
    }
    // Skip Clerk auth for nutritionist-owned paths
    return
  }

  // ── Clerk nutritionist portal (/nutritionist/*) ──
  if (isNutritionistPortalRoute(path)) {
    await auth.protect()
    const { userId } = await auth()
    if (!userId) return NextResponse.next()
    const allowed = await isRegisteredNutritionistClerkUser(userId)
    if (!allowed) {
      const url = req.nextUrl.clone()
      url.pathname = '/sign-in'
      url.searchParams.set('message', 'not-authorized')
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
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
