import type { MetadataRoute } from 'next'
import { SITE_SITELINKS } from '@/lib/site-navigation'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const sitelinkEntries: MetadataRoute.Sitemap = SITE_SITELINKS.map((link) => ({
    url: `https://thebeetamin.com${link.href}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.88,
  }))

  return [
    {
      url: 'https://thebeetamin.com',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...sitelinkEntries,
    {
      url: 'https://thebeetamin.com/assessment',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://thebeetamin.com/sessions',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: 'https://thebeetamin.com/booking',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
