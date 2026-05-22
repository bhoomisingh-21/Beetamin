import type { Metadata } from 'next'
import { SitelinkPage } from '@/components/seo/SitelinkPage'
import { SitelinkPageJsonLd } from '@/components/seo/SitelinkPageJsonLd'
import { getSitelinkBySlug } from '@/lib/site-navigation'

const link = getSitelinkBySlug('nutrient-deficiency')!

export const metadata: Metadata = {
  title: link.label,
  description: link.description,
  alternates: { canonical: `https://thebeetamin.com${link.href}` },
}

export default function NutrientDeficiencyPage() {
  return (
    <>
      <SitelinkPageJsonLd link={link} />
      <SitelinkPage link={link} />
    </>
  )
}
