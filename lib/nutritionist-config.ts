export const ALLOWED_NUTRITIONIST_EMAILS: string[] = [
  'bhoomisingh2109@gmail.com',
  'sbhoomi23bca@student.mes.ac.in',
]

export function isNutritionistEmail(email: string): boolean {
  return ALLOWED_NUTRITIONIST_EMAILS.includes(email.toLowerCase().trim())
}
