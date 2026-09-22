'use client'

import Link from 'next/link'
import { ArrowLeft, Paperclip } from 'lucide-react'
import type { ClientDocumentCustomerDTO } from '@/lib/booking-types'
import { ProfileDocumentsSection } from '@/components/profile/ProfileDocumentsSection'

export default function ProfileDocumentsRouteClient({
  documents,
}: {
  documents: ClientDocumentCustomerDTO[]
}) {
  return (
    <div>
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-white/[0.06] bg-[#060910]/95 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8B9AB0] transition hover:text-emerald-400"
        >
          <ArrowLeft size={16} />
          Back to Overview
        </Link>
      </div>

      <header className="mb-8">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15">
            <Paperclip className="text-emerald-400" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#F0F4F8]">Documents</h1>
            <p className="mt-1 text-sm text-[#8B9AB0]">
              Files your nutritionist has shared with you
            </p>
          </div>
        </div>
        <div className="mt-3 h-[3px] w-10 rounded-full bg-emerald-500" aria-hidden />
      </header>

      <ProfileDocumentsSection documents={documents} />
    </div>
  )
}
