import { SITE_URL } from '@/lib/seo-site-url'
import type { SiteSitelink } from '@/lib/site-navigation'

export function SitelinkPageJsonLd({ link }: { link: SiteSitelink }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    '@id': `${SITE_URL}${link.href}`,
    name: link.label,
    description: link.description,
    url: `${SITE_URL}${link.href}`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    inLanguage: 'en-IN',
    about: {
      '@type': 'MedicalCondition',
      name: 'Nutrient deficiency',
    },
    audience: {
      '@type': 'PeopleAudience',
      geographicArea: { '@type': 'Country', name: 'India' },
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'TheBeetamin',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: link.label,
          item: `${SITE_URL}${link.href}`,
        },
      ],
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
