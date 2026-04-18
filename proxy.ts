import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { ALLOWED_NUTRITIONIST_EMAILS } from '@/lib/nutritionist-config'

// ── Nutritionist session helper ──────────────────────────────────────────────
// After sign-in, the client sets a `nut-email` cookie so this middleware can
// detect the session. (Supabase browser client uses localStorage by default,
// not cookies, so we can't read the Supabase JWT here directly.)
function getNutEmailFromCookies(req: NextRequest): string | null {
  const cookie = req.cookies.get('nut-email')
  if (!cookie?.value) return null
  try {
    return decodeURIComponent(cookie.value).toLowerCase().trim()
  } catch {
    return null
  }
}

// ── Clerk-protected user routes ──────────────────────────────────────────────
const isProtectedRoute = createRouteMatcher([
  '/booking/dashboard(.*)',
  '/booking/new(.*)',
  '/booking/onboard(.*)',
  '/booking/profile(.*)',
  '/booking/success(.*)',
  '/nutritionist(.*)',
  // /nutritionist-dashboard is protected by Supabase session (see below), not Clerk
])

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname

  // ── Nutritionist gate (Supabase session) ──
  // Skip if Clerk has authenticated this request — that means it's a patient, not a nutritionist.
  const { userId } = await auth()
  const nutEmail = getNutEmailFromCookies(req)
  if (!userId && nutEmail && ALLOWED_NUTRITIONIST_EMAILS.includes(nutEmail.toLowerCase().trim())) {
    // Allow: dashboard, sign-in (for logout redirect), and internal Next.js paths
    const allowed =
      path.startsWith('/nutritionist-dashboard') ||
      path.startsWith('/sign-in') ||
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
