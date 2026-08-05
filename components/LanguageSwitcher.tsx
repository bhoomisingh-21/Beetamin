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

    // Belt-and-suspenders: Google injects a top "Translated to X — Show original"
    // banner (and pushes <body> down ~40px) directly into the document, outside
    // our own widget container, and it can re-apply itself after our CSS loads.
    // Force it gone via JS with !important priority so it always wins, no matter
    // what class name this version of the widget happens to use.
    function hideGoogleChrome() {
      document
        .querySelectorAll<HTMLElement>(
          'iframe.goog-te-banner-frame, .goog-te-banner-frame, iframe.skiptranslate, body > .skiptranslate, .goog-te-ftab',
        )
        .forEach((el) => {
          if (el.id === 'google_translate_element' || el.closest('#google_translate_element')) return
          el.style.setProperty('display', 'none', 'important')
          el.style.setProperty('visibility', 'hidden', 'important')
          el.style.setProperty('height', '0px', 'important')
        })
      document.body.style.setProperty('position', 'static', 'important')
      document.body.style.setProperty('top', '0px', 'important')
    }
    hideGoogleChrome()
    // Two observers: one watches for new nodes anywhere (the banner being
    // inserted), the other watches only <body>'s own `style` attribute
    // (Google's push-down) — kept separate so the attribute watch stays cheap
    // and isn't triggered by every Framer Motion animation in the subtree.
    const structureObserver = new MutationObserver(hideGoogleChrome)
    structureObserver.observe(document.body, { childList: true, subtree: true })
    const bodyStyleObserver = new MutationObserver(hideGoogleChrome)
    bodyStyleObserver.observe(document.body, { attributes: true, attributeFilter: ['style'] })
    const interval = window.setInterval(hideGoogleChrome, 300)
    return () => {
      structureObserver.disconnect()
      bodyStyleObserver.disconnect()
      window.clearInterval(interval)
    }
  }, [])

  function changeLanguage(code: string) {
    setCurrent(code)

    if (code === 'en') {
      // The Google widget's injected <select> only lists "translate to X"
      // options (the includedLanguages), never "en" itself, so setting
      // combo.value = 'en' matches nothing and the dispatched change event
      // is a no-op. The reliable way to revert to the original page is to
      // expire the googtrans cookie entirely and reload.
      document.cookie = 'googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = `googtrans=;path=/;domain=${window.location.hostname};expires=Thu, 01 Jan 1970 00:00:00 GMT`
      window.location.reload()
      return
    }

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
