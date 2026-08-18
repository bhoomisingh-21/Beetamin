'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

/** Fire PageView on App Router client navigations (initial load handled by MetaPixelHead). */
export function MetaPixelPageView() {
  const pathname = usePathname()
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    window.fbq?.('track', 'PageView')
  }, [pathname])

  return null
}
