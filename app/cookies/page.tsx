import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookie Policy — TheBeetamin',
  description: 'TheBeetamin Cookie Policy — what cookies we use and how to manage them.',
}

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-[#010d06] text-white px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            Legal
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Cookie Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: June 2026</p>
        </div>

        <div className="space-y-8 text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-white text-xl font-bold mb-3">What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences and improve your experience.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">Cookies We Use</h2>
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <p className="text-white font-semibold mb-1">Essential Cookies</p>
                <p>Required for the website to function. These include session cookies for authentication (managed by Clerk) and payment security cookies (managed by PayU). These cannot be disabled.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <p className="text-white font-semibold mb-1">Analytics Cookies</p>
                <p>Used to understand how visitors interact with our platform. We use Google Analytics and Microsoft Clarity. Data collected is anonymised. You can opt out via your browser settings or Google&apos;s opt-out tools.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <p className="text-white font-semibold mb-1">Preference Cookies</p>
                <p>Used to remember your choices such as assessment progress stored in localStorage. These are cleared when you clear your browser data.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">Managing Cookies</h2>
            <p>
              You can control and delete cookies through your browser settings. Note that disabling cookies may affect functionality. For Google Analytics, you can install the{' '}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                Google Analytics Opt-out Browser Add-on
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">Contact</h2>
            <p>
              Questions about our cookie use? Email us at{' '}
              <a href="mailto:hi@thebeetamin.com" className="text-emerald-400 hover:underline">
                hi@thebeetamin.com
              </a>.
            </p>
          </section>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#00E676] text-black font-bold rounded-full px-6 py-3 hover:bg-[#00c864] transition-all"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
