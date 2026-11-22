import { gbpShort } from '../format'
import type { YearSummary } from '../mortgage'

interface Props {
  loan: number
  years: number // the full term, so both lines share the same x-axis
  standard: YearSummary[]
  withOverpayment?: YearSummary[]
}

const WIDTH = 640
const HEIGHT = 280
const PAD = { top: 16, right: 16, bottom: 36, left: 56 }
const PLOT_W = WIDTH - PAD.left - PAD.right
const PLOT_H = HEIGHT - PAD.top - PAD.bottom

/** Remaining balance over time, drawn as plain SVG. */
export function BalanceChart({ loan, years, standard, withOverpayment }: Props) {
  // Scale functions: data value -> pixel position. SVG's y-axis points down,
  // so a full balance sits at the top and £0 at the bottom.
  const x = (year: number) => PAD.left + (year / years) * PLOT_W
  const y = (balance: number) => PAD.top + (1 - balance / loan) * PLOT_H

  const points = (rows: YearSummary[]) =>
    [`${x(0)},${y(loan)}`, ...rows.map((r) => `${x(r.year)},${y(r.balance)}`)].join(' ')

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * loan)
  const xStep = years > 20 ? 5 : years > 10 ? 2 : 1
  const xTicks = Array.from({ length: Math.floor(years / xStep) + 1 }, (_, i) => i * xStep)

  const lastStandard = standard.at(-1)?.year ?? 0
  const lastOver = withOverpayment?.at(-1)?.year
  const description =
    `Remaining balance falls from ${gbpShort(loan)} to £0 over ${lastStandard} years` +
    (lastOver !== undefined && lastOver < lastStandard
      ? `, or ${lastOver} years with overpayments.`
      : '.')

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={description}>
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line className="chart__grid" x1={PAD.left} x2={WIDTH - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="chart__label" x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle">
              {gbpShort(t)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={`x${t}`} className="chart__label" x={x(t)} y={HEIGHT - PAD.bottom + 18} textAnchor="middle">
            {t}
          </text>
        ))}
        <text className="chart__label" x={PAD.left + PLOT_W / 2} y={HEIGHT - 4} textAnchor="middle">
          Years
        </text>
        <polyline className="chart__line chart__line--standard" points={points(standard)} />
        {withOverpayment && (
          <polyline className="chart__line chart__line--over" points={points(withOverpayment)} />
        )}
      </svg>
      <figcaption className="chart__legend">
        <span className="legend legend--standard">Standard payments</span>
        {withOverpayment && <span className="legend legend--over">With overpayments</span>}
      </figcaption>
    </figure>
  )
}
