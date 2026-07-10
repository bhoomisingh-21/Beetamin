'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { usePathname, useRouter } from 'next/navigation'
import { isNutritionistEmail } from '@/lib/nutritionist-config'

const BLOCKED_PATHS = [
  '/assessment',
  '/report',
  '/sessions',
  '/booking',
  '/profile',
  '/detailed-assessment',
  '/nutritionist',
  '/nutritionist-dashboard',
  '/admin',
]
/** Once per browser tab session; cleared when the tab/window is closed */
const SESSION_POPUP_KEY = 'beetamin.deficiencyPopupShown'

function popupAlreadyShownThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_POPUP_KEY) === '1'
  } catch {
    return false
  }
}

function markPopupShownThisSession(): void {
  try {
    sessionStorage.setItem(SESSION_POPUP_KEY, '1')
  } catch {
    /* private mode / blocked storage */
  }
}

const POPUP_ITEMS = [
  { icon: '📋', text: 'Personalised deficiency report' },
  { icon: '🥗', text: '7-day Indian meal plan' },
  { icon: '💊', text: 'Supplement protocol for your gaps' },
  { icon: '📅', text: '90-day recovery timeline' },
] as const

/** Nutritionist figure — arms extend toward the offer card */
function PopupIllustration() {
  return (
    <div
      className="relative mx-auto w-[200px] shrink-0 sm:mx-0 sm:w-[220px] lg:w-[260px]"
      aria-hidden
    >
      <div className="absolute -bottom-2 left-1/2 h-16 w-[85%] -translate-x-1/2 rounded-[100%] bg-[#00C16A]/20 blur-2xl" />
      <svg
        viewBox="0 0 260 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 h-auto w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
      >
        <ellipse cx="130" cy="298" rx="72" ry="14" fill="#00C16A" fillOpacity="0.12" />
        <path
          d="M72 168c8-42 36-68 58-68s50 26 58 68c-6 38-28 62-58 62s-52-24-58-62z"
          fill="#1a3d2e"
        />
        <path
          d="M88 175c6-32 28-52 42-52s36 20 42 52c-4 28-18 48-42 48s-38-20-42-48z"
          fill="#00C16A"
          fillOpacity="0.35"
        />
        <circle cx="130" cy="108" r="44" fill="#2d4a3e" />
        <circle cx="130" cy="108" r="40" fill="#f5d0b8" />
        <path
          d="M98 98c6-18 20-28 32-28s26 10 32 28c-4 14-14 22-32 22s-28-8-32-22z"
          fill="#1a2e24"
        />
        <ellipse cx="130" cy="88" rx="38" ry="20" fill="#1a2e24" />
        <circle cx="116" cy="108" r="5" fill="#1a2e24" />
        <circle cx="144" cy="108" r="5" fill="#1a2e24" />
        <path d="M122 122q8 8 16 0" stroke="#c97b5a" strokeWidth="2.5" strokeLinecap="round" />
        <path
          d="M52 145c-8-6-18-2-22 8-2 6 0 12 4 14 10 4 18-2 20-12 2-10-2-16-10-18-20-4-14 2-24 12-26 22-2 12 4 14 14"
          fill="#f5d0b8"
          stroke="#e8b896"
          strokeWidth="1"
        />
        <path
          d="M208 145c8-6 18-2 22 8 2 6 0 12-4 14-10-4-18 2-20 12-2 10 2 16 10 18 20 4 14-2 24-12 26-22 2-12-4-14-14"
          fill="#f5d0b8"
          stroke="#e8b896"
          strokeWidth="1"
        />
        <path
          d="M168 178h72c6 0 10 4 10 10v28c0 14-10 24-24 24h-44c-14 0-24-10-24-24v-28c0-6 4-10 10-10z"
          fill="#ffffff"
          fillOpacity="0.95"
          stroke="#00C16A"
          strokeWidth="2"
        />
        <rect x="178" y="192" width="52" height="6" rx="3" fill="#00C16A" fillOpacity="0.35" />
        <rect x="178" y="204" width="40" height="4" rx="2" fill="#00C16A" fillOpacity="0.2" />
        <rect x="178" y="214" width="46" height="4" rx="2" fill="#00C16A" fillOpacity="0.2" />
        <path
          d="M158 200c12-4 28-6 44-4"
          stroke="#00C16A"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="168" cy="72" r="10" fill="#00E87A" fillOpacity="0.9" />
        <path
          d="M164 72l3 3 6-7"
          stroke="#0a1f14"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="mt-1 text-center text-[11px] font-semibold text-emerald-400/90 sm:text-left">
        Dr. Priya Sharma
      </p>
    </div>
  )
}

