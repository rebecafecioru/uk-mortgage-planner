const pounds = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })
const wholePounds = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
})

/** £1,169.18 */
export const gbp = (value: number) => pounds.format(value)

/** £1,169 */
export const gbp0 = (value: number) => wholePounds.format(value)

/** 0.8 -> "80%" */
export const percent = (value: number) => `${Math.round(value * 100)}%`

/** 30 -> "2 years 6 months" */
export function duration(months: number): string {
  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts = []
  if (years) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`)
  if (rest) parts.push(`${rest} ${rest === 1 ? 'month' : 'months'}`)
  return parts.join(' ') || '0 months'
}

/** Compact axis labels: 150000 -> "£150k" */
export const gbpShort = (value: number) =>
  value >= 1000 ? `£${Math.round(value / 1000)}k` : `£${Math.round(value)}`
