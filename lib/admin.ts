export const ADMIN_EMAILS = ['bhoomisingh2109@gmail.com', 'khushboogadhia99@gmail.com'] as const

/** Built-in admins plus optional `NEXT_PUBLIC_ADMIN_EMAIL` / `ADMIN_EMAIL` from env. */
export function getAdminEmails(): string[] {
  const set = new Set<string>()
  for (const e of ADMIN_EMAILS) set.add(e.toLowerCase())
  const fromPublic = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase()
  const fromServer = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (fromPublic) set.add(fromPublic)
  if (fromServer) set.add(fromServer)
  return [...set]
}

export function isAdmin(email: string): boolean {
  const e = email.toLowerCase().trim()
  return getAdminEmails().includes(e)
}
