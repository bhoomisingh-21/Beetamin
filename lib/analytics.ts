export type AnalyticsParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export const trackEvent = (eventName: string, params?: AnalyticsParams) => {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', eventName, params ?? {})
}
