import type { Metadata } from 'next'

import { SitelinkPage } from '@/components/seo/SitelinkPage'
import { SitelinkPageJsonLd } from '@/components/seo/SitelinkPageJsonLd'
import { servicePageMetadata } from '@/lib/seo-metadata'
import { getSitelinkBySlug } from '@/lib/site-navigation'

const link = getSitelinkBySlug('expert-nutritionist-consultation')!

export function generateMetadata(): Metadata {
  return servicePageMetadata('expert-nutritionist-consultation', link.href)
}

export default function ExpertNutritionistConsultationPage() {
  return (
    <>
      <SitelinkPageJsonLd link={link} />
      <SitelinkPage link={link} />
    </>
  )
}
