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
import { portal } from '@/components/nutritionist-portal/portal-theme'

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
      <header className={portal.navHeader}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/nutritionist"
            className="flex min-h-[44px] min-w-0 shrink items-center gap-2 text-slate-900"
            onClick={closeMenu}
          >
            <Leaf className="shrink-0 text-emerald-600" size={22} aria-hidden />
            <span className="truncate font-bold tracking-tight">TheBeetamin</span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-500 md:flex">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs uppercase tracking-wider text-slate-600">
              Nutritionist Portal
            </span>
            <Link href="/nutritionist/clients" className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-700">
              <Users size={16} aria-hidden />
              Clients
            </Link>
            <Link href="/nutritionist/appointments" className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-700">
              <CalendarDays size={16} aria-hidden />
              Appointments
            </Link>
            <Link href={availabilityHref} className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-700">
              <CalendarClock size={16} aria-hidden />
              Availability
            </Link>
            <Link href="/nutritionist-dashboard" className="text-slate-700 hover:text-emerald-700">
              Quick dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {!isLoaded ? (
              <span className="text-xs text-slate-500" aria-hidden>
                …
              </span>
            ) : isSignedIn ? (
              <>
                <span className="hidden max-w-[140px] truncate text-sm text-slate-700 lg:inline">{name}</span>
                <UserButton />
              </>
            ) : (
              <>
                <span className="hidden text-sm text-slate-500 lg:inline">Signed in</span>
                <button
                  type="button"
                  onClick={() => void logoutNutritionistCookie()}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-red-600 hover:bg-red-50 sm:min-w-0 sm:px-3"
                  aria-label="Log out"
                >
                  <LogOut size={18} aria-hidden />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}

            <button
              type="button"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 md:hidden"
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
            className={portal.overlay}
            aria-label="Close menu"
            onClick={closeMenu}
          />
          <nav
            className={portal.navMobile}
            aria-hidden={false}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Menu</span>
              <button
                type="button"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close menu"
                onClick={closeMenu}
              >
                <X size={22} />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 pb-8">
              <Link href="/nutritionist" className={portal.navLink} onClick={closeMenu}>
                <LayoutDashboard size={20} className="text-emerald-600" aria-hidden />
                Portal home
              </Link>
              <Link href="/nutritionist/clients" className={portal.navLink} onClick={closeMenu}>
                <Users size={20} className="text-emerald-600" aria-hidden />
                Clients
              </Link>
              <Link href="/nutritionist/appointments" className={portal.navLink} onClick={closeMenu}>
                <CalendarDays size={20} className="text-emerald-600" aria-hidden />
                Appointments
              </Link>
              <Link href={availabilityHref} className={portal.navLink} onClick={closeMenu}>
                <CalendarClock size={20} className="text-emerald-600" aria-hidden />
                Availability
              </Link>
              <Link href="/nutritionist-dashboard" className={portal.navLink} onClick={closeMenu}>
                <Home size={20} className="text-slate-500" aria-hidden />
                Quick dashboard
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  )
}
