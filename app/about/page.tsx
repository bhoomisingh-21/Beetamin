import type { Metadata } from 'next'
import Link from 'next/link'

import { buildPageMetadata } from '@/lib/seo-metadata'

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: 'About TheBeetamin — India Deficiency Recovery',
    description:
      'India\'s personalised deficiency recovery platform — certified nutritionists, doctor-reviewed reports, and Indian meal plans built for local diets.',
    path: '/about',
  })
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#010d06] text-white flex flex-col items-center justify-center px-4 py-20">
      <div className="max-w-2xl w-full text-center">
        <span className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
          About Us
        </span>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-6">
          India&apos;s Deficiency Recovery Platform
        </h1>
        <p className="text-gray-400 text-base leading-relaxed mb-10">
          TheBeetamin was founded with a simple mission: help every Indian understand and fix their nutrient deficiencies with personalised, expert-guided recovery plans. We are a team of certified nutritionists, doctors, and health technologists building India&apos;s most trusted deficiency recovery platform.
        </p>
        <p className="text-gray-500 text-sm mb-10">
          Explore our{' '}
          <Link href="/nutrient-deficiency" className="text-emerald-400 hover:underline">
            deficiency assessment
          </Link>
          ,{' '}
          <Link href="/personalised-meal-plan" className="text-emerald-400 hover:underline">
            Indian meal plans
          </Link>
          , and{' '}
          <Link href="/expert-nutritionist-consultation" className="text-emerald-400 hover:underline">
            nutritionist consultations
          </Link>
          . Questions? Email{' '}
          <a href="mailto:hi@thebeetamin.com" className="text-emerald-400 hover:underline">
            hi@thebeetamin.com
          </a>.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#00E676] text-black font-bold rounded-full px-6 py-3 hover:bg-[#00c864] transition-all"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  )
}
