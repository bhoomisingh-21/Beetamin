import type { Metadata } from 'next'

import { SitelinkPage } from '@/components/seo/SitelinkPage'
import { SitelinkPageJsonLd } from '@/components/seo/SitelinkPageJsonLd'
import { servicePageMetadata } from '@/lib/seo-metadata'
import { getSitelinkBySlug } from '@/lib/site-navigation'

const link = getSitelinkBySlug('deficiency-recovery-report')!

export function generateMetadata(): Metadata {
  return servicePageMetadata('deficiency-recovery-report', link.href)
}

export default function DeficiencyRecoveryReportPage() {
  return (
    <>
      <SitelinkPageJsonLd link={link} />
      <SitelinkPage link={link} />
    </>
  )
}
