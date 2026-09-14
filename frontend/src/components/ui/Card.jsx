'use client'

const VARIANTS = {
  default: {
    background: 'var(--color-surface)',
    border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
  },
  elevated: {
    background: 'var(--color-surface)',
    border: 'calc(var(--space-0-5) / 2) solid transparent',
    boxShadow: 'var(--shadow-md)',
  },
  flat: {
    background: 'var(--color-surface)',
    border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
    boxShadow: 'none',
  },
  subtle: {
    background: 'var(--color-surface-subtle)',
    border: 'calc(var(--space-0-5) / 2) solid transparent',
    boxShadow: 'none',
  },
}

/**
 * Reusable content surface.
 *
 * @param {object} props
 * @param {'default'|'elevated'|'flat'|'subtle'} [props.variant]
 * @param {boolean} [props.interactive]
 * @param {boolean} [props.selected]
 */
function Card({
  variant = 'default',
  interactive = false,
  selected = false,
  children,
  className = '',
  style = {},
  ...props
}) {
  return (
    <div
      className={['tm-card-motion', 'tm-card-enter', className].filter(Boolean).join(' ')}
      data-interactive={interactive ? 'true' : undefined}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)',
        cursor: interactive ? 'pointer' : undefined,
        ...(VARIANTS[variant] ?? VARIANTS.default),
        ...(variant === 'subtle' || selected ? { '--badge-subtle-bg': 'var(--color-surface)' } : {}),
        ...(selected ? {
          borderLeft: '3px solid var(--color-blue)',
          background: 'var(--color-blue-light)',
        } : {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ title, subtitle, action, children, className = '', style = {} }) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        padding: 'var(--space-6) var(--space-6) 0',
        ...style,
      }}
    >
      <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
        {title ? (
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h4)', fontWeight: 600 }}>
            {title}
          </h3>
        ) : null}
        {subtitle ? (
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            {subtitle}
          </p>
        ) : null}
        {children}
      </div>
      {action}
    </div>
  )
}

function CardBody({ children, className = '', style = {} }) {
  return (
    <div className={className} style={{ padding: 'var(--space-6)', ...style }}>
      {children}
    </div>
  )
}

function CardFooter({ children, className = '', style = {} }) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 'var(--space-2)',
        padding: 'var(--space-4) var(--space-6)',
        borderTop: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter

export default Card
export { Card, CardHeader, CardBody, CardFooter }
