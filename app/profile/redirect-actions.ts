'use server'

import { cookies } from 'next/headers'

/** Reads and clears one-time post-auth redirect (set via `?redirect_after_auth=`). */
export async function consumeRedirectAfterAuth(): Promise<string | null> {
  const store = await cookies()
  const v = store.get('redirect_after_auth')?.value
  if (v && v.startsWith('/') && !v.startsWith('//')) {
    store.delete('redirect_after_auth')
    return v
  }
  return null
}
