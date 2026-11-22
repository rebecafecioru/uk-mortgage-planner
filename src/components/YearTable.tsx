import { gbp0 } from '../format'
import type { YearSummary } from '../mortgage'

/** Year-by-year breakdown, collapsed by default. Also the chart's text alternative. */
export function YearTable({ rows }: { rows: YearSummary[] }) {
  return (
    <details className="year-table">
      <summary>Year-by-year breakdown</summary>
      <div className="year-table__scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Year</th>
              <th scope="col">Interest paid</th>
              <th scope="col">Capital repaid</th>
              <th scope="col">Balance left</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.year}>
                <th scope="row">{r.year}</th>
                <td>{gbp0(r.interest)}</td>
                <td>{gbp0(r.principal)}</td>
                <td>{gbp0(r.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
