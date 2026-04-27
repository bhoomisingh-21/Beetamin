'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton, useUser } from '@clerk/nextjs'
import { Leaf } from 'lucide-react'

const NAV = [
  { href: '/profile', label: 'Personal Info', emoji: '👤' },
  { href: '/profile/deficiency', label: 'Deficiency Profile', emoji: '🧬' },
  { href: '/profile/reports', label: 'My Reports', emoji: '📋' },
  { href: '/profile/progress', label: 'Progress Tracker', emoji: '📊' },
  { href: '/profile/goals', label: 'Wellness Goals', emoji: '🎯' },
] as const

export default function ProfileLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isLoaded } = useUser()

  const displayName =
    user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'
  const initials = displayName
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-[#0A0F14] text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0A0F14]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-white">
            <Leaf className="text-emerald-500" size={20} />
            TheBeetamin
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/sessions"
              className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
            >
              My Sessions
            </Link>
            <SignOutButton redirectUrl="/">
              <button
                type="button"
                className="px-2 text-sm font-medium text-gray-400 hover:text-white"
              >
                Log out
              </button>
            </SignOutButton>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] flex-col md:flex-row">
        <aside className="hidden w-[240px] shrink-0 border-r border-white/[0.08] bg-[#0A0F14] md:block">
          <div className="sticky top-[57px] space-y-6 px-4 py-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-base font-black text-black">
                {isLoaded ? initials : '••'}
              </div>
              <p className="mt-3 text-sm font-bold leading-tight text-white">{displayName}</p>
              <p className="mt-1 max-w-[200px] break-all text-xs text-gray-500">
                {user?.primaryEmailAddress?.emailAddress ?? '—'}
              </p>
            </div>
            <div className="h-px w-full bg-white/[0.08]" />
            <nav className="flex flex-col gap-0.5">
              {NAV.map((item) => {
                const active =
                  item.href === '/profile'
                    ? pathname === '/profile'
                    : pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-r-lg border-l-[3px] px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-transparent text-gray-400 hover:text-emerald-400/90'
                    }`}
                  >
                    <span className="text-base" aria-hidden>
                      {item.emoji}
                    </span>
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        <div className="md:hidden border-b border-white/[0.08] bg-[#0A0F14] px-3 py-3">
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {NAV.map((item) => {
              const active =
                item.href === '/profile'
                  ? pathname === '/profile'
                  : pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-full border px-3 py-2 text-xs font-bold transition ${
                    active
                      ? 'border-emerald-500 bg-emerald-500 text-black'
                      : 'border-white/15 bg-transparent text-gray-400 hover:border-emerald-500/40'
                  }`}
                >
                  <span className="mr-1">{item.emoji}</span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <main className="min-h-[calc(100vh-57px)] min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  )
}
