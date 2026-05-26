'use client'

import { useCallback, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { usePathname, useRouter } from 'next/navigation'

const BLOCKED_PATHS = ['/assessment', '/report', '/sessions', '/booking', '/profile', '/detailed-assessment']

const POPUP_ITEMS = [
  { icon: '📋', text: 'Personalised deficiency report' },
  { icon: '🥗', text: '7-day Indian meal plan' },
  { icon: '💊', text: 'Supplement protocol for your gaps' },
  { icon: '📅', text: '90-day recovery timeline' },
] as const

export function DeficiencyPopup() {
  const [show, setShow] = useState(false)
  const { isSignedIn, isLoaded } = useUser()
  const pathname = usePathname()
  const router = useRouter()

  const handleClose = useCallback(() => {
    setShow(false)
    try {
      localStorage.setItem('bt_popup_seen', '1')
    } catch {
      /* private mode */
    }
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn) return
    if (BLOCKED_PATHS.some((p) => pathname.startsWith(p))) return
    try {
      if (localStorage.getItem('bt_popup_seen')) return
    } catch {
      return
    }

    const timer = setTimeout(() => setShow(true), 2000)
    return () => clearTimeout(timer)
  }, [isLoaded, isSignedIn, pathname])

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
    handleClose()
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

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bt-popup-title"
        className="bt-popup-pop-in fixed left-1/2 top-1/2 z-[9999] w-[90%] max-w-[480px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-[#00C16A]/30 bg-[#111111] shadow-[0_0_60px_rgba(0,193,106,0.15),0_24px_80px_rgba(0,0,0,0.6)]"
      >
        <div className="bt-popup-shimmer h-1 bg-gradient-to-r from-[#00C16A] via-[#00E87A] to-[#00C16A] bg-[length:200%_100%]" />

        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-white/[0.08] text-lg leading-none text-[#888888] transition-colors hover:bg-white/[0.12] hover:text-white"
        >
          ×
        </button>

        <div className="px-8 pb-7 pt-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="text-4xl" aria-hidden>
              🧬
            </span>
            <span className="rounded-full border border-[#00C16A]/30 bg-[#00C16A]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#00C16A]">
              Only ₹39 today
            </span>
          </div>

          <h2 id="bt-popup-title" className="mb-2.5 text-2xl font-bold leading-snug text-white">
            Are you low on Vitamin D,
            <br />
            Iron, or B12?
          </h2>

          <p className="mb-6 text-[15px] leading-relaxed text-[#999999]">
            Most Indians are deficient and don&apos;t know it. Get your personalised report in minutes —
            with an Indian meal plan, supplement list, and 90-day recovery timeline.
          </p>

          <div className="mb-6 flex flex-col gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-[18px] py-4">
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
            className="w-full cursor-pointer rounded-2xl border-0 bg-[#00C16A] px-4 py-4 text-base font-bold tracking-tight text-black transition-[transform,background] duration-150 hover:scale-[1.02] hover:bg-[#00E87A] active:scale-[0.99]"
          >
            Get My Report — ₹39 →
          </button>

          <p className="mt-3 text-center text-xs text-[#555555]">
            Prepared by Dr. Priya Sharma · No spam · Cancel anytime
          </p>
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
            transform: translate(-50%, -48%) scale(0.92);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
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
          animation: btPopupPopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .bt-popup-shimmer {
          animation: btPopupShimmer 2s linear infinite;
        }
      `}</style>
    </>
  )
}
