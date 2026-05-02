/** Pure helpers — keep out of `'use server'` modules (Next requires exported functions there to be async). */

export function sanitizeCodePart(nameOrEmail: string): string {
  return nameOrEmail.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8)
}

export function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6).toUpperCase()
}

/** Base code from display name + stable suffix from client UUID (not Clerk id). */
export function generateReferralCode(name: string, clientUuid: string): string {
  const cleanName = sanitizeCodePart(name || 'USER') || 'USER'
  const compact = clientUuid.replace(/-/g, '').toUpperCase()
  const suffix = compact.slice(-4)
  return `${cleanName}${suffix}`.slice(0, 24)
}
