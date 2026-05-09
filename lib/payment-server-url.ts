/**
 * Base URL used by server-side `fetch` loops (cookies must match the Clerk session domain).
 */
export function paymentUrlForServerFetch(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/^\/+/, '')}`
  return 'http://127.0.0.1:3000'
}
