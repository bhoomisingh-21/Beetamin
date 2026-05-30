import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — TheBeetamin',
  description: 'TheBeetamin Terms of Service — service description, payment terms, refund policy, and medical disclaimer.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#010d06] text-white px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            Legal
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Terms of Service</h1>
          <p className="text-gray-500 text-sm">Last updated: June 2026</p>
        </div>

        <div className="space-y-8 text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-white text-xl font-bold mb-3">1. Service Description</h2>
            <p>
              TheBeetamin is a personalised nutrition and deficiency recovery platform that provides users with health assessments, personalised nutrition plans, and 1-on-1 consultations with certified nutritionists. By using TheBeetamin, you agree to these Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">2. Eligibility</h2>
            <p>
              You must be at least 18 years of age to use TheBeetamin. By creating an account, you confirm you meet this requirement. For users below 18, a parent or legal guardian must provide consent.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">3. Payment Terms</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>The Core Transformation plan is priced at ₹3,999 (one-time payment). Single Booster sessions are priced at ₹499 each.</li>
              <li>All payments are processed securely through PayU. We accept UPI, credit/debit cards, and net banking.</li>
              <li>Prices are inclusive of applicable taxes unless stated otherwise.</li>
              <li>There are no hidden fees or auto-renewal charges. Every purchase is a one-time transaction.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">4. Refund Policy</h2>
            <p>
              We offer a <strong className="text-white">7-day satisfaction guarantee</strong>. If you are unsatisfied after your first session, you may request a full refund within 7 days of your purchase by emailing{' '}
              <a href="mailto:hi@thebeetamin.com" className="text-emerald-400 hover:underline">
                hi@thebeetamin.com
              </a>{' '}
              with the subject line &quot;Refund Request&quot;. Refunds are not available after 7 days or after more than one session has been conducted, whichever comes first. Report purchases (₹39) are non-refundable once the report has been generated.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">5. Medical Disclaimer</h2>
            <p className="font-medium text-yellow-300/90">
              TheBeetamin is not a medical service and does not provide medical diagnoses, prescriptions, or treatment.
            </p>
            <p className="mt-2">
              The information and recommendations provided through our platform — including personalised nutrition plans, supplement suggestions, and meal plans — are for general wellness and informational purposes only. They are not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on this platform.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">6. User Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide accurate and complete health information during the assessment and consultations.</li>
              <li>Attend scheduled sessions or provide at least 24-hour notice for cancellations.</li>
              <li>Not share your account access with others.</li>
              <li>Use the platform in good faith and not for any unlawful purpose.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">7. Intellectual Property</h2>
            <p>
              All content on TheBeetamin, including text, graphics, plans, and reports generated for you, is the intellectual property of TheBeetamin or its licensors. Your personalised plan is for your personal use only and may not be resold or redistributed.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">8. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">9. Contact</h2>
            <p>
              For any queries regarding these Terms, contact us at{' '}
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
