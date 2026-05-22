import Link from 'next/link'
import { SITE_SITELINKS } from '@/lib/site-navigation'

/** Crawler-facing copy on the homepage — supports sitelinks without changing visible layout. */
export function SitelinkDiscovery() {
  return (
    <section className="sr-only" aria-label="TheBeetamin services">
      <h2>TheBeetamin — Personalised Nutrition &amp; Deficiency Recovery for India</h2>
      <p>
        Fix Vitamin D, Iron, B12 and Omega-3 deficiencies with a personalised recovery report,
        Indian meal plan, and expert nutritionist sessions — Dr. Priya Sharma. Built for India.
        Starting at ₹39.
      </p>
      <ul>
        {SITE_SITELINKS.map(({ label, href, description }) => (
          <li key={href}>
            <Link href={href}>
              <strong>{label}</strong>
            </Link>
            <p>{description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
