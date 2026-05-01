'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { getAllClients, getAllLeads, type ClientRowAdmin, type LeadRowAdmin } from '@/lib/admin-queries'

function clientStatusClass(status: string | null | undefined) {
  const s = (status ?? '').toLowerCase()
  if (s === 'active') return 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
  if (s === 'expired') return 'border border-amber-500/30 bg-amber-500/15 text-amber-400'
  if (s === 'completed') return 'border border-blue-500/30 bg-blue-500/15 text-blue-400'
  return 'border border-white/10 bg-[#0d1520] text-gray-400'
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatJoined(iso: string | null | undefined) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function waHref(lead: LeadRowAdmin) {
  const digits = (lead.phone ?? '').replace(/\D/g, '')
  const num = digits.length >= 10 ? digits.slice(-10) : digits
  const prefix = num.startsWith('91') && num.length > 10 ? '' : '91'
  const body = encodeURIComponent(
    `Hi ${lead.name}, we received your interest in TheBeetamin's Core Transformation plan...`
  )
  return `https://wa.me/${prefix}${num}?text=${body}`
}

export default function AdminClientsPage() {
  const [tab, setTab] = useState<'clients' | 'leads'>('clients')
  const [clients, setClients] = useState<ClientRowAdmin[]>([])
  const [leads, setLeads] = useState<LeadRowAdmin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([getAllClients(), getAllLeads()])
      .then(([c, l]) => {
        if (!cancelled) {
          setClients(c)
          setLeads(l)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setClients([])
          setLeads([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="font-black text-3xl text-white">Clients &amp; Leads</h1>

      <div className="mt-6 flex gap-6 border-b border-white/10 pb-2">
        {(['clients', 'leads'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`relative pb-2 text-sm font-bold capitalize transition ${
              tab === key ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {key === 'clients' ? 'Active Clients' : 'Leads'}
            {tab === key ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-emerald-500" />
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-[#1a2535]" />
          ))}
        </div>
      ) : tab === 'clients' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111820]"
        >
          {clients.length === 0 ? (
            <div className="py-16 text-center text-gray-500">No clients yet 👥</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[880px] w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0d1520] text-left text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Sessions Used</th>
                    <th className="px-6 py-4">Plan Status</th>
                    <th className="px-6 py-4">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                            {initials(c.name || '?')}
                          </div>
                          <span className="font-semibold text-white">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{c.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{c.phone ?? '—'}</td>
                      <td className="px-6 py-4 font-black tabular-nums text-white">
                        {c.sessions_used ?? 0}
                        <span className="text-gray-600"> / </span>
                        {c.sessions_total ?? 0}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold capitalize ${clientStatusClass(c.status)}`}
                        >
                          {c.status ?? 'unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{formatJoined(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111820]"
        >
          {leads.length === 0 ? (
            <div className="py-16 text-center text-gray-500">No leads captured yet 📬</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[820px] w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0d1520] text-left text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4"> </th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, idx) => (
                    <tr key={lead.email + String(idx)} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-semibold text-white">{lead.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{lead.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{lead.phone ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{lead.source ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{formatJoined(lead.created_at)}</td>
                      <td className="px-6 py-4">
                        {lead.phone ? (
                          <a
                            href={waHref(lead)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex rounded-full border border-[#25D366]/30 bg-[#25D366]/20 px-3 py-1 text-xs font-bold text-[#25D366] transition hover:bg-[#25D366]/30"
                          >
                            WhatsApp
                          </a>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
