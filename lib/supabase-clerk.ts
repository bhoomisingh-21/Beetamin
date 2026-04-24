import { createClient } from '@supabase/supabase-js'

/**
 * Browser Supabase client that sends the Clerk JWT (template name: "supabase")
 * on each request so PostgREST can enforce RLS on `paid_reports`.
 *
 * Configure in Clerk: JWT template "supabase" per Supabase third-party auth docs.
 * Configure in Supabase: Third-party auth / Clerk issuer so JWTs are accepted.
 */
export function createSupabaseBrowserWithClerk(getToken: () => Promise<string | null>) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
  }
  return createClient(url, key, {
    global: {
      fetch: async (input, init) => {
        const token = await getToken()
        const headers = new Headers(init?.headers)
        if (token) headers.set('Authorization', `Bearer ${token}`)
        return fetch(input, { ...init, headers })
      },
    },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
