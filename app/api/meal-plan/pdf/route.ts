import { NextResponse } from 'next/server'
import { canAccessMealPlanPdf } from '@/lib/meal-plan-pdf-access'
import {
  createMealPlanPdfSignedUrl,
  ensureMealPlanPdfSignedUrl,
  generateAndStoreMealPlanPdf,
  generateMealPlanPdfBuffer,
} from '@/lib/meal-plan-pdf-service'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

function pdfFileName(title: string): string {
  const safe = title.replace(/[^\w.\- ]+/g, '_').trim() || 'diet-plan'
  return `${safe}.pdf`
}

/** Preview/download generated meal plan PDF for nutritionist or published client. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const planId = searchParams.get('planId')?.trim()
  const mode = searchParams.get('mode')?.trim() || 'inline'

  if (!planId) {
    return NextResponse.json({ error: 'planId is required' }, { status: 400 })
  }

  const access = await canAccessMealPlanPdf(planId)
  if (!access) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  if (mode === 'signed') {
    const url = await ensureMealPlanPdfSignedUrl(planId)
    if (!url) {
      return NextResponse.json({ error: 'Could not prepare PDF download link.' }, { status: 502 })
    }
    return NextResponse.redirect(url)
  }

  const buffer = await generateMealPlanPdfBuffer(planId)
  if (!buffer) {
    return NextResponse.json({ error: 'Could not generate PDF.' }, { status: 502 })
  }

  const disposition = mode === 'download' ? 'attachment' : 'inline'
  const { data: plan } = await supabaseAdmin.from('meal_plans').select('title').eq('id', planId).maybeSingle()

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename="${pdfFileName(String(plan?.title || 'diet-plan'))}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}

/** Store PDF on publish/preview-save — nutritionist only. */
export async function POST(req: Request) {
  let body: { planId?: string }
  try {
    body = (await req.json()) as { planId?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const planId = body.planId?.trim()
  if (!planId) {
    return NextResponse.json({ error: 'planId is required' }, { status: 400 })
  }

  const access = await canAccessMealPlanPdf(planId)
  if (access !== 'nutritionist') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const stored = await generateAndStoreMealPlanPdf(planId)
  if (!stored.ok) {
    return NextResponse.json({ error: stored.error }, { status: 502 })
  }

  const signedUrl = await createMealPlanPdfSignedUrl(planId)
  return NextResponse.json({ ok: true, storagePath: stored.storagePath, signedUrl })
}
