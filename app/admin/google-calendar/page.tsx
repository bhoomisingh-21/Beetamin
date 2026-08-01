'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

import { GoogleCalendarAdminClient } from '@/components/admin/GoogleCalendarAdminClient'

function Fallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="animate-spin text-emerald-400" size={28} />
    </div>
  )
}

export default function AdminGoogleCalendarPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <GoogleCalendarAdminClient />
    </Suspense>
  )
}
