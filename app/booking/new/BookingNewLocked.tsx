import Link from 'next/link'
import { Leaf } from 'lucide-react'

export function BookingNewLocked() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/sessions" className="flex items-center gap-2 text-gray-900 font-bold">
          <Leaf className="text-emerald-500 shrink-0" size={18} />
          TheBeetamin
        </Link>
        <Link href="/sessions" className="text-sm text-gray-500 hover:text-gray-700">
          ← My Sessions
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-lg p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl">
            🔒
          </div>
          <h1 className="mt-5 text-gray-900 font-black text-xl sm:text-2xl tracking-tight">Sessions not included</h1>
          <p className="mt-3 text-gray-600 text-sm leading-relaxed">
            Session booking is included in the Full Recovery Plan (₹3,999). Your ₹39 plan includes your personalised
            report only.
          </p>
          <Link
            href="/booking"
            className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-3.5 transition shadow-sm"
          >
            Upgrade to Full Plan
          </Link>
          <p className="mt-4 text-xs text-gray-400">
            After purchase, your account will show a ₹3,999 completed report and session booking will unlock.
          </p>
        </div>
      </div>
    </div>
  )
}
