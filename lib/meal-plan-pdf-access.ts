import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { isNutritionistEmail } from '@/lib/nutritionist-config'
import { getOrCreateNutritionist } from '@/lib/nutritionist-actions'
import { verifySignedCookie } from '@/lib/nut-session-crypto-node'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function portalNutritionist() {
  const { userId } = await auth()
  if (userId) {
    try {
      return await getOrCreateNutritionist()
    } catch {
      return null
    }
  }
  const cookieStore = await cookies()
  const token = cookieStore.get('nut-session')?.value
  const secret = process.env.COOKIE_SECRET
  if (!token || !secret) return null
  const rawEmail = verifySignedCookie(token, secret)
  const email = rawEmail?.toLowerCase().trim() ?? ''
  if (!email || !isNutritionistEmail(email)) return null
  const { data } = await supabaseAdmin.from('nutritionists').select('id').eq('email', email).maybeSingle()
  return data ?? null
}

export async function canAccessMealPlanPdf(planId: string): Promise<'nutritionist' | 'client' | null> {
  const { data: plan } = await supabaseAdmin
    .from('meal_plans')
    .select('nutritionist_id, client_id, client_email, status')
    .eq('id', planId)
    .maybeSingle()

  if (!plan) return null

  const nut = await portalNutritionist()
  if (nut && String(plan.nutritionist_id) === String(nut.id)) {
    return 'nutritionist'
  }

  const { userId } = await auth()
  if (!userId) return null

  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('id, clerk_user_id, email')
    .eq('id', plan.client_id)
    .maybeSingle()

  if (!client || String(client.clerk_user_id ?? '') !== userId) return null
  if (plan.status !== 'published') return null

  return 'client'
}
