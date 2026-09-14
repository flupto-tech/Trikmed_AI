'use client'

const BASE_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
  borderRadius: 'var(--radius-btn)',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  transition: 'background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out)',
}

const SIZE_STYLES = {
  sm: { minHeight: 'max(var(--touch-target-min, 0px), 30px)', padding: '0 var(--space-3)', fontSize: '12.5px' },
  md: { minHeight: 'max(var(--touch-target-min, 0px), 34px)', padding: '0 14px', fontSize: '13px' },
}

const ACTIVE_STYLE = {
  background: 'var(--color-navy)',
  color: 'var(--color-text-inverse)',
  border: 'calc(var(--space-0-5) / 2) solid var(--color-navy)',
}

const INACTIVE_STYLE = {
  background: 'var(--color-surface)',
  color: 'var(--color-text-secondary)',
  border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
}

/**
 * Toggle-able filter chip for tables and list filters.
 *
 * @param {object} props
 * @param {boolean} [props.isActive]
 * @param {'sm'|'md'} [props.size]
 * @param {Function} [props.icon]
 * @param {number|string} [props.count]
 */
export function FilterChip({
  isActive = false,
  size = 'md',
  onClick,
  icon: Icon,
  count,
  children,
  className = '',
  style = {},
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      aria-pressed={isActive}
      onClick={onClick}
      className={['tm-filter-chip-motion', className].filter(Boolean).join(' ')}
      style={{
        ...BASE_STYLE,
        ...(SIZE_STYLES[size] ?? SIZE_STYLES.md),
        ...(isActive ? ACTIVE_STYLE : INACTIVE_STYLE),
        ...style,
      }}
      {...props}
    >
      {Icon && <Icon size={12} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />}
      {children}
      {count !== undefined && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '18px',
            minHeight: '18px',
            padding: '0 var(--space-1)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-2xs)',
            fontWeight: 700,
            background: isActive ? 'rgba(255,255,255,0.18)' : 'var(--color-surface-subtle)',
            color: isActive ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}

export default FilterChip
