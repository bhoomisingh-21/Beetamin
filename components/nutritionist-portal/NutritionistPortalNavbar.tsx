'use client'

import Link from 'next/link'
import { UserButton, useUser } from '@clerk/nextjs'
import { CalendarClock, Leaf, Users } from 'lucide-react'

export function NutritionistPortalNavbar() {
  const { user } = useUser()
  const name = user?.fullName || user?.firstName || 'Nutritionist'

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
          <Link href="/nutritionist/availability" className="flex items-center gap-1.5 hover:text-emerald-400">
            <CalendarClock size={16} aria-hidden />
            Availability
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden max-w-[140px] truncate text-sm text-[#F0F4F8] sm:inline">{name}</span>
          <UserButton />
        </div>
      </div>
    </header>
  )
}
