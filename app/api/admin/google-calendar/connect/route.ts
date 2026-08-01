import { randomBytes } from 'crypto'

import { NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/admin-api-auth'
import { getGoogleAuthUrl, isGoogleCalendarConfigured } from '@/lib/google-calendar'
import { paymentAppBaseUrl } from '@/lib/payment-app-base-url'

export const runtime = 'nodejs'

const STATE_COOKIE = 'gcal_oauth_state'

export async function GET() {
  const admin = await requireAdminApi()
  if (!admin.ok) {
    return NextResponse.redirect(`${paymentAppBaseUrl()}/admin/google-calendar?error=unauthorized`)
  }

  if (!isGoogleCalendarConfigured()) {
    return NextResponse.redirect(`${paymentAppBaseUrl()}/admin/google-calendar?error=not_configured`)
  }

  const state = randomBytes(24).toString('hex')
  const authUrl = getGoogleAuthUrl(state)

  const res = NextResponse.redirect(authUrl)
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  return res
}
