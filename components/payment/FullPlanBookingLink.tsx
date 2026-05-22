'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

import { trackEvent } from '@/lib/analytics'

type Props = {
  children: ReactNode
  className?: string
}

/** Full Recovery Plan (₹3,999) — always land on /booking first; PayU starts from that page only. */
export function FullPlanBookingLink({ children, className }: Props) {
  return (
    <Link
      href="/booking"
      className={className}
      onClick={() => trackEvent('upgrade_clicked', { plan: 'full_plan', amount: 3999 })}
    >
      {children}
    </Link>
  )
}
