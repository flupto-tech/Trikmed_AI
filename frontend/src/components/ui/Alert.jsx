'use client'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { Button } from './Button'

const VARIANTS = {
  info: {
    icon: Info,
    bg: 'var(--color-info-bg)',
    border: 'var(--color-info-border)',
    text: 'var(--color-info-text)',
    role: 'status',
    live: 'polite',
  },
  success: {
    icon: CheckCircle2,
    bg: 'var(--color-success-bg)',
    border: 'var(--color-success-border)',
    text: 'var(--color-success-text)',
    role: 'status',
    live: 'polite',
  },
  warning: {
    icon: TriangleAlert,
    bg: 'var(--color-warning-bg)',
    border: 'var(--color-warning-border)',
    text: 'var(--color-warning-text)',
    role: 'alert',
    live: 'assertive',
  },
  error: {
    icon: AlertCircle,
    bg: 'var(--color-error-bg)',
    border: 'var(--color-error-border)',
    text: 'var(--color-error-text)',
    role: 'alert',
    live: 'assertive',
  },
}

/**
 * Inline alert/banner.
 *
 * @param {object} props
 * @param {'info'|'success'|'warning'|'error'} [props.variant]
 * @param {'sm'|'md'} [props.size]
 * @param {string} [props.title]
 * @param {string} [props.children]
 * @param {Function} [props.onDismiss]
 * @param {{label: string, onClick: Function}} [props.action]
 */
export default function Alert({
  variant = 'info',
  size = 'md',
  title,
  children,
  onDismiss,
  action,
  className = '',
  style = {},
}) {
  const config = VARIANTS[variant] ?? VARIANTS.info
  const Icon = config.icon

  return (
    <div
      role={config.role}
      aria-live={config.live}
      className={className}
      style={{
        display: 'flex',
        alignItems: size === 'sm' ? 'center' : 'flex-start',
        gap: 'var(--space-3)',
        padding: size === 'sm' ? 'var(--space-3) var(--space-4)' : 'var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        border: `calc(var(--space-0-5) / 2) solid ${config.border}`,
        background: config.bg,
        color: config.text,
        ...style,
      }}
    >
      <Icon size={18} strokeWidth={1.8} aria-hidden="true" style={{ flexShrink: 0, marginTop: size === 'sm' ? 0 : '2px' }} />
      <div style={{ flex: 1, display: 'grid', gap: title && children ? 'var(--space-1)' : 0 }}>
        {title ? (
          <strong style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {title}
          </strong>
        ) : null}
        {children ? (
          <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
            {children}
          </div>
        ) : null}
      </div>
      {action ? (
        <Button size="sm" variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
      {onDismiss ? (
        <button
          type="button"
          aria-label="Dismiss alert"
          onClick={onDismiss}
          style={{
            display: 'inline-grid',
            placeItems: 'center',
            width: '28px',
            height: '28px',
            border: 0,
            borderRadius: 'var(--radius-sm)',
            background: 'transparent',
            color: config.text,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <X size={15} strokeWidth={1.8} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
