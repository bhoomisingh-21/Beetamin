/** Server-side: re-run generation if a row stays `generating` this long (Vercel/waitUntil may have dropped the job). */
export const REPORT_GENERATION_STALE_MS = 90 * 1000

/** Client soft-timeout: show "still working" copy but keep polling for ready/failed. */
export const REPORT_UI_SOFT_TIMEOUT_MS = 120_000

export const REPORT_POLL_MS = 4000
