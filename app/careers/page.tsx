import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Careers — TheBeetamin',
  description: 'Join the TheBeetamin team and help build India\'s leading deficiency recovery platform.',
}

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-[#010d06] text-white flex flex-col items-center justify-center px-4 py-20">
      <div className="max-w-2xl w-full text-center">
        <span className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
          Careers
        </span>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-6">
          Join Our Team
        </h1>
        <p className="text-gray-400 text-base leading-relaxed mb-10">
          We are always looking for passionate nutritionists, doctors, engineers, and health communicators who want to make a real difference in people&apos;s lives. Our careers page is being built and open roles will be listed here soon.
        </p>
        <p className="text-gray-500 text-sm mb-10">
          Interested in working with us? Send your CV and a brief note to{' '}
          <a href="mailto:hi@thebeetamin.com" className="text-emerald-400 hover:underline">
            hi@thebeetamin.com
          </a>{' '}
          with the subject line &quot;Careers Inquiry&quot;.
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
