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
      title: 'Article Not Found',
      description: 'This blog article is not available yet.',
      path: `/blog/${slug}`,
      noIndex: true,
    })
  }
  return buildPageMetadata({
    title: `${topic.title} — Blog`,
    description: topic.description,
    path: `/blog/${slug}`,
  })
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params
  const topic = getResourceTopic(slug)
  if (!topic) notFound()

  return (
    <main className="min-h-screen bg-[#0A0F0A] text-white px-4 py-20">
      <article className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Coming soon</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{topic.title}</h1>
        <p className="mt-4 text-zinc-400 leading-relaxed">{topic.description}</p>
        <p className="mt-6 text-sm text-zinc-500">
          This article will be published here. Meanwhile, explore{' '}
          <Link href="/nutrient-deficiency" className="text-emerald-400 hover:underline">
            nutrient deficiency guidance
          </Link>{' '}
          or take the{' '}
          <Link href="/assessment" className="text-emerald-400 hover:underline">
            free assessment
          </Link>
          .
        </p>
        <Link href="/blog" className="mt-10 inline-block text-sm text-emerald-400 hover:underline">
          ← All blog posts
        </Link>
      </article>
    </main>
  )
}
