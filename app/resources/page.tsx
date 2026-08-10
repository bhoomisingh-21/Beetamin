import type { Metadata } from 'next'
import Link from 'next/link'

import { RESOURCE_TOPICS } from '@/lib/faq-content'
import { buildPageMetadata } from '@/lib/seo-metadata'

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: 'Nutrition Resources — Deficiency Guides India',
    description:
      'Planned guides on Vitamin D deficiency symptoms, iron-rich Indian foods, and B12 for vegetarians — from TheBeetamin clinical nutrition team.',
    path: '/resources',
  })
}

export default function ResourcesIndexPage() {
  return (
    <main className="min-h-screen bg-[#0A0F0A] text-white px-4 py-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Nutrition Resources</h1>
        <p className="mt-4 text-zinc-400 leading-relaxed">
          Evidence-based guides for Indians addressing common micronutrient gaps — scaffolded for
          upcoming MDX articles.
        </p>
        <ul className="mt-10 space-y-6">
          {RESOURCE_TOPICS.map((topic) => (
            <li key={topic.slug} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-bold text-white">
                <Link href={`/resources/${topic.slug}`} className="hover:text-emerald-300">
                  {topic.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-zinc-400">{topic.description}</p>
            </li>
          ))}
        </ul>
        <Link href="/" className="mt-10 inline-block text-sm text-emerald-400 hover:underline">
          ← Back to home
        </Link>
      </div>
    </main>
  )
}
