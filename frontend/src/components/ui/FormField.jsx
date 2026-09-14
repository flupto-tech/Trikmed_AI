'use client'
import { AlertCircle } from 'lucide-react'

/**
 * Consistent label, hint, error, and control wrapper.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.htmlFor
 * @param {boolean} [props.required]
 * @param {string} [props.error]
 * @param {string} [props.hint]
 */
export default function FormField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
  className = '',
  style = {},
}) {
  const hintId = hint ? `${htmlFor}-hint` : undefined
  const errorId = error ? `${htmlFor}-error` : undefined

  return (
    <div
      className={className}
      style={{ display: 'grid', gap: 'var(--space-2)', ...style }}
      data-hint-id={hintId}
      data-error-id={errorId}
    >
      {label ? (
        <label
          htmlFor={htmlFor}
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          {label}
          {required ? <span aria-hidden="true" style={{ color: 'var(--color-error-text)' }}> *</span> : null}
        </label>
      ) : null}
      {children}
      {hint && !error ? (
        <p id={hintId} style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            margin: 0,
            fontSize: 'var(--text-xs)',
            color: 'var(--color-error-text)',
          }}
        >
          <AlertCircle size={12} strokeWidth={1.8} aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  )
}
