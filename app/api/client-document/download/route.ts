import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  let userId: string | null = null
  try {
    userId = (await auth()).userId ?? null
  } catch (e) {
    console.error('[client-document/download] auth', e)
    return NextResponse.json({ error: 'Sign-in service error.' }, { status: 503 })
  }

  const { searchParams } = new URL(req.url)
  const docId = searchParams.get('id')?.trim()

  if (!userId) {
    const sign = new URL('/sign-in', req.url)
    sign.searchParams.set('after', '/profile/documents')
    return NextResponse.redirect(sign)
  }
  if (!docId) {
    return NextResponse.json({ error: 'Document id is required.' }, { status: 400 })
  }

  const { data: client, error: clientErr } = await supabaseAdmin
    .from('clients')
    .select('id, email')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (clientErr) {
    console.error('[client-document/download] client', clientErr)
    return NextResponse.json({ error: 'Could not load your profile.' }, { status: 502 })
  }
  if (!client?.id) {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
  }

  const { data: doc, error } = await supabaseAdmin
    .from('client_documents')
    .select('storage_path, client_id, client_email')
    .eq('id', docId)
    .maybeSingle()

  if (error) {
    console.error('[client-document/download] query', error)
    return NextResponse.json({ error: 'Could not load this document.' }, { status: 502 })
  }
  if (!doc?.storage_path) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
  }

  const email = String(client.email || '').toLowerCase().trim()
  const ownsById = String(doc.client_id || '') === String(client.id)
  const ownsByEmail = String(doc.client_email || '').toLowerCase().trim() === email
  if (!ownsById && !ownsByEmail) {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
  }

  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from('client-documents')
    .createSignedUrl(doc.storage_path, 60)

  if (signErr || !signed?.signedUrl) {
    console.error('[client-document/download] sign', signErr)
    return NextResponse.json({ error: 'Could not create a download link.' }, { status: 502 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
