'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  UtensilsCrossed,
} from 'lucide-react'
import type { DietPlanCustomerDTO } from '@/lib/booking-types'
import type { MealPlanCustomerDTO, MealPlanDay } from '@/lib/meal-plan-types'
import { MEAL_SLOT_META } from '@/lib/meal-plan-types'
import { formatGridDayHeader, parseMealPlanMeta } from '@/lib/meal-plan-meta'
import { profileCard } from '@/components/profile/profile-dark-styles'

function formatReportDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ProfileDietPlanSection({
  dietPlans,
  mealPlans,
}: {
  dietPlans: DietPlanCustomerDTO[]
  mealPlans: MealPlanCustomerDTO[]
}) {
  const hasPlans = dietPlans.length > 0 || mealPlans.length > 0
  if (!hasPlans) {
    return (
      <div className={`${profileCard} px-6 py-14 text-center`}>
        <UtensilsCrossed className="mx-auto text-emerald-500/60" size={36} />
        <p className="mt-4 font-semibold text-[#F0F4F8]">No diet plan yet</p>
        <p className="mt-2 text-sm text-[#8B9AB0]">
          When your nutritionist publishes your plan, it will appear here with day-by-day meals.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {dietPlans.length > 0 && (
        <div className={`${profileCard} p-6 md:p-8`}>
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[#8B9AB0]">PDF plans</p>
          <div className="space-y-3">
            {dietPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#060910] px-4 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#F0F4F8] sm:text-base">{plan.title}</p>
                  <p className="mt-1 text-xs text-[#8B9AB0]">
                    {formatReportDay(plan.published_at)}
                    {plan.nutritionistName ? ` · ${plan.nutritionistName}` : ''}
                  </p>
                </div>
                <a
                  href={`/api/diet-plan/download?id=${encodeURIComponent(plan.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-black text-black hover:bg-emerald-400"
                >
                  <FileText size={14} />
                  Download PDF
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {mealPlans.map((plan, planIdx) => (
        <ProfileMealPlanCard key={plan.id} plan={plan} showPlanLabel={mealPlans.length > 1} index={planIdx} />
      ))}
    </div>
  )
}

function ProfileMealPlanCard({
  plan,
  showPlanLabel,
  index,
}: {
  plan: MealPlanCustomerDTO
  showPlanLabel: boolean
  index: number
}) {
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const days: MealPlanDay[] = plan.days ?? []
  const currentDay = days[activeDayIdx]
  const planNote = parseMealPlanMeta(plan.nutritionist_notes).note

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`${profileCard} overflow-hidden p-0`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/15 bg-emerald-500/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="shrink-0 text-emerald-400" size={20} />
          <div>
            <h2 className="text-lg font-black leading-tight text-[#F0F4F8]">
              {showPlanLabel ? `Plan ${index + 1}: ` : ''}
              {plan.title}
            </h2>
            <p className="mt-0.5 text-xs text-[#8B9AB0]">
              {plan.nutritionist_name ? `By ${plan.nutritionist_name}` : 'Your nutritionist'} · Published{' '}
              {fmtDate(plan.published_at)}
            </p>
          </div>
        </div>
      </div>

      {planNote ? (
        <div className="border-b border-white/[0.06] bg-[#060910] px-6 py-3">
          <p className="text-sm italic text-[#8B9AB0]">📌 {planNote}</p>
        </div>
      ) : null}

      {days.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-b border-white/[0.06] px-6 py-3">
          {days.map((d, idx) => {
            const label = d.plan_date
              ? formatGridDayHeader(new Date(`${d.plan_date}T12:00:00`))
              : `Day ${d.day}`
            return (
              <button
                key={`${d.day}-${idx}`}
                type="button"
                onClick={() => setActiveDayIdx(idx)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  idx === activeDayIdx
                    ? d.skipped
                      ? 'bg-slate-500 text-white'
                      : 'bg-emerald-500 text-black'
                    : 'border border-white/10 text-[#8B9AB0] hover:border-emerald-500/30 hover:text-[#F0F4F8]'
                }`}
              >
                {label}
                {d.skipped ? ' · Off' : ''}
              </button>
            )
          })}
        </div>
      ) : null}

      {currentDay ? (
        currentDay.skipped ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-semibold text-[#8B9AB0]">Rest day</p>
            <p className="mt-1 text-xs text-[#6B7280]">No meals planned for this day.</p>
          </div>
        ) : (
          <div className="px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-[#F0F4F8]">
                {currentDay.plan_date
                  ? formatGridDayHeader(new Date(`${currentDay.plan_date}T12:00:00`))
                  : `Day ${currentDay.day}`}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveDayIdx((p) => Math.max(0, p - 1))}
                  disabled={activeDayIdx === 0}
                  className="rounded-lg border border-white/10 p-1.5 text-[#8B9AB0] hover:text-[#F0F4F8] disabled:opacity-30"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDayIdx((p) => Math.min(days.length - 1, p + 1))}
                  disabled={activeDayIdx === days.length - 1}
                  className="rounded-lg border border-white/10 p-1.5 text-[#8B9AB0] hover:text-[#F0F4F8] disabled:opacity-30"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {MEAL_SLOT_META.map((slot) => {
                const text = currentDay.meals[slot.key]
                if (!text) return null
                return (
                  <div
                    key={slot.key}
                    className="flex gap-3 rounded-2xl border border-white/[0.08] bg-[#060910] px-4 py-3"
                  >
                    <span className="mt-0.5 shrink-0 text-xl">{slot.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#8B9AB0]">
                        {slot.label}{' '}
                        <span className="font-normal normal-case tracking-normal text-[#6B7280]">
                          ({slot.time})
                        </span>
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-[#F0F4F8]">{text}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {(currentDay.water_target || currentDay.day_notes) && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {currentDay.water_target ? (
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-400">
                      💧 Water target
                    </p>
                    <p className="text-sm text-[#F0F4F8]">{currentDay.water_target}</p>
                  </div>
                ) : null}
                {currentDay.day_notes ? (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-400">
                      📌 Day note
                    </p>
                    <p className="text-sm text-[#F0F4F8]">{currentDay.day_notes}</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )
      ) : (
        <div className="px-6 py-8 text-center text-sm text-[#8B9AB0]">
          Your nutritionist is preparing your meal plan.
        </div>
      )}
    </motion.div>
  )
}
