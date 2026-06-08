import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  let userId: string | null = null
  try {
    userId = (await auth()).userId ?? null
  } catch (e) {
    console.error('[diet-plan/download] auth', e)
    return NextResponse.json({ error: 'Sign-in service error.' }, { status: 503 })
  }

  const { searchParams } = new URL(req.url)
  const planId = searchParams.get('id')?.trim()

  if (!userId) {
    const sign = new URL('/sign-in', req.url)
    sign.searchParams.set('after', '/sessions')
    return NextResponse.redirect(sign)
  }
  if (!planId) {
    return NextResponse.json({ error: 'Plan id is required.' }, { status: 400 })
  }

  const { data: plan, error } = await supabaseAdmin
    .from('diet_plans')
    .select('storage_path, client_id, clients(clerk_user_id)')
    .eq('id', planId)
    .maybeSingle()

  if (error) {
    console.error('[diet-plan/download] query', error)
    return NextResponse.json({ error: 'Could not load your diet plan.' }, { status: 502 })
  }
  if (!plan?.storage_path) {
    return NextResponse.json({ error: 'Diet plan not found.' }, { status: 404 })
  }

  const rawClient = (plan as { clients?: unknown }).clients
  const clientRow = (Array.isArray(rawClient) ? rawClient[0] : rawClient) as
    | { clerk_user_id?: string | null }
    | null
  if (!clientRow || String(clientRow.clerk_user_id ?? '') !== userId) {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
  }

  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from('diet-plans')
    .createSignedUrl(plan.storage_path, 60)

  if (signErr || !signed?.signedUrl) {
    console.error('[diet-plan/download] sign', signErr)
    return NextResponse.json({ error: 'Could not create a download link.' }, { status: 502 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
