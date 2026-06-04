import { ASSESSMENT_AUTH_RETURN } from '@/lib/assessment-local-storage'

/** After sign-in/sign-up, return here so the free quiz syncs before ₹39 checkout. */
export function signInReturnForPaidReport(): string {
  return `/sign-in?after=${encodeURIComponent(ASSESSMENT_AUTH_RETURN)}`
}

export function signUpReturnForPaidReport(): string {
  return `/sign-up?after=${encodeURIComponent(ASSESSMENT_AUTH_RETURN)}`
}
