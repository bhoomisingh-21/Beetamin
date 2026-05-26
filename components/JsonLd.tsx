import { SITE_URL } from '@/lib/seo-site-url'
import { CORE_SITE_NAV_LINKS, SITE_SITELINKS } from '@/lib/site-navigation'

export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'TheBeetamin',
    alternateName: ['Beetamin', 'The Beetamin'],
    url: SITE_URL,
    description:
      'Fix Vitamin D, Iron, B12 and Omega-3 deficiencies with a personalised recovery report, Indian meal plan, and expert nutritionist sessions — built for India. Starting at ₹39.',
    publisher: {
      '@type': 'Organization',
      name: 'TheBeetamin',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/favicon-96.png`,
        width: 96,
        height: 96,
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
      url: `${SITE_URL}/favicon-96.png`,
      width: 96,
      height: 96,
    },
    description:
      'Personalised nutrient deficiency recovery platform for Indians. Expert nutrition sessions and AI-powered deficiency reports.',
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
        description: 'AI-powered nutrient deficiency analysis with 7-day Indian meal plan.',
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
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is TheBeetamin?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'TheBeetamin is a personalised nutrition platform that identifies your nutrient deficiencies and gives you an Indian food-based recovery plan with expert nutritionist support.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does the deficiency report work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You take a free assessment quiz about your symptoms and lifestyle. Our system generates a personalised report with your deficiencies, a 7-day Indian meal plan, supplement protocol, and lab test recommendations.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is TheBeetamin available across India?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, TheBeetamin is fully online and available across all of India. Sessions are conducted via video call.',
        },
      },
      {
        '@type': 'Question',
        name: 'What does the ₹3,999 plan include?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The Core Transformation plan includes 6 expert nutrition sessions of 30 minutes each, 3 months validity, WhatsApp support between sessions, personalised vitamin and supplement plan, and session recordings.',
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
