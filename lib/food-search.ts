import type { QuickFoodPick } from '@/lib/meal-slot-suggestions'
import { supabaseAdmin } from '@/lib/supabase-admin'

export function sanitizeFoodSearchTerm(term: string): string {
  return term.replace(/[%_,]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Resolve a quick pick or search query to a food row id (IFCT + nutritionist custom). */
export async function resolveFoodId(
  pick: QuickFoodPick | { ifctName?: string; searchTerm: string; label?: string },
  nutritionistId: string,
): Promise<string | null> {
  if (pick.ifctName) {
    const exact = await supabaseAdmin
      .from('foods')
      .select('id')
      .or(`source.eq.ifct,created_by.eq.${nutritionistId}`)
      .ilike('name', pick.ifctName)
      .limit(1)
      .maybeSingle()
    if (exact.data?.id) return exact.data.id
  }

  const terms = [pick.searchTerm, pick.label].filter(Boolean) as string[]
  for (const raw of terms) {
    const q = sanitizeFoodSearchTerm(raw)
    if (!q) continue
    const { data } = await supabaseAdmin
      .from('foods')
      .select('id')
      .or(`source.eq.ifct,created_by.eq.${nutritionistId}`)
      .ilike('name', `%${q}%`)
      .order('name', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (data?.id) return data.id
  }

  const words = sanitizeFoodSearchTerm(pick.searchTerm).split(' ').filter((w) => w.length > 2)
  for (const word of words) {
    const { data } = await supabaseAdmin
      .from('foods')
      .select('id')
      .or(`source.eq.ifct,created_by.eq.${nutritionistId}`)
      .ilike('name', `%${word}%`)
      .order('name', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (data?.id) return data.id
  }

  return null
}
