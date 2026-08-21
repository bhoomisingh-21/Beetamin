'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

import { trackEvent } from '@/lib/analytics'

type Props = {
  children: ReactNode
  className?: string
}

/** Full Recovery Plan (₹3,999) — profile + verification before PayU. */
export function FullPlanBookingLink({ children, className }: Props) {
  return (
    <Link
      href="/booking/checkout"
      className={className}
      onClick={() => trackEvent('upgrade_clicked', { plan: 'full_plan', amount: 3999 })}
    >
      {children}
    </Link>
  )
}
