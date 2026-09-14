'use client'
import { Inbox } from 'lucide-react'
import { createElement } from 'react'
import { Button } from './Button'

/**
 * Empty content placeholder.
 *
 * @param {object} props
 * @param {Function} [props.icon]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {{label: string, onClick?: Function, href?: string, variant?: string}} [props.action]
 */
export default function EmptyState({
  icon = Inbox,
  title,
  description,
  action,
  className = '',
  style = {},
}) {
  const content = (
    <div
      className={['tm-empty-state-enter', className].filter(Boolean).join(' ')}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-12) var(--space-6)',
        textAlign: 'center',
        color: 'var(--color-text-primary)',
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          display: 'grid',
          placeItems: 'center',
          width: '80px',
          height: '80px',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--color-blue-light)',
          color: 'var(--color-blue)',
        }}
      >
        {createElement(icon, { size: 40, strokeWidth: 1.8 })}
      </div>
      <div style={{ display: 'grid', gap: 'var(--space-2)', justifyItems: 'center' }}>
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-h4)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}
        >
          {title}
        </h3>
        {description ? (
          <p
            style={{
              margin: 0,
              maxWidth: '320px',
              fontSize: 'var(--text-body)',
              lineHeight: 1.65,
              color: 'var(--color-text-secondary)',
            }}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        action.href ? (
          <a
            href={action.href}
            onClick={action.onClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '38px',
              padding: '0 18px',
              borderRadius: 'var(--radius-btn)',
              background: 'var(--color-navy)',
              color: 'var(--color-text-inverse)',
              fontFamily: 'var(--font-body)',
              fontSize: '13.5px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {action.label}
          </a>
        ) : (
          <Button variant={action.variant ?? 'primary'} onClick={action.onClick}>
            {action.label}
          </Button>
        )
      ) : null}
    </div>
  )

  return content
}
