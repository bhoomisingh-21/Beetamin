/** Absolute site URL for PayU surl/furl redirects (never include trailing slash problems for join). */
export function paymentAppBaseUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/^\/+/, '')}`
  return 'http://localhost:3000'
}

/** Hosted checkout POST target. Override with PAYU_BASE_URL or set PAYU_ENV=live. */
export function payuHostedActionUrl(): string | null {
  const explicit = process.env.PAYU_BASE_URL?.trim()
  if (explicit) return explicit

  const env = (process.env.PAYU_ENV ?? 'test').trim().toLowerCase()
  if (env === 'live' || env === 'production' || env === 'prod') {
    return 'https://secure.payu.in/_payment'
  }
  return 'https://test.payu.in/_payment'
}

export function payuMerchantConfigured(): boolean {
  const key = process.env.PAYU_KEY?.trim()
  const salt = process.env.PAYU_SALT?.trim()
  const base = payuHostedActionUrl()
  return Boolean(key && salt && base)
}
