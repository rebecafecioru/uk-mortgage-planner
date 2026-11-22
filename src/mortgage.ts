// Repayment-mortgage maths. Pure functions: no React, no DOM, so they are
// easy to test and reuse.

export interface MortgageInputs {
  price: number // property price, £
  deposit: number // £
  annualRate: number // % a year, e.g. 4.5
  years: number // term
  overpayment: number // extra £ paid each month
}

export interface Month {
  month: number // 1-based
  interest: number
  principal: number // includes any overpayment
  balance: number // after this month's payment
}

export interface YearSummary {
  year: number
  interest: number
  principal: number
  balance: number // at the end of the year
}

export interface MortgageResult {
  loan: number
  ltv: number // 0..1
  monthlyPayment: number // contractual payment, without the overpayment
  months: Month[]
  totalInterest: number
  totalPaid: number
}

// Balances below half a penny are treated as paid off, so floating-point
// leftovers like 0.0000001 don't create an extra month.
const PAID_OFF = 0.005

export function monthlyPayment(loan: number, annualRate: number, years: number): number {
  const n = years * 12
  if (loan <= 0 || n <= 0) return 0
  const r = annualRate / 100 / 12
  if (r === 0) return loan / n
  return (loan * r) / (1 - (1 + r) ** -n)
}

export function schedule(
  loan: number,
  annualRate: number,
  years: number,
  overpayment = 0,
): Month[] {
  const r = annualRate / 100 / 12
  const payment = monthlyPayment(loan, annualRate, years)
  const months: Month[] = []
  let balance = loan

  for (let month = 1; month <= years * 12 && balance > PAID_OFF; month++) {
    const interest = balance * r
    // The last payment only needs to clear what is left.
    const principal = Math.min(payment + overpayment - interest, balance)
    balance -= principal
    months.push({ month, interest, principal, balance: Math.max(balance, 0) })
  }
  return months
}

export function calculate(inputs: MortgageInputs): MortgageResult {
  const loan = Math.max(inputs.price - inputs.deposit, 0)
  const months = schedule(loan, inputs.annualRate, inputs.years, inputs.overpayment)
  const totalInterest = sum(months.map((m) => m.interest))
  return {
    loan,
    ltv: inputs.price > 0 ? loan / inputs.price : 0,
    monthlyPayment: monthlyPayment(loan, inputs.annualRate, inputs.years),
    months,
    totalInterest,
    totalPaid: loan + totalInterest,
  }
}

export function byYear(months: Month[]): YearSummary[] {
  const years: YearSummary[] = []
  for (const m of months) {
    const index = Math.ceil(m.month / 12) - 1
    const year = (years[index] ??= { year: index + 1, interest: 0, principal: 0, balance: 0 })
    year.interest += m.interest
    year.principal += m.principal
    year.balance = m.balance
  }
  return years
}

export interface Saving {
  monthsSaved: number
  interestSaved: number
}

/** What overpaying saves, compared with paying only the contractual amount. */
export function overpaymentSaving(withOver: MortgageResult, without: MortgageResult): Saving {
  return {
    monthsSaved: without.months.length - withOver.months.length,
    interestSaved: without.totalInterest - withOver.totalInterest,
  }
}

export type Errors = Partial<Record<keyof MortgageInputs, string>>

export function validate(inputs: MortgageInputs): Errors {
  const errors: Errors = {}
  if (!(inputs.price > 0)) errors.price = 'Enter a price above £0.'
  if (!(inputs.deposit >= 0)) errors.deposit = "The deposit can't be negative."
  else if (inputs.deposit >= inputs.price) errors.deposit = 'The deposit must be less than the price.'
  if (!(inputs.annualRate >= 0 && inputs.annualRate <= 20))
    errors.annualRate = 'Enter a rate between 0% and 20%.'
  if (!(Number.isInteger(inputs.years) && inputs.years >= 1 && inputs.years <= 40))
    errors.years = 'Enter a whole number of years from 1 to 40.'
  if (!(inputs.overpayment >= 0)) errors.overpayment = "Overpayments can't be negative."
  return errors
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}
