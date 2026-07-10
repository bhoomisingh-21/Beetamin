'use client'

import { useState, useTransition } from 'react'
import { Loader2, UserPlus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { addNutritionistClient } from '@/lib/nutritionist-portal-actions'
import { portal } from '@/components/nutritionist-portal/portal-theme'

type Props = {
  open: boolean
  onClose: () => void
}

export function AddClientModal({ open, onClose }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await addNutritionistClient({ name, email, phone })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setName('')
      setEmail('')
      setPhone('')
      onClose()
      router.refresh()
      router.push(`/nutritionist/clients/${res.clientId}`)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className={portal.overlay} aria-label="Close" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Add client</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          Create a client under your panel. They&apos;ll sign up with this email on Beetamin to access their profile.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-emerald-900">Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={portal.inputSearch}
              placeholder="Client full name"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-emerald-900">Email *</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={portal.inputSearch}
              placeholder="client@email.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-emerald-900">Phone (optional)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={portal.inputSearch}
              placeholder="+91 …"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Add client
          </button>
        </form>
      </div>
    </div>
  )
}
