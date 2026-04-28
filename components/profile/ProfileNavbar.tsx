'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, Calendar, Leaf, User } from 'lucide-react'

export default function ProfileNavbar() {
  const pathname = usePathname()
  const onProfile = pathname === '/profile' || pathname?.startsWith('/profile/')

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#060910]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1680px] items-center justify-between gap-3 px-4 md:h-16 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold text-[#F0F4F8]">
          <Leaf className="text-emerald-500" size={20} aria-hidden />
          <span className="text-base md:text-lg">TheBeetamin</span>
        </Link>

        <div className="hidden flex-1 md:block" aria-hidden />

        <nav className="flex items-center gap-2 md:gap-3">
          <Link
            href="/"
            className="hidden items-center gap-1 text-sm text-[#8B9AB0] transition hover:text-white sm:inline-flex"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Link>
          <Link
            href="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[#8B9AB0] transition hover:bg-white/5 hover:text-white sm:hidden"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <Link
            href="/profile"
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              onProfile
                ? 'border border-emerald-500 text-emerald-400'
                : 'border border-white/15 text-white hover:border-white/25'
            }`}
          >
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <User className="h-3.5 w-3.5" aria-hidden />
              My Profile
            </span>
            <span className="sm:hidden">
              <User className="h-4 w-4" aria-hidden />
            </span>
          </Link>

          <Link
            href="/sessions"
            className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-zinc-900"
          >
            <Calendar className="hidden h-3.5 w-3.5 sm:inline" aria-hidden />
            <span className="hidden sm:inline">My Sessions</span>
            <span className="sm:hidden">Sessions</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
