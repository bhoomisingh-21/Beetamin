'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { Leaf, CheckCircle, Shield, Clock, Star, Loader2 } from 'lucide-react'
import { patientClerkAppearance } from '@/components/auth/patient-clerk-appearance'
import { authReturnPath } from '@/lib/auth-return-path'

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

function PatientSignUpForm() {
  const sp = useSearchParams()
  const after = authReturnPath(sp.get('after'))
  const signInHref = `/sign-in?after=${encodeURIComponent(after)}`
  return (
    <>
      <div className="mb-6">
        <h2 className="text-gray-900 font-black text-2xl">Create your account 👋</h2>
        <p className="text-gray-500 text-sm mt-1">Join thousands transforming their health with TheBeetamin.</p>
      </div>

      <div className="clerk-sign-up-wrapper w-full">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl={signInHref}
          fallbackRedirectUrl={after}
          signInFallbackRedirectUrl={after}
          appearance={patientClerkAppearance}
        />
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-gray-500">
        <span className="font-medium text-gray-700">Authorized administrator?</span>{' '}
        <Link href="/login?redirect=/admin" className="font-semibold text-emerald-600 hover:text-emerald-700">
          Sign in as admin
        </Link>
        <span className="text-gray-300"> · </span>
        <Link
          href={`/sign-up?after=${encodeURIComponent('/admin')}`}
          className="font-semibold text-emerald-600 hover:text-emerald-700"
        >
          Sign up as admin (redirects to dashboard)
        </Link>
        <span className="mt-2 block text-gray-400">
          Nutritionist login: open{' '}
          <Link href="/sign-in" className="font-medium text-emerald-600 hover:text-emerald-700">
            Sign in
          </Link>{' '}
          and choose &quot;I&apos;m a Nutritionist&quot;.
        </span>
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <span className="flex items-center gap-1.5 text-gray-400 text-xs">
          <Shield size={12} className="text-emerald-500" />HIPAA-safe & secure
        </span>
        <span className="flex items-center gap-1.5 text-gray-400 text-xs">
          <CheckCircle size={12} className="text-emerald-500" />OTP verified sign-in
        </span>
      </div>
    </>
  )
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div
        className="relative hidden flex-col justify-between overflow-hidden bg-[#010d06] px-12 py-10 lg:flex lg:w-[52%]"
        style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'70\' viewBox=\'0 0 60 70\'><path d=\'M30 0L60 17.5V52.5L30 70L0 52.5V17.5L30 0Z\' fill=\'none\' stroke=\'%2322C55E\' stroke-width=\'0.5\' stroke-opacity=\'0.15\'/></svg>')}")`,
          backgroundSize: '60px 70px',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="text-emerald-500" size={22} />
            <span className="text-white font-bold text-xl">TheBeetamin</span>
          </Link>
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition">
            ← Back to home
          </Link>
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

      <div className="flex min-h-screen w-full flex-1 flex-col items-center justify-start overflow-y-auto bg-white px-6 py-8 lg:justify-center lg:px-12 lg:py-12">
        <div className="mb-8 flex w-full max-w-[420px] items-center justify-between lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="text-emerald-500" size={22} />
            <span className="text-lg font-bold text-gray-900">TheBeetamin</span>
          </Link>
          <Link href="/" className="text-muted-foreground text-sm hover:text-gray-600">
            ← Back to home
          </Link>
        </div>

        <div className="w-full max-w-[420px]">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="animate-spin text-emerald-500" size={28} />
                <p className="text-gray-500 text-sm">Loading…</p>
              </div>
            }
          >
            <PatientSignUpForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
