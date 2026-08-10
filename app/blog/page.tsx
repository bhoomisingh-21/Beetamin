import type { Metadata } from 'next'
import Link from 'next/link'

import { buildPageMetadata } from '@/lib/seo-metadata'

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: 'Nutrition & Deficiency Blog — Coming Soon',
    description:
      'Expert articles on Vitamin D, Iron, B12 and Omega-3 deficiency recovery for Indians. Guides, meal ideas, and clinician-reviewed nutrition tips.',
    path: '/blog',
  })
}

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-[#0A0F0A] text-white px-4 py-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">TheBeetamin Blog</h1>
        <p className="mt-4 text-zinc-400 leading-relaxed">
          In-depth guides on nutrient deficiencies, Indian meal planning, and recovery protocols —
          written for search topics like vitamin D symptoms in India and iron-rich vegetarian foods.
        </p>
        <p className="mt-6 text-sm text-zinc-500">
          Articles are being prepared. Browse our{' '}
          <Link href="/resources" className="text-emerald-400 hover:underline">
            resource hub
          </Link>{' '}
          for planned topics, or{' '}
          <Link href="/assessment" className="text-emerald-400 hover:underline">
            start the free assessment
          </Link>
          .
        </p>
        <Link href="/" className="mt-10 inline-block text-sm text-emerald-400 hover:underline">
          ← Back to home
        </Link>
      </div>
    </main>
  )
}
