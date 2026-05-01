'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton, useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Calendar,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  ShieldX,
  UserCircle,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { isAdmin } from '@/lib/admin'
import { supabase } from '@/lib/supabase'

function AccessDenied({ emailHint }: { emailHint: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0F14] px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm rounded-3xl border border-red-500/30 bg-[#111820] p-10 text-center"
      >
        <ShieldX className="mx-auto text-red-500" size={64} aria-hidden />
        <h1 className="mt-4 font-black text-3xl text-white">Access Denied</h1>
        <p className="mt-2 text-sm text-gray-400">
          This panel is restricted to authorized administrators only.
        </p>
        {emailHint ? <p className="mt-2 text-xs text-gray-600">Signed in as {emailHint}</p> : null}
        <button
          type="button"
          onClick={() => {
            window.location.href = '/'
          }}
          className="mt-8 rounded-full bg-emerald-500 px-8 py-3 font-bold text-black transition hover:bg-emerald-400"
        >
          Back to Home
        </button>
      </motion.div>
    </div>
  )
}

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  const links = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/appointments', label: 'Appointments', icon: Calendar },
    { href: '/admin/nutritionists', label: 'Nutritionists', icon: Users },
    { href: '/admin/clients', label: 'Clients', icon: UserCircle },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <nav className="mt-8 flex flex-col gap-1 px-3">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
              active
                ? 'border border-emerald-500/20 bg-emerald-500/20 text-emerald-400'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon size={18} className="shrink-0 opacity-90" aria-hidden />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isLoaded: clerkLoaded } = useUser()
  const [nutEmail, setNutEmail] = useState<string | null>(null)
  const [nutDone, setNutDone] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setNutEmail(data.session?.user?.email?.toLowerCase().trim() ?? null)
        setNutDone(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  const clerkEmail = user?.primaryEmailAddress?.emailAddress ?? ''
  const email = clerkEmail || nutEmail || ''
  const sessionReady = clerkLoaded && nutDone
  const allowed = isAdmin(email)

  if (!sessionReady) {
    return (
      <div className="flex min-h-screen flex-col gap-4 bg-[#0A0F14] p-8">
        <div className="h-10 max-w-xs animate-pulse rounded-xl bg-[#1a2535]" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#1a2535]" />
          ))}
        </div>
      </div>
    )
  }

  if (!allowed) {
    return <AccessDenied emailHint={email} />
  }

  const sidebar = (
    <>
      <div className="flex items-center gap-2 px-4 pt-6">
        <Leaf className="text-emerald-500" size={22} aria-hidden />
        <span className="truncate font-bold text-white">TheBeetamin</span>
      </div>
      <div className="mx-4 mt-3 inline-flex items-center rounded-full bg-red-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400 border border-red-500/25">
        Admin Panel
      </div>
      <SidebarNav pathname={pathname} onNavigate={() => setMobileOpen(false)} />
      <div className="mt-auto border-t border-white/8 p-4">
        <p className="truncate text-xs text-gray-500">{email || '—'}</p>
        {user ? (
          <SignOutButton redirectUrl="/">
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-red-500/30 hover:text-red-400"
            >
              <LogOut size={16} aria-hidden />
              Sign Out
            </button>
          </SignOutButton>
        ) : (
          <button
            type="button"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-red-500/30 hover:text-red-400"
            onClick={async () => {
              await supabase.auth.signOut()
              await fetch('/api/auth/nutritionist-session', { method: 'DELETE' })
              window.location.href = '/'
            }}
          >
            <LogOut size={16} aria-hidden />
            Sign Out
          </button>
        )}
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/8 bg-[#0A0F14] px-4 py-3 md:hidden">
        <div className="flex items-center gap-2 min-w-0">
          <Leaf className="shrink-0 text-emerald-500" size={20} />
          <span className="truncate font-bold text-white text-sm">Admin</span>
          <span className="shrink-0 rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] font-bold uppercase text-red-400">
            Panel
          </span>
        </div>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 text-white"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-white/8 bg-[#0A0F14] shadow-2xl">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/8 bg-[#0A0F14] md:flex">
        {sidebar}
      </aside>

      <main className="min-h-screen md:ml-64 md:p-8 p-4 pb-10">{children}</main>
    </div>
  )
}
