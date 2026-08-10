import { SITE_URL } from '@/lib/seo-site-url'
import { SITE_FAQS } from '@/lib/faq-content'

export function PricingProductsJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${SITE_URL}/#product-core-transformation`,
        name: 'Core Transformation — Full Recovery Plan',
        description:
          '6 expert nutrition sessions over 3 months with WhatsApp support, doctor-reviewed guidance, and a personalised vitamin plan for Indians.',
        brand: { '@type': 'Brand', name: 'TheBeetamin' },
        offers: {
          '@type': 'Offer',
          url: `${SITE_URL}/booking`,
          price: '3999',
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          priceValidUntil: '2027-12-31',
        },
      },
      {
        '@type': 'Product',
        '@id': `${SITE_URL}/#product-single-booster`,
        name: 'Single Booster Session',
        description:
          'One 30-minute expert nutrition session with doctor-reviewed guidance — try before committing to the full plan.',
        brand: { '@type': 'Brand', name: 'TheBeetamin' },
        offers: {
          '@type': 'Offer',
          url: `${SITE_URL}/booking`,
          price: '499',
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          priceValidUntil: '2027-12-31',
        },
      },
      {
        '@type': 'Service',
        '@id': `${SITE_URL}/#service-deficiency-report`,
        name: 'Deficiency Recovery Report PDF',
        description: 'Personalised 12-page PDF report with Indian meal guidance for ₹39 after free assessment.',
        provider: { '@type': 'Organization', name: 'TheBeetamin', url: SITE_URL },
        offers: {
          '@type': 'Offer',
          url: `${SITE_URL}/assessment`,
          price: '39',
          priceCurrency: 'INR',
        },
      },
    ],
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  )
}

export function faqPageSchema(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }
}

export function FAQJsonLdFromContent() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema(SITE_FAQS)) }}
    />
  )
}
