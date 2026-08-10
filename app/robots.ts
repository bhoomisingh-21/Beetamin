import type { MetadataRoute } from 'next'

import { RESOURCE_TOPICS } from '@/lib/faq-content'
import { SITE_URL } from '@/lib/seo-site-url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/dashboard',
          '/login',
          '/api/',
          '/report/',
          '/profile',
          '/booking/purchase',
          '/nutritionist',
          '/nutritionist-dashboard',
          '/nutritionist-login',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
