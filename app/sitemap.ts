import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo-site-url'
import { SITE_SITELINKS } from '@/lib/site-navigation'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const sitelinkEntries: MetadataRoute.Sitemap = SITE_SITELINKS.map((link) => ({
    url: `${SITE_URL}${link.href}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }))

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/assessment`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/sessions`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/booking`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...sitelinkEntries,
  ]
}
