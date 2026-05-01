'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserButton, useAuth, useUser } from '@clerk/nextjs'
import { CalendarClock, CalendarDays, Leaf, LogOut, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function NutritionistPortalNavbar() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const name = user?.fullName || user?.firstName || 'Nutritionist'

  async function logoutNutritionistCookie() {
    await supabase.auth.signOut()
    await fetch('/api/auth/nutritionist-session', { method: 'DELETE' })
    router.push('/sign-in')
  }

  const availabilityHref =
    isLoaded && isSignedIn ? '/nutritionist/availability' : '/nutritionist-dashboard/availability'

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#060910]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/nutritionist" className="flex shrink-0 items-center gap-2 text-[#F0F4F8]">
          <Leaf className="text-emerald-500" size={22} aria-hidden />
          <span className="font-bold tracking-tight">TheBeetamin</span>
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

        <div className="flex items-center gap-3">
          {!isLoaded ? (
            <span className="text-xs text-[#8B9AB0]" aria-hidden>
              …
            </span>
          ) : isSignedIn ? (
            <>
              <span className="hidden max-w-[140px] truncate text-sm text-[#F0F4F8] sm:inline">{name}</span>
              <UserButton />
            </>
          ) : (
            <>
              <span className="hidden text-sm text-[#8B9AB0] sm:inline">Signed in</span>
              <button
                type="button"
                onClick={() => void logoutNutritionistCookie()}
                className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10"
              >
                <LogOut size={14} aria-hidden />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
