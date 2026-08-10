import type { Metadata } from 'next'

import { SitelinkPage } from '@/components/seo/SitelinkPage'
import { SitelinkPageJsonLd } from '@/components/seo/SitelinkPageJsonLd'
import { servicePageMetadata } from '@/lib/seo-metadata'
import { getSitelinkBySlug } from '@/lib/site-navigation'

const link = getSitelinkBySlug('nutrient-deficiency')!

export function generateMetadata(): Metadata {
  return servicePageMetadata('nutrient-deficiency', link.href)
}

export default function NutrientDeficiencyPage() {
  return (
    <>
      <SitelinkPageJsonLd link={link} />
      <SitelinkPage link={link} />
    </>
  )
}
