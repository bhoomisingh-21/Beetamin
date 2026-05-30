import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact Us — TheBeetamin',
  description: 'Get in touch with the TheBeetamin team for support, queries, or partnership enquiries.',
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#010d06] text-white flex flex-col items-center justify-center px-4 py-20">
      <div className="max-w-2xl w-full text-center">
        <span className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
          Contact Us
        </span>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-6">
          We&apos;re Here to Help
        </h1>
        <p className="text-gray-400 text-base leading-relaxed mb-8">
          Have a question about your plan, need support, or want to partner with us? Reach out — we typically respond within a few hours on weekdays.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 text-left">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">General Enquiries</p>
            <a href="mailto:hi@thebeetamin.com" className="text-white font-semibold hover:text-emerald-400 transition-colors">
              hi@thebeetamin.com
            </a>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">Client Support</p>
            <a href="mailto:hi@thebeetamin.com" className="text-white font-semibold hover:text-emerald-400 transition-colors">
              hi@thebeetamin.com
            </a>
          </div>
        </div>

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
