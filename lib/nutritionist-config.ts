export const ALLOWED_NUTRITIONIST_EMAILS: string[] = [
  'dtjyotidahiya@gmail.com',
  'nausheen1shaikh@gmail.com',
]

export function isNutritionistEmail(email: string): boolean {
  return ALLOWED_NUTRITIONIST_EMAILS.includes(email.toLowerCase().trim())
}
