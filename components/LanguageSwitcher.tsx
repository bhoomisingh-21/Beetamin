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

const GOOGTRANS_COOKIE_NAMES = ['googtrans', 'googtransopt'] as const

/** Parse every googtrans= value present in document.cookie (duplicates possible across domains). */
function readGoogTransCookieValues(): string[] {
  if (typeof document === 'undefined') return []
  const values: string[] = []
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim()
    if (!trimmed.toLowerCase().startsWith('googtrans=')) continue
    values.push(decodeURIComponent(trimmed.slice('googtrans='.length)))
  }
  return values
}

/** Active target language from cookie, or 'en' when missing / empty / invalid. */
function languageFromGoogTransCookie(): string {
  const values = readGoogTransCookieValues()
  for (const raw of values) {
    if (!raw || raw === '/en/en') continue
    // Typical shapes: /en/hi, /auto/hi
    const match = raw.match(/\/(?:en|auto)\/([a-z]{2,3})$/i)
    if (match && match[1].toLowerCase() !== 'en') {
      return match[1].toLowerCase()
    }
  }
  return 'en'
}

/** Domains Google Translate may have bound googtrans to (host-only + dotted + parent). */
function googTransCookieDomains(): Array<string | undefined> {
  const hostname = window.location.hostname
  const domains: Array<string | undefined> = [undefined, hostname, `.${hostname}`]

  // www.example.com → also clear example.com / .example.com
  const parts = hostname.split('.').filter(Boolean)
  if (parts.length >= 2) {
    const parent = parts.slice(-2).join('.')
    if (parent && parent !== hostname) {
      domains.push(parent, `.${parent}`)
    }
  }

  // Deduplicate while preserving order
  const seen = new Set<string>()
  return domains.filter((d) => {
    const key = d ?? '__host__'
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Exhaustively expire googtrans cookies. Google's widget often sets the cookie
 * on `.hostname` (leading dot) and sometimes the registrable parent domain;
 * clearing only the host-only / bare-hostname variants leaves a survivor that
 * re-applies translation after reload — which is why English→X worked but
 * X→English did not.
 */
function clearGoogTransCookies(): void {
  const expires = 'Thu, 01 Jan 1970 00:00:00 GMT'
  const paths = Array.from(
    new Set(['/', window.location.pathname || '/', '/']),
  )
  const domains = googTransCookieDomains()

  for (const name of GOOGTRANS_COOKIE_NAMES) {
    for (const path of paths) {
      for (const domain of domains) {
        const base = `${name}=;expires=${expires};Max-Age=0;path=${path}`
        if (domain) {
          document.cookie = `${base};domain=${domain}`
        } else {
          document.cookie = base
        }
      }
    }
  }
}

function clearGoogTransStorage(): void {
  try {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      const keys: string[] = []
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (!key) continue
        if (/googtrans|google.?translate|goog-te/i.test(key)) keys.push(key)
      }
      keys.forEach((key) => storage.removeItem(key))
    }
  } catch {
    // Storage may be blocked; cookie clear + reload is still the main path.
  }
}

/** Best-effort reset of the in-page Google Translate widget before reload. */
function resetGoogleTranslateDom(): void {
  const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo')
  if (combo) {
    // Empty string is Google's "original language" option (not "en").
    combo.value = ''
    combo.dispatchEvent(new Event('change'))
  }

  document.documentElement.classList.remove('translated-ltr', 'translated-rtl')
  document.body.classList.remove('translated-ltr', 'translated-rtl')
  document.documentElement.setAttribute('lang', 'en')

  // Drop leftover skiptranslate chrome so a stale frame can't flash content.
  document
    .querySelectorAll<HTMLElement>(
      'iframe.goog-te-banner-frame, .goog-te-banner-frame, iframe.skiptranslate, body > .skiptranslate, .goog-te-ftab, .goog-te-spinner-pos',
    )
    .forEach((el) => {
      if (el.id === 'google_translate_element' || el.closest('#google_translate_element')) return
      el.remove()
    })
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
    return languageFromGoogTransCookie()
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
      // combo.value = 'en' matches nothing and is a no-op. Empty string is
      // Google's "show original"; we also exhaustively clear googtrans cookies
      // (including dotted / parent domains) then reload so GT cannot re-apply.
      resetGoogleTranslateDom()
      clearGoogTransCookies()
      clearGoogTransStorage()
      // Second pass after DOM reset in case the widget rewrote the cookie.
      clearGoogTransCookies()
      window.location.reload()
      return
    }

    const value = `/en/${code}`
    // Mirror the domains GT itself uses so later English clear can find them.
    for (const domain of googTransCookieDomains()) {
      const base = `googtrans=${value};path=/`
      document.cookie = domain ? `${base};domain=${domain}` : base
    }

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
