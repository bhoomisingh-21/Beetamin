import type { Metadata } from 'next'
import { SitelinkPage } from '@/components/seo/SitelinkPage'
import { SitelinkPageJsonLd } from '@/components/seo/SitelinkPageJsonLd'
import { SITE_URL } from '@/lib/seo-site-url'
import { getSitelinkBySlug } from '@/lib/site-navigation'

const link = getSitelinkBySlug('personalised-meal-plan')!

export const metadata: Metadata = {
  title: link.label,
  description: link.description,
  alternates: { canonical: `${SITE_URL}${link.href}` },
  robots: { index: true, follow: true },
}

export default function PersonalisedMealPlanPage() {
  return (
    <>
      <SitelinkPageJsonLd link={link} />
      <SitelinkPage link={link} />
    </>
  )
}
