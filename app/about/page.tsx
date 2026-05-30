import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us — TheBeetamin',
  description: 'Learn about TheBeetamin, India\'s deficiency recovery platform built by certified nutritionists and doctors.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#010d06] text-white flex flex-col items-center justify-center px-4 py-20">
      <div className="max-w-2xl w-full text-center">
        <span className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
          About Us
        </span>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-6">
          Our Story is Coming Soon
        </h1>
        <p className="text-gray-400 text-base leading-relaxed mb-10">
          TheBeetamin was founded with a simple mission: help every Indian understand and fix their nutrient deficiencies with personalised, expert-guided recovery plans. We are a team of certified nutritionists, doctors, and health technologists building India&apos;s most trusted deficiency recovery platform.
        </p>
        <p className="text-gray-500 text-sm mb-10">
          Our full story, team bios, and company details are being put together and will be live soon. In the meantime, feel free to reach us at{' '}
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
