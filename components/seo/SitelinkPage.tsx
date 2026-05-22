import Link from 'next/link'
import { SITE_SITELINKS, type SiteSitelink } from '@/lib/site-navigation'

type Props = {
  link: SiteSitelink
}

/** Lightweight landing pages — distinct URLs for Google sitelinks; CTAs only link to existing flows. */
export function SitelinkPage({ link }: Props) {
  const others = SITE_SITELINKS.filter((s) => s.href !== link.href)

  return (
    <main className="min-h-screen bg-[#0A0F0A] text-white">
      <article className="mx-auto max-w-2xl px-4 py-14 sm:py-20 sm:px-6">
        <Link
          href="/"
          className="text-sm font-medium text-emerald-400/90 transition-colors hover:text-emerald-300"
        >
          ← TheBeetamin
        </Link>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {link.label}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-zinc-400">{link.description}</p>
        {'sections' in link && link.sections?.length ? (
          <ul className="mt-6 list-disc space-y-3 pl-5 text-base leading-relaxed text-zinc-400">
            {link.sections.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        <Link
          href={link.ctaHref}
          className="mt-10 inline-flex items-center justify-center rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-[0_8px_24px_-4px_rgba(16,185,129,0.45)] transition-[filter,box-shadow] hover:from-emerald-300 hover:to-emerald-500"
        >
          {link.ctaLabel}
        </Link>

        <nav className="mt-16 border-t border-white/[0.08] pt-8" aria-label="More from TheBeetamin">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            More from TheBeetamin
          </p>
          <ul className="mt-4 space-y-4">
            {others.map(({ label, href, description }) => (
              <li key={href}>
                <Link href={href} className="group block rounded-xl transition-colors hover:bg-white/[0.03]">
                  <span className="text-base font-semibold text-white group-hover:text-emerald-300">
                    {label}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-zinc-500">{description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </main>
  )
}
