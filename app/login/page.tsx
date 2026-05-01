import { redirect } from 'next/navigation'
import { authReturnPath } from '@/lib/auth-return-path'

/** Maps `/login?redirect=…` to Clerk sign-in (`after` query). */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const sp = await searchParams
  const after = authReturnPath(sp.redirect ?? '/booking')
  redirect(`/sign-in?after=${encodeURIComponent(after)}`)
}
