/** PostgREST often returns PGRST204/PGRST205 instead of Postgres 42703/42P01. */

type SbErr = { code?: string; message?: string; details?: string } | null | undefined

function blob(err: SbErr): string {
  if (!err) return ''
  return `${err.code ?? ''} ${err.message ?? ''} ${err.details ?? ''}`.toLowerCase()
}

export function isMissingRelation(err: SbErr): boolean {
  const b = blob(err)
  return (
    err?.code === '42P01' ||
    err?.code === 'PGRST205' ||
    b.includes('could not find the table') ||
    (b.includes('does not exist') && b.includes('assessment_otp_challenges'))
  )
}

export function isMissingColumn(err: SbErr): boolean {
  const b = blob(err)
  return (
    err?.code === '42703' ||
    err?.code === 'PGRST204' ||
    (b.includes('schema cache') && b.includes('column')) ||
    (b.includes('lead_snapshot') && (b.includes('does not exist') || b.includes('could not find')))
  )
}

export const OTP_STORAGE_NOT_READY = {
  error: 'Verification storage is not ready. Apply the assessment OTP SQL in the Supabase SQL editor, then click Send OTP again.',
  code: 'OTP_TABLE_MISSING' as const,
}
