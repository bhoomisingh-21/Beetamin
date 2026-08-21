import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import {
  FULL_PLAN_CHECKOUT_COOKIE,
  verifyCheckoutVerification,
} from '@/lib/checkout-verification-cookie'
import { supabaseAdmin } from '@/lib/supabase-admin'

export type FullPlanCheckoutProfileInput = {
  name: string
  email: string
  phone: string
  age: number
  addressLine: string
  city: string
  state: string
  pincode: string
}

function cleanString(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

export function parseFullPlanCheckoutProfile(body: unknown): FullPlanCheckoutProfileInput | null {
  if (!body || typeof body !== 'object') return null
  const o = body as Record<string, unknown>
  const name = cleanString(o.name, 100)
  const email = cleanString(o.email, 120).toLowerCase()
  const phone = cleanString(o.phone, 20)
  const addressLine = cleanString(o.addressLine, 200)
  const city = cleanString(o.city, 80)
  const state = cleanString(o.state, 80)
  const pincode = cleanString(o.pincode, 12)
  const ageRaw = o.age
  const age =
    typeof ageRaw === 'number'
      ? Math.floor(ageRaw)
      : typeof ageRaw === 'string'
        ? Math.floor(Number(ageRaw))
        : NaN

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  if (!phone || phone.replace(/\D/g, '').length < 10) return null
  if (!Number.isFinite(age) || age < 10 || age > 120) return null
  if (!addressLine || !city || !state || !pincode) return null

  return { name, email, phone, age, addressLine, city, state, pincode }
}

export async function saveFullPlanCheckoutProfile(
  clerkUserId: string,
  profile: FullPlanCheckoutProfileInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: existing } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()

  const row = {
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    age: profile.age,
    address_line: profile.addressLine,
    city: profile.city,
    state: profile.state,
    pincode: profile.pincode,
  }

  if (existing?.id) {
    const { error } = await supabaseAdmin.from('clients').update(row).eq('clerk_user_id', clerkUserId)
    if (error) {
      console.error('[full-plan/checkout-profile] update', error)
      return { ok: false, error: 'Could not save your details.' }
    }
    return { ok: true }
  }

  const start = new Date()
  const end = new Date()
  end.setMonth(end.getMonth() + 3)

  const { error } = await supabaseAdmin.from('clients').insert({
    clerk_user_id: clerkUserId,
    ...row,
    plan_start_date: start.toISOString().split('T')[0],
    plan_end_date: end.toISOString().split('T')[0],
    status: 'active',
    sessions_total: 6,
    sessions_used: 0,
    sessions_remaining: 6,
  })

  if (error) {
    console.error('[full-plan/checkout-profile] insert', error)
    return { ok: false, error: 'Could not save your details.' }
  }
  return { ok: true }
}

/** Returns null when verified; error payload when checkout must complete first. */
export async function requireFullPlanCheckoutVerification(
  clerkUserId: string,
): Promise<{ error: string; code: 'CHECKOUT_VERIFICATION_REQUIRED' } | null> {
  const secret = process.env.COOKIE_SECRET?.trim()
  if (secret) {
    const jar = await cookies()
    const token = jar.get(FULL_PLAN_CHECKOUT_COOKIE)?.value
    const payload = verifyCheckoutVerification(token, secret)
    if (payload?.userId === clerkUserId) return null
  }

  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('phone_verified_at')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()

  const verifiedAt = client?.phone_verified_at ? new Date(String(client.phone_verified_at)).getTime() : NaN
  if (Number.isFinite(verifiedAt) && Date.now() - verifiedAt < 24 * 60 * 60 * 1000) {
    return null
  }

  return {
    error: 'Complete profile verification before checkout.',
    code: 'CHECKOUT_VERIFICATION_REQUIRED',
  }
}

export async function assertAuthenticatedUser(): Promise<
  { userId: string } | { error: string; status: number }
> {
  const { userId } = await auth()
  if (!userId) return { error: 'Please sign in to continue.', status: 401 }
  return { userId }
}
