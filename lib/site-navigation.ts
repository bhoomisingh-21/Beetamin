/**
 * Primary internal links for sitelinks — order and anchor text must stay consistent
 * across footer, navbar, JSON-LD, and crawlable nav (/assessment first, /#comparison second).
 */
export const CORE_SITE_NAV_LINKS = [
  { label: 'Free Deficiency Assessment', href: '/assessment' },
  { label: 'Why TheBeetamin', href: '/#comparison' },
  { label: 'Book a Session', href: '/sessions' },
  { label: 'Our Plans', href: '/booking' },
] as const

/** Sitelink landing pages for Google — keep in sync with sitemap. */
export const SITE_SITELINKS = [
  {
    slug: 'nutrient-deficiency',
    label: 'Vitamin D, Iron, B12 and Omega-3 Deficiency',
    href: '/nutrient-deficiency',
    description:
      'Nutrient deficiency test India can rely on online — a deficiency recovery report rooted in your symptoms and Indian eating patterns, not generic Western templates.',
    ctaHref: '/assessment',
    ctaLabel: 'Start Your Free Assessment',
    sections: [
      'Free assessment maps your symptoms to likely Vitamin D, Iron, B12, and Omega-3 gaps using Indian diet patterns.',
      'Reports explain what to eat locally, when to confirm with labs, and what to expect in the first 30 days.',
      'Built for India — not copied from Western one-size-fits-all templates.',
    ],
  },
  {
    slug: 'personalised-meal-plan',
    label: 'Personalised Indian Meal Plan',
    href: '/personalised-meal-plan',
    description:
      'Foods you can buy locally, with practical swaps for vegetarian and non-vegetarian households. Lab-ready guidance when Vitamin D, Iron, B12, or Omega-3 gaps need confirmation.',
    ctaHref: '/assessment',
    ctaLabel: 'Get Your Meal Plan',
    sections: [
      '7-day Indian meal plans with foods you can buy at local markets and kirana stores.',
      'Practical swaps for vegetarian and non-vegetarian households, including iron, B12, and Omega-3 friendly options.',
      'Pairs with your deficiency report and lab-ready guidance when confirmation is needed.',
    ],
  },
  {
    slug: 'expert-nutritionist-consultation',
    label: 'Expert Nutritionist Consultation',
    href: '/expert-nutritionist-consultation',
    description:
      'Online nutrition sessions you can attend from home — structured follow-ups, WhatsApp support between calls, and a clear path from report to habit change.',
    ctaHref: '/sessions',
    ctaLabel: 'Book a Session',
    sections: [
      'Book 1-on-1 video sessions with a certified nutritionist — not a chatbot or generic template.',
      'Structured follow-ups every two weeks, WhatsApp support between calls, and adjustments based on your labs and symptoms.',
      'Designed for India: vegetarian and non-vegetarian meal guidance, affordable supplement options, and clear next steps after your deficiency report.',
    ],
  },
  {
    slug: 'deficiency-recovery-report',
    label: 'Deficiency Recovery Report',
    href: '/deficiency-recovery-report',
    description:
      'Symptoms tied to likely gaps, affordable interventions prioritised, and week-by-week expectations — the same rigour whether you came from search or a referral.',
    ctaHref: '/assessment',
    ctaLabel: 'Get Your Report',
    sections: [
      'Symptoms linked to likely nutrient gaps with plain-language explanations.',
      'Affordable interventions prioritised — food first, targeted supplements when needed.',
      'Week-by-week expectations so you know what should improve and when to recheck labs.',
    ],
  },
] as const

export type SiteSitelink = (typeof SITE_SITELINKS)[number]

export function getSitelinkBySlug(slug: string): SiteSitelink | undefined {
  return SITE_SITELINKS.find((s) => s.slug === slug)
}

/** @deprecated Use CORE_SITE_NAV_LINKS for footer; SITE_SITELINKS for landing pages. */
export const PRIMARY_SITE_LINKS = SITE_SITELINKS.map(({ label, href, description }) => ({
  label,
  href,
  description,
}))
