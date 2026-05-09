/** Absolute site URL for PayU surl/furl redirects (never include trailing slash problems for join). */
export function paymentAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/^\/+/, '')}`
  return 'http://localhost:3000'
}

export function payuHostedActionUrl(): string | null {
  const u = process.env.PAYU_BASE_URL?.trim()
  return u?.length ? u : null
}

export function payuMerchantConfigured(): boolean {
  const key = process.env.PAYU_KEY?.trim()
  const salt = process.env.PAYU_SALT?.trim()
  const base = payuHostedActionUrl()
  return Boolean(key && salt && base)
}
