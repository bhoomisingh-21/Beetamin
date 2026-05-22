import Link from 'next/link'
import { SITE_SITELINKS } from '@/lib/site-navigation'

/** Screen-reader + crawler navigation; does not change visible layout. */
export function CrawlableSiteNav() {
  return (
    <nav aria-label="Site" className="sr-only">
      <ul>
        <li>
          <Link href="/">TheBeetamin — Personalised Nutrition &amp; Deficiency Recovery for India</Link>
        </li>
        {SITE_SITELINKS.map(({ label, href, description }) => (
          <li key={href}>
            <Link href={href}>
              <span>{label}</span>
              <p>{description}</p>
            </Link>
          </li>
        ))}
        <li>
          <Link href="/assessment">Free health assessment</Link>
        </li>
        <li>
          <Link href="/sessions">Book a nutrition session</Link>
        </li>
        <li>
          <Link href="/booking">Recovery plans</Link>
        </li>
        <li>
          <a href="mailto:hi@thebeetamin.com">Contact</a>
        </li>
      </ul>
    </nav>
  )
}
