import { useEffect, useMemo, useState } from 'react'
import { BalanceChart } from './components/BalanceChart'
import { NumberField } from './components/NumberField'
import { YearTable } from './components/YearTable'
import { duration, gbp, gbp0, percent } from './format'
import {
  byYear,
  calculate,
  overpaymentSaving,
  validate,
  type MortgageInputs,
} from './mortgage'
import { readForm, writeForm, type FormValues } from './urlState'

function toInputs(form: FormValues): MortgageInputs {
  // An empty box becomes NaN, which validate() reports, instead of silently 0.
  const num = (s: string) => (s.trim() === '' ? Number.NaN : Number(s))
  return {
    price: num(form.price),
    deposit: num(form.deposit),
    annualRate: num(form.rate),
    years: num(form.years),
    overpayment: form.overpayment.trim() === '' ? 0 : num(form.overpayment),
  }
}

export default function App() {
  const [form, setForm] = useState<FormValues>(() => readForm(window.location.search))
  const set = (key: keyof FormValues) => (value: string) => setForm((f) => ({ ...f, [key]: value }))

  // Keep the URL in sync so the current numbers can be shared or bookmarked.
  useEffect(() => {
    window.history.replaceState(null, '', writeForm(form))
  }, [form])

  // Derived from the form on every change, never stored separately.
  const inputs = useMemo(() => toInputs(form), [form])
  const errors = useMemo(() => validate(inputs), [inputs])
  const valid = Object.keys(errors).length === 0

  const result = useMemo(() => (valid ? calculate(inputs) : null), [valid, inputs])
  const standard = useMemo(
    () => (valid && inputs.overpayment > 0 ? calculate({ ...inputs, overpayment: 0 }) : result),
    [valid, inputs, result],
  )
  const overpaying = valid && inputs.overpayment > 0

  return (
    <div className="page">
      <header className="page__header">
        <h1>UK Mortgage Planner</h1>
        <p>See what a repayment mortgage costs, and how much overpaying could save.</p>
      </header>

      <main className="layout">
        <form className="panel" onSubmit={(e) => e.preventDefault()} aria-label="Mortgage details">
          <NumberField label="Property price" prefix="£" value={form.price} onChange={set('price')}
            error={errors.price} step="1000" />
          <NumberField label="Deposit" prefix="£" value={form.deposit} onChange={set('deposit')}
            error={errors.deposit} step="1000"
            hint={valid && result ? `${percent(1 - result.ltv)} of the price` : undefined} />
          <NumberField label="Interest rate" suffix="% a year" value={form.rate} onChange={set('rate')}
            error={errors.annualRate} step="0.05" />
          <NumberField label="Term" suffix="years" value={form.years} onChange={set('years')}
            error={errors.years} step="1" />
          <NumberField label="Monthly overpayment" prefix="£" value={form.overpayment}
            onChange={set('overpayment')} error={errors.overpayment} step="50"
            hint="Optional. Many lenders allow up to 10% of the balance a year without a fee." />
        </form>

        <section className="results" aria-live="polite" aria-label="Results">
          {!result || !standard ? (
            <p className="results__empty">Fix the highlighted fields to see your results.</p>
          ) : (
            <>
              <div className="stats">
                <Stat label="Monthly payment" value={gbp(result.monthlyPayment)}
                  note={overpaying ? `${gbp(result.monthlyPayment + inputs.overpayment)} with overpayment` : undefined} />
                <Stat label="You borrow" value={gbp0(result.loan)} note={`${percent(result.ltv)} loan-to-value`} />
                <Stat label="Total interest" value={gbp0(result.totalInterest)}
                  note={overpaying ? 'with overpayments' : undefined} />
                <Stat label="Total repaid" value={gbp0(result.totalPaid)}
                  note={overpaying ? 'with overpayments' : undefined} />
              </div>

              {overpaying && (
                <Saving withOver={result} without={standard} />
              )}

              <h2>Balance over time</h2>
              <BalanceChart
                loan={result.loan}
                years={inputs.years}
                standard={byYear(standard.months)}
                withOverpayment={overpaying ? byYear(result.months) : undefined}
              />
              <YearTable rows={byYear(result.months)} />
            </>
          )}
        </section>
      </main>

      <footer className="page__footer">
        Estimates for a repayment mortgage at a fixed rate for the whole term. Real deals change
        rate after the fixed period and may charge fees. Not financial advice.
      </footer>
    </div>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="stat">
      <p className="stat__label">{label}</p>
      <p className="stat__value">{value}</p>
      {note && <p className="stat__note">{note}</p>}
    </div>
  )
}

function Saving({ withOver, without }: { withOver: ReturnType<typeof calculate>; without: ReturnType<typeof calculate> }) {
  const saving = overpaymentSaving(withOver, without)
  return (
    <p className="saving">
      Overpaying clears the mortgage in <strong>{duration(withOver.months.length)}</strong>,{' '}
      <strong>{duration(saving.monthsSaved)} sooner</strong>, and saves{' '}
      <strong>{gbp0(saving.interestSaved)}</strong> in interest.
    </p>
  )
}
