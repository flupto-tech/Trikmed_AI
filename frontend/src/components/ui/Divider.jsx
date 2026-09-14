'use client'

/**
 * Visual content divider.
 *
 * @param {object} props
 * @param {'horizontal'|'vertical'} [props.orientation]
 * @param {string} [props.label]
 */
export default function Divider({
  orientation = 'horizontal',
  label,
  className = '',
  style = {},
}) {
  if (orientation === 'vertical') {
    return (
      <span
        aria-hidden="true"
        className={className}
        style={{
          display: 'inline-block',
          alignSelf: 'stretch',
          width: 'calc(var(--space-0-5) / 2)',
          minHeight: 'var(--space-6)',
          background: 'var(--color-border)',
          ...style,
        }}
      />
    )
  }

  if (label) {
    return (
      <div
        className={className}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 'var(--space-3)',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          ...style,
        }}
      >
        <span aria-hidden="true" style={{ height: 'calc(var(--space-0-5) / 2)', background: 'var(--color-border)' }} />
        <span>{label}</span>
        <span aria-hidden="true" style={{ height: 'calc(var(--space-0-5) / 2)', background: 'var(--color-border)' }} />
      </div>
    )
  }

  return (
    <hr
      className={className}
      style={{
        border: 0,
        height: 'calc(var(--space-0-5) / 2)',
        background: 'var(--color-border)',
        margin: 0,
        ...style,
      }}
    />
  )
}
