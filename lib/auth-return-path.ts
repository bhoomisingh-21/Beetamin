const DEFAULT = '/booking'

/** Safe in-app path after auth (blocks open redirects). */
export function authReturnPath(raw: string | null | undefined, fallback = DEFAULT): string {
  if (raw == null || raw === '') return fallback
  let t: string
  try {
    t = decodeURIComponent(raw).trim()
  } catch {
    return fallback
  }
  if (!t.startsWith('/') || t.startsWith('//')) return fallback
  if (t.includes('://') || t.includes('\\')) return fallback
  if (/[\s<>"'`]/.test(t)) return fallback
  if (t.length > 256) return fallback
  return t
}
