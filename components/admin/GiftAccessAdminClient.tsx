'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Gift } from 'lucide-react'

type GiftedRow = {
  id: string
  clerk_user_id: string
  email: string
  gifted_plan: 'report' | 'full_plan'
  gifted_note: string | null
  gifted_at: string
}

const PLAN_OPTIONS = [
  { value: 'report', label: '₹39 Report' },
  { value: 'full_plan', label: '₹3,999 Full Plan' },
] as const

function formatPlan(plan: string) {
  return plan === 'full_plan' ? '₹3,999 Full Plan' : '₹39 Report'
}

function formatGiftedAt(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function GiftAccessAdminClient() {
  const [rows, setRows] = useState<GiftedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState<'report' | 'full_plan'>('report')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const loadRows = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/gift-access')
      const json = (await res.json()) as { rows?: GiftedRow[]; error?: string }
      if (!res.ok) throw new Error(json.error || 'Could not load gifted users.')
      setRows(json.rows ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load gifted users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRows()
  }, [loadRows])

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/admin/gift-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan, note: note.trim() || undefined }),
      })
      const json = (await res.json()) as { message?: string; error?: string }
      if (!res.ok) throw new Error(json.error || 'Grant failed.')
      setMessage(json.message ?? 'Access granted.')
      setEmail('')
      setNote('')
      await loadRows()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grant failed.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRevoke(id: string) {
    setRevokingId(id)
    setError('')
    try {
      const res = await fetch('/api/admin/gift-access', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Revoke failed.')
      await loadRows()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revoke failed.')
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
          <Gift className="text-emerald-400" size={24} />
        </div>
        <div>
          <h1 className="text-white font-black text-2xl md:text-3xl">Gift Plan Access</h1>
          <p className="text-gray-500 text-sm mt-1">
            Grant ₹39 report or ₹3,999 full plan without PayU checkout.
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => void handleGrant(e)}
        className="rounded-3xl border border-white/10 bg-[#111820] p-6 md:p-8 space-y-5"
      >
        <div>
          <label htmlFor="gift-email" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            Email
          </label>
          <input
            id="gift-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full rounded-xl border border-white/10 bg-[#0A0F14] px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="gift-plan" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            Select plan
          </label>
          <select
            id="gift-plan"
            value={plan}
            onChange={(e) => setPlan(e.target.value as 'report' | 'full_plan')}
            className="w-full rounded-xl border border-white/10 bg-[#0A0F14] px-4 py-3 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
          >
            {PLAN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="gift-note" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            Note (optional)
          </label>
          <input
            id="gift-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. sister, college friend"
            className="w-full rounded-xl border border-white/10 bg-[#0A0F14] px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>

        {message ? (
          <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 py-3.5 text-sm font-black text-black transition disabled:opacity-60"
        >
          {submitting ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              Granting…
            </span>
          ) : (
            'Grant Access'
          )}
        </button>
      </form>

      <div className="mt-10 rounded-3xl border border-white/10 bg-[#111820] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-bold text-lg">Gifted users</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-emerald-400" size={28} />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-6 py-10 text-center text-gray-500 text-sm">No gifted access granted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Note</th>
                  <th className="px-4 py-3 font-semibold">Gifted on</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-gray-200">{row.email || '—'}</td>
                    <td className="px-4 py-3 text-emerald-300">{formatPlan(row.gifted_plan)}</td>
                    <td className="px-4 py-3 text-gray-400">{row.gifted_note || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatGiftedAt(row.gifted_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={revokingId === row.id}
                        onClick={() => void handleRevoke(row.id)}
                        className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {revokingId === row.id ? '…' : 'Revoke'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
