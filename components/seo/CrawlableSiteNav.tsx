import Link from 'next/link'
import { PRIMARY_SITE_LINKS } from '@/lib/site-navigation'

/** Screen-reader + crawler navigation; does not change visible layout. */
export function CrawlableSiteNav() {
  return (
    <nav aria-label="Site" className="sr-only">
      <ul>
        <li>
          <Link href="/">Home — TheBeetamin</Link>
        </li>
        {PRIMARY_SITE_LINKS.map(({ label, href, description }) => (
          <li key={href}>
            <Link href={href} title={description}>
              {label}
            </Link>
          </li>
        ))}
        <li>
          <a href="mailto:hi@thebeetamin.com">Contact</a>
        </li>
      </ul>
    </nav>
  )
}
