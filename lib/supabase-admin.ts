import { createClient } from '@supabase/supabase-js'

// Server-only admin client — never import this in client components.
// SUPABASE_SERVICE_ROLE_KEY is not prefixed with NEXT_PUBLIC_ and is
// therefore unavailable in the browser bundle.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
