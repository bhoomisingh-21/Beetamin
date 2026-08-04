'use client'

import { useEffect, useRef, useState } from 'react'
import { Languages } from 'lucide-react'

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: {
          new (options: Record<string, unknown>, elementId: string): unknown
          InlineLayout: Record<string, unknown>
        }
      }
    }
    googleTranslateElementInit?: () => void
  }
}

/** Common Indian languages plus English — covers the vast majority of TheBeetamin's users. */
const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'ur', label: 'اردو' },
  { code: 'or', label: 'ଓଡ଼ିଆ' },
]

function readGoogTransCookie(): string {
  const match = document.cookie.match(/(?:^|; )googtrans=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

/**
 * Free, no-API-key translation for the whole site using Google's public
 * Website Translator widget. It auto-translates every page's rendered text —
 * no manual per-string translation files needed. We hide Google's own UI
 * chrome and drive it through this small custom pill instead.
 */
export function LanguageSwitcher() {
  const [current, setCurrent] = useState<string>(() => {
    if (typeof document === 'undefined') return 'en'
    const match = readGoogTransCookie().match(/\/en\/(\w+)/)
    return match ? match[1] : 'en'
  })
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate) return
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: LANGUAGES.filter((l) => l.code !== 'en')
            .map((l) => l.code)
            .join(','),
          autoDisplay: false,
        },
        'google_translate_element',
      )
    }

    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script')
      script.id = 'google-translate-script'
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      document.body.appendChild(script)
    } else if (window.google?.translate) {
      window.googleTranslateElementInit()
    }

    // Belt-and-suspenders: Google sometimes re-applies its own inline styles to
    // the banner iframe after our CSS loads, which can win the cascade. Force it
    // hidden via JS too, and keep the body from being pushed down by 40px.
    function hideGoogleChrome() {
      const banner = document.querySelector<HTMLElement>(
        '.goog-te-banner-frame, iframe.goog-te-banner-frame',
      )
      if (banner) banner.style.display = 'none'
      if (document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.top = '0px'
      }
    }
    hideGoogleChrome()
    const observer = new MutationObserver(hideGoogleChrome)
    observer.observe(document.body, { childList: true, subtree: true })
    const interval = window.setInterval(hideGoogleChrome, 1000)
    return () => {
      observer.disconnect()
      window.clearInterval(interval)
    }
  }, [])

  function changeLanguage(code: string) {
    setCurrent(code)
    const value = `/en/${code}`
    document.cookie = `googtrans=${value};path=/`
    document.cookie = `googtrans=${value};path=/;domain=${window.location.hostname}`

    const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo')
    if (combo) {
      combo.value = code
      combo.dispatchEvent(new Event('change'))
    } else {
      window.location.reload()
    }
  }

  return (
    <>
      <div id="google_translate_element" className="hidden" />
      <div className="fixed bottom-20 left-4 z-[200] md:bottom-5">
        <label htmlFor="beetamin-lang-switcher" className="sr-only">
          Choose language
        </label>
        <div className="notranslate flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950/90 py-2 pl-3 pr-2.5 shadow-xl backdrop-blur-md">
          <Languages size={15} className="shrink-0 text-emerald-400" aria-hidden />
          <select
            id="beetamin-lang-switcher"
            value={current}
            onChange={(e) => changeLanguage(e.target.value)}
            aria-label="Choose language"
            className="bg-transparent text-xs font-semibold text-white outline-none [&>option]:bg-zinc-900 [&>option]:text-white"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  )
}
