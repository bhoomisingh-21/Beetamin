'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import {
  ChevronLeft, CheckCircle, Leaf, Shield, Loader2,
  FileText, Utensils, Pill, Dumbbell, MessageCircle, ClipboardList, ArrowRight,
} from 'lucide-react'

const PLAN_ITEMS = [
  { icon: Utensils, title: 'Personalized 90-day meal plan', desc: 'Built around your deficiencies and dietary type' },
  { icon: Pill, title: 'Exact supplement list with dosages', desc: 'Doctor-reviewed, safe, and effective' },
  { icon: Dumbbell, title: 'Daily routine for your goal', desc: 'Lifestyle changes that actually stick' },
  { icon: FileText, title: 'Foods worsening your condition', desc: 'Know what to avoid for faster recovery' },
  { icon: MessageCircle, title: 'WhatsApp nutritionist check-in', desc: 'One-time guidance from our expert' },
  { icon: ClipboardList, title: 'Doctor-reviewed & signed off', desc: 'Verified by certified nutritionists' },
]

export default function PurchasePage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  const [meta, setMeta] = useState({ name: '', email: '', phone: '', goal: '' })
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('assessmentMeta')
      if (stored) {
        const parsed = JSON.parse(stored)
        setMeta({
          name: parsed.name || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          goal: parsed.goal || parsed.healthGoal || '',
        })
      }
    } catch { /* ignore */ }
  }, [])

  async function handleConfirm() {
    setIsLoading(true)
    try {
      await fetch('/api/save-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: meta.name,
          email: meta.email,
          phone: meta.phone,
          goal: meta.goal,
          plan: '₹29 Personalized Report Plan',
          source: 'assessment-purchase',
        }),
      })
    } catch { /* continue anyway */ }
    setIsLoading(false)
    setSubmitted(true)
  }

  // ── Auth gate: must be logged in to purchase ─────────────────────────────
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={28} />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center gap-4">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm transition">
            <ChevronLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-1.5">
            <Leaf className="text-emerald-500" size={16} />
            <span className="text-gray-900 font-bold text-sm">TheBeetamin</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Shield className="text-emerald-500" size={28} />
            </div>
            <h2 className="text-gray-900 font-black text-2xl">Almost there!</h2>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              Sign in or create a free account to get your personalized ₹29 plan.
            </p>
            <SignInButton mode="redirect" forceRedirectUrl="/assessment/purchase">
              <button className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl py-4 text-base transition flex items-center justify-center gap-2">
                Sign In to Continue
                <ArrowRight size={18} />
              </button>
            </SignInButton>
            <p className="text-gray-400 text-xs mt-3">Free to sign up · No payment until you confirm</p>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-emerald-400" size={40} />
          </div>
          <h1 className="text-white font-black text-3xl">Order Confirmed! 🎉</h1>
          <p className="text-gray-400 mt-3 leading-relaxed">
            Your personalized ₹29 plan has been reserved. Our nutritionist will WhatsApp you at{' '}
            <span className="text-white font-semibold">{meta.phone || 'your number'}</span> within 24 hours with your complete plan.
          </p>

          <div className="mt-6 bg-[#111820] border border-emerald-500/20 rounded-2xl p-5 text-left space-y-3">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">What happens next</p>
            {[
              'We review your assessment results',
              'Our nutritionist builds your personalized plan',
              'You receive it via WhatsApp & email within 24 hours',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{i + 1}</div>
                <p className="text-gray-300 text-sm">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href="/"
              className="flex-1 border border-white/10 text-white font-bold rounded-2xl py-4 text-center hover:bg-white/5 transition"
            >
              Back to Home
            </a>
            <a
              href="/booking"
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl py-4 text-center transition"
            >
              Book ₹3999 Plan →
            </a>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm transition"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <div className="flex items-center gap-1.5">
          <Leaf className="text-emerald-500" size={16} />
          <span className="text-gray-900 font-bold text-sm">TheBeetamin</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16">

          {/* Left — plan details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-full px-3 py-1 mb-5">
              🔥 New User Offer — Limited Time
            </div>
            <h1 className="text-gray-900 font-black text-3xl md:text-4xl leading-tight">
              {meta.name ? `${meta.name}'s` : 'Your'} Personalized
              <span className="block text-emerald-600 mt-1">90-Day Plan</span>
            </h1>
            {meta.goal && (
              <p className="mt-3 text-gray-500 text-sm">
                Tailored for: <span className="font-semibold text-gray-700">{meta.goal}</span>
              </p>
            )}

            <div className="mt-8 space-y-4">
              {PLAN_ITEMS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="text-emerald-600" size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 bg-gray-50 rounded-2xl p-5">
              <div className="text-center">
                <p className="font-black text-2xl text-gray-900">50K+</p>
                <p className="text-gray-500 text-xs mt-0.5">Indians helped</p>
              </div>
              <div className="text-center border-x border-gray-200">
                <p className="font-black text-2xl text-gray-900">94%</p>
                <p className="text-gray-500 text-xs mt-0.5">Success rate</p>
              </div>
              <div className="text-center">
                <p className="font-black text-2xl text-emerald-600">24h</p>
                <p className="text-gray-500 text-xs mt-0.5">Delivery</p>
              </div>
            </div>
          </motion.div>

          {/* Right — order summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:sticky lg:top-20 self-start"
          >
            <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-xl">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-5">Order Summary</p>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 text-sm">Personalized 90-Day Plan</span>
                  <span className="text-gray-400 text-sm line-through">₹299</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-600 text-sm font-bold">New User Discount</span>
                  <span className="text-emerald-600 text-sm font-bold">-₹270</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                  <span className="text-gray-900 font-black text-lg">Total</span>
                  <span className="text-gray-900 font-black text-4xl">₹29</span>
                </div>
              </div>

              {/* Pre-filled info */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-3">Delivery Details</p>
                {[
                  { label: 'Name', value: meta.name },
                  { label: 'Email', value: meta.email },
                  { label: 'WhatsApp', value: meta.phone },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500 text-xs">{label}</span>
                    <span className="text-gray-800 text-xs font-medium truncate max-w-[160px]">
                      {value || <span className="text-gray-400 italic">Not provided</span>}
                    </span>
                  </div>
                ))}
              </div>

              {/* Payment icons */}
              <div className="mb-5">
                <p className="text-xs text-gray-500 font-medium text-center mb-2">Secure Payment via Razorpay</p>
                <div className="flex justify-center items-center gap-3 flex-wrap">
                  <img src="https://cdn.simpleicons.org/googlepay" className="h-5" alt="Google Pay" />
                  <img src="https://cdn.simpleicons.org/phonepe" className="h-5" alt="PhonePe" />
                  <img src="https://cdn.simpleicons.org/paytm" className="h-5" alt="Paytm" />
                  <img src="https://cdn.simpleicons.org/visa" className="h-5" alt="Visa" />
                  <img src="https://cdn.simpleicons.org/mastercard" className="h-5" alt="Mastercard" />
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-black py-4 rounded-2xl text-base shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processing...
                  </>
                ) : (
                  '🔒 CONFIRM & PAY ₹29'
                )}
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-gray-400 text-xs">
                <Shield size={11} className="text-emerald-500" />
                100% Secure • No hidden charges
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                <p className="text-gray-400 text-xs">Want real 1-on-1 sessions?</p>
                <button
                  onClick={() => router.push('/booking')}
                  className="text-gray-700 font-semibold text-sm mt-1 hover:text-emerald-600 transition"
                >
                  Book the Complete ₹3999 Plan →
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
