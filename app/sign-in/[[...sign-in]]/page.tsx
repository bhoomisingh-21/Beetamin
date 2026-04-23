'use client'

import { useState } from 'react'
import { SignIn, useUser } from '@clerk/nextjs'
import { patientClerkAppearance } from '@/components/auth/patient-clerk-appearance'
import { useRouter } from 'next/navigation'
import { Leaf, CheckCircle, Shield, Clock, Star, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { ALLOWED_NUTRITIONIST_EMAILS } from '@/lib/nutritionist-config'
import { supabase } from '@/lib/supabase'

const BENEFITS = [
  { icon: CheckCircle, text: 'Doctor-reviewed personalized guidance' },
  { icon: Shield, text: 'Certified nutritionists with 5+ years experience' },
  { icon: Clock, text: '30-min focused sessions, 6 over 3 months' },
  { icon: Star, text: '50,000+ lives transformed across India' },
]

const TESTIMONIALS = [
  { name: 'Priya S.', location: 'Mumbai', text: 'Fixed my B12 deficiency in 6 weeks. Life-changing.', avatar: 'P' },
  { name: 'Rahul K.', location: 'Bangalore', text: 'My energy levels are back. Finally feel like myself.', avatar: 'R' },
]

// ── Nutritionist login (fully custom, no Clerk UI) ────────────────────────────
function NutritionistLogin({ onSwitchToUser }: { onSwitchToUser: () => void }) {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'password'>('email')
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  function goBack() {
    setStep('email')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setInfo('')
    setMode('signin')
  }

  function handleEmailContinue(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) { setError('Please enter your email address.'); return }
    if (!ALLOWED_NUTRITIONIST_EMAILS.includes(trimmed)) {
      setError('This is the Nutritionist Portal. Please sign in as a User.')
      return
    }
    setError('')
    setStep('password')
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!password) { setError('Please enter your password.'); return }
    setLoading(true)
    setError('')
    const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    setLoading(false)
    if (authError) {
      if (authError.message.toLowerCase().includes('email not confirmed') || authError.message.toLowerCase().includes('confirm')) {
        setError('Please confirm your email first. Check your inbox for a confirmation link from Supabase.')
      } else {
        setError(authError.message || 'Invalid credentials. Try again.')
      }
      return
    }
    const accessToken = signInData.session?.access_token
    if (!accessToken) {
      setError('Could not establish a session. Try again.')
      return
    }
    const sessionRes = await fetch('/api/auth/nutritionist-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        access_token: accessToken,
      }),
    })
    if (!sessionRes.ok) {
      const errJson = (await sessionRes.json().catch(() => ({}))) as { error?: string }
      setError(errJson.error || 'Could not complete sign-in. Try again.')
      return
    }
    router.push('/nutritionist-dashboard')
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!password) { setError('Please enter a password.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    })
    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    setInfo('Account created! Check your email to confirm, then sign in.')
    setMode('signin')
    setPassword('')
    setConfirmPassword('')
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/nutritionist-update-password` }
    )
    setLoading(false)
    if (resetError) {
      setError('Could not send reset email. Try again.')
      return
    }
    setInfo('Password reset email sent! Check your inbox.')
    setMode('signin')
  }

  // ── Email step ────────────────────────────────────────────────────────────
  if (step === 'email') {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-gray-900 font-black text-2xl">Nutritionist Portal 🥗</h2>
          <p className="text-gray-500 text-sm mt-1">Sign in to manage your sessions and clients.</p>
        </div>
        <form onSubmit={handleEmailContinue} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nutritionist Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              placeholder="your@email.com"
              autoFocus
              className={`w-full border rounded-xl px-4 h-11 text-gray-900 text-sm focus:outline-none focus:ring-2 transition ${
                error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-100'
              }`}
            />
            {error && (
              <div className="flex items-start gap-2 mt-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2.5">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>{error}</span>
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
            <button type="button" onClick={onSwitchToUser} className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign in as a User
            </button>
          </p>
        </form>
      </div>
    )
  }

  // ── Password step (sign in / sign up / forgot) ────────────────────────────
  const emailRow = (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
      <div className="flex items-center w-full border border-gray-100 bg-gray-50 rounded-xl px-4 h-11 text-gray-500 text-sm gap-2">
        <span className="flex-1 truncate">{email}</span>
        <button type="button" onClick={goBack} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium shrink-0">
          Change
        </button>
      </div>
    </div>
  )

  const passwordField = (label: string, val: string, setVal: (v: string) => void, show: boolean, setShow: (v: boolean) => void) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className={`flex items-center w-full border rounded-xl px-4 h-11 transition ${
        error ? 'border-red-400' : 'border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100'
      }`}>
        <input
          type={show ? 'text' : 'password'}
          value={val}
          onChange={(e) => { setVal(e.target.value); setError('') }}
          placeholder="Enter password"
          autoFocus={label === 'Password'}
          className="flex-1 bg-transparent text-gray-900 text-sm outline-none"
        />
        <button type="button" onClick={() => setShow(!show)} className="text-gray-400 hover:text-gray-600 transition shrink-0">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )

  if (mode === 'forgot') {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-gray-900 font-black text-2xl">Reset Password</h2>
          <p className="text-gray-500 text-sm mt-1">We&apos;ll email you a link to set a new password.</p>
        </div>
        <form onSubmit={handleForgotPassword} className="space-y-4">
          {emailRow}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2.5">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-bold rounded-xl h-11 text-sm transition flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="animate-spin" size={16} /> Sending...</> : 'Send Reset Link →'}
          </button>
          <p className="text-center text-gray-400 text-xs">
            <button type="button" onClick={() => { setMode('signin'); setError('') }} className="text-emerald-600 hover:text-emerald-700 font-medium">
              ← Back to Sign In
            </button>
          </p>
        </form>
      </div>
    )
  }

  if (mode === 'signup') {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-gray-900 font-black text-2xl">Create Account 🥗</h2>
          <p className="text-gray-500 text-sm mt-1">Set a password for your nutritionist account.</p>
        </div>
        <form onSubmit={handleSignUp} className="space-y-4">
          {emailRow}
          {passwordField('Password', password, setPassword, showPass, setShowPass)}
          {passwordField('Confirm Password', confirmPassword, setConfirmPassword, showConfirmPass, setShowConfirmPass)}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2.5">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-bold rounded-xl h-11 text-sm transition flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="animate-spin" size={16} /> Creating...</> : 'Create Account →'}
          </button>
          <p className="text-center text-gray-400 text-xs">
            Already have an account?{' '}
            <button type="button" onClick={() => { setMode('signin'); setError('') }} className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign In
            </button>
          </p>
        </form>
      </div>
    )
  }

  // default: sign in
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-gray-900 font-black text-2xl">Nutritionist Portal 🥗</h2>
        <p className="text-gray-500 text-sm mt-1">Sign in to manage your sessions and clients.</p>
      </div>
      {info && (
        <div className="flex items-start gap-2 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl px-3 py-2.5">
          <CheckCircle size={13} className="shrink-0 mt-0.5" />
          <span>{info}</span>
        </div>
      )}
      <form onSubmit={handleSignIn} className="space-y-4">
        {emailRow}
        {passwordField('Password', password, setPassword, showPass, setShowPass)}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2.5">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs">
          <button type="button" onClick={() => { setMode('forgot'); setError('') }} className="text-gray-400 hover:text-gray-600 transition">
            Forgot password?
          </button>
          <button type="button" onClick={() => { setMode('signup'); setError('') }} className="text-emerald-600 hover:text-emerald-700 font-medium">
            First time? Create account
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-bold rounded-xl h-11 text-sm transition flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="animate-spin" size={16} /> Signing in...</> : 'Sign In →'}
        </button>
      </form>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SignInPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [isNutritionist, setIsNutritionist] = useState(false)

  // If already signed in via Clerk (regular user) and they switch to Nutritionist tab:
  // Check their email — if NOT in whitelist → show access denied
  const clerkEmail = user?.primaryEmailAddress?.emailAddress ?? ''
  const clerkUserBlockedOnNutTab =
    isLoaded && isSignedIn && isNutritionist &&
    !ALLOWED_NUTRITIONIST_EMAILS.includes(clerkEmail.toLowerCase().trim())

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ── LEFT PANEL (desktop only) ──────────────────────────────────── */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden bg-[#010d06] px-12 py-10 lg:flex lg:w-[52%]"
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
            🌿 INDIA&apos;S #1 NUTRITION SYSTEM
          </div>
          <h1 className="text-white font-black text-4xl xl:text-5xl leading-tight">
            Fix Your Deficiencies<br />
            <span className="text-[#00E676]">In 90 Days.</span>
          </h1>
          <p className="text-gray-400 mt-4 text-base leading-relaxed max-w-md">
            Expert-led nutrition sessions, personalized supplement plans, and doctor-reviewed guidance — all in one place.
          </p>
          <ul className="mt-8 space-y-3">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <Icon className="text-emerald-500 shrink-0" size={16} />
                <span className="text-gray-300 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 space-y-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-black font-black text-sm shrink-0">{t.avatar}</div>
              <div>
                <p className="text-white text-sm leading-snug">&ldquo;{t.text}&rdquo;</p>
                <p className="text-gray-500 text-xs mt-1">{t.name} · {t.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
      <div className="flex min-h-screen w-full flex-1 flex-col items-center justify-start overflow-y-auto bg-white px-6 py-8 lg:justify-center lg:px-12 lg:py-12">
        {/* Mobile: logo + back (left panel is hidden below lg) */}
        <div className="mb-8 flex w-full max-w-[420px] items-center justify-between lg:hidden">
          <a href="/" className="flex items-center gap-2">
            <Leaf className="text-emerald-500" size={22} />
            <span className="text-lg font-bold text-gray-900">TheBeetamin</span>
          </a>
          <a href="/" className="text-muted-foreground text-sm hover:text-gray-600">
            ← Back to home
          </a>
        </div>

        <div className="w-full max-w-[420px]">
          {/* ── Toggle ── */}
          <div className="mb-6 flex w-full gap-0 rounded-full border border-gray-200 bg-gray-50 p-1 lg:rounded-xl lg:border-0 lg:bg-gray-100">
            <button
              onClick={() => {
                setIsNutritionist(false)
                void fetch('/api/auth/nutritionist-session', { method: 'DELETE' })
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${!isNutritionist ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              I&apos;m a Patient
            </button>
            <button
              onClick={() => setIsNutritionist(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${isNutritionist ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              I&apos;m a Nutritionist
            </button>
          </div>

          {/* ── Nutritionist tab content ── */}
          {isNutritionist ? (
            clerkUserBlockedOnNutTab ? (
              // Already signed in via Clerk but not a nutritionist
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="text-red-500" size={32} />
                </div>
                <h2 className="text-gray-900 font-black text-xl">Access Denied</h2>
                <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                  This is the Nutritionist Portal. Your account (<span className="font-medium text-gray-700">{clerkEmail}</span>) is not registered as a nutritionist.
                </p>
                <p className="text-gray-500 text-sm mt-1">Please sign in as a User.</p>
                <button
                  onClick={() => setIsNutritionist(false)}
                  className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl py-3 text-sm transition"
                >
                  Go to User Login
                </button>
              </div>
            ) : (
              // Custom Supabase login — NO Clerk UI
              <NutritionistLogin onSwitchToUser={() => setIsNutritionist(false)} />
            )
          ) : (
            // ── Patient tab — Clerk SignIn unchanged ──
            <>
              <div className="mb-6">
                <h2 className="text-gray-900 font-black text-2xl">Hi there 👋</h2>
                <p className="text-gray-500 text-sm mt-1">Get started with your nutrition transformation.</p>
              </div>

              <div className="clerk-sign-in-wrapper w-full">
                <SignIn
                  key="patient"
                  signUpUrl="/sign-up"
                  forceRedirectUrl="/booking"
                  appearance={patientClerkAppearance}
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <Shield size={12} className="text-emerald-500" />HIPAA-safe & secure
                </span>
                <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <CheckCircle size={12} className="text-emerald-500" />OTP verified sign-in
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
