import { duration, gbp, gbp0, gbpShort, percent } from './format'
import { DEFAULTS, readForm, writeForm } from './urlState'

describe('format', () => {
  it('formats pounds the UK way', () => {
    expect(gbp(1169.183)).toBe('£1,169.18')
    expect(gbp0(97219.4)).toBe('£97,219')
    expect(gbpShort(150000)).toBe('£150k')
    expect(percent(0.8)).toBe('80%')
  })

  it.each([
    [0, '0 months'],
    [1, '1 month'],
    [12, '1 year'],
    [30, '2 years 6 months'],
    [73, '6 years 1 month'],
  ])('duration(%i) is "%s"', (months, text) => {
    expect(duration(months)).toBe(text)
  })
})

describe('urlState', () => {
  it('round-trips the form through the URL', () => {
    const form = { ...DEFAULTS, price: '320000', rate: '3.75' }
    expect(readForm(writeForm(form))).toEqual(form)
  })

  it('uses defaults for missing or non-numeric values', () => {
    expect(readForm('')).toEqual(DEFAULTS)
    expect(readForm('?price=<script>&rate=-5&years=abc')).toEqual(DEFAULTS)
  })
})
