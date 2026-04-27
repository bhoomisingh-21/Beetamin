'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Calendar,
  Edit3,
  Loader2,
  Phone,
  Save,
  Target,
  X,
  Zap,
  CalendarDays,
} from 'lucide-react'
import {
  getDashboardBundle,
  updateClientProfile,
  type ClientRow,
  type DashboardBundle,
} from '@/lib/booking-actions'
import {
  cardSubtitle,
  cardTitle,
  profileCard,
  textPrimary,
  textSecondary,
} from '@/components/profile/profile-dark-styles'
import { formatReportHeadingDate } from '@/components/profile/profile-helpers'

const HERO_IMG =
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80'

function daysInPlan(client: ClientRow | null): number {
  if (!client) return 0
  const start = new Date(client.plan_start_date).getTime()
  const end = Math.min(Date.now(), new Date(client.plan_end_date).getTime())
  if (Number.isNaN(start) || Number.isNaN(end)) return 0
  return Math.max(0, Math.ceil((end - start) / 86400000))
}

type Props = {
  initialBundle: DashboardBundle
}

export default function ProfilePersonalClient({ initialBundle }: Props) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [bundle, setBundle] = useState<DashboardBundle>(initialBundle)

  const [hydrating, setHydrating] = useState(false)
  const [toast, setToast] = useState('')

  const [editMode, setEditMode] = useState(false)
  const [editPhone, setEditPhone] = useState('')
  const [editGoal, setEditGoal] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const reload = useCallback(async () => {
    if (!user?.id) return
    setHydrating(true)
    try {
      const b = await getDashboardBundle(user.id)
      setBundle(b)
      if (b.client) {
        setEditPhone(b.client.phone || '')
        setEditGoal(b.client.assessment_goal || '')
      }
    } catch {
      /* ignore */
    } finally {
      setHydrating(false)
    }
  }, [user?.id])

  useEffect(() => {
    setBundle(initialBundle)
    if (initialBundle.client) {
      setEditPhone(initialBundle.client.phone || '')
      setEditGoal(initialBundle.client.assessment_goal || '')
    }
  }, [initialBundle])

  useEffect(() => {
    if (!isLoaded) return
    if (!user) {
      router.replace('/sign-in?after=' + encodeURIComponent('/profile'))
    }
  }, [isLoaded, user, router])

  async function handleSaveProfile() {
    if (!user?.id || !bundle.client) return
    setIsSavingProfile(true)
    try {
      await updateClientProfile(user.id, { phone: editPhone, assessment_goal: editGoal })
      setEditMode(false)
      setToast('Profile updated.')
      setTimeout(() => setToast(''), 3000)
      await reload()
    } catch {
      setToast('Could not save profile.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-[#060910]">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!user) return null

  const { client, paidReports } = bundle
  const displayName =
    user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
  const initials = displayName
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const planPill = !client
    ? { label: 'No plan', cls: 'border-white/10 bg-white/5 text-[#8B9AB0]' }
    : client.status === 'active'
      ? {
          label: '● Active',
          cls: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-400',
        }
      : client.status === 'expired'
        ? { label: 'Expired', cls: 'border-red-500/30 bg-red-500/10 text-red-400' }
        : { label: 'Completed', cls: 'border-blue-500/30 bg-blue-500/10 text-blue-300' }

  const daysLabel =
    client && client.status === 'active' ? String(daysInPlan(client)) : client ? '—' : '—'

  const stats = [
    { label: 'Sessions Used', value: client ? String(client.sessions_used) : '—' },
    { label: 'Sessions Remaining', value: client ? String(client.sessions_remaining) : '—' },
    {
      label: 'Reports Generated',
      value: String(paidReports.filter((p) => p.status === 'ready' || p.status === 'generated').length),
    },
    {
      label: 'Days in Plan',
      value: client && client.status === 'active' ? String(daysInPlan(client)) : daysLabel,
    },
  ]

  return (
    <>
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-[#0F1623] px-5 py-2.5 text-sm font-semibold text-[#F0F4F8] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          {toast}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {hydrating && (
          <div className="mb-4 flex justify-end">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-500/80" aria-hidden />
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-2xl font-black tracking-tight text-[#F0F4F8]">Overview</h1>
          <p className="mt-1 text-sm text-[#8B9AB0]">Your dashboard at a glance</p>
          <div className="mt-3 h-[3px] w-10 rounded-full bg-emerald-500" aria-hidden />
        </header>

        <div className={`${profileCard} overflow-hidden p-0`}>
          {/* Mobile: image first */}
          <div className="relative h-[160px] w-full md:hidden">
            <Image src={HERO_IMG} alt="" fill className="object-cover" sizes="100vw" priority />
            <div
              className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,22,35,0.2),#0F1623)]"
              aria-hidden
            />
          </div>

          <div className="flex flex-col md:flex-row">
            <div className="relative w-full p-6 md:w-[60%] md:p-8">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 text-xl font-black text-white shadow-[0_4px_24px_rgba(16,185,129,0.4)]">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[28px] font-black leading-tight text-[#F0F4F8]">{displayName}</h2>
                  <p className="mt-1 text-sm text-[#8B9AB0]">
                    {user.primaryEmailAddress?.emailAddress || '—'}
                  </p>
                  <span
                    className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${planPill.cls}`}
                  >
                    {planPill.label}
                  </span>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 gap-y-5">
                <div className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500/90" aria-hidden />
                  <div>
                    <p className={cardSubtitle}>Phone</p>
                    <p className={`mt-1 text-sm font-medium ${textPrimary}`}>{client?.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Target className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500/90" aria-hidden />
                  <div>
                    <p className={cardSubtitle}>Health goal</p>
                    <p className={`mt-1 text-sm font-medium ${textPrimary}`}>
                      {client?.assessment_goal || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500/90" aria-hidden />
                  <div>
                    <p className={cardSubtitle}>Plan start</p>
                    <p className={`mt-1 text-sm font-medium ${textPrimary}`}>
                      {client ? formatReportHeadingDate(client.plan_start_date) : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500/90" aria-hidden />
                  <div>
                    <p className={cardSubtitle}>Sessions</p>
                    <p className={`mt-1 text-sm font-medium ${textPrimary}`}>
                      {client
                        ? `${client.sessions_used} used · ${client.sessions_remaining} left`
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative hidden min-h-[280px] w-[40%] md:block">
              <Image src={HERO_IMG} alt="" fill className="object-cover" sizes="40vw" priority />
              <div
                className="absolute inset-0 bg-[linear-gradient(to_right,#0F1623_0%,transparent_42%)]"
                aria-hidden
              />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className={`${profileCard} relative overflow-hidden px-5 py-6`}>
              <div className="absolute left-0 top-0 h-0.5 w-[30%] rounded-full bg-emerald-500/90" aria-hidden />
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#8B9AB0]">{s.label}</p>
              <p
                className="mt-3 text-[32px] font-black tabular-nums text-emerald-400"
                style={{ textShadow: '0 0 28px rgba(16,185,129,0.25)' }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sessions"
            className="group inline-flex flex-1 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 text-center text-sm font-bold text-black shadow-[0_4px_24px_rgba(16,185,129,0.35)] transition hover:brightness-110 hover:scale-[1.01]"
          >
            <CalendarDays className="h-5 w-5 shrink-0" aria-hidden />
            Book My Next Session
            <ArrowRight className="h-5 w-5 shrink-0 transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <Link
            href="/profile/reports"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-[#0F1623] py-4 text-center text-sm font-bold text-[#F0F4F8] shadow-[0_0_0_1px_rgba(16,185,129,0.05),0_4px_24px_rgba(0,0,0,0.4)] transition hover:border-emerald-500/25"
          >
            View Latest Report
          </Link>
        </div>

        {client && (
          <div className={`${profileCard} mt-10 p-6 md:p-8`}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className={cardTitle}>Account Details</h2>
              {!editMode ? (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Edit3 size={16} /> Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false)
                    setEditPhone(client.phone || '')
                    setEditGoal(client.assessment_goal || '')
                  }}
                  className="flex items-center gap-1 text-sm text-[#8B9AB0] hover:text-[#F0F4F8]"
                >
                  <X size={14} /> Cancel
                </button>
              )}
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <p className={cardSubtitle}>Phone / WhatsApp</p>
                {editMode ? (
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#060910] px-4 py-3 text-sm text-[#F0F4F8] outline-none ring-emerald-500/20 focus:ring-2"
                  />
                ) : (
                  <p className={`mt-2 rounded-xl border border-white/[0.06] bg-[#060910]/80 px-4 py-3 text-sm ${textPrimary}`}>
                    {client.phone || '—'}
                  </p>
                )}
              </div>
              <div>
                <p className={cardSubtitle}>Health goal</p>
                {editMode ? (
                  <input
                    type="text"
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#060910] px-4 py-3 text-sm text-[#F0F4F8] outline-none ring-emerald-500/20 focus:ring-2"
                  />
                ) : (
                  <p className={`mt-2 rounded-xl border border-white/[0.06] bg-[#060910]/80 px-4 py-3 text-sm ${textPrimary}`}>
                    {client.assessment_goal || '—'}
                  </p>
                )}
              </div>
            </div>

            {editMode && (
              <button
                type="button"
                disabled={isSavingProfile}
                onClick={() => void handleSaveProfile()}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-black hover:bg-emerald-400 disabled:opacity-60 md:w-auto md:px-10"
              >
                <Save size={18} />
                {isSavingProfile ? 'Saving…' : 'Save changes'}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </>
  )
}
