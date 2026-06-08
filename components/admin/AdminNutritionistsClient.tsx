'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, UserCog } from 'lucide-react'
import { getNutritionistStats } from '@/lib/admin-queries'

type Row = {
  id: string
  name: string
  email: string
  bio: string | null
  is_active: boolean
  total: number
  completed: number
  upcoming: number
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function AdminNutritionistsClient() {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  // Create form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [creating, setCreating] = useState(false)

  // Inline edit
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editBio, setEditBio] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [res, stats] = await Promise.all([
        fetch('/api/admin/nutritionists'),
        getNutritionistStats().catch(() => []),
      ])
      const json = (await res.json()) as {
        rows?: { id: string; name: string; email: string; bio: string | null; is_active: boolean }[]
        error?: string
      }
      if (!res.ok) throw new Error(json.error || 'Could not load nutritionists.')
      const statById = new Map(stats.map((s) => [s.id, s]))
      const merged: Row[] = (json.rows ?? []).map((n) => {
        const s = statById.get(n.id)
        return {
          ...n,
          total: s?.total ?? 0,
          completed: s?.completed ?? 0,
          upcoming: s?.upcoming ?? 0,
        }
      })
      setRows(merged)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load nutritionists.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/admin/nutritionists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, bio: bio.trim() || undefined }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Create failed.')
      setName('')
      setEmail('')
      setBio('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed.')
    } finally {
      setCreating(false)
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id)
    setError('')
    try {
      const res = await fetch('/api/admin/nutritionists', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...body }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Update failed.')
      setEditId(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.')
    } finally {
      setBusyId(null)
    }
  }

  function startEdit(r: Row) {
    setEditId(r.id)
    setEditName(r.name)
    setEditEmail(r.email)
    setEditBio(r.bio ?? '')
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15">
          <UserCog className="text-emerald-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white md:text-3xl">Manage Nutritionists</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add real nutritionists, edit details, or deactivate without losing history.
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => void handleCreate(e)}
        className="space-y-4 rounded-3xl border border-white/10 bg-[#111820] p-6 md:p-8"
      >
        <p className="text-sm font-bold text-white">Add a nutritionist</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="rounded-xl border border-white/10 bg-[#0A0F14] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:outline-none"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Google login email"
            className="rounded-xl border border-white/10 bg-[#0A0F14] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
        <input
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Short bio (e.g. Specialist in gut health & PCOS)"
          className="w-full rounded-xl border border-white/10 bg-[#0A0F14] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-black transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {creating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
          Add nutritionist
        </button>
        <p className="text-xs text-gray-500">
          They sign in with this exact Google email at <code className="text-gray-400">/nutritionist-login</code>.
        </p>
      </form>

      {error && (
        <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="mt-8 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-emerald-400" size={28} />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">No nutritionists yet.</p>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className={`rounded-3xl border bg-[#111820] p-6 ${
                r.is_active ? 'border-white/[0.08]' : 'border-amber-500/30 opacity-80'
              }`}
            >
              {editId === r.id ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="rounded-xl border border-white/10 bg-[#0A0F14] px-4 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                    />
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="rounded-xl border border-white/10 bg-[#0A0F14] px-4 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                    />
                  </div>
                  <input
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Short bio"
                    className="w-full rounded-xl border border-white/10 bg-[#0A0F14] px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void patch(r.id, { name: editName, email: editEmail, bio: editBio })}
                      className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-black text-black hover:bg-emerald-400 disabled:opacity-60"
                    >
                      {busyId === r.id ? '…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xl font-black text-black">
                      {initials(r.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-black text-white">{r.name}</p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            r.is_active
                              ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                              : 'border-amber-500/30 bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          {r.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="truncate text-sm text-gray-400">{r.email}</p>
                      {r.bio && <p className="mt-1 text-sm text-gray-500">{r.bio}</p>}
                      <p className="mt-2 text-xs text-gray-500">
                        {r.total} total · {r.completed} completed · {r.upcoming} upcoming
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(r)}
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:border-emerald-500 hover:text-emerald-400"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void patch(r.id, { is_active: !r.is_active })}
                      className={`rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-60 ${
                        r.is_active
                          ? 'border-amber-500/40 text-amber-300 hover:bg-amber-500/10'
                          : 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10'
                      }`}
                    >
                      {busyId === r.id ? '…' : r.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/appointments?nutritionist=${r.id}`)}
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:border-emerald-500 hover:text-emerald-400"
                    >
                      Appointments
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
