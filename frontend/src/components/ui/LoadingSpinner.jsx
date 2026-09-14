'use client'
import Skeleton from './Skeleton'

const SIZE_MAP = {
  sm: '16px',
  md: '24px',
  lg: '40px',
}

/**
 * Accessible loading indicator.
 *
 * @param {object} props
 * @param {'spinner'|'dots'|'skeleton-page'} [props.variant]
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {string} [props.message]
 */
export default function LoadingSpinner({
  variant = 'spinner',
  size = 'lg',
  message = 'Loading...',
  className = '',
  style = {},
}) {
  const dimension = SIZE_MAP[size] ?? SIZE_MAP.md

  if (variant === 'skeleton-page') {
    return (
      <div
        role="status"
        aria-label={message}
        aria-live="polite"
        className={className}
        style={{
          display: 'grid',
          gap: 'var(--space-4)',
          width: '100%',
          padding: 'var(--space-6)',
          ...style,
        }}
      >
        <Skeleton variant="text" width="35%" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div
        role="status"
        aria-label={message}
        aria-live="polite"
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          color: 'var(--color-coral)',
          ...style,
        }}
      >
        {[0, 1, 2].map(index => (
          <span
            key={index}
            aria-hidden="true"
            style={{
              width: '6px',
              height: '6px',
              borderRadius: 'var(--radius-full)',
              background: 'currentColor',
              animation: `tmDotPulse var(--duration-slow) var(--ease-in-out) ${index * 120}ms infinite`,
            }}
          />
        ))}
        <style>{`@keyframes tmDotPulse { 0%, 80%, 100% { opacity: .35; transform: scale(.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-label={message}
      aria-live="polite"
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: size === 'sm' ? 'auto' : '240px',
        gap: 'var(--space-3)',
        color: 'var(--color-text-muted)',
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: dimension,
          height: dimension,
          borderRadius: 'var(--radius-full)',
          border: '3px solid var(--color-error-bg)',
          borderTopColor: 'var(--color-coral)',
          animation: 'tmSpin 750ms var(--ease-linear) infinite',
        }}
      />
      {message ? (
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          {message}
        </span>
      ) : null}
      <style>{`@keyframes tmSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
