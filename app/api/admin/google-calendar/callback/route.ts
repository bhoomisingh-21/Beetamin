import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/admin-api-auth'
import { saveGoogleTokensFromCode } from '@/lib/google-calendar'
import { paymentAppBaseUrl } from '@/lib/payment-app-base-url'

export const runtime = 'nodejs'

const STATE_COOKIE = 'gcal_oauth_state'

function redirect(query: string) {
  return NextResponse.redirect(`${paymentAppBaseUrl()}/admin/google-calendar${query}`)
}

export async function GET(req: Request) {
  const admin = await requireAdminApi()
  if (!admin.ok) {
    return redirect('?error=unauthorized')
  }

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const errorParam = url.searchParams.get('error')

  const cookieStore = await cookies()
  const expectedState = cookieStore.get(STATE_COOKIE)?.value

  if (errorParam) {
    return redirect(`?error=${encodeURIComponent(errorParam)}`)
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirect('?error=invalid_state')
  }

  try {
    const { email } = await saveGoogleTokensFromCode(code)
    const res = redirect(`?connected=1&email=${encodeURIComponent(email ?? '')}`)
    res.cookies.delete(STATE_COOKIE)
    return res
  } catch (e) {
    console.error('[google-calendar callback]', e)
    const message = e instanceof Error ? e.message : 'connection_failed'
    return redirect(`?error=${encodeURIComponent(message)}`)
  }
}
