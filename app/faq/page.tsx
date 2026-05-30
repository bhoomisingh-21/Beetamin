import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'FAQ — TheBeetamin',
  description: 'Answers to frequently asked questions about TheBeetamin\'s nutrition plans, pricing, sessions, and refund policy.',
}

const FAQS = [
  {
    q: 'How is Beetamin different from other nutrition apps?',
    a: 'TheBeetamin connects you with certified nutritionists who build plans from your assessment, goals, and medical history — reviewed by a doctor before delivery. No AI-generated generic advice.',
  },
  {
    q: 'Do I need blood tests before starting?',
    a: 'No blood tests required upfront. We start with a comprehensive health assessment and symptom questionnaire. Your nutritionist may recommend specific tests later as part of your protocol.',
  },
  {
    q: 'What happens after I complete the free assessment?',
    a: "You'll receive an instant summary of your likely nutrient gaps. A nutritionist will then reach out within 24 hours to schedule your 1-on-1 consultation call.",
  },
  {
    q: 'Is the ₹3,999 plan a one-time payment or a subscription?',
    a: "It's a one-time payment covering 3 full months — all expert sessions, your personalised plan, fortnightly check-ins, and WhatsApp support. No recurring charges.",
  },
  {
    q: 'What is your refund policy?',
    a: "If you're unsatisfied after your first session, contact us at hi@thebeetamin.com within 7 days of purchase for a full refund. No questions asked.",
  },
  {
    q: 'Who exactly will be my nutritionist?',
    a: "After purchase, you'll be matched with one of our certified nutritionists based on your assessment results and health goals. You'll see their full profile — including their specialty, experience, and credentials — before your first session.",
  },
  {
    q: 'Is this service a substitute for medical treatment?',
    a: 'No. TheBeetamin is a nutrition guidance platform and is not a substitute for medical diagnosis or treatment. Always consult a qualified doctor for medical conditions.',
  },
]

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-[#010d06] text-white px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            FAQ
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-400 text-base">
            Can&apos;t find your answer here? Email us at{' '}
            <a href="mailto:hi@thebeetamin.com" className="text-emerald-400 hover:underline">
              hi@thebeetamin.com
            </a>
          </p>
        </div>

        <div className="space-y-4 mb-12">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="font-bold text-white mb-2">{q}</p>
              <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
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
