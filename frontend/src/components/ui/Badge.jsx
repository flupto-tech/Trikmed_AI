'use client'

const COLORS = {
  default: { bg: 'var(--color-surface-subtle)', text: 'var(--color-text-secondary)', border: 'var(--color-border)' },
  blue: { bg: 'var(--color-info-bg)', text: 'var(--color-info-text)', border: 'var(--color-info-border)' },
  green: { bg: 'var(--color-success-bg)', text: 'var(--color-success-text)', border: 'var(--color-success-border)' },
  yellow: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-text)', border: 'var(--color-warning-border)' },
  red: { bg: 'var(--color-error-bg)', text: 'var(--color-error-text)', border: 'var(--color-error-border)' },
  coral: { bg: 'rgba(232,102,61,0.12)', text: 'var(--color-coral)', border: 'rgba(232,102,61,0.35)' },
  purple: { bg: 'rgba(124,58,237,0.10)', text: '#6D28D9', border: 'rgba(124,58,237,0.28)' },
  navy: { bg: 'var(--color-navy)', text: 'var(--color-text-inverse)', border: 'var(--color-navy)' },
}

const SIZES = {
  sm: { minHeight: '18px', padding: '0 var(--space-1)', fontSize: '10px' },
  md: { minHeight: '22px', padding: '0 var(--space-2)', fontSize: '11px' },
  lg: { minHeight: '26px', padding: '0 var(--space-3)', fontSize: '12px' },
}

/**
 * Compact status, category, and count indicator.
 *
 * @param {object} props
 * @param {'default'|'blue'|'green'|'yellow'|'red'|'coral'|'purple'|'navy'} [props.variant]
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {'solid'|'subtle'|'outline'|'dot'} [props.type]
 */
export default function Badge({
  variant = 'default',
  size = 'md',
  type = 'subtle',
  children,
  className = '',
  style = {},
}) {
  const color = COLORS[variant] ?? COLORS.default
  const solid = type === 'solid'
  const outline = type === 'outline'
  const subtleBackground = `var(--badge-subtle-bg, ${color.bg})`

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-1)',
        borderRadius: 'var(--radius-sm)',
        border: `calc(var(--space-0-5) / 2) solid ${outline ? color.border : 'transparent'}`,
        background: solid ? color.text : outline ? 'var(--color-surface)' : subtleBackground,
        color: solid ? 'var(--color-text-inverse)' : color.text,
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...(SIZES[size] ?? SIZES.md),
        ...style,
      }}
    >
      {type === 'dot' ? (
        <span
          aria-hidden="true"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: 'var(--radius-full)',
            background: color.text,
            animation: 'tmBadgePulse var(--duration-slow) var(--ease-in-out) infinite',
          }}
        />
      ) : null}
      {children}
      <style>{`@keyframes tmBadgePulse { 0%, 100% { opacity: .45; } 50% { opacity: 1; } }`}</style>
    </span>
  )
}
