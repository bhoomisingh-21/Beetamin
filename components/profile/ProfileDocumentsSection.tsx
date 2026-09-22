'use client'

import { FileText, Paperclip } from 'lucide-react'
import type { ClientDocumentCustomerDTO } from '@/lib/booking-types'
import { profileCard } from '@/components/profile/profile-dark-styles'

function formatUploaded(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function ProfileDocumentsSection({
  documents,
}: {
  documents: ClientDocumentCustomerDTO[]
}) {
  if (documents.length === 0) {
    return (
      <div className={`${profileCard} px-6 py-14 text-center`}>
        <Paperclip className="mx-auto text-emerald-500/60" size={36} />
        <p className="mt-4 font-semibold text-[#F0F4F8]">No documents yet</p>
        <p className="mt-2 text-sm text-[#8B9AB0]">
          When your nutritionist shares a file with you, it will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className={`${profileCard} p-6 md:p-8`}>
      <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[#8B9AB0]">
        Shared by your nutritionist
      </p>
      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#060910] px-4 py-4"
          >
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#F0F4F8] sm:text-base">{doc.file_name}</p>
              {doc.description ? (
                <p className="mt-1 text-sm text-[#8B9AB0]">{doc.description}</p>
              ) : null}
              <p className="mt-1 text-xs text-[#8B9AB0]">
                {formatUploaded(doc.uploaded_at)}
                {doc.nutritionistName ? ` · ${doc.nutritionistName}` : ''}
              </p>
            </div>
            <a
              href={`/api/client-document/download?id=${encodeURIComponent(doc.id)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-black text-black hover:bg-emerald-400"
            >
              <FileText size={14} />
              Open file
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
