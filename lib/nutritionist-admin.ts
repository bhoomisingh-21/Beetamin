import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Admin-only nutritionist management. These use the service-role client and MUST
 * only be called from routes guarded by `requireAdminApi()`.
 */

export type AdminNutritionistRow = {
  id: string
  name: string
  email: string
  bio: string | null
  is_active: boolean
  clerk_user_id: string | null
  created_at: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function listAdminNutritionists(): Promise<AdminNutritionistRow[]> {
  const { data, error } = await supabaseAdmin
    .from('nutritionists')
    .select('id, name, email, bio, is_active, clerk_user_id, created_at')
    .order('name')
  if (error) throw error
  return (data ?? []) as AdminNutritionistRow[]
}

export async function createNutritionist(input: {
  name: string
  email: string
  bio?: string | null
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const bio = (input.bio ?? '').trim() || null

  if (!name) return { ok: false, error: 'Name is required.' }
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'A valid email is required.' }

  const { data: existing } = await supabaseAdmin
    .from('nutritionists')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (existing) return { ok: false, error: 'A nutritionist with this email already exists.' }

  const { data, error } = await supabaseAdmin
    .from('nutritionists')
    .insert({ name, email, bio })
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }
  return { ok: true, id: String(data.id) }
}

export async function updateNutritionist(input: {
  id: string
  name?: string
  email?: string
  bio?: string | null
  is_active?: boolean
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = input.id.trim()
  if (!id) return { ok: false, error: 'Nutritionist id is required.' }

  const patch: Record<string, unknown> = {}
  if (typeof input.name === 'string') {
    const name = input.name.trim()
    if (!name) return { ok: false, error: 'Name cannot be empty.' }
    patch.name = name
  }
  if (typeof input.email === 'string') {
    const email = input.email.trim().toLowerCase()
    if (!EMAIL_RE.test(email)) return { ok: false, error: 'A valid email is required.' }
    const { data: clash } = await supabaseAdmin
      .from('nutritionists')
      .select('id')
      .eq('email', email)
      .neq('id', id)
      .maybeSingle()
    if (clash) return { ok: false, error: 'Another nutritionist already uses this email.' }
    patch.email = email
  }
  if (input.bio !== undefined) patch.bio = (input.bio ?? '').trim() || null
  if (typeof input.is_active === 'boolean') patch.is_active = input.is_active

  if (Object.keys(patch).length === 0) return { ok: false, error: 'Nothing to update.' }

  const { error } = await supabaseAdmin.from('nutritionists').update(patch).eq('id', id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
