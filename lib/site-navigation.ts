/** Sitelink targets for Google — keep in sync with footer, JSON-LD, sitemap, and CrawlableSiteNav. */
export const SITE_SITELINKS = [
  {
    slug: 'nutrient-deficiency',
    label: 'Vitamin D, Iron, B12 and Omega-3 Deficiency',
    href: '/nutrient-deficiency',
    description:
      'Nutrient deficiency test India can rely on online — a deficiency recovery report rooted in your symptoms and Indian eating patterns, not generic Western templates.',
    ctaHref: '/assessment',
    ctaLabel: 'Start Free Health Assessment',
  },
  {
    slug: 'personalised-meal-plan',
    label: 'Personalised Indian Meal Plan',
    href: '/personalised-meal-plan',
    description:
      'Foods you can buy locally, with practical swaps for vegetarian and non-vegetarian households. Lab-ready guidance when Vitamin D, Iron, B12, or Omega-3 gaps need confirmation.',
    ctaHref: '/assessment',
    ctaLabel: 'Get Your Meal Plan',
  },
  {
    slug: 'nutritionist-consultation',
    label: 'Expert Nutritionist Consultation',
    href: '/nutritionist-consultation',
    description:
      'Online nutrition sessions you can attend from home — structured follow-ups, WhatsApp support between calls, and a clear path from report to habit change.',
    ctaHref: '/sessions',
    ctaLabel: 'Book a Session',
  },
  {
    slug: 'deficiency-recovery-report',
    label: 'Deficiency Recovery Report',
    href: '/deficiency-recovery-report',
    description:
      'Symptoms tied to likely gaps, affordable interventions prioritised, and week-by-week expectations — the same rigour whether you came from search or a referral.',
    ctaHref: '/assessment',
    ctaLabel: 'Get Your Report',
  },
] as const

export type SiteSitelink = (typeof SITE_SITELINKS)[number]

export function getSitelinkBySlug(slug: string): SiteSitelink | undefined {
  return SITE_SITELINKS.find((s) => s.slug === slug)
}

/** @deprecated Use SITE_SITELINKS — alias for footer / crawl nav. */
export const PRIMARY_SITE_LINKS = SITE_SITELINKS.map(({ label, href, description }) => ({
  label,
  href,
  description,
}))
