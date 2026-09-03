export const ASSESSMENT_OTP_SESSION_KEY = 'beetamin.assessmentOtpSession'
export const ASSESSMENT_OTP_VERIFIED_KEY = 'beetamin.assessmentOtpVerified'
export const ASSESSMENT_DRAFT_KEY = 'beetamin.assessmentDraft'

export function getOrCreateAssessmentSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = sessionStorage.getItem(ASSESSMENT_OTP_SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(ASSESSMENT_OTP_SESSION_KEY, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

export function markAssessmentOtpVerified(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(ASSESSMENT_OTP_VERIFIED_KEY, '1')
  } catch {
    /* private mode */
  }
}

export function hasVerifiedAssessmentOtp(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(ASSESSMENT_OTP_VERIFIED_KEY) === '1'
  } catch {
    return false
  }
}
