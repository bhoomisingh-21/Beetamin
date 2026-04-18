'use client'

import { useState, useEffect } from 'react'
import { SignIn, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Leaf, Shield, ChevronLeft, AlertCircle } from 'lucide-react'
import { ALLOWED_NUTRITIONIST_EMAILS } from '@/lib/nutritionist-config'

export default function NutritionistLoginPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [emailChecked, setEmailChecked] = useState(false)
  const [emailError, setEmailError] = useState('')

  // If already signed in as a nutritionist, redirect to dashboard
  useEffect(() => {
    if (!isLoaded || !user) return
    const userEmail = user.primaryEmailAddress?.emailAddress ?? ''
    if (ALLOWED_NUTRITIONIST_EMAILS.includes(userEmail.toLowerCase().trim())) {
      router.replace('/nutritionist-dashboard')
    } else {
      // Signed in, but not a nutritionist
      router.replace('/')
    }
  }, [isLoaded, user, router])

  function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setEmailError('Please enter your email address.')
      return
    }
    if (!ALLOWED_NUTRITIONIST_EMAILS.includes(trimmed)) {
      setEmailError('This is the Nutritionist Portal. Please sign in as a User.')
      return
    }
    setEmailError('')
    setEmailChecked(true)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-[48%] flex-col justify-between bg-[#010d06] px-12 py-10 relative overflow-hidden"
        style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'70\' viewBox=\'0 0 60 70\'><path d=\'M30 0L60 17.5V52.5L30 70L0 52.5V17.5L30 0Z\' fill=\'none\' stroke=\'%2322C55E\' stroke-width=\'0.5\' stroke-opacity=\'0.15\'/></svg>')}")`,
          backgroundSize: '60px 70px',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <a href="/" className="flex items-center gap-2">
            <Leaf className="text-emerald-500" size={22} />
            <span className="text-white font-bold text-xl">TheBeetamin</span>
          </a>
          <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition">← Back to home</a>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase rounded-full px-4 py-1.5 mb-6">
            🥗 NUTRITIONIST PORTAL
          </div>
          <h1 className="text-white font-black text-4xl xl:text-5xl leading-tight">
            Welcome Back,
            <br />
            <span className="text-emerald-400">Nutritionist.</span>
          </h1>
          <p className="text-gray-400 mt-4 text-base leading-relaxed max-w-md">
            Manage your client sessions, set your availability, and track every appointment — all in one place.
          </p>

          <div className="mt-10 space-y-4">
            {[
              'View & manage all client bookings',
              'Set your weekly availability',
              'Confirm, reschedule, or complete sessions',
              'Track session progress per client',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                <span className="text-gray-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-gray-600 text-xs">
          <Shield size={12} />
          <span>Restricted access — nutritionists only</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 min-h-screen">
        {/* Mobile logo */}
        <div className="flex items-center justify-between w-full max-w-[420px] mb-8 lg:hidden">
          <a href="/" className="flex items-center gap-2">
            <Leaf className="text-emerald-500" size={20} />
            <span className="text-gray-900 font-bold text-lg">TheBeetamin</span>
          </a>
          <a href="/" className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1">
            <ChevronLeft size={14} />Back
          </a>
        </div>

        <div className="w-full max-w-[420px]">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full px-3 py-1 mb-4">
              🥗 Nutritionist Portal
            </div>
            <h2 className="text-gray-900 font-black text-2xl">
              {emailChecked ? 'Sign in to your portal' : 'Verify your access'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {emailChecked
                ? 'Enter your credentials below to continue.'
                : 'Enter your registered nutritionist email to continue.'}
            </p>
          </div>

          {!emailChecked ? (
            <form onSubmit={handleContinue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nutritionist Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
                  placeholder="your@email.com"
                  className={`w-full border rounded-xl px-4 h-11 text-gray-900 text-sm focus:outline-none focus:ring-2 transition ${
                    emailError
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                      : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-100'
                  }`}
                />
                {emailError && (
                  <div className="flex items-start gap-2 mt-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2.5">
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                    <span>{emailError}</span>
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl h-11 text-sm transition"
              >
                Continue →
              </button>
              <p className="text-center text-gray-400 text-xs">
                Not a nutritionist?{' '}
                <a href="/sign-in" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Sign in as a User
                </a>
              </p>
            </form>
          ) : (
            <>
              <button
                onClick={() => setEmailChecked(false)}
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-5 transition"
              >
                <ChevronLeft size={14} /> Change email
              </button>
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl px-3 py-2.5 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                Signing in as: <span className="font-bold">{email}</span>
              </div>
              <SignIn
                forceRedirectUrl="/nutritionist-dashboard"
                appearance={{
                  layout: {
                    logoPlacement: 'none',
                    socialButtonsVariant: 'blockButton',
                  },
                  elements: {
                    rootBox: 'w-full',
                    card: 'shadow-none p-0 gap-0 bg-transparent',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',
                    header: 'hidden',
                    socialButtonsBlockButton:
                      'border border-gray-200 rounded-xl h-11 font-medium text-sm text-gray-700 hover:bg-gray-50 transition mb-3',
                    socialButtonsBlockButtonText: 'font-medium',
                    dividerRow: 'my-4',
                    dividerText: 'text-gray-400 text-xs',
                    formFieldLabel: 'text-gray-700 text-sm font-medium',
                    formFieldInput:
                      'border border-gray-200 rounded-xl px-4 h-11 text-gray-900 text-sm focus:border-emerald-500 focus:ring-emerald-100 focus:ring-2 focus:outline-none',
                    formButtonPrimary:
                      'bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl h-11 text-sm transition mt-1',
                    footerActionLink: 'text-emerald-600 hover:text-emerald-700 font-medium',
                    otpCodeFieldInput:
                      'border border-gray-200 rounded-xl text-gray-900 font-bold text-lg text-center focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none',
                    alertText: 'text-red-600 text-sm',
                    formFieldInputShowPasswordButton: 'text-gray-400 hover:text-gray-600',
                  },
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
