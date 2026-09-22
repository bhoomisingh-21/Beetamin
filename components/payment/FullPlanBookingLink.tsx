'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

import { trackEvent } from '@/lib/analytics'

type Props = {
  children: ReactNode
  className?: string
  /** `booster` sends buyers through the same details form, then ₹499 PayU. */
  plan?: 'full' | 'booster'
}

/** Full Recovery Plan (₹3,999) or Single Session (₹499) — profile + verification before PayU. */
export function FullPlanBookingLink({ children, className, plan = 'full' }: Props) {
  const href = plan === 'booster' ? '/booking/checkout?plan=booster' : '/booking/checkout'
  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        trackEvent('upgrade_clicked', {
          plan: plan === 'booster' ? 'booster' : 'full_plan',
          amount: plan === 'booster' ? 499 : 3999,
        })
      }
    >
      {children}
    </Link>
  )
}
