import { redirect } from 'next/navigation'

/** Alias so shared links can use `/signup?ref=CODE` (canonical route is `/sign-up`). */
export default async function SignupAliasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const q = new URLSearchParams()
  for (const [key, val] of Object.entries(sp)) {
    if (val === undefined) continue
    if (Array.isArray(val)) {
      for (const v of val) q.append(key, v)
    } else {
      q.set(key, val)
    }
  }
  const s = q.toString()
  redirect(s ? `/sign-up?${s}` : '/sign-up')
}
