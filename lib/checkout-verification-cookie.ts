import crypto from 'crypto'

type CheckoutPayload = {
  userId: string
  phone: string
  exp: number
}

function encodePayload(payload: CheckoutPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

function decodePayload(encoded: string): CheckoutPayload | null {
  try {
    const raw = Buffer.from(encoded, 'base64url').toString('utf8')
    const parsed = JSON.parse(raw) as CheckoutPayload
    if (!parsed?.userId || !parsed?.phone || typeof parsed.exp !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

/** HMAC-signed cookie proving phone/email OTP passed for full-plan checkout. */
export function signCheckoutVerification(payload: CheckoutPayload, secret: string): string {
  const encoded = encodePayload(payload)
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('hex')
  return `${sig}.${encoded}`
}

export function verifyCheckoutVerification(
  token: string | undefined | null,
  secret: string,
): CheckoutPayload | null {
  if (!token) return null
  const firstDot = token.indexOf('.')
  if (firstDot === -1) return null
  const sig = token.slice(0, firstDot)
  const encoded = token.slice(firstDot + 1)
  if (!sig || !encoded) return null

  const expected = crypto.createHmac('sha256', secret).update(encoded).digest('hex')
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null
  }

  const payload = decodePayload(encoded)
  if (!payload || payload.exp < Date.now()) return null
  return payload
}

export const FULL_PLAN_CHECKOUT_COOKIE = 'beetamin_full_plan_checkout'

/** 30 minutes — enough to complete PayU redirect. */
export const FULL_PLAN_CHECKOUT_COOKIE_MAX_AGE_SEC = 60 * 30
