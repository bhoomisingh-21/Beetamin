'use server'

import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { triggerRetakePayment } from '@/lib/retake-report-payment'

function apiBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
  if (explicit) return explicit.replace(/\/$/, '')
  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`
  return 'http://127.0.0.1:3000'
}

/**
 * ₹39 regenerate: same quiz + detailed assessment, new paid_reports row after stub payment + Groq pipeline.
 */
export async function requestRegeneratePaidReport(detailedAssessmentId: string): Promise<
  | { ok: true; reportId: string; status?: string }
  | { ok: false; error: string; code?: string }
> {
  const { userId } = await auth()
  if (!userId) return { ok: false, error: 'Please sign in again.', code: 'AUTH' }

  const id = detailedAssessmentId.trim()
  if (!id) return { ok: false, error: 'Missing assessment.', code: 'INPUT' }

  const payment = await triggerRetakePayment({
    userId,
    assessmentId: id,
    mode: 'regenerate',
    simulateSuccess: true,
  })
  if (!payment.ok) return { ok: false, error: payment.error ?? 'Payment did not complete.' }

  const hdrs = await headers()
  const cookieStr = hdrs.get('cookie') ?? ''

  const res = await fetch(`${apiBaseUrl()}/api/generate-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookieStr ? { Cookie: cookieStr } : {}),
    },
    body: JSON.stringify({
      detailedAssessmentId: id,
      forceNewPaidReport: true,
    }),
    cache: 'no-store',
  })

  let body: Record<string, unknown> = {}
  try {
    body = (await res.json()) as Record<string, unknown>
  } catch {
    body = {}
  }

  if (!res.ok) {
    const err =
      typeof body.error === 'string'
        ? body.error
        : typeof body.code === 'string'
          ? body.code
          : `Request failed (${res.status})`
    return { ok: false, error: err, code: typeof body.code === 'string' ? body.code : undefined }
  }

  const reportId = typeof body.reportId === 'string' ? body.reportId : ''
  if (!reportId) return { ok: false, error: 'Report could not be started.', code: 'MISSING_REPORT_ID' }

  return {
    ok: true,
    reportId,
    status: typeof body.status === 'string' ? body.status : undefined,
  }
}
