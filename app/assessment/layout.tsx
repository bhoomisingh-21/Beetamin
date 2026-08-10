import type { Metadata } from 'next'

import { buildPageMetadata } from '@/lib/seo-metadata'

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: 'Free Deficiency Assessment Quiz — 2 Minutes',
    description:
      'Take the free 2-minute quiz to find likely Vitamin D, Iron, B12 & Omega-3 gaps. Instant summary plus option to unlock a full Indian recovery PDF for ₹39.',
    path: '/assessment',
    keywords: [
      'free deficiency assessment',
      'vitamin deficiency quiz India',
      'nutrient gap test online',
    ],
  })
}

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
