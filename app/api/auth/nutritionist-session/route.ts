import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ALLOWED_NUTRITIONIST_EMAILS } from '@/lib/nutritionist-config'
import { signEmail } from '@/lib/nut-session-crypto-node'
import { supabaseAdmin } from '@/lib/supabase-admin'

const COOKIE_NAME = 'nut-session'
const MAX_AGE = 60 * 60 * 8

export async function POST(req: NextRequest) {
  const secret = process.env.COOKIE_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const emailRaw =
    body && typeof body === 'object' && 'email' in body
      ? (body as { email?: unknown }).email
      : undefined
  const accessToken =
    body && typeof body === 'object' && 'access_token' in body
      ? (body as { access_token?: unknown }).access_token
      : undefined

  if (typeof emailRaw !== 'string' || typeof accessToken !== 'string') {
    return NextResponse.json({ error: 'email and access_token required' }, { status: 400 })
  }

  const email = emailRaw.trim().toLowerCase()
  if (!ALLOWED_NUTRITIONIST_EMAILS.includes(email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: userData, error: userErr } =
    await supabaseAdmin.auth.getUser(accessToken)
  if (userErr || !userData.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sessionEmail = userData.user.email.trim().toLowerCase()
  if (sessionEmail !== email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const signedToken = signEmail(email, secret)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: MAX_AGE,
    path: '/',
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
  return NextResponse.json({ ok: true })
}
