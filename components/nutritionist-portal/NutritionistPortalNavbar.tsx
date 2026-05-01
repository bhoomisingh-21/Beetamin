'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { UserButton, useAuth, useUser } from '@clerk/nextjs'
import {
  CalendarClock,
  CalendarDays,
  Home,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const navLinkClass =
  'flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-[#F0F4F8] transition hover:bg-white/[0.06] active:bg-white/[0.08]'

export function NutritionistPortalNavbar() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const name = user?.fullName || user?.firstName || 'Nutritionist'
  const [menuOpen, setMenuOpen] = useState(false)

  async function logoutNutritionistCookie() {
    await supabase.auth.signOut()
    await fetch('/api/auth/nutritionist-session', { method: 'DELETE' })
    router.push('/sign-in')
  }

  const availabilityHref =
    isLoaded && isSignedIn ? '/nutritionist/availability' : '/nutritionist-dashboard/availability'

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#060910]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/nutritionist"
            className="flex min-h-[44px] min-w-0 shrink items-center gap-2 text-[#F0F4F8]"
            onClick={closeMenu}
          >
            <Leaf className="shrink-0 text-emerald-500" size={22} aria-hidden />
            <span className="truncate font-bold tracking-tight">TheBeetamin</span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-semibold text-[#8B9AB0] md:flex">
            <span className="rounded-full border border-white/[0.06] bg-[#0F1623] px-4 py-1.5 text-xs uppercase tracking-wider">
              Nutritionist Portal
            </span>
            <Link href="/nutritionist/clients" className="flex items-center gap-1.5 hover:text-emerald-400">
              <Users size={16} aria-hidden />
              Clients
            </Link>
            <Link href="/nutritionist/appointments" className="flex items-center gap-1.5 hover:text-emerald-400">
              <CalendarDays size={16} aria-hidden />
              Appointments
            </Link>
            <Link href={availabilityHref} className="flex items-center gap-1.5 hover:text-emerald-400">
              <CalendarClock size={16} aria-hidden />
              Availability
            </Link>
            <Link href="/nutritionist-dashboard" className="hover:text-emerald-400">
              Quick dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {!isLoaded ? (
              <span className="text-xs text-[#8B9AB0]" aria-hidden>
                …
              </span>
            ) : isSignedIn ? (
              <>
                <span className="hidden max-w-[140px] truncate text-sm text-[#F0F4F8] lg:inline">{name}</span>
                <UserButton />
              </>
            ) : (
              <>
                <span className="hidden text-sm text-[#8B9AB0] lg:inline">Signed in</span>
                <button
                  type="button"
                  onClick={() => void logoutNutritionistCookie()}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-lg border border-white/10 px-3 text-xs font-bold text-red-400 hover:bg-red-500/10 sm:min-w-0 sm:px-3"
                  aria-label="Log out"
                >
                  <LogOut size={18} aria-hidden />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}

            <button
              type="button"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/[0.12] text-[#F0F4F8] hover:bg-white/[0.06] md:hidden"
              aria-expanded={menuOpen}
              aria-controls="nutritionist-portal-mobile-nav"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" id="nutritionist-portal-mobile-nav">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={closeMenu}
          />
          <nav
            className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col border-l border-white/[0.08] bg-[#060910] shadow-2xl"
            aria-hidden={false}
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8B9AB0]">Menu</span>
              <button
                type="button"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#8B9AB0] hover:bg-white/[0.06] hover:text-[#F0F4F8]"
                aria-label="Close menu"
                onClick={closeMenu}
              >
                <X size={22} />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 pb-8">
              <Link href="/nutritionist" className={navLinkClass} onClick={closeMenu}>
                <LayoutDashboard size={20} className="text-emerald-400" aria-hidden />
                Portal home
              </Link>
              <Link href="/nutritionist/clients" className={navLinkClass} onClick={closeMenu}>
                <Users size={20} className="text-emerald-400" aria-hidden />
                Clients
              </Link>
              <Link href="/nutritionist/appointments" className={navLinkClass} onClick={closeMenu}>
                <CalendarDays size={20} className="text-emerald-400" aria-hidden />
                Appointments
              </Link>
              <Link href={availabilityHref} className={navLinkClass} onClick={closeMenu}>
                <CalendarClock size={20} className="text-emerald-400" aria-hidden />
                Availability
              </Link>
              <Link href="/nutritionist-dashboard" className={navLinkClass} onClick={closeMenu}>
                <Home size={20} className="text-[#8B9AB0]" aria-hidden />
                Quick dashboard
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  )
}
