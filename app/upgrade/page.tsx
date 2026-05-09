import Link from 'next/link'
import { Leaf } from 'lucide-react'

/** ₹3,999 full plan upgrade — avoids /booking redirect loop for existing clients. */
export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-[#0A0F14] text-white flex flex-col">
      <header className="border-b border-white/10 px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition">
          <Leaf className="text-emerald-400" size={18} />
          TheBeetamin
        </Link>
        <Link href="/sessions" className="text-sm text-gray-500 hover:text-white">
          Sessions
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#111820] p-8 text-center">
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Full Recovery Plan</p>
          <h1 className="mt-4 text-2xl font-black tracking-tight">Upgrade to ₹3,999</h1>
          <p className="mt-3 text-gray-400 text-sm leading-relaxed">
            Unlock all 6 personalised nutrition sessions, WhatsApp support, and ongoing plan updates. Our team confirms
            payment and activates your booking window.
          </p>
          <Link
            href="/booking/purchase"
            className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-6 py-4 text-black font-black text-sm transition"
          >
            Continue to checkout
          </Link>
          <p className="mt-4 text-[11px] text-gray-600">
            You were redirected here so we don&apos;t bounce you through the onboarding loop at /booking.
          </p>
        </div>
      </div>
    </div>
  )
}
