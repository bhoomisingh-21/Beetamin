'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser, SignOutButton } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { Edit3, Leaf, Loader2, Save, X } from 'lucide-react'
import Footer from '@/components/sections/Footer'
import {
  getDashboardBundle,
  updateClientProfile,
  type ClientRow,
  type DashboardBundle,
} from '@/lib/booking-actions'
import { bmiMeta as bmiMetaFromHelpers, formatReportHeadingDate } from './profile-helpers'
import { MyReportsSection } from './MyReportsSection'
import { DeficiencyProfileSection } from './DeficiencyProfileSection'
import { ProgressTrackerSection } from './ProgressTrackerSection'
import { ProgressSectionErrorBoundary } from './ProgressSectionErrorBoundary'

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

export default function ProfilePageClient({ initialBundle }: Props) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [bundle, setBundle] = useState<DashboardBundle>(initialBundle)
  const [expandedReport, setExpandedReport] = useState<string | null>(null)

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
      /* getDashboardBundle returns empty on failure */
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
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f4]">
        <Loader2 className="h-10 w-10 animate-spin text-[#1a472a]" />
      </div>
    )
  }

  if (!user) return null

  const { client, paidReports, latestReadyReport, assessmentDates, progressLogs } = bundle
  const displayName =
    user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
  const initials = displayName
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const planBadge = !client
    ? { label: 'No Plan', cls: 'bg-stone-200 text-stone-700 border border-stone-300' }
    : client.status === 'active'
      ? { label: 'Active', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200' }
      : client.status === 'expired'
        ? { label: 'Expired', cls: 'bg-red-100 text-red-800 border border-red-200' }
        : { label: 'Completed', cls: 'bg-blue-100 text-blue-900 border border-blue-200' }

  const daysLabel =
    client && client.status === 'active' ? String(daysInPlan(client)) : client ? 'No active plan' : '—'

  const latestWeightLog = (() => {
    const withW = progressLogs.filter((l) => l.weight_kg != null)
    if (!withW.length) return null
    return withW.reduce((a, b) => (new Date(a.logged_at) > new Date(b.logged_at) ? a : b))
  })()

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-stone-900">
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 shadow-lg">
          {toast}
        </div>
      )}

      <motion.header
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-20 border-b border-stone-200/90 bg-white/95 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-stone-900">
            <Leaf className="text-emerald-600" size={20} />
            TheBeetamin
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/sessions"
              className="rounded-xl bg-[#0A0F14] px-3 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              My Sessions
            </Link>
            <SignOutButton redirectUrl="/">
              <button
                type="button"
                className="px-2 text-sm font-medium text-stone-600 hover:text-stone-900"
              >
                Log out
              </button>
            </SignOutButton>
          </div>
        </div>
      </motion.header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {hydrating && (
          <div className="mb-4 flex justify-end">
            <Loader2 className="h-5 w-5 animate-spin text-stone-400" aria-hidden />
          </div>
        )}

        <div className="space-y-8">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-wrap items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-black text-emerald-800 ring-2 ring-emerald-200/80">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-black text-stone-900">{displayName}</h1>
                <p className="mt-1 text-sm text-stone-600">
                  {user.primaryEmailAddress?.emailAddress || '—'}
                </p>
                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${planBadge.cls}`}
                >
                  {planBadge.label}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Sessions Used', value: client ? String(client.sessions_used) : '—' },
              { label: 'Sessions Remaining', value: client ? String(client.sessions_remaining) : '—' },
              {
                label: 'Reports Generated',
                value: String(
                  paidReports.filter((p) => p.status === 'ready' || p.status === 'generated').length,
                ),
              },
              {
                label: 'Days in Plan',
                value: client && client.status === 'active' ? String(daysInPlan(client)) : daysLabel,
              },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{s.label}</p>
                <p className="mt-2 text-2xl font-black text-[#1a472a]">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sessions"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1a472a] px-6 py-4 text-center text-sm font-bold text-white shadow-md hover:bg-[#143622]"
            >
              Book My Next Session
            </Link>
            {latestReadyReport && (
              <Link
                href={`/report/${encodeURIComponent(latestReadyReport.report_id)}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-[#1a472a]/30 bg-white px-6 py-4 text-center text-sm font-bold text-[#1a472a] hover:bg-emerald-50"
              >
                View Latest Report
              </Link>
            )}
          </div>

          {latestWeightLog && (
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
                Latest weight log
              </h2>
              <p className="mt-3 text-2xl font-black text-[#1a472a]">
                {Number(latestWeightLog.weight_kg).toFixed(1)} kg
              </p>
              <p className="mt-1 text-sm text-stone-600">
                BMI:{' '}
                {latestWeightLog.bmi != null ? (
                  <>
                    <span className="font-bold">{Number(latestWeightLog.bmi).toFixed(1)}</span>
                    <span className={` ml-2 ${bmiMetaFromHelpers(Number(latestWeightLog.bmi)).cls}`}>
                      ({bmiMetaFromHelpers(Number(latestWeightLog.bmi)).label})
                    </span>
                  </>
                ) : (
                  '—'
                )}
              </p>
              <p className="mt-2 text-xs text-stone-500">
                Last logged:{' '}
                {formatReportHeadingDate(latestWeightLog.logged_at)}
              </p>
            </div>
          )}

          {client && (
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-stone-900">Account</h2>
                {!editMode ? (
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false)
                      setEditPhone(client.phone || '')
                      setEditGoal(client.assessment_goal || '')
                    }}
                    className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
                  >
                    <X size={14} /> Cancel
                  </button>
                )}
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-stone-500">Phone / WhatsApp</p>
                  {editMode ? (
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                    />
                  ) : (
                    <p className="mt-1 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2">
                      {client.phone || '—'}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500">Health goal</p>
                  {editMode ? (
                    <input
                      type="text"
                      value={editGoal}
                      onChange={(e) => setEditGoal(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                    />
                  ) : (
                    <p className="mt-1 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2">
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
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Save size={16} />
                  {isSavingProfile ? 'Saving…' : 'Save'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-14 space-y-14">
          <MyReportsSection
            paidReports={paidReports}
            assessmentDates={assessmentDates}
            expandedReport={expandedReport}
            setExpandedReport={setExpandedReport}
          />

          <ProgressSectionErrorBoundary>
            <ProgressTrackerSection
              userId={user.id}
              client={client}
              progressLogs={progressLogs}
              onReload={reload}
              onToast={(msg) => {
                setToast(msg)
                setTimeout(() => setToast(''), 3000)
              }}
            />
          </ProgressSectionErrorBoundary>

          <DeficiencyProfileSection paidReports={paidReports} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
