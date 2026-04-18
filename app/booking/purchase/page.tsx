'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Loader2 } from 'lucide-react'
import { saveLead } from '@/lib/booking-actions'

const HEX_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='70' viewBox='0 0 60 70'><path d='M30 0L60 17.5V52.5L30 70L0 52.5V17.5L30 0Z' fill='none' stroke='%2322C55E' stroke-width='0.5' stroke-opacity='0.18'/></svg>`
const HEX_URL = `data:image/svg+xml,${encodeURIComponent(HEX_SVG.replace(/'/g, '%27'))}`

const FEATURES = [
  '6 Expert Nutrition Sessions (30 min each)',
  '3 Months Validity from purchase date',
  'Doctor-reviewed personalized guidance',
  'Personalized vitamin & supplement plan',
  'WhatsApp support between sessions',
  'Session recordings available',
]

const SOURCE_OPTIONS = [
  'Free Assessment',
  'Instagram',
  'Friend/Family',
  'Google Search',
  'YouTube',
  'Other',
]

export default function PurchasePage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', source: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    if (!form.name || !form.email || !form.phone) return
    setIsSubmitting(true)
    try {
      await saveLead(form)
      setSubmitted(true)
    } catch {
      // silently continue
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl p-10 text-center"
        >
          <CheckCircle className="text-emerald-500 mx-auto" size={64} />
          <h2 className="text-gray-900 font-black text-3xl mt-4">
            Thank you, {form.name}! 🌿
          </h2>
          <p className="text-gray-500 mt-3 leading-relaxed">
            Our team will contact you on WhatsApp within 2 hours to complete your purchase and
            activate your 6-session plan.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mt-6 text-left">
            <p className="text-emerald-700 font-bold text-sm">What happens next:</p>
            <p className="text-emerald-600 text-sm mt-2">
              1. Our nutritionist will call/WhatsApp you within 2 hours
            </p>
            <p className="text-emerald-600 text-sm mt-2">
              2. You confirm the payment of ₹3,999
            </p>
            <p className="text-emerald-600 text-sm mt-2">
              3. Your 6-session plan gets activated immediately
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="mt-6 border border-gray-200 text-gray-600 rounded-full px-6 py-3 hover:border-gray-400 transition"
          >
            Go back home
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-[#0A0F14]"
      style={{
        backgroundImage: `url("${HEX_URL}")`,
        backgroundSize: '60px 70px',
        backgroundRepeat: 'repeat',
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center pt-16 pb-8 px-4"
      >
        <span className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase rounded-full px-4 py-1.5 mb-6">
          💳 SECURE ENROLLMENT
        </span>
        <h1 className="text-white font-black text-4xl md:text-5xl">Start Your Transformation</h1>
        <p className="text-gray-400 mt-4 max-w-xl mx-auto">
          Join thousands of Indians who have fixed their nutrient deficiencies with expert guidance.
        </p>
      </motion.div>

      {/* Two Column Grid */}
      <div className="max-w-5xl mx-auto px-4 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left — Plan Summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-[#111820] border border-white/[0.08] rounded-3xl p-8"
        >
          <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase">
            THE CORE TRANSFORMATION
          </p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-white font-black text-5xl">₹3,999</span>
            <span className="text-gray-400 text-base">/3 months</span>
          </div>
          <ul className="mt-6 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <span className="text-gray-300 text-sm">{f}</span>
              </li>
            ))}
          </ul>

          {/* Testimonial */}
          <div className="bg-[#0d1520] rounded-2xl p-4 mt-6">
            <p className="text-gray-300 text-sm italic leading-relaxed">
              &ldquo;I fixed my B12 deficiency in 6 weeks. The nutritionist knew exactly what I needed.&rdquo;
            </p>
            <p className="text-gray-500 text-xs mt-2">— Priya, Mumbai</p>
          </div>
        </motion.div>

        {/* Right — Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-3xl p-8 shadow-2xl"
        >
          <h2 className="text-gray-900 font-bold text-xl">Reserve Your Spot</h2>
          <p className="text-gray-500 text-sm mt-1">Our team will contact you within 2 hours</p>

          <div className="flex flex-col gap-4 mt-6">
            <div>
              <label className="text-gray-700 text-sm font-medium mb-1 block">Full name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
                className="border border-gray-200 rounded-xl px-4 py-3 w-full text-gray-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium mb-1 block">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                className="border border-gray-200 rounded-xl px-4 py-3 w-full text-gray-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium mb-1 block">Phone number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="border border-gray-200 rounded-xl px-4 py-3 w-full text-gray-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium mb-1 block">
                How did you hear about us?
              </label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 w-full text-gray-900 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white"
              >
                <option value="">Select...</option>
                {SOURCE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !form.name || !form.email || !form.phone}
            className="mt-6 w-full bg-emerald-500 text-black font-black text-lg rounded-2xl py-4 hover:bg-emerald-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Submitting...
              </>
            ) : (
              'Reserve My Spot — ₹3,999 →'
            )}
          </button>

          <p className="mt-4 text-center text-gray-400 text-xs">
            🔒 No payment now · Our team contacts you within 2 hours · 100% refund if not satisfied
          </p>
        </motion.div>
      </div>
    </div>
  )
}
