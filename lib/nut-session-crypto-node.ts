import crypto from 'crypto'

/** Server route only: HMAC-signed token for nutritionist gate cookie. */
export function signEmail(email: string, secret: string): string {
  return (
    crypto.createHmac('sha256', secret).update(email).digest('hex') +
    '.' +
    Buffer.from(email, 'utf8').toString('base64')
  )
}
