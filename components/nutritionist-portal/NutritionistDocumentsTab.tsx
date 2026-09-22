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
import { portal } from '@/components/nutritionist-portal/portal-theme'

function iconFor(doc: ClientDocumentDTO) {
  const t = (doc.file_type || '').toLowerCase()
  if (t === 'pdf')
    return <FileText className="text-red-600" size={28} aria-hidden />
  if (t === 'doc' || t === 'docx')
    return <FileText className="text-blue-600" size={28} aria-hidden />
  return <FileImage className="text-emerald-600" size={28} aria-hidden />
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
  clientName: string
  documents: ClientDocumentDTO[]
}

export function NutritionistDocumentsTab({
  clientId,
  clientEmail,
  clientName,
  documents,
}: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [drag, setDrag] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const firstName = clientName.split(/\s+/)[0] || clientName

  async function download(docId: string) {
    const { url, error: err } = await getSignedDocumentUrl(docId)
    if (!url) {
      alert(err || 'Could not download')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function pickFile(next: File | undefined | null) {
    if (!next) return
    setError('')
    setFile(next)
  }

  function doUpload() {
    if (!file) {
      setError('Choose a file first, then tap Upload.')
      inputRef.current?.click()
      return
    }
    setError('')
    const fd = new FormData()
    fd.set('clientId', clientId)
    fd.set('clientEmail', clientEmail)
    fd.set('file', file)
    if (description.trim()) fd.set('description', description.trim())
    start(async () => {
      const res = await uploadClientDocument(fd)
      if (!res.ok) {
        setError(res.error || 'Upload failed')
        return
      }
      setFile(null)
      setDescription('')
      if (inputRef.current) inputRef.current.value = ''
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className={`text-sm font-bold ${portal.textH}`}>Upload a document</p>
        <p className={`mt-1 text-xs ${portal.textMuted}`}>
          {firstName} will see this file in their profile and get an email with a download link.
        </p>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional note (e.g. Week 2 lab report)"
          rows={2}
          className={`mt-4 ${portal.input}`}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            pickFile(e.dataTransfer.files?.[0])
          }}
          className={`mt-3 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
            drag ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-white'
          }`}
        >
          <Upload className={`mx-auto ${portal.textMuted}`} size={32} />
          <p className={`mt-3 font-semibold ${portal.textH}`}>
            {file ? file.name : 'Drop a file here'}
          </p>
          <p className={`mt-1 text-xs ${portal.textMuted}`}>
            {file ? `${(file.size / 1024).toFixed(0)} KB` : 'PDF, Word, or image · max 10MB'}
          </p>
          <label
            htmlFor="nutritionist-client-doc-upload"
            className={`mt-4 inline-flex cursor-pointer items-center justify-center px-5 py-2.5 ${portal.btnOutline}`}
          >
            Choose file
          </label>
          <input
            id="nutritionist-client-doc-upload"
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            className="sr-only"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={doUpload}
            className={`inline-flex items-center gap-2 px-5 py-2.5 ${portal.btnPrimary} disabled:opacity-50`}
          >
            {pending ? <Loader2 className="animate-spin" size={18} /> : 'Upload & share with client'}
          </button>
          {file ? (
            <button
              type="button"
              onClick={() => {
                setFile(null)
                if (inputRef.current) inputRef.current.value = ''
              }}
              className={`px-4 py-2.5 text-sm ${portal.btnGhost}`}
            >
              Clear
            </button>
          ) : null}
        </div>

        {error ? (
          <p className="mt-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>

      {documents.length === 0 ? (
        <div className={`${portal.cardEmpty} py-12`}>
          <p className={`font-semibold ${portal.textH}`}>No documents yet</p>
          <p className={`mt-2 text-sm ${portal.textMuted}`}>
            Upload intake forms, lab reports, or any relevant documents for {firstName}.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className={`flex flex-col gap-4 ${portal.card} p-4 sm:flex-row sm:items-center`}
            >
              <div className="flex shrink-0 items-center justify-center rounded-xl bg-slate-50 p-3">
                {iconFor(doc)}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`font-bold ${portal.textH}`}>{doc.file_name}</p>
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
                  className={`mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs ${portal.textH} outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100`}
                />
                <div className={`mt-2 flex flex-wrap gap-2 text-[11px] ${portal.textMuted}`}>
                  {doc.session_number != null && (
                    <span className="rounded-full border border-slate-200 px-2 py-0.5">
                      Session {doc.session_number}
                    </span>
                  )}
                  <span>{formatUploaded(doc.uploaded_at)}</span>
                  {doc.file_size_kb != null && <span>{doc.file_size_kb} KB</span>}
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700">
                    Visible to client
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => download(doc.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold ${portal.btnOutline}`}
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
                  className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
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
