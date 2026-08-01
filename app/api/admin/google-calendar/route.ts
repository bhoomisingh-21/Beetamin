import { NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/admin-api-auth'
import { disconnectGoogleCalendar, getGoogleCalendarStatus } from '@/lib/google-calendar'

export const runtime = 'nodejs'

export async function GET() {
  const admin = await requireAdminApi()
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status })
  }

  const status = await getGoogleCalendarStatus()
  return NextResponse.json(status)
}

export async function DELETE() {
  const admin = await requireAdminApi()
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status })
  }

  await disconnectGoogleCalendar()
  return NextResponse.json({ success: true })
}
