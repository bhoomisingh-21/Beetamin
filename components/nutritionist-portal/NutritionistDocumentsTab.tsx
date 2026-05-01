'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { FileImage, FileText, Loader2, Trash2, Upload } from 'lucide-react'
import type { ClientDocumentDTO } from '@/lib/nutritionist-types'
import {
  deleteClientDocument,
  getSignedDocumentUrl,
  updateDocumentDescription,
  uploadClientDocument,
} from '@/lib/nutritionist-portal-actions'

function iconFor(doc: ClientDocumentDTO) {
  const t = (doc.file_type || '').toLowerCase()
  if (t === 'pdf')
    return <FileText className="text-red-400" size={28} aria-hidden />
  if (t === 'doc' || t === 'docx')
    return <FileText className="text-blue-400" size={28} aria-hidden />
  return <FileImage className="text-emerald-400" size={28} aria-hidden />
}

function formatUploaded(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

type Props = {
  clientId: string
  clientEmail: string
  documents: ClientDocumentDTO[]
}

export function NutritionistDocumentsTab({ clientId, clientEmail, documents }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [drag, setDrag] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  async function download(docId: string) {
    const { url, error } = await getSignedDocumentUrl(docId)
    if (!url) {
      alert(error || 'Could not download')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function doUpload() {
    if (!file) return
    const fd = new FormData()
    fd.set('clientId', clientId)
    fd.set('clientEmail', clientEmail)
    fd.set('file', file)
    setProgress(30)
    start(async () => {
      const res = await uploadClientDocument(fd)
      setProgress(100)
      setFile(null)
      if (!res.ok) alert(res.error || 'Upload failed')
      else router.refresh()
      setTimeout(() => setProgress(0), 400)
    })
  }

  return (
    <div className="space-y-8">
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
        className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
          drag ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/[0.12] bg-[#0F1623]/40'
        }`}
      >
        <Upload className="mx-auto text-[#8B9AB0]" size={36} />
        <p className="mt-3 font-semibold text-[#F0F4F8]">Drop files here or click to browse</p>
        <p className="mt-1 text-xs text-[#8B9AB0]">PDF, DOC/DOCX, images · max 10MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {file && (
        <div className="rounded-xl border border-white/[0.06] bg-[#0F1623] p-4">
          <p className="text-sm font-semibold text-[#F0F4F8]">{file.name}</p>
          <p className="text-xs text-[#8B9AB0]">{(file.size / 1024).toFixed(0)} KB</p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={(e) => {
                e.stopPropagation()
                doUpload()
              }}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
            >
              {pending ? <Loader2 className="animate-spin" size={18} /> : 'Upload'}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setFile(null)
              }}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-[#8B9AB0]"
            >
              Clear
            </button>
          </div>
          {progress > 0 && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#060910]">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0F1623]/60 px-6 py-12 text-center">
          <p className="font-semibold text-[#F0F4F8]">No documents yet</p>
          <p className="mt-2 text-sm text-[#8B9AB0]">
            Upload intake forms, lab reports, or any relevant documents for this client.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-[#0F1623] p-4 sm:flex-row sm:items-center"
            >
              <div className="flex shrink-0 items-center justify-center rounded-xl bg-[#060910] p-3">
                {iconFor(doc)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#F0F4F8]">{doc.file_name}</p>
                <textarea
                  defaultValue={doc.description ?? ''}
                  placeholder="Description…"
                  rows={2}
                  onBlur={(e) => {
                    const v = e.target.value.trim() || null
                    if (v === (doc.description ?? '')) return
                    start(async () => {
                      await updateDocumentDescription(doc.id, clientId, v)
                      router.refresh()
                    })
                  }}
                  className="mt-2 w-full rounded-lg border border-white/[0.06] bg-[#060910] px-3 py-2 text-xs text-[#F0F4F8] outline-none ring-emerald-500/10 focus:ring-2"
                />
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#8B9AB0]">
                  {doc.session_number != null && (
                    <span className="rounded-full border border-white/10 px-2 py-0.5">
                      Session {doc.session_number}
                    </span>
                  )}
                  <span>{formatUploaded(doc.uploaded_at)}</span>
                  {doc.file_size_kb != null && <span>{doc.file_size_kb} KB</span>}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => download(doc.id)}
                  className="rounded-xl border border-emerald-500/35 px-4 py-2 text-sm font-bold text-emerald-400 hover:bg-emerald-500/10"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm('Delete this document?')) return
                    start(async () => {
                      await deleteClientDocument(doc.id, clientId)
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
