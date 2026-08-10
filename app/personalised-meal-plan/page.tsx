import type { Metadata } from 'next'

import { SitelinkPage } from '@/components/seo/SitelinkPage'
import { SitelinkPageJsonLd } from '@/components/seo/SitelinkPageJsonLd'
import { servicePageMetadata } from '@/lib/seo-metadata'
import { getSitelinkBySlug } from '@/lib/site-navigation'

const link = getSitelinkBySlug('personalised-meal-plan')!

export function generateMetadata(): Metadata {
  return servicePageMetadata('personalised-meal-plan', link.href)
}

export default function PersonalisedMealPlanPage() {
  return (
    <>
      <SitelinkPageJsonLd link={link} />
      <SitelinkPage link={link} />
    </>
  )
}
