import type { Metadata } from 'next'
import Link from 'next/link'

import { faqPageSchema } from '@/components/seo/PricingProductsJsonLd'
import { ALL_FAQ_PAGE_ITEMS } from '@/lib/faq-content'
import { buildPageMetadata } from '@/lib/seo-metadata'

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: 'FAQ — Plans, Sessions & Refunds',
    description:
      'Answers about TheBeetamin pricing (₹3,999 full plan, ₹499 session, ₹39 report), nutritionist matching, refunds, and how we differ from generic diet apps.',
    path: '/faq',
  })
}

export default function FaqPage() {
  const schema = faqPageSchema(ALL_FAQ_PAGE_ITEMS)

  return (
    <main className="min-h-screen bg-[#010d06] text-white px-4 py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            FAQ
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-400 text-base">
            Can&apos;t find your answer here? Email us at{' '}
            <a href="mailto:hi@thebeetamin.com" className="text-emerald-400 hover:underline">
              hi@thebeetamin.com
            </a>
          </p>
        </div>

        <div className="space-y-4 mb-12">
          {ALL_FAQ_PAGE_ITEMS.map(({ q, a }) => (
            <article key={q} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="font-bold text-white mb-2 text-base">{q}</h2>
              <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
            </article>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/assessment"
            className="inline-flex items-center gap-2 bg-[#00E676] text-black font-bold rounded-full px-6 py-3 hover:bg-[#00c864] transition-all mr-3"
          >
            Start Free Assessment
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-white/20 text-white font-bold rounded-full px-6 py-3 hover:bg-white/5 transition-all"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
