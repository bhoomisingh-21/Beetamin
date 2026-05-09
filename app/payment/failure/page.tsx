'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { AlertCircle, Leaf } from 'lucide-react'

function FailureBody() {
  const sp = useSearchParams()
  const txnid = sp.get('txnid') ?? ''
  const assessmentId = sp.get('assessmentId') ?? ''

  return (
    <div className="min-h-screen bg-[#0a1219] text-white flex flex-col">
      <header className="border-b border-white/10 px-4 py-4 flex items-center gap-2">
        <Leaf className="text-emerald-400" size={20} aria-hidden />
        <span className="font-bold text-sm tracking-tight">TheBeetamin</span>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#111820] p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 ring-1 ring-amber-500/30">
            <AlertCircle className="text-amber-400" size={28} aria-hidden />
          </div>
          <h1 className="mt-6 text-xl font-black tracking-tight">Payment couldn&apos;t be completed</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-400">
            Your bank or PayU did not confirm this checkout. Nothing was charged, or funds were reversed
            automatically — you can try again securely.
          </p>
          {txnid ? (
            <p className="mt-4 text-[11px] font-mono text-gray-600 break-all">
              Reference:&nbsp;<span className="text-gray-500">{txnid}</span>
            </p>
          ) : null}
          <div className="mt-8 flex flex-col gap-3">
            {assessmentId ? (
              <Link
                href={`/detailed-assessment`}
                className="rounded-2xl bg-emerald-500 py-4 text-center text-sm font-black text-black"
              >
                Back to checkout
              </Link>
            ) : (
              <Link
                href="/sessions"
                className="rounded-2xl bg-emerald-500 py-4 text-center text-sm font-black text-black"
              >
                Back to dashboard
              </Link>
            )}
            <Link href="/" className="rounded-2xl border border-white/15 py-3.5 text-center text-sm font-semibold">
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a1219]" />}>
      <FailureBody />
    </Suspense>
  )
}
