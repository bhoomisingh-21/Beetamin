'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton, useUser } from '@clerk/nextjs'
import {
  FileText,
  FlaskConical,
  LayoutDashboard,
  Leaf,
  Target,
  TrendingUp,
} from 'lucide-react'
import type { ProfilePlanStatus } from '@/components/profile/profile-plan'
import Navbar from '@/components/sections/Navbar'
import { sidebarBg, textPrimary, textSecondary } from '@/components/profile/profile-dark-styles'

const NAV = [
  { href: '/profile', label: 'Overview', Icon: LayoutDashboard },
  { href: '/profile/deficiency', label: 'Deficiency', Icon: FlaskConical },
  { href: '/profile/reports', label: 'Reports', Icon: FileText },
  { href: '/profile/progress', label: 'Progress', Icon: TrendingUp },
  { href: '/profile/goals', label: 'Goals', Icon: Target },
] as const

function planBadge(planStatus: ProfilePlanStatus) {
  if (planStatus === 'active')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
        <span className="text-emerald-400" aria-hidden>
          ●
        </span>{' '}
        Active
      </span>
    )
  if (planStatus === 'expired')
    return (
      <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-400">
        Expired
      </span>
    )
  if (planStatus === 'completed')
    return (
      <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300">
        Completed
      </span>
    )
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#8B9AB0]">
      No plan
    </span>
  )
}

type Props = {
  children: React.ReactNode
  planStatus: ProfilePlanStatus
}

export default function ProfileLayoutShell({ children, planStatus }: Props) {
  const pathname = usePathname()
  const { user, isLoaded } = useUser()

  const displayName =
    user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Member'
  const initials = displayName
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  function isActive(href: string) {
    if (href === '/profile') return pathname === '/profile'
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <div className="min-h-screen bg-[#060910] text-[#F0F4F8]">
      <Navbar />

      <div className="mx-auto flex max-w-[1680px] flex-col md:flex-row">
        <aside
          className={`relative z-30 hidden w-[260px] shrink-0 flex-col border-r border-white/[0.06] ${sidebarBg} md:flex`}
        >
          <div className="flex min-h-[calc(100vh-4rem)] flex-col px-4 py-8">
            <Link href="/" className={`flex items-center gap-2 px-1 font-bold ${textPrimary}`}>
              <Leaf className="shrink-0 text-emerald-500" size={22} aria-hidden />
              <span className="text-[17px] tracking-tight">TheBeetamin</span>
            </Link>

            <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

            <div className="flex flex-col items-center px-1 text-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 text-[15px] font-black text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)]">
                {isLoaded ? initials : '••'}
              </div>
              <p className={`mt-3 text-[15px] font-semibold leading-snug ${textPrimary}`}>{displayName}</p>
              <p className={`mt-1 max-w-[200px] break-all text-xs leading-relaxed ${textSecondary}`}>
                {user?.primaryEmailAddress?.emailAddress ?? '—'}
              </p>
              <div className="mt-3">{planBadge(planStatus)}</div>
            </div>

            <nav className="mt-8 flex flex-col gap-1">
              {NAV.map(({ href, label, Icon }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`group flex items-center gap-3 rounded-xl border-l-[3px] px-4 py-3 text-[14px] transition-colors ${
                      active
                        ? 'border-emerald-500 bg-[#0d2418] font-semibold text-white'
                        : 'border-transparent text-[#8B9AB0] hover:bg-[#141B24]'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 shrink-0 transition-colors ${active ? 'text-emerald-500' : 'text-[#4B5563] group-hover:text-emerald-500'}`}
                      strokeWidth={2}
                      aria-hidden
                    />
                    <span
                      className={
                        active ? 'text-white' : 'text-[#8B9AB0] group-hover:text-white'
                      }
                    >
                      {label}
                    </span>
                  </Link>
                )
              })}
            </nav>

            <div className="mt-auto border-t border-white/[0.06] pt-5">
              <SignOutButton redirectUrl="/">
                <button
                  type="button"
                  className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-[#8B9AB0] transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  Log out
                </button>
              </SignOutButton>
            </div>
          </div>
        </aside>

        <div className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#060910] px-2 py-2.5 md:hidden">
          <div
            className="-mx-0.5 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {NAV.map(({ href, label, Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-white/10 bg-[#0F1623] text-[#8B9AB0]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                  <span className="whitespace-nowrap">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <main className="min-h-[calc(100vh-3.5rem)] min-w-0 flex-1 bg-[#060910] p-4 md:min-h-[calc(100vh-4rem)] md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
