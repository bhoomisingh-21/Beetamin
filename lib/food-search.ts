import type { QuickFoodPick } from '@/lib/meal-slot-suggestions'
import { supabaseAdmin } from '@/lib/supabase-admin'

export function sanitizeFoodSearchTerm(term: string): string {
  return term.replace(/[%_,]/g, ' ').replace(/\s+/g, ' ').trim()
}

async function findPreparedMealByName(name: string, nutritionistId: string): Promise<string | null> {
  const q = name.trim()
  if (!q) return null

  const { data: tagged } = await supabaseAdmin
    .from('foods')
    .select('id')
    .contains('tags', ['prepared_meal'])
    .ilike('name', q)
    .limit(1)
    .maybeSingle()
  if (tagged?.id) return tagged.id

  const { data: preparedSource } = await supabaseAdmin
    .from('foods')
    .select('id')
    .eq('source', 'prepared')
    .ilike('name', q)
    .limit(1)
    .maybeSingle()
  if (preparedSource?.id) return preparedSource.id

  const { data: fuzzy } = await supabaseAdmin
    .from('foods')
    .select('id')
    .contains('tags', ['prepared_meal'])
    .ilike('name', `%${q}%`)
    .order('name', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (fuzzy?.id) return fuzzy.id

  const { data: custom } = await supabaseAdmin
    .from('foods')
    .select('id')
    .eq('created_by', nutritionistId)
    .ilike('name', q)
    .limit(1)
    .maybeSingle()
  return custom?.id ?? null
}

/**
 * Resolve a meal pick to a food id.
 * When preparedOnly=true (auto-seed), only matches prepared dish names — never raw IFCT ingredients.
 */
export async function resolveFoodId(
  pick: QuickFoodPick | { ifctName?: string; searchTerm: string; label?: string },
  nutritionistId: string,
  opts?: { preparedOnly?: boolean },
): Promise<string | null> {
  const names = [pick.label, pick.ifctName].filter(Boolean) as string[]

  for (const name of names) {
    const id = await findPreparedMealByName(name, nutritionistId)
    if (id) return id
  }

  if (opts?.preparedOnly) return null

  const foodSources = `source.eq.ifct,source.eq.prepared,created_by.eq.${nutritionistId}`
  for (const raw of [pick.searchTerm, pick.label].filter(Boolean) as string[]) {
    const q = sanitizeFoodSearchTerm(raw)
    if (!q) continue
    const { data } = await supabaseAdmin
      .from('foods')
      .select('id')
      .or(foodSources)
      .ilike('name', `%${q}%`)
      .order('name', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (data?.id) return data.id
  }

  return null
}

export async function isPreparedMealFoodId(foodId: string): Promise<boolean> {
  const { data } = await supabaseAdmin.from('foods').select('tags, source').eq('id', foodId).maybeSingle()
  if (!data) return false
  if (data.source === 'prepared') return true
  const tags = data.tags as string[] | null
  return Array.isArray(tags) && tags.includes('prepared_meal')
}
