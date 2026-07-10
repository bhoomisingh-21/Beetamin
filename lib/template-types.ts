export const TEMPLATE_CONDITION_TAGS = [
  'PCOD',
  'weight_loss',
  'weight_gain',
  'diabetes',
  'thyroid',
  'PCOS',
  'general',
] as const

export type TemplateListItem = {
  id: string
  name: string
  condition_tags: string[]
  target_kcal: number | null
  created_at: string
  entry_count: number
}
