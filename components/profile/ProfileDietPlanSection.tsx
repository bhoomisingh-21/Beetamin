'use client'

import { Fragment, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, FileText, UtensilsCrossed } from 'lucide-react'
import type { DietPlanCustomerDTO } from '@/lib/booking-types'
import type { MealPlanCustomerDTO, MealPlanDay } from '@/lib/meal-plan-types'
import { MEAL_SLOT_META } from '@/lib/meal-plan-types'
import {
  datesForPlanDays,
  estimateDailyMacros,
  formatGridDayColumn,
  formatWeekRangeLabel,
  parseMealPlanMeta,
} from '@/lib/meal-plan-meta'
import { profileCard } from '@/components/profile/profile-dark-styles'

const WEEK_DAYS = 7

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
          When your nutritionist publishes your plan, it will appear here as a weekly calendar.
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
  const [weekPage, setWeekPage] = useState(0)
  const days: MealPlanDay[] = plan.days ?? []
  const planNote = parseMealPlanMeta(plan.nutritionist_notes).note
  const targetCalories = parseMealPlanMeta(plan.nutritionist_notes).targetCalories ?? 1800
  const dailyMacros = estimateDailyMacros(targetCalories)
  const planDates = useMemo(
    () => datesForPlanDays(days, new Date(plan.published_at)),
    [days, plan.published_at],
  )

  const weekStart = weekPage * WEEK_DAYS
  const weekEnd = weekStart + WEEK_DAYS - 1
  const weekRangeLabel =
    planDates[weekStart] && planDates[Math.min(weekEnd, days.length - 1)]
      ? formatWeekRangeLabel(planDates[weekStart], planDates[Math.min(weekEnd, days.length - 1)])
      : '—'

  const visibleColumns = Array.from({ length: WEEK_DAYS }, (_, i) => days[weekStart + i] ?? null)
  const canGoPrev = weekPage > 0
  const canGoNext = weekEnd < days.length - 1

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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/15 bg-emerald-500/10 px-4 py-4 sm:px-6">
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
        <div className="border-b border-white/[0.06] bg-[#060910] px-4 py-3 sm:px-6">
          <p className="text-sm italic text-[#8B9AB0]">📌 {planNote}</p>
        </div>
      ) : null}

      {days.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-[#8B9AB0]">
          Your nutritionist is preparing your meal plan.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#0a1018] px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setWeekPage((p) => p - 1)}
              disabled={!canGoPrev}
              className="rounded-lg border border-white/10 p-1.5 text-[#8B9AB0] hover:text-[#F0F4F8] disabled:opacity-30"
              aria-label="Previous week"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-emerald-400">{weekRangeLabel}</span>
            <button
              type="button"
              onClick={() => setWeekPage((p) => p + 1)}
              disabled={!canGoNext}
              className="rounded-lg border border-white/10 p-1.5 text-[#8B9AB0] hover:text-[#F0F4F8] disabled:opacity-30"
              aria-label="Next week"
            >
              <ChevronRight size={16} />
            </button>
            <span className="ml-auto text-[10px] text-[#6B7280]">Swipe or scroll → for all days</span>
          </div>

          <div className="overflow-x-auto overscroll-x-contain">
            <div
              className="grid min-w-[960px]"
              style={{ gridTemplateColumns: `120px repeat(${WEEK_DAYS}, minmax(120px, 1fr))` }}
            >
              <div className="sticky left-0 z-10 border-b border-r border-white/[0.08] bg-[#0F1623] px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-[#8B9AB0]">
                Meal
              </div>
              {visibleColumns.map((d, localIdx) => {
                const abs = weekStart + localIdx
                const date = planDates[abs]
                return (
                  <div
                    key={`hdr-${abs}`}
                    className={`border-b border-r border-white/[0.06] p-2 last:border-r-0 ${
                      d?.skipped ? 'bg-[#0a0e14]' : 'bg-[#0F1623]'
                    }`}
                  >
                    {date ? (
                      <p className="text-[10px] font-bold text-emerald-400">{formatGridDayColumn(date)}</p>
                    ) : (
                      <p className="text-[10px] font-bold text-[#F0F4F8]">Day {abs + 1}</p>
                    )}
                    {d?.skipped ? (
                      <p className="mt-2 text-[9px] text-[#6B7280]">Rest day</p>
                    ) : (
                      <div className="mt-2 rounded border border-rose-500/20 bg-rose-500/10 p-2">
                        <p className="text-[10px] font-bold text-rose-200">
                          {targetCalories.toLocaleString('en-IN')} Kcal
                        </p>
                        <p className="mt-1 text-[9px] text-[#8B9AB0]">
                          C {dailyMacros.carbs} · F {dailyMacros.fat} · P {dailyMacros.protein}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}

              {MEAL_SLOT_META.map((slot) => (
                <Fragment key={slot.key}>
                  <div className="sticky left-0 z-10 border-r border-t border-white/[0.08] bg-[#0F1623] px-2 py-2">
                    <p className="text-[10px] font-bold text-[#F0F4F8]">{slot.label}</p>
                    <p className="text-[9px] text-[#6B7280]">{slot.time}</p>
                  </div>
                  {visibleColumns.map((day, localIdx) => {
                    const abs = weekStart + localIdx
                    const text = day?.meals[slot.key]
                    return (
                      <div
                        key={`${slot.key}-${abs}`}
                        className={`border-r border-t border-white/[0.06] p-1.5 last:border-r-0 ${
                          day?.skipped ? 'bg-[#0a0e14]' : 'bg-[#060910]'
                        }`}
                      >
                        {!day || day.skipped ? (
                          <div className="flex min-h-[44px] items-center justify-center text-[10px] text-[#4B5563]">
                            —
                          </div>
                        ) : text ? (
                          <div className="min-h-[44px] rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2 py-1.5 text-[11px] leading-snug text-[#F0F4F8]">
                            {text}
                          </div>
                        ) : (
                          <div className="flex min-h-[44px] items-center justify-center text-[10px] text-[#4B5563]">
                            —
                          </div>
                        )}
                      </div>
                    )
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}
