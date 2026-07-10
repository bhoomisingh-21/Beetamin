import { redirect } from 'next/navigation'
import NutritionistTemplatesPageClient from '@/components/nutritionist-portal/NutritionistTemplatesPageClient'
import { ensureNutritionistPortalAccess } from '@/lib/nutritionist-portal-actions'
import { listNutritionistTemplates } from '@/lib/template-actions'

export default async function NutritionistTemplatesPage() {
  const ok = await ensureNutritionistPortalAccess()
  if (!ok) redirect('/sign-in?message=not-authorized')

  const res = await listNutritionistTemplates()
  const templates = res.ok ? res.templates : []

  return <NutritionistTemplatesPageClient templates={templates} />
}
