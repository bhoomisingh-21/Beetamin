'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  Copy,
  Gift,
  Lock,
  Share2,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { REFERRAL_REWARD_INR } from '@/lib/referral-constants'
import {
  loadReferralDashboardAction,
  syncPendingReferralCodeAction,
  type ReferralStatsPayload,
} from '@/lib/referral'

const HEX_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='70' viewBox='0 0 60 70'>
  <path d='M30 0L60 17.5V52.5L30 70L0 52.5V17.5L30 0Z' fill='none' stroke='%2310B981' stroke-width='0.35' stroke-opacity='0.2'/>
</svg>`
const HEX_BG = `url("data:image/svg+xml,${encodeURIComponent(HEX_SVG)}")`

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function initials(name: string | null | undefined) {
  const n = name ?? '?'
  return n
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function ReferralDashboardPage() {
  const [stats, setStats] = useState<ReferralStatsPayload | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [bootError, setBootError] = useState<'no_client' | 'unknown' | null>(null)

  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoading(true)
      setBootError(null)
      try {
        const pending =
          typeof window !== 'undefined' ? sessionStorage.getItem('referralCode') : null
        if (pending?.trim()) {
          await syncPendingReferralCodeAction(pending.trim())
          sessionStorage.removeItem('referralCode')
        }
      } catch {
        /* ignore */
      }
      try {
        const data = await loadReferralDashboardAction()
        if (cancelled) return
        if ('error' in data) {
          setStats(null)
          setBootError(data.error === 'no_client' ? 'no_client' : 'unknown')
        } else {
          setStats(data)
          setBootError(null)
        }
      } catch {
        if (!cancelled) {
          setStats(null)
          setBootError('unknown')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void init()
    return () => {
      cancelled = true
    }
  }, [])

  const referralLink = useMemo(() => {
    if (!stats?.referralCode) return ''
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || 'https://thebeetamin.com'
    return `${origin}/signup?ref=${encodeURIComponent(stats.referralCode)}`
  }, [stats?.referralCode])

  function copyLink() {
    if (!referralLink) return
    void navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function shareLink() {
    if (!referralLink) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TheBeetamin',
          text: 'Fix your nutrient deficiencies in 90 days! Use my referral link:',
          url: referralLink,
        })
      } catch {
        copyLink()
      }
    } else {
      copyLink()
    }
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  }

  if (loading && !stats) {
    return (
      <div
        className="min-h-screen bg-[#0A0F14] px-4 py-16"
        style={{ backgroundImage: HEX_BG, backgroundSize: '60px 70px' }}
      >
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-12 animate-pulse rounded-xl bg-[#1a2535]" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#1a2535]" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (bootError === 'no_client') {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center bg-[#0A0F14] px-4 py-16 text-center"
        style={{ backgroundImage: HEX_BG, backgroundSize: '60px 70px' }}
      >
        <p className="font-black text-2xl text-white">Complete your Beetamin profile first</p>
        <p className="mt-2 max-w-md text-gray-400 text-sm">
          Referrals are tied to your Core Transformation account. Finish onboarding, then come back here.
        </p>
        <Link
          href="/booking/onboard"
          className="mt-8 rounded-full bg-emerald-500 px-8 py-3 font-bold text-black hover:bg-emerald-400"
        >
          Go to onboarding
        </Link>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0F14] px-4 py-16 text-gray-400">
        Something went wrong loading referrals.
      </div>
    )
  }

  const totalEarned = stats.successfulReferrals * REFERRAL_REWARD_INR

  return (
    <div
      className="min-h-screen bg-[#0A0F14] px-4 py-16"
      style={{ backgroundImage: HEX_BG, backgroundSize: '60px 70px' }}
    >
      <div className="mx-auto max-w-4xl">
        <motion.header
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.45 }}
          className="mb-12 text-center"
        >
          <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
            🎁 Referral program
          </span>
          <h1 className="mt-4 font-black text-4xl text-white md:text-5xl">
            Earn ₹300 for{' '}
            <span className="text-[#00E676]">every friend you refer</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
            Share your link. When your friend completes their first session, ₹300 lands in your wallet.
          </p>
        </motion.header>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {[
            {
              icon: Wallet,
              color: 'text-emerald-400',
              value: `₹${stats.walletBalance}`,
              label: 'Wallet balance',
            },
            {
              icon: Users,
              color: 'text-blue-400',
              value: stats.totalReferrals,
              label: 'Total referrals',
            },
            {
              icon: CheckCircle,
              color: 'text-emerald-400',
              value: stats.successfulReferrals,
              label: 'Successful',
            },
            {
              icon: TrendingUp,
              color: 'text-purple-400',
              value: `₹${totalEarned}`,
              label: 'Total earned',
            },
          ].map((c) => (
            <motion.div
              key={c.label}
              variants={fadeUp}
              className="rounded-2xl border border-white/[0.08] bg-[#111820] p-6 text-center"
            >
              <c.icon className={`mx-auto ${c.color}`} size={32} strokeWidth={2} />
              <p className="mt-2 font-black text-3xl tabular-nums text-white">{c.value}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{c.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.45 }}
          className="mt-8 rounded-3xl border border-white/[0.08] bg-[#111820] p-8"
        >
          <h2 className="font-bold text-xl text-white">Your referral link</h2>
          <p className="mt-1 text-sm text-gray-400">
            Share this link and earn ₹300 when your friend completes their first session.
          </p>

          <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0d1520] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Lock className="shrink-0 text-emerald-400" size={16} aria-hidden />
              <span className="truncate font-mono text-sm text-emerald-400">{referralLink || '—'}</span>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={copyLink}
                disabled={!referralLink}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                {copied ? (
                  <>
                    <CheckCircle className="text-emerald-400" size={16} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Copy
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => void shareLink()}
                disabled={!referralLink}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-emerald-400 disabled:opacity-50"
              >
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-400">Your code:</span>
            <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 font-mono text-lg font-bold tracking-wider text-emerald-400">
              {stats.referralCode || '—'}
            </span>
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          {[
            {
              n: '1',
              fill: true,
              title: 'Share your link',
              body: 'Send it to friends via WhatsApp, Instagram, or copy the link.',
            },
            {
              n: '2',
              fill: false,
              title: 'Friend joins & books',
              body: 'They sign up using your link and purchase the Core Transformation plan.',
            },
            {
              n: '3',
              fill: true,
              title: 'You earn ₹300',
              body: 'Once they complete their first 30-min session, ₹300 is added to your wallet instantly.',
            },
          ].map((step) => (
            <motion.div
              key={step.n}
              variants={fadeUp}
              className="rounded-2xl border border-white/[0.08] bg-[#111820] p-6 text-center"
            >
              <div
                className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full font-black text-lg ${
                  step.fill ? 'bg-emerald-500 text-black' : 'border border-white/20 text-white'
                }`}
              >
                {step.n}
              </div>
              <p className="mt-4 font-bold text-white">{step.title}</p>
              <p className="mt-2 text-sm text-gray-400">{step.body}</p>
            </motion.div>
          ))}
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mt-10"
        >
          <h2 className="font-bold text-xl text-white">Referral history</h2>
          {stats.rewards.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-[#111820] p-12 text-center">
              <Gift className="mx-auto text-gray-600" size={48} strokeWidth={1.25} />
              <p className="mt-4 text-gray-500">No referrals yet</p>
              <p className="mt-2 text-sm text-gray-600">Share your link to start earning</p>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111820]">
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0d1520] text-[11px] font-bold uppercase tracking-wide text-gray-400">
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4">Rewarded</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Reward</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.rewards.map((r) => (
                      <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                              {initials(r.referred_name)}
                            </div>
                            <div>
                              <p className="font-medium text-white">{r.referred_name ?? 'Friend'}</p>
                              <p className="text-xs text-gray-500">Referred user</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">{fmtDate(r.referred_joined)}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{fmtDate(r.created_at)}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
                            ₹{REFERRAL_REWARD_INR} earned
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-400">₹{r.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-white/5 md:hidden">
                {stats.rewards.map((r) => (
                  <li key={r.id} className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                        {initials(r.referred_name)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{r.referred_name ?? 'Friend'}</p>
                        <p className="text-xs text-gray-500">Joined {fmtDate(r.referred_joined)}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Rewarded {fmtDate(r.created_at)}</p>
                    <span className="mt-2 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
                      ₹{REFERRAL_REWARD_INR} earned
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mt-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-8"
        >
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-black text-6xl text-[#00E676]">₹{stats.walletBalance}</p>
              <p className="mt-2 text-gray-400">Available wallet balance</p>
            </div>
            <div className="max-w-md space-y-3 text-sm text-gray-300">
              <p>
                Your wallet balance will be automatically applied as a discount on your next TheBeetamin purchase.
              </p>
              <p>Minimum purchase required: ₹3,999 (Core Transformation)</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Wallet credits never expire · One credit per referred user · Credits apply at checkout
          </p>
        </motion.section>

        <div className="mt-10 text-center">
          <Link href="/profile" className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline">
            ← Back to profile
          </Link>
        </div>
      </div>
    </div>
  )
}
