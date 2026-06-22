'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { ArrowLeft, UtensilsCrossed } from 'lucide-react'
import type { DashboardBundle } from '@/lib/booking-types'
import { ProfileDietPlanSection } from '@/components/profile/ProfileDietPlanSection'

type Props = {
  dietPlans: NonNullable<DashboardBundle['dietPlans']>
  mealPlans: NonNullable<DashboardBundle['mealPlans']>
}

export default function ProfileDietPlanRouteClient({ dietPlans, mealPlans }: Props) {
  useEffect(() => {
    if (typeof window === 'undefined' || window.location.hash !== '#top') return
    document.getElementById('diet-plan-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-white/[0.06] bg-[#060910]/95 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8B9AB0] transition hover:text-emerald-400"
          >
            <ArrowLeft size={16} />
            Back to Overview
          </Link>
          <a
            href="#diet-plan-top"
            className="text-xs font-semibold text-emerald-400 hover:underline"
          >
            Back to title
          </a>
        </div>
      </div>

      <header id="diet-plan-top" className="mb-8 scroll-mt-28">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15">
            <UtensilsCrossed className="text-emerald-400" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#F0F4F8]">Diet Plan</h1>
            <p className="mt-1 text-sm text-[#8B9AB0]">
              Personalised meals and PDFs from your nutritionist
            </p>
          </div>
        </div>
        <div className="mt-3 h-[3px] w-10 rounded-full bg-emerald-500" aria-hidden />
      </header>

      <ProfileDietPlanSection dietPlans={dietPlans} mealPlans={mealPlans} />
    </div>
  )
}
