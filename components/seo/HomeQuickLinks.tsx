import Link from 'next/link'
import { CORE_SITE_NAV_LINKS, SITE_SITELINKS } from '@/lib/site-navigation'

/** Visible internal links on the homepage — helps Google discover sitelink candidates. */
export function HomeQuickLinks() {
  return (
    <section
      className="border-t border-white/[0.06] bg-[#050a06] py-12 sm:py-14"
      aria-labelledby="home-quick-links-heading"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2
          id="home-quick-links-heading"
          className="text-center text-sm font-bold uppercase tracking-widest text-zinc-500"
        >
          Explore TheBeetamin
        </h2>

        <ul className="mt-6 flex flex-wrap justify-center gap-3">
          {CORE_SITE_NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          <li className="sm:col-span-2">
            <Link
              href="/assessment"
              className="block rounded-2xl border border-emerald-500/35 bg-emerald-500/[0.08] p-5 transition-colors hover:border-emerald-500/50"
            >
              <span className="text-base font-semibold text-white">Free Deficiency Assessment</span>
              <span className="mt-2 block text-sm leading-relaxed text-zinc-400">
                Take the free 2-minute quiz — find Vitamin D, Iron, B12, and Omega-3 gaps built for
                Indian diets.
              </span>
            </Link>
          </li>
          {SITE_SITELINKS.map(({ label, href, description }) => (
            <li key={href}>
              <Link
                href={href}
                className="block rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/[0.04]"
              >
                <span className="text-base font-semibold text-white">{label}</span>
                <span className="mt-2 block text-sm leading-relaxed text-zinc-500">{description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
