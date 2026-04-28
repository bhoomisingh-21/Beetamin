'use client'

import Link from 'next/link'
import { Pill } from 'lucide-react'
import type { DeficiencyItem } from '@/lib/deficiency-profile-parse'
import {
  deficiencyScorePresentation,
  profileCard,
  textSecondary,
} from '@/components/profile/profile-dark-styles'

function severityStripe(sev: string) {
  if (sev === 'high') return { icon: 'bg-red-500/25 text-red-400', badge: 'bg-red-500 text-white' }
  if (sev === 'medium')
    return { icon: 'bg-orange-500/25 text-orange-400', badge: 'bg-orange-500 text-black' }
  return { icon: 'bg-emerald-500/25 text-emerald-400', badge: 'bg-emerald-500 text-black' }
}

function severityLabel(sev: string) {
  if (sev === 'high') return 'High'
  if (sev === 'medium') return 'Medium'
  return 'Low'
}

function normalizeDeficiencies(raw: unknown): DeficiencyItem[] {
  if (!raw || typeof raw !== 'object') return []
  const o = raw as Record<string, unknown>
  const arr = o.primaryDeficiencies
  if (!Array.isArray(arr)) return []
  return arr
    .map((item): DeficiencyItem | null => {
      if (!item || typeof item !== 'object') return null
      const d = item as Record<string, unknown>
      const sev = d.severity
      const severity =
        sev === 'high' || sev === 'medium' || sev === 'low' ? String(sev) : 'low'
      const symptoms = Array.isArray(d.symptoms)
        ? (d.symptoms as unknown[]).filter((s): s is string => typeof s === 'string')
        : []
      return {
        nutrient: typeof d.nutrient === 'string' ? d.nutrient : String(d.nutrient ?? ''),
        severity,
        reason:
          typeof d.reason === 'string'
            ? d.reason
            : typeof d.explanation === 'string'
              ? d.explanation
              : '',
        symptoms,
      }
    })
    .filter((x): x is DeficiencyItem => x !== null)
}

type Props = {
  result: unknown
}

export function FreeAssessmentDeficiencyBlock({ result }: Props) {
  if (!result || typeof result !== 'object') return null

  const o = result as Record<string, unknown>
  const scoreRaw = o.deficiencyScore
  const score =
    typeof scoreRaw === 'number' && !Number.isNaN(scoreRaw) ? Math.round(scoreRaw) : null
  const presentation = score != null ? deficiencyScorePresentation(score) : null
  const deficiencies = normalizeDeficiencies(result)
  const quickWins = Array.isArray(o.quickWins)
    ? (o.quickWins as unknown[]).filter((w): w is string => typeof w === 'string')
    : []

  if (score == null && deficiencies.length === 0 && quickWins.length === 0) return null

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-[#F0F4F8]">From Your Free Assessment</h2>
        <p className={`mt-1 text-sm ${textSecondary}`}>Based on your answers from the quiz</p>
        <div className="mt-3 h-[3px] w-10 rounded-full bg-emerald-500" aria-hidden />
      </div>

      {score != null && presentation && (
        <div
          className={`${profileCard} bg-gradient-to-br p-6 md:p-8 ${presentation.barClass}`}
        >
          <div className="flex flex-wrap items-end gap-2">
            <span
              className={`text-5xl font-black tabular-nums md:text-6xl ${presentation.textClass}`}
              style={{ textShadow: `0 0 32px ${presentation.fillHex}44` }}
            >
              {score}
            </span>
            <span className="pb-1 text-xl font-semibold text-[#8B9AB0]">/100</span>
            <span
              className={`mb-1 ml-2 inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${presentation.textClass} ring-1 ring-white/10`}
            >
              {presentation.label}
            </span>
          </div>
        </div>
      )}

      {deficiencies.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {deficiencies.map((def, i) => {
            const stripe = severityStripe(def.severity)
            return (
              <div key={`${def.nutrient}-${i}`} className={`${profileCard} p-5 md:p-6`}>
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${stripe.icon}`}
                  >
                    <Pill className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-bold leading-tight text-[#F0F4F8]">{def.nutrient}</h3>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${stripe.badge}`}
                      >
                        {severityLabel(def.severity)}
                      </span>
                    </div>
                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[#8B9AB0]">{def.reason}</p>
                    {def.symptoms.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {def.symptoms.map((s, j) => (
                          <span
                            key={j}
                            className="rounded-full bg-[#1A2332] px-2.5 py-1 text-[11px] text-[#8B9AB0]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {quickWins.length > 0 && (
        <div className={`${profileCard} p-6`}>
          <h3 className="text-[15px] font-semibold text-[#F0F4F8]">Quick wins</h3>
          <ul className="mt-4 space-y-3">
            {quickWins.slice(0, 3).map((win, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-[#8B9AB0]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                <span>{win}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href="/assessment/results"
        className="flex w-full items-center justify-center rounded-xl border-2 border-emerald-500/50 bg-transparent py-4 text-sm font-bold text-emerald-400 transition hover:border-emerald-400 hover:bg-emerald-500/10"
      >
        View Full Free Assessment Results →
      </Link>
    </section>
  )
}