export function DeficiencyPopup() {
  const [show, setShow] = useState(false)
  const { isSignedIn, isLoaded, user } = useUser()
  const pathname = usePathname()
  const router = useRouter()
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nutritionistEmail = user?.primaryEmailAddress?.emailAddress ?? ''
  const isNutritionistAccount = isNutritionistEmail(nutritionistEmail)
  const isOnBlockedRoute = BLOCKED_PATHS.some((p) => pathname.startsWith(p))
  const suppressPopup = isNutritionistAccount || isOnBlockedRoute

  const handleClose = useCallback(() => {
    markPopupShownThisSession()
    setShow(false)
  }, [])

  // One delayed show per tab session; timer is not reset on client-side route changes.
  useEffect(() => {
    if (!isLoaded || isSignedIn || suppressPopup) {
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current)
        popupTimerRef.current = null
      }
      return
    }
    if (popupAlreadyShownThisSession()) return
    if (popupTimerRef.current) return

    popupTimerRef.current = setTimeout(() => {
      popupTimerRef.current = null
      if (BLOCKED_PATHS.some((p) => window.location.pathname.startsWith(p))) return
      markPopupShownThisSession()
      setShow(true)
    }, 2000)
  }, [isLoaded, isSignedIn, suppressPopup])

  // Hide on blocked routes, nutritionist accounts, or after login.
  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn || suppressPopup) {
      setShow(false)
    }
  }, [isLoaded, isSignedIn, suppressPopup])

  useEffect(() => {
    if (!show) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [show, handleClose])

  function handleCTA() {
    markPopupShownThisSession()
    setShow(false)
    router.push('/assessment')
  }

  if (!show) return null

  return (
    <>
      <div
        className="bt-popup-fade-in fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />

      {/* Centered stage: illustration + card */}
      <div
        className="bt-popup-fade-in fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
        onClick={handleClose}
      >
        <div
          className="bt-popup-pop-in relative flex max-h-[92vh] w-full max-w-[920px] flex-col items-center justify-center sm:flex-row sm:items-end sm:gap-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative z-10 sm:-mr-10 sm:mb-6 lg:-mr-14">
            <PopupIllustration />
          </div>

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bt-popup-title"
            className="relative z-20 w-full max-w-[480px] shrink-0 overflow-hidden rounded-3xl border border-[#00C16A]/30 bg-[#111111] shadow-[0_0_60px_rgba(0,193,106,0.15),0_24px_80px_rgba(0,0,0,0.6)] sm:translate-y-[-8px]"
          >
            <div className="bt-popup-shimmer h-1 bg-gradient-to-r from-[#00C16A] via-[#00E87A] to-[#00C16A] bg-[length:200%_100%]" />

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-30 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-white/[0.08] text-lg leading-none text-[#888888] transition-colors hover:bg-white/[0.12] hover:text-white"
            >
              ×
            </button>

            <div className="max-h-[calc(92vh-4px)] overflow-y-auto px-6 pb-6 pt-7 sm:px-8 sm:pb-7 sm:pt-8">
              <div className="mb-4 flex items-center gap-3 sm:mb-5">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-[#00C16A]/30">
                  <Image
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80"
                    alt=""
                    width={44}
                    height={44}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="rounded-full border border-[#00C16A]/30 bg-[#00C16A]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#00C16A]">
                  Only ₹39 today
                </span>
              </div>

              <h2 id="bt-popup-title" className="mb-2.5 text-xl font-bold leading-snug text-white sm:text-2xl">
                Are you low on Vitamin D,
                <br />
                Iron, or B12?
              </h2>

              <p className="mb-5 text-sm leading-relaxed text-[#999999] sm:mb-6 sm:text-[15px]">
                Most Indians are deficient and don&apos;t know it. Get your personalised report in minutes —
                with an Indian meal plan, supplement list, and 90-day recovery timeline.
              </p>

              <div className="mb-5 flex flex-col gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 sm:mb-6 sm:px-[18px] sm:py-4">
                {POPUP_ITEMS.map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <span className="text-lg" aria-hidden>
                      {icon}
                    </span>
                    <span className="text-sm text-[#cccccc]">{text}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCTA}
                className="w-full cursor-pointer rounded-2xl border-0 bg-[#00C16A] px-4 py-3.5 text-base font-bold tracking-tight text-black transition-[transform,background] duration-150 hover:scale-[1.02] hover:bg-[#00E87A] active:scale-[0.99] sm:py-4"
              >
                Get My Report — ₹39 →
              </button>

              <p className="mt-3 text-center text-xs text-[#555555]">
                Prepared by Dr. Priya Sharma · No spam · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes btPopupFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes btPopupPopIn {
          from {
            opacity: 0;
            transform: scale(0.94) translateY(12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes btPopupShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        .bt-popup-fade-in {
          animation: btPopupFadeIn 0.3s ease forwards;
        }
        .bt-popup-pop-in {
          animation: btPopupPopIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .bt-popup-shimmer {
          animation: btPopupShimmer 2s linear infinite;
        }
      `}</style>
    </>
  )
}
