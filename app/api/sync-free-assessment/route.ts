import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { normalizeFreeAssessment } from '@/lib/assessment-profile-fields'
import { persistFreeAssessmentForClerkUser } from '@/lib/persist-free-assessment'
import { restoreFreeAssessmentForClerkUser } from '@/lib/restore-free-assessment'

export const runtime = 'nodejs'

export async function GET() {
  const userId = (await auth()).userId
  if (!userId) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  }

  const restored = await restoreFreeAssessmentForClerkUser(userId)
  if (!restored) {
    return NextResponse.json({ hasOnFile: false })
  }

  return NextResponse.json({
    hasOnFile: true,
    assessmentResult: restored.assessmentResult,
    assessmentMeta: restored.assessmentMeta,
    source: restored.source,
  })
}

export async function POST(req: Request) {
  const userId = (await auth()).userId
  if (!userId) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  }

  let body: { assessmentResult?: unknown; assessmentMeta?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const normalized = normalizeFreeAssessment(body.assessmentResult)
  if (!normalized) {
    return NextResponse.json(
      {
        error:
          'No valid free quiz found. Complete the free assessment, then open your results again.',
        code: 'INVALID_ASSESSMENT',
      },
      { status: 400 },
    )
  }

  try {
    await persistFreeAssessmentForClerkUser({
      clerkUserId: userId,
      freeAssessment: normalized,
      assessmentMeta: body.assessmentMeta ?? null,
    })
    return NextResponse.json({ ok: true, hasOnFile: true })
  } catch (err) {
    console.error('[sync-free-assessment]', err)
    return NextResponse.json({ error: 'Could not save your quiz. Please retry.' }, { status: 500 })
  }
}
