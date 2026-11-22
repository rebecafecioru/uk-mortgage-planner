import {
  byYear,
  calculate,
  monthlyPayment,
  overpaymentSaving,
  schedule,
  validate,
  type MortgageInputs,
} from './mortgage'

const base: MortgageInputs = {
  price: 250_000,
  deposit: 50_000,
  annualRate: 5,
  years: 25,
  overpayment: 0,
}

const total = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

describe('monthlyPayment', () => {
  it('matches the standard figure for £200k at 5% over 25 years', () => {
    expect(monthlyPayment(200_000, 5, 25)).toBeCloseTo(1169.18, 2)
  })

  it('splits the loan evenly at 0% interest', () => {
    expect(monthlyPayment(120_000, 0, 10)).toBe(1000)
  })

  it('is zero when nothing is borrowed', () => {
    expect(monthlyPayment(0, 5, 25)).toBe(0)
  })
})

describe('schedule', () => {
  const months = schedule(200_000, 5, 25)

  it('runs for the full term and ends at zero', () => {
    expect(months).toHaveLength(300)
    expect(months.at(-1)!.balance).toBeCloseTo(0, 2)
  })

  it('repays exactly the loan, and interest falls as the balance does', () => {
    expect(total(months.map((m) => m.principal))).toBeCloseTo(200_000, 2)
    expect(months[0]!.interest).toBeCloseTo(833.33, 2) // 200,000 × 5% ÷ 12
    expect(months[0]!.interest).toBeGreaterThan(months[299]!.interest)
  })

  it('finishes early and never overpays when overpaying', () => {
    const faster = schedule(200_000, 5, 25, 300)
    expect(faster.length).toBeLessThan(300)
    expect(total(faster.map((m) => m.principal))).toBeCloseTo(200_000, 2)
    expect(faster.every((m) => m.balance >= 0)).toBe(true)
  })

  it('handles an overpayment big enough to clear the loan at once', () => {
    const once = schedule(10_000, 5, 25, 1_000_000)
    expect(once).toHaveLength(1)
    expect(once[0]!.principal).toBe(10_000)
  })
})

describe('calculate', () => {
  it('works out the loan, LTV and totals', () => {
    const result = calculate(base)
    expect(result.loan).toBe(200_000)
    expect(result.ltv).toBeCloseTo(0.8)
    expect(result.monthlyPayment).toBeCloseTo(1169.18, 2)
    expect(result.totalPaid).toBeCloseTo(200_000 + result.totalInterest, 6)
    expect(result.totalInterest).toBeCloseTo(1169.18 * 300 - 200_000, -1)
  })
})

describe('overpaymentSaving', () => {
  it('reports months and interest saved', () => {
    const without = calculate(base)
    const withOver = calculate({ ...base, overpayment: 200 })
    const saving = overpaymentSaving(withOver, without)
    expect(saving.monthsSaved).toBeGreaterThan(0)
    expect(saving.interestSaved).toBeGreaterThan(0)
    expect(saving.interestSaved).toBeCloseTo(without.totalInterest - withOver.totalInterest, 6)
  })

  it('is zero without an overpayment', () => {
    const r = calculate(base)
    expect(overpaymentSaving(r, r)).toEqual({ monthsSaved: 0, interestSaved: 0 })
  })
})

describe('byYear', () => {
  it('groups months into years with matching totals', () => {
    const months = schedule(200_000, 5, 25)
    const years = byYear(months)
    expect(years).toHaveLength(25)
    expect(years[0]!.year).toBe(1)
    expect(years[0]!.balance).toBeCloseTo(months[11]!.balance, 6)
    expect(total(years.map((y) => y.interest))).toBeCloseTo(total(months.map((m) => m.interest)), 6)
  })

  it('keeps a part year at the end', () => {
    expect(byYear(schedule(200_000, 5, 25, 500)).at(-1)!.balance).toBeCloseTo(0, 2)
  })
})

describe('validate', () => {
  it('accepts sensible inputs', () => {
    expect(validate(base)).toEqual({})
  })

  it.each([
    [{ price: 0 }, 'price'],
    [{ deposit: -1 }, 'deposit'],
    [{ deposit: 250_000 }, 'deposit'],
    [{ annualRate: 25 }, 'annualRate'],
    [{ annualRate: Number.NaN }, 'annualRate'],
    [{ years: 0 }, 'years'],
    [{ years: 2.5 }, 'years'],
    [{ overpayment: -50 }, 'overpayment'],
  ] as const)('rejects %o', (change, field) => {
    expect(validate({ ...base, ...change })).toHaveProperty(field)
  })
})
