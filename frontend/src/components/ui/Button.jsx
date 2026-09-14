'use client'
import { createElement, isValidElement, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { FilterChip } from './FilterChip'
import { FilterChipGroup } from './FilterChipGroup'

const BASE_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
  borderRadius: 'var(--radius-btn)',
  border: 'none',
  cursor: 'pointer',
  flexShrink: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  transition: 'transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out), opacity var(--duration-fast) var(--ease-out)',
}

const SIZE_STYLES = {
  sm: { minHeight: 'max(var(--touch-target-min, 0px), 32px)', padding: '0 var(--space-3)', fontSize: '12.5px' },
  md: { minHeight: 'max(var(--touch-target-min, 0px), 38px)', padding: '0 18px', fontSize: '13.5px' },
  lg: { minHeight: 'max(var(--touch-target-min, 0px), 46px)', padding: '0 var(--space-6)', fontSize: '15px' },
  'icon-sm': { width: '30px', minWidth: 'max(var(--touch-target-min, 0px), 30px)', minHeight: 'max(var(--touch-target-min, 0px), 30px)', padding: 'var(--space-1)' },
  'icon-md': { width: '38px', minWidth: 'max(var(--touch-target-min, 0px), 38px)', minHeight: 'max(var(--touch-target-min, 0px), 38px)', padding: 'var(--space-2)' },
}

const VARIANT_STYLES = {
  primary: { background: 'var(--color-navy)', color: 'var(--color-text-inverse)' },
  danger: { background: 'var(--color-error-text)', color: 'var(--color-text-inverse)' },
  secondary: {
    background: 'var(--color-surface)',
    color: 'var(--color-navy)',
    border: '1.5px solid var(--color-border)',
  },
  ghost: { background: 'transparent', color: 'var(--color-text-secondary)' },
  coral: { background: 'var(--color-coral)', color: 'var(--color-text-inverse)' },
  'outline-coral': {
    background: 'transparent',
    color: 'var(--color-coral)',
    border: '1.5px solid var(--color-coral)',
  },
}

const ICON_BUTTON_STYLES = {
  ghost: { background: 'transparent', color: 'var(--color-text-secondary)' },
  subtle: { background: 'var(--color-surface-subtle)', color: 'var(--color-text-secondary)' },
  solid: { background: 'var(--color-navy)', color: 'var(--color-text-inverse)' },
}

function renderIcon(icon, size = 16) {
  if (!icon) return null
  if (isValidElement(icon)) return icon
  if (typeof icon === 'function') {
    const Icon = icon
    return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />
  }
  if (typeof icon === 'object' && icon.$$typeof) {
    return createElement(icon, { size, strokeWidth: 1.8, 'aria-hidden': 'true' })
  }
  return icon
}

/**
 * Token-backed action button.
 *
 * @param {object} props
 * @param {'primary'|'danger'|'secondary'|'ghost'|'coral'|'outline-coral'} [props.variant]
 * @param {'sm'|'md'|'lg'|'icon-sm'|'icon-md'} [props.size]
 * @param {boolean} [props.isLoading]
 * @param {boolean} [props.loading] Backward-compatible alias for isLoading.
 * @param {React.ReactNode|Function} [props.leftIcon]
 * @param {React.ReactNode|Function} [props.rightIcon]
 * @param {Function} [props.icon] Backward-compatible icon component prop.
 * @param {'left'|'right'} [props.iconPosition]
 * @param {boolean} [props.fullWidth]
 */
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  leftIcon,
  rightIcon,
  loading = false,
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  style = {},
  type = 'button',
  children,
  'aria-label': ariaLabel,
  ...props
}) {
  const busy = loading || isLoading
  const iconOnly = !children && (size === 'icon-sm' || size === 'icon-md' || icon || leftIcon || rightIcon)

  useEffect(() => {
    if (iconOnly && !ariaLabel) {
      console.warn('<Button> icon-only buttons require an aria-label.')
    }
  }, [ariaLabel, iconOnly])

  const resolvedLeftIcon = leftIcon || (iconPosition === 'left' ? icon : null)
  const resolvedRightIcon = rightIcon || (iconPosition === 'right' ? icon : null)
  const buttonStyle = {
    ...BASE_STYLE,
    ...(SIZE_STYLES[size] ?? SIZE_STYLES.md),
    ...(VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary),
    ...(fullWidth ? { width: '100%' } : {}),
    ...(disabled || busy ? { opacity: 0.45, cursor: 'not-allowed', pointerEvents: 'none' } : {}),
    ...style,
  }

  return (
    <button
      type={type}
      className={['tm-button-motion', className].filter(Boolean).join(' ')}
      style={buttonStyle}
      disabled={disabled || busy}
      aria-disabled={disabled || busy ? 'true' : undefined}
      aria-busy={busy ? 'true' : undefined}
      aria-label={busy && ariaLabel ? `${ariaLabel}, loading` : ariaLabel}
      {...props}
    >
      {busy ? (
        <>
          <Loader2 size={16} strokeWidth={1.8} className="animate-spin" aria-hidden="true" />
          {children ? <span>Loading...</span> : null}
        </>
      ) : (
        <>
          {renderIcon(resolvedLeftIcon)}
          {children}
          {renderIcon(resolvedRightIcon)}
        </>
      )}
    </button>
  )
}

/**
 * Icon-only button wrapper kept for existing screens.
 *
 * @param {object} props
 * @param {Function} props.icon
 * @param {string} props.ariaLabel
 * @param {'ghost'|'subtle'|'solid'} [props.variant]
 */
export function IconButton({
  icon: Icon,
  variant = 'ghost',
  ariaLabel,
  disabled = false,
  className = '',
  style = {},
  ...props
}) {
  if (!Icon) throw new Error('<IconButton> requires an `icon` prop')
  if (!ariaLabel) throw new Error('<IconButton> requires an `ariaLabel` prop')

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      aria-disabled={disabled ? 'true' : undefined}
      className={['tm-button-motion', className].filter(Boolean).join(' ')}
      style={{
        ...BASE_STYLE,
        width: '36px',
        minWidth: 'max(var(--touch-target-min, 0px), 36px)',
        minHeight: 'max(var(--touch-target-min, 0px), 36px)',
        padding: 'var(--space-2)',
        borderRadius: 'var(--radius-md)',
        ...(ICON_BUTTON_STYLES[variant] ?? ICON_BUTTON_STYLES.ghost),
        ...(disabled ? { opacity: 0.45, cursor: 'not-allowed', pointerEvents: 'none' } : {}),
        ...style,
      }}
      {...props}
    >
      <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
    </button>
  )
}

export { FilterChip, FilterChipGroup }
