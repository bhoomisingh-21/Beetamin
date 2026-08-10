import { SITE_URL } from '@/lib/seo-site-url'
import { CORE_SITE_NAV_LINKS, SITE_SITELINKS } from '@/lib/site-navigation'
import { FAQJsonLdFromContent } from '@/components/seo/PricingProductsJsonLd'
import { PricingProductsJsonLd } from '@/components/seo/PricingProductsJsonLd'

export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'TheBeetamin',
    alternateName: ['Beetamin', 'The Beetamin'],
    url: SITE_URL,
    description:
      'Fix Vitamin D, Iron, B12 and Omega-3 deficiencies with a personalised recovery report, Indian meal plan, and expert nutritionist sessions — built for India.',
    publisher: {
      '@type': 'Organization',
      name: 'TheBeetamin',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
      },
    },
    inLanguage: 'en-IN',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/** Hints key internal destinations for rich results / sitelinks (not guaranteed by Google). */
export function SiteNavigationJsonLd() {
  const preferredNav = [
    ...CORE_SITE_NAV_LINKS.map((link) => ({
      name: link.label,
      url: link.href.startsWith('/#') ? `${SITE_URL}${link.href}` : `${SITE_URL}${link.href}`,
    })),
    ...SITE_SITELINKS.map((link) => ({
      name: link.label,
      url: `${SITE_URL}${link.href}`,
      description: link.description,
    })),
  ]

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SiteNavigationElement',
        '@id': `${SITE_URL}/#site-navigation`,
        name: 'TheBeetamin primary navigation',
        hasPart: preferredNav.map((link) => ({
          '@type': 'WebPage',
          '@id': link.url,
          name: link.name,
          url: link.url,
        })),
      },
      {
        '@type': 'ItemList',
        name: 'TheBeetamin — main pages',
        itemListElement: preferredNav.map((link, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'WebPage',
            '@id': link.url,
            name: link.name,
            url: link.url,
          },
        })),
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TheBeetamin',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/og-image.png`,
      width: 1200,
      height: 630,
    },
    description:
      'Personalised nutrient deficiency recovery platform for Indians. Expert nutrition sessions and clinician-reviewed deficiency reports.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'hi@thebeetamin.com',
      availableLanguage: ['English', 'Hindi'],
    },
    sameAs: ['https://instagram.com/thebeetamin', 'https://twitter.com/thebeetamin'],
    potentialAction: [
      {
        '@type': 'Action',
        name: 'Free Deficiency Assessment',
        target: `${SITE_URL}/assessment`,
      },
      {
        '@type': 'Action',
        name: 'Why TheBeetamin',
        target: `${SITE_URL}/#comparison`,
      },
      {
        '@type': 'Action',
        name: 'Book a Session',
        target: `${SITE_URL}/sessions`,
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function MedicalServiceJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: 'TheBeetamin',
    url: SITE_URL,
    description:
      'Online nutrition consultation and personalised deficiency recovery plans for Indians.',
    priceRange: '₹39 - ₹3,999',
    currenciesAccepted: 'INR',
    paymentAccepted: 'UPI, Credit Card, Debit Card, Net Banking',
    areaServed: 'IN',
    availableService: [
      {
        '@type': 'MedicalTherapy',
        name: 'Personalised Deficiency Recovery Report',
        description: 'Expert-reviewed nutrient deficiency analysis with 7-day Indian meal plan.',
        offers: {
          '@type': 'Offer',
          price: '39',
          priceCurrency: 'INR',
        },
      },
      {
        '@type': 'MedicalTherapy',
        name: 'Full Recovery Plan — 6 Expert Sessions',
        description:
          '3-month nutrition recovery with 6 expert sessions and WhatsApp support.',
        offers: {
          '@type': 'Offer',
          price: '3999',
          priceCurrency: 'INR',
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function FAQJsonLd() {
  return <FAQJsonLdFromContent />
}

export { PricingProductsJsonLd }
