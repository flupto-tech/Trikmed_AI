'use client'
import { RefreshCw } from 'lucide-react'
import Alert from './Alert'
import ErrorState from './ErrorState'

/**
 * Backward-compatible error banner.
 *
 * @param {object} props
 * @param {string} props.message
 * @param {Function} [props.onRetry]
 * @param {boolean} [props.fullPage]
 */
export default function ErrorBanner({ message, onRetry, fullPage = false }) {
  if (fullPage) {
    return (
      <ErrorState
        variant="fullPage"
        title="Unable to load this page"
        description={message}
        onRetry={onRetry}
      />
    )
  }

  return (
    <Alert
      variant="error"
      title="Something went wrong"
      action={onRetry ? { label: 'Try again', onClick: onRetry } : undefined}
      style={{ margin: 'var(--space-4) 0' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {onRetry ? <RefreshCw size={12} strokeWidth={1.8} aria-hidden="true" /> : null}
        {message}
      </span>
    </Alert>
  )
}
