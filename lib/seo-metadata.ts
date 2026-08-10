import type { Metadata } from 'next'

import { SITE_URL } from '@/lib/seo-site-url'

const DEFAULT_OG = '/og-image.png'

/** Trim copy to common SERP display limits without breaking words mid-token when possible. */
export function trimSeoTitle(title: string, max = 60): string {
  const t = title.trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + '…'
}

export function trimSeoDescription(description: string, max = 155): string {
  const d = description.trim()
  if (d.length <= max) return d
  const cut = d.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut).trim() + '…'
}

type PageMetadataInput = {
  /** Page title before template suffix (unless absoluteTitle). */
  title: string
  description: string
  /** Path including leading slash, e.g. `/faq`. */
  path: string
  /** Skip `| TheBeetamin` template from root layout. */
  absoluteTitle?: boolean
  noIndex?: boolean
  keywords?: string[]
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const title = trimSeoTitle(input.title)
  const description = trimSeoDescription(input.description)
  const canonical = `${SITE_URL}${input.path === '/' ? '' : input.path}`

  return {
    title: input.absoluteTitle ? { absolute: title } : title,
    description,
    ...(input.keywords?.length ? { keywords: input.keywords } : {}),
    alternates: { canonical },
    robots: input.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'TheBeetamin',
      locale: 'en_IN',
      type: 'website',
      images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: 'TheBeetamin — Personalised Deficiency Recovery' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG],
    },
  }
}

/** Sitelink service pages — unique titles/descriptions tuned per URL. */
export const SERVICE_PAGE_SEO: Record<
  string,
  { title: string; description: string; keywords: string[] }
> = {
  'nutrient-deficiency': {
    title: 'Nutrient Deficiency Test India — Vitamin D, Iron, B12',
    description:
      'Free online deficiency assessment for Indians. Map symptoms to Vitamin D, Iron, B12 & Omega-3 gaps with Indian diet context — not generic Western templates.',
    keywords: [
      'nutrient deficiency test India',
      'vitamin D deficiency symptoms India',
      'iron deficiency test online',
      'B12 deficiency India',
    ],
  },
  'personalised-meal-plan': {
    title: 'Personalised Indian Meal Plan for Deficiency Recovery',
    description:
      '7-day Indian meal plans with local foods, veg & non-veg swaps, and iron, B12 & Omega-3 friendly options — paired with your deficiency report.',
    keywords: [
      'personalised meal plan India',
      'Indian diet plan for deficiency',
      'iron rich Indian foods',
      'B12 vegetarian diet India',
    ],
  },
  'expert-nutritionist-consultation': {
    title: 'Online Nutritionist Consultation India — 1-on-1',
    description:
      'Book certified nutritionist video sessions from home. Fortnightly follow-ups, WhatsApp support, and plans built for Indian diets — from ₹499.',
    keywords: [
      'online nutritionist consultation India',
      'certified nutritionist India',
      'dietitian consultation online',
    ],
  },
  'deficiency-recovery-report': {
    title: 'Deficiency Recovery Report — ₹39 PDF for India',
    description:
      '12-page clinician-reviewed PDF: symptom-linked nutrient gaps, affordable food-first fixes, supplement guidance & week-by-week expectations.',
    keywords: [
      'deficiency recovery report',
      'personalised nutrition report India',
      'vitamin deficiency report PDF',
    ],
  },
}

export function servicePageMetadata(slug: keyof typeof SERVICE_PAGE_SEO, path: string): Metadata {
  const seo = SERVICE_PAGE_SEO[slug]
  return buildPageMetadata({
    title: seo.title,
    description: seo.description,
    path,
    keywords: seo.keywords,
  })
}
