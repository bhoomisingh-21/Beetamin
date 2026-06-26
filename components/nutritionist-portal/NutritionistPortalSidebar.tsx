'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { UserButton, useAuth, useUser } from '@clerk/nextjs'
import {
  CalendarClock,
  CalendarDays,
  Home,
  Leaf,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { portal } from '@/components/nutritionist-portal/portal-theme'

const NAV = [
  { href: '/nutritionist', label: 'Home', Icon: Home, exact: true },
  { href: '/nutritionist/clients', label: 'Clients', Icon: Users, exact: false },
  { href: '/nutritionist/appointments', label: 'Appts', Icon: CalendarDays, exact: false },
  { href: '/nutritionist/availability', label: 'Slots', Icon: CalendarClock, exact: false },
] as const

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

export function NutritionistPortalSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)

  const availabilityHref =
    isLoaded && isSignedIn ? '/nutritionist/availability' : '/nutritionist-dashboard/availability'

  const navItems = NAV.map((item) =>
    item.href === '/nutritionist/availability' ? { ...item, href: availabilityHref } : item,
  )

  async function logoutNutritionistCookie() {
    await supabase.auth.signOut()
    await fetch('/api/auth/nutritionist-session', { method: 'DELETE' })
    router.push('/sign-in')
  }

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

  function SidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <>
        {navItems.map(({ href, label, Icon, exact }) => {
          const active = isActive(pathname ?? '', href, exact)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`${portal.sidebarLink} ${active ? portal.sidebarLinkActive : portal.sidebarLinkIdle}`}
            >
              <Icon size={22} strokeWidth={active ? 2.25 : 2} aria-hidden />
              <span>{label}</span>
            </Link>
          )
        })}
      </>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={portal.sidebar}>
        <Link
          href="/nutritionist"
          className="flex flex-col items-center gap-1 border-b border-emerald-700/60 px-2 py-5"
        >
          <Leaf className="text-emerald-300" size={26} aria-hidden />
          <span className="text-center text-[9px] font-black uppercase tracking-widest text-white lg:text-[10px]">
            Beetamin
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
          <SidebarLinks />
        </nav>

        <div className="border-t border-emerald-700/60 px-2 py-4">
          {isLoaded && isSignedIn ? (
            <div className="flex flex-col items-center gap-2">
              <UserButton
                appearance={{
                  elements: { avatarBox: 'h-9 w-9 ring-2 ring-white/20' },
                }}
              />
              <span className="max-w-full truncate text-center text-[9px] text-emerald-200/80">
                {user?.firstName || 'You'}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void logoutNutritionistCookie()}
              className={`${portal.sidebarLink} w-full ${portal.sidebarLinkIdle}`}
            >
              <LogOut size={20} aria-hidden />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className={`${portal.navHeader} md:hidden`}>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-emerald-200 text-emerald-800"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link href="/nutritionist" className="flex items-center gap-2 font-bold text-emerald-900">
            <Leaf className="text-emerald-600" size={20} aria-hidden />
            Nutritionist
          </Link>

          {isLoaded && isSignedIn ? (
            <UserButton />
          ) : (
            <button
              type="button"
              onClick={() => void logoutNutritionistCookie()}
              className="text-xs font-bold text-red-600"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className={portal.overlay} aria-label="Close menu" onClick={closeMenu} />
          <nav className={portal.navMobile}>
            <div className="flex items-center justify-between border-b border-emerald-700 px-4 py-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Menu</span>
              <button
                type="button"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-emerald-200"
                onClick={closeMenu}
              >
                <X size={22} />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 pb-8">
              <SidebarLinks onNavigate={closeMenu} />
            </div>
          </nav>
        </div>
      ) : null}
    </>
  )
}
