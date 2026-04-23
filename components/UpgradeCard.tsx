'use client'

import Link from 'next/link'
import { ArrowRight, Check, Lock, FileText, Mail, BadgeCheck } from 'lucide-react'

const FEATURES = [
  'Deficiency analysis with severity levels',
  '7-day personalised Indian meal plan',
  'Safe supplement list with exact dosages & brands',
  'Foods actively blocking your recovery',
  'Your personalised daily recovery routine',
  'Reviewed & prepared by Dr. Priya Sharma, Clinical Nutritionist',
]

export function UpgradeCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/40 to-white shadow-xl shadow-emerald-900/5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500" />
      <div className="p-6 sm:p-8 md:p-10">
        <p className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-emerald-700 uppercase mb-3">
          Detailed Recovery Plan
        </p>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-tight max-w-3xl">
          Your Free Report Shows Early Signs.{' '}
          <span className="text-emerald-700">Get the Complete Picture.</span>
        </h3>
        <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl">
          Based on your results, our nutritionist has identified specific deficiencies that need attention. Your
          detailed plan includes:
        </p>

        <ul className="mt-6 sm:mt-8 space-y-3 max-w-2xl">
          {FEATURES.map((line) => (
            <li key={line} className="flex gap-3 text-sm sm:text-base text-gray-800">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <span className="leading-snug">{line}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-gray-200 px-3 py-1.5">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            100% Private & Confidential
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-gray-200 px-3 py-1.5">
            <FileText className="h-3.5 w-3.5 text-emerald-600" />
            Delivered as Professional PDF
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-gray-200 px-3 py-1.5">
            <Mail className="h-3.5 w-3.5 text-emerald-600" />
            Sent to your email instantly
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-gray-200 px-3 py-1.5">
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
            Doctor reviewed format
          </span>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8 border-t border-emerald-100 pt-8">
          <div>
            <p className="text-sm text-gray-400 line-through">₹299</p>
            <p className="text-4xl sm:text-5xl font-black text-emerald-600">₹39</p>
            <p className="text-xs sm:text-sm font-semibold text-emerald-800 mt-1">
              Limited time — wellness should be accessible
            </p>
          </div>
          <div className="flex-1 w-full">
            <Link
              href="/detailed-assessment"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#14532d] px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#166534] active:scale-[0.99]"
            >
              Get My Complete Recovery Plan — ₹39
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-3 text-center text-[11px] sm:text-xs text-gray-500">
              2 min additional assessment required for personalisation
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
