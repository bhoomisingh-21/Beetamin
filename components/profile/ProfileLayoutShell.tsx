'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'
import {
  FileText,
  FlaskConical,
  LayoutDashboard,
  Leaf,
  Target,
  TrendingUp,
} from 'lucide-react'
import Navbar from '@/components/sections/Navbar'

const NAV = [
  { href: '/profile', label: 'Overview', Icon: LayoutDashboard },
  { href: '/profile/deficiency', label: 'Deficiency', Icon: FlaskConical },
  { href: '/profile/reports', label: 'My Reports', Icon: FileText },
  { href: '/profile/progress', label: 'Progress', Icon: TrendingUp },
  { href: '/profile/goals', label: 'Goals', Icon: Target },
] as const

export default function ProfileLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/profile') return pathname === '/profile'
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <div className="min-h-screen bg-[#0A0F14] text-white">
      <Navbar />

      <div className="mx-auto flex max-w-[1600px] flex-col md:flex-row">
        <aside className="relative z-30 hidden w-[220px] shrink-0 flex-col border-r border-white/[0.08] bg-[#0A0F14] md:flex">
          <div className="flex min-h-[calc(100vh-4rem)] flex-col px-3 py-6">
            <Link href="/" className="flex items-center gap-2 px-2 font-bold text-white">
              <Leaf className="shrink-0 text-emerald-500" size={20} aria-hidden />
              <span className="text-base tracking-tight">TheBeetamin</span>
            </Link>

            <div className="my-5 h-px bg-white/[0.08]" />

            <nav className="flex flex-col gap-0.5">
              {NAV.map(({ href, label, Icon }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm font-semibold transition-colors ${
                      active
                        ? 'border-emerald-500 bg-[#0d2418] text-emerald-400'
                        : 'border-transparent text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                    {label}
                  </Link>
                )
              })}
            </nav>

            <div className="mt-auto border-t border-white/[0.08] pt-4">
              <SignOutButton redirectUrl="/">
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-400 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  Log out
                </button>
              </SignOutButton>
            </div>
          </div>
        </aside>

        <div className="border-b border-white/[0.08] bg-[#0A0F14] px-2 py-3 md:hidden">
          <div className="-mx-0.5 flex gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
            {NAV.map(({ href, label, Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition-colors ${
                    active
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-gray-600 bg-transparent text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                  <span className="whitespace-nowrap">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <main className="min-h-[calc(100vh-3.5rem)] min-w-0 flex-1 bg-[#0A0F14] p-4 md:min-h-[calc(100vh-4rem)] md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
