'use client'

/**
 * PayU Hosted Checkout expects a browser form POST redirect (not fetch).
 * Builds a transient hidden form, submits to PayU `_payment`, then removes it from the DOM.
 */
export function submitToPayU(params: Record<string, string>, actionUrl: string): void {
  if (typeof document === 'undefined') return
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = actionUrl
  form.style.display = 'none'
  for (const [name, raw] of Object.entries(params)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = raw
    form.appendChild(input)
  }
  document.body.appendChild(form)
  form.submit()
  // Keep the form in the DOM until navigation starts — removing immediately can cancel PayU redirect in some browsers.
  window.setTimeout(() => form.remove(), 2000)
}
