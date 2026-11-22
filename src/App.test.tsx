import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

function renderAt(search = '') {
  window.history.replaceState(null, '', `/${search}`)
  return render(<App />)
}

async function setField(label: string, value: string) {
  const input = screen.getByLabelText(label)
  await userEvent.clear(input)
  if (value) await userEvent.type(input, value)
}

const results = () => screen.getByRole('region', { name: 'Results' })

describe('App', () => {
  it('shows results for the default example', () => {
    renderAt()
    expect(screen.getByLabelText('Property price')).toHaveValue(250000)
    expect(results()).toHaveTextContent('Monthly payment£1,111.66') // £200k, 4.5%, 25 years
    expect(results()).toHaveTextContent('80% loan-to-value')
  })

  it('starts from the numbers in a shared link', () => {
    renderAt('?price=300000&deposit=60000&rate=5&years=25&overpayment=0')
    expect(screen.getByLabelText('Property price')).toHaveValue(300000)
    expect(results()).toHaveTextContent('You borrow£240,000')
  })

  it('updates the results and the URL as you type', async () => {
    renderAt()
    await setField('Deposit', '100000')
    expect(results()).toHaveTextContent('You borrow£150,000')
    expect(results()).toHaveTextContent('60% loan-to-value')
    expect(window.location.search).toContain('deposit=100000')
  })

  it('explains what overpaying saves', async () => {
    renderAt()
    expect(results()).not.toHaveTextContent('Overpaying clears')
    await setField('Monthly overpayment', '200')
    expect(results()).toHaveTextContent(/Overpaying clears the mortgage in .+ sooner/)
    expect(screen.getByText('With overpayments')).toBeInTheDocument()
  })

  it('flags a bad field and hides results until it is fixed', async () => {
    renderAt()
    await setField('Deposit', '300000')
    const deposit = screen.getByLabelText('Deposit')
    expect(deposit).toHaveAttribute('aria-invalid', 'true')
    expect(deposit).toHaveAccessibleDescription('The deposit must be less than the price.')
    expect(results()).toHaveTextContent('Fix the highlighted fields')

    await setField('Deposit', '50000')
    expect(deposit).not.toHaveAttribute('aria-invalid')
    expect(results()).toHaveTextContent('Monthly payment')
  })

  it('treats an empty required field as an error, not as zero', async () => {
    renderAt()
    await setField('Interest rate', '')
    expect(screen.getByLabelText('Interest rate')).toHaveAttribute('aria-invalid', 'true')
  })

  it('describes the chart for screen readers', () => {
    renderAt('?price=250000&deposit=50000&rate=4.5&years=25&overpayment=200')
    const chart = screen.getByRole('img')
    expect(chart).toHaveAccessibleName(/from £200k to £0 over 25 years, or 19 years with overpayments/)
  })
})
