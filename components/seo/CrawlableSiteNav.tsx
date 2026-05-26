import Link from 'next/link'
import { CORE_SITE_NAV_LINKS, SITE_SITELINKS } from '@/lib/site-navigation'

/** Screen-reader + crawler navigation; does not change visible layout. */
export function CrawlableSiteNav() {
  return (
    <nav aria-label="Site" className="sr-only">
      <ul>
        <li>
          <Link href="/">TheBeetamin — Personalised Nutrition &amp; Deficiency Recovery for India</Link>
        </li>
        {CORE_SITE_NAV_LINKS.map(({ label, href }) => (
          <li key={href}>
            <Link href={href}>{label}</Link>
          </li>
        ))}
        <li>
          <a href="mailto:hi@thebeetamin.com">Contact</a>
        </li>
        {SITE_SITELINKS.map(({ label, href, description }) => (
          <li key={href}>
            <Link href={href}>
              <span>{label}</span>
              <p>{description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
