/**
 * Edge-safe nutritionist registration check for middleware (Supabase + Clerk HTTP API).
 */
import { createClient } from '@supabase/supabase-js'

async function clerkPrimaryEmail(userId: string): Promise<string | null> {
  const secret = process.env.CLERK_SECRET_KEY
  if (!secret) return null
  try {
    const res = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`, {
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      primary_email_address_id?: string | null
      email_addresses?: { id: string; email_address: string }[]
    }
    const list = data.email_addresses ?? []
    const primaryId = data.primary_email_address_id
    const primary =
      (primaryId && list.find((e) => e.id === primaryId)?.email_address) || list[0]?.email_address
    return primary ? primary.toLowerCase().trim() : null
  } catch {
    return null
  }
}

/** Returns true if this Clerk user is linked or matched by email in nutritionists. */
export async function isRegisteredNutritionistClerkUser(userId: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return false

  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  try {
    const { data: byClerk } = await sb
      .from('nutritionists')
      .select('id')
      .eq('clerk_user_id', userId)
      .maybeSingle()
    if (byClerk?.id) return true

    const email = await clerkPrimaryEmail(userId)
    if (!email) return false

    const { data: byEmail } = await sb
      .from('nutritionists')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    return !!byEmail?.id
  } catch {
    return false
  }
}
