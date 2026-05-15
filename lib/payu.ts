import { createHash, randomBytes, timingSafeEqual } from 'crypto'

import type { PayUHashInput, PayUResponseParams } from '@/lib/payu-types'

/**
 * Request hash sequence (PayU Hosted Checkout):
 * key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
 * (five empty segments between udf5 and salt)
 */
export function generatePayUHash(params: PayUHashInput, salt: string): string {
  const {
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
  } = params
  const segments = [
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
    '',
    '',
    '',
    '',
    '',
    salt,
  ]
  const hashString = segments.join('|')
  return createHash('sha512').update(hashString, 'utf8').digest('hex').toLowerCase()
}

/**
 * Response hash (verified against `hash` POST field):
 * salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
 */
export function verifyPayUResponseHash(responseParams: PayUResponseParams, salt: string): boolean {
  const get = (k: string): string => {
    const lc = responseParams[k] ?? responseParams[k.toLowerCase()]
    return lc == null ? '' : String(lc)
  }
  const reversedSegments = [
    salt,
    get('status'),
    '',
    '',
    '',
    '',
    '',
    get('udf5'),
    get('udf4'),
    get('udf3'),
    get('udf2'),
    get('udf1'),
    get('email'),
    get('firstname'),
    get('productinfo'),
    get('amount'),
    get('txnid'),
    get('key'),
  ]
  const reversed = reversedSegments.join('|')
  const expectedHex = createHash('sha512').update(reversed, 'utf8').digest('hex').toLowerCase()
  const got = get('hash').toLowerCase().trim()

  if (!/^[a-f0-9]{128}$/.test(expectedHex) || !/^[a-f0-9]{128}$/.test(got)) {
    return false
  }

  try {
    return timingSafeEqual(Buffer.from(expectedHex, 'hex'), Buffer.from(got, 'hex'))
  } catch {
    return false
  }
}

/** `BT-{ms}-{8-hex}` — merchant txn id for PayU. */
export function makePayUTxnId(): string {
  return `BT-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`
}

export function rupeesForPaymentMode(mode: 'new' | 'retake' | 'regenerate' | 'upgrade' | 'booster'): number {
  if (mode === 'upgrade') return 3999
  if (mode === 'booster') return 499
  return 39
}

export function parsePayUFormData(fd: FormData): PayUResponseParams {
  const out: Record<string, string> = {}
  fd.forEach((value, rawKey) => {
    const k = typeof rawKey === 'string' ? rawKey.trim().toLowerCase() : String(rawKey)
    if (!k || typeof value !== 'string') return
    out[k] = value
  })
  return out as PayUResponseParams
}
