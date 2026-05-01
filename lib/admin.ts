export const ADMIN_EMAILS = ['bhoomisingh2109@gmail.com', 'khushboogadhia99@gmail.com'] as const

export function isAdmin(email: string): boolean {
  const e = email.toLowerCase().trim()
  return (ADMIN_EMAILS as readonly string[]).includes(e)
}
