/**
 * Middleware (Edge) verification — matches `signEmail` in nut-session-crypto-node.ts.
 */
export async function verifySignedCookieAsync(
  token: string,
  secret: string
): Promise<string | null> {
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

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(email))
  const expected = [...new Uint8Array(sigBuf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  if (sig.length !== expected.length) return null
  let diff = 0
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  if (diff !== 0) return null
  return email
}
