import { useId } from 'react'

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  prefix?: string
  suffix?: string
  hint?: string
  error?: string
  step?: string
}

/** A labelled number input whose hint and error are linked for screen readers. */
export function NumberField({ label, value, onChange, prefix, suffix, hint, error, step }: Props) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field__control">
        {prefix && <span className="field__affix" aria-hidden="true">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min="0"
          step={step ?? 'any'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {suffix && <span className="field__affix" aria-hidden="true">{suffix}</span>}
      </div>
      {hint && !error && <p id={hintId} className="field__hint">{hint}</p>}
      {error && <p id={errorId} className="field__error">{error}</p>}
    </div>
  )
}
