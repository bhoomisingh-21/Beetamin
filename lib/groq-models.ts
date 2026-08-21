/**
 * Groq model IDs — keep in sync with https://console.groq.com/docs/deprecations
 * llama-3.3-70b-versatile + llama-3.1-8b-instant retired 2026-08-16.
 */
export const GROQ_PRIMARY_MODEL = 'openai/gpt-oss-120b'

/** Lighter fallback when primary hits TPM/TPD limits. */
export const GROQ_FAST_FALLBACK_MODEL = 'openai/gpt-oss-20b'

export const GROQ_REPORT_MODELS = [GROQ_PRIMARY_MODEL, GROQ_FAST_FALLBACK_MODEL] as const

export const GROQ_FREE_ASSESSMENT_MODEL = GROQ_PRIMARY_MODEL
