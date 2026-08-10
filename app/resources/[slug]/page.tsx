import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getResourceTopic, RESOURCE_TOPICS } from '@/lib/faq-content'
import { buildPageMetadata } from '@/lib/seo-metadata'

export function generateStaticParams() {
  return RESOURCE_TOPICS.map((topic) => ({ slug: topic.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const topic = getResourceTopic(slug)
  if (!topic) {
    return buildPageMetadata({
      title: 'Resource Not Found',
      description: 'This nutrition resource is not available yet.',
      path: `/resources/${slug}`,
      noIndex: true,
    })
  }
  return buildPageMetadata({
    title: topic.title,
    description: topic.description,
    path: `/resources/${slug}`,
  })
}

export default async function ResourceArticlePage({ params }: Props) {
  const { slug } = await params
  const topic = getResourceTopic(slug)
  if (!topic) notFound()

  return (
    <main className="min-h-screen bg-[#0A0F0A] text-white px-4 py-20">
      <article className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Resource guide</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{topic.title}</h1>
        <p className="mt-4 text-zinc-400 leading-relaxed">{topic.description}</p>
        <p className="mt-6 text-sm text-zinc-500">
          Full article content coming soon. Start with our{' '}
          <Link href="/deficiency-recovery-report" className="text-emerald-400 hover:underline">
            deficiency recovery report
          </Link>{' '}
          or a{' '}
          <Link href="/personalised-meal-plan" className="text-emerald-400 hover:underline">
            personalised Indian meal plan
          </Link>
          .
        </p>
        <Link href="/resources" className="mt-10 inline-block text-sm text-emerald-400 hover:underline">
          ← All resources
        </Link>
      </article>
    </main>
  )
}
