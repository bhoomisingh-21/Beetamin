/** Portal login whitelist. Client booking visibility is separate — use Admin → is_active toggle. */
export const ALLOWED_NUTRITIONIST_EMAILS: string[] = [
  'dtjyotidahiya@gmail.com',
  'nausheen1shaikh@gmail.com',
  // Occasional / backup portal access — keep is_active false unless clients should book them
  'sbhoomi23bca@student.mes.ac.in',
]

export function isNutritionistEmail(email: string): boolean {
  return ALLOWED_NUTRITIONIST_EMAILS.includes(email.toLowerCase().trim())
}
