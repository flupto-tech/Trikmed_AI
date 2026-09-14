'use client'
import { AlertTriangle, FileQuestion, ServerCrash } from 'lucide-react'
import { Button } from './Button'

const ICONS = {
  inline: AlertTriangle,
  page: AlertTriangle,
  fullPage: AlertTriangle,
  404: FileQuestion,
  500: ServerCrash,
}

/**
 * Error state for sections and full pages.
 *
 * @param {object} props
 * @param {'inline'|'page'|'fullPage'|'404'|'500'} [props.variant]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {Function} [props.onRetry]
 * @param {string} [props.homeHref]
 */
export default function ErrorState({
  variant = 'inline',
  title = 'Something went wrong',
  description = 'Please try again.',
  onRetry,
  homeHref,
  className = '',
  style = {},
}) {
  const Icon = ICONS[variant] ?? AlertTriangle
  const fullPage = variant === 'page' || variant === 'fullPage' || variant === '404' || variant === '500'

  return (
    <div
      role="alert"
      className={className}
      style={{
        display: 'flex',
        flexDirection: fullPage ? 'column' : 'row',
        alignItems: fullPage ? 'center' : 'flex-start',
        justifyContent: 'center',
        gap: fullPage ? 'var(--space-5)' : 'var(--space-3)',
        minHeight: fullPage ? '60vh' : 'auto',
        padding: fullPage ? 'var(--space-16) var(--space-6)' : 'var(--space-4)',
        borderRadius: fullPage ? 0 : 'var(--radius-lg)',
        border: fullPage ? 'none' : 'calc(var(--space-0-5) / 2) solid var(--color-error-border)',
        background: fullPage ? 'transparent' : 'var(--color-error-bg)',
        textAlign: fullPage ? 'center' : 'left',
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          display: 'grid',
          placeItems: 'center',
          width: fullPage ? '80px' : '36px',
          height: fullPage ? '80px' : '36px',
          borderRadius: fullPage ? 'var(--radius-xl)' : 'var(--radius-md)',
          background: 'var(--color-error-bg)',
          color: 'var(--color-error-text)',
          flexShrink: 0,
        }}
      >
        <Icon size={fullPage ? 40 : 18} strokeWidth={1.8} />
      </div>
      <div style={{ display: 'grid', gap: 'var(--space-2)', maxWidth: fullPage ? '440px' : 'none' }}>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: fullPage ? 'var(--text-h2)' : 'var(--text-h4)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}
        >
          {title}
        </h2>
        {description ? (
          <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--color-text-secondary)' }}>
            {description}
          </p>
        ) : null}
        {(onRetry || homeHref) ? (
          <div
            style={{
              display: 'flex',
              justifyContent: fullPage ? 'center' : 'flex-start',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-2)',
            }}
          >
            {onRetry ? <Button onClick={onRetry}>Try again</Button> : null}
            {homeHref ? (
              <a
                href={homeHref}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: '38px',
                  padding: '0 18px',
                  borderRadius: 'var(--radius-btn)',
                  border: '1.5px solid var(--color-border)',
                  color: 'var(--color-navy)',
                  background: 'var(--color-surface)',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Go home
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
