'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { FileText, Loader2, Trash2, Upload } from 'lucide-react'
import type { DietPlanDTO } from '@/lib/nutritionist-types'
import { deleteDietPlan, getSignedDietPlanUrl, uploadDietPlan } from '@/lib/nutritionist-portal-actions'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

type Props = {
  clientId: string
  clientEmail: string
  clientName: string
  dietPlans: DietPlanDTO[]
}

export function NutritionistDietPlanTab({ clientId, clientEmail, clientName, dietPlans }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [drag, setDrag] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function download(planId: string) {
    const { url, error: err } = await getSignedDietPlanUrl(planId)
    if (!url) {
      alert(err || 'Could not download')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function doUpload() {
    if (!file) return
    setError('')
    const ext = (file.name.split('.').pop() || '').toLowerCase()
    if (ext !== 'pdf') {
      setError('Diet plan must be a PDF file.')
      return
    }
    const fd = new FormData()
    fd.set('clientId', clientId)
    fd.set('clientEmail', clientEmail)
    fd.set('title', title.trim() || 'Personalised Diet Plan')
    fd.set('file', file)
    start(async () => {
      const res = await uploadDietPlan(fd)
      if (!res.ok) {
        setError(res.error || 'Upload failed')
      } else {
        setFile(null)
        setTitle('')
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
        <p className="text-sm font-bold text-[#F0F4F8]">Upload a personalised diet plan</p>
        <p className="mt-1 text-xs text-[#8B9AB0]">
          Upload a PDF and {clientName.split(/\s+/)[0] || clientName} will be emailed a secure download link
          and see it on their sessions page.
        </p>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Plan title (e.g. Week 1–4 Iron Recovery Plan)"
          className="mt-4 w-full rounded-xl border border-white/[0.08] bg-[#0F1623] px-4 py-2.5 text-sm text-[#F0F4F8] outline-none ring-emerald-500/20 focus:ring-2"
        />

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') inputRef.current?.click()
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            const f = e.dataTransfer.files?.[0]
            if (f) setFile(f)
          }}
          onClick={() => inputRef.current?.click()}
          className={`mt-3 cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
            drag ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/[0.12] bg-[#0F1623]/40'
          }`}
        >
          <Upload className="mx-auto text-[#8B9AB0]" size={32} />
          <p className="mt-3 font-semibold text-[#F0F4F8]">Drop a PDF here or click to browse</p>
          <p className="mt-1 text-xs text-[#8B9AB0]">PDF only · max 10MB</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {file && (
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#0F1623] p-4">
            <p className="text-sm font-semibold text-[#F0F4F8]">{file.name}</p>
            <p className="text-xs text-[#8B9AB0]">{(file.size / 1024).toFixed(0)} KB</p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={doUpload}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
              >
                {pending ? <Loader2 className="animate-spin" size={18} /> : 'Upload & notify client'}
              </button>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-[#8B9AB0]"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}
      </div>

      {dietPlans.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0F1623]/60 px-6 py-12 text-center">
          <p className="font-semibold text-[#F0F4F8]">No diet plan yet</p>
          <p className="mt-2 text-sm text-[#8B9AB0]">
            Upload {clientName.split(/\s+/)[0] || clientName}&apos;s first personalised diet plan above.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {dietPlans.map((plan) => (
            <li
              key={plan.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-[#0F1623] p-4 sm:flex-row sm:items-center"
            >
              <div className="flex shrink-0 items-center justify-center rounded-xl bg-[#060910] p-3">
                <FileText className="text-emerald-400" size={28} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#F0F4F8]">{plan.title}</p>
                <p className="truncate text-xs text-[#8B9AB0]">{plan.file_name}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#8B9AB0]">
                  <span className="rounded-full border border-white/10 px-2 py-0.5">v{plan.version}</span>
                  <span>{formatDate(plan.published_at)}</span>
                  {plan.file_size_kb != null && <span>{plan.file_size_kb} KB</span>}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => download(plan.id)}
                  className="rounded-xl border border-emerald-500/35 px-4 py-2 text-sm font-bold text-emerald-400 hover:bg-emerald-500/10"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm('Delete this diet plan?')) return
                    start(async () => {
                      await deleteDietPlan(plan.id, clientId)
                      router.refresh()
                    })
                  }}
                  className="rounded-xl border border-red-500/35 px-4 py-2 text-sm font-bold text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 size={16} className="mx-auto" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
