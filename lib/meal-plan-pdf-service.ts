import { supabaseAdmin } from '@/lib/supabase-admin'
import { loadMealPlanPdfPayload } from '@/lib/meal-plan-pdf-data'
import { renderMealPlanPdfBuffer } from '@/lib/render-meal-plan-pdf'

const BUCKET = 'diet-plans'

function safeFilePart(value: string): string {
  return value.replace(/[^\w.\- ]+/g, '_').slice(0, 80)
}

export async function generateMealPlanPdfBuffer(planId: string): Promise<Buffer | null> {
  const payload = await loadMealPlanPdfPayload(planId)
  if (!payload) return null
  return renderMealPlanPdfBuffer(payload)
}

export async function storeMealPlanPdf(
  planId: string,
  buffer: Buffer,
): Promise<{ ok: true; storagePath: string } | { ok: false; error: string }> {
  const { data: plan, error: fetchErr } = await supabaseAdmin
    .from('meal_plans')
    .select('nutritionist_id, client_email, title, pdf_storage_path')
    .eq('id', planId)
    .maybeSingle()

  if (fetchErr || !plan) {
    return { ok: false, error: fetchErr?.message ?? 'Plan not found' }
  }

  const safeEmail = String(plan.client_email || '').replace(/[^a-zA-Z0-9.@_-]/g, '_')
  const fileName = `${safeFilePart(String(plan.title || 'diet-plan'))}_${Date.now()}.pdf`
  const storagePath = `${plan.nutritionist_id}/${safeEmail}/meal-plan_${planId}_${fileName}`

  const oldPath = String(plan.pdf_storage_path || '')
  if (oldPath) {
    await supabaseAdmin.storage.from(BUCKET).remove([oldPath])
  }

  const { error: upErr } = await supabaseAdmin.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: 'application/pdf',
    upsert: true,
  })

  if (upErr) {
    console.error('[storeMealPlanPdf] upload', upErr)
    return { ok: false, error: upErr.message }
  }

  const { error: updErr } = await supabaseAdmin
    .from('meal_plans')
    .update({ pdf_storage_path: storagePath, updated_at: new Date().toISOString() })
    .eq('id', planId)

  if (updErr) {
    await supabaseAdmin.storage.from(BUCKET).remove([storagePath])
    return { ok: false, error: updErr.message }
  }

  return { ok: true, storagePath }
}

export async function generateAndStoreMealPlanPdf(
  planId: string,
): Promise<{ ok: true; storagePath: string } | { ok: false; error: string }> {
  const buffer = await generateMealPlanPdfBuffer(planId)
  if (!buffer) return { ok: false, error: 'Could not build PDF data' }
  return storeMealPlanPdf(planId, buffer)
}

export async function createMealPlanPdfSignedUrl(
  planId: string,
  expiresInSeconds = 60 * 60 * 24 * 7,
): Promise<string | null> {
  const { data: plan } = await supabaseAdmin
    .from('meal_plans')
    .select('pdf_storage_path')
    .eq('id', planId)
    .maybeSingle()

  const path = String(plan?.pdf_storage_path || '')
  if (!path) return null

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds)
  if (error || !data?.signedUrl) {
    console.error('[createMealPlanPdfSignedUrl]', error)
    return null
  }
  return data.signedUrl
}

export async function ensureMealPlanPdfSignedUrl(planId: string): Promise<string | null> {
  let url = await createMealPlanPdfSignedUrl(planId)
  if (url) return url

  const generated = await generateAndStoreMealPlanPdf(planId)
  if (!generated.ok) return null
  url = await createMealPlanPdfSignedUrl(planId)
  return url
}
