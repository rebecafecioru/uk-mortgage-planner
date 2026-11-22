// Keeps the form in the page URL (?price=...&rate=...), so a link shares the
// exact numbers and refreshing the page doesn't lose them.

export interface FormValues {
  price: string
  deposit: string
  rate: string
  years: string
  overpayment: string
}

export const DEFAULTS: FormValues = {
  price: '250000',
  deposit: '50000',
  rate: '4.5',
  years: '25',
  overpayment: '0',
}

const KEYS = Object.keys(DEFAULTS) as (keyof FormValues)[]

export function readForm(search: string): FormValues {
  const params = new URLSearchParams(search)
  const form = { ...DEFAULTS }
  for (const key of KEYS) {
    const value = params.get(key)
    // Only accept plain numbers from the URL; anything else falls back to the default.
    if (value !== null && /^\d+(\.\d+)?$/.test(value)) form[key] = value
  }
  return form
}

export function writeForm(form: FormValues): string {
  const params = new URLSearchParams()
  for (const key of KEYS) params.set(key, form[key])
  return `?${params.toString()}`
}
