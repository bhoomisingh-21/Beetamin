import crypto from 'crypto'

/** Server route only: HMAC-signed token for nutritionist gate cookie. */
export function signEmail(email: string, secret: string): string {
  return (
    crypto.createHmac('sha256', secret).update(email).digest('hex') +
    '.' +
    Buffer.from(email, 'utf8').toString('base64')
  )
}

/** Verify cookie from middleware/signEmail (Node server actions / routes). */
export function verifySignedCookie(token: string, secret: string): string | null {
  const firstDot = token.indexOf('.')
  if (firstDot === -1) return null
  const sig = token.slice(0, firstDot)
  const encoded = token.slice(firstDot + 1)
  if (!sig || !encoded) return null
  let email: string
  try {
    email = Buffer.from(encoded, 'base64').toString('utf8')
  } catch {
    return null
  }
  const expected = crypto.createHmac('sha256', secret).update(email).digest('hex')
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null
  }
  return email
}
