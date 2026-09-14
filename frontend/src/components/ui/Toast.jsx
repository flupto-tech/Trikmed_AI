'use client'
import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { MOTION_EASE_OUT } from './motionConfig'

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
}

const COLORS = {
  success: { text: 'var(--color-success-text)', border: 'var(--color-success-border)' },
  error: { text: 'var(--color-error-text)', border: 'var(--color-error-border)' },
  warning: { text: 'var(--color-warning-text)', border: 'var(--color-warning-border)' },
  info: { text: 'var(--color-info-text)', border: 'var(--color-info-border)' },
}

const listeners = new Set()
let nextId = 1

export function showToast(message, type = 'success', options = {}) {
  const id = nextId
  nextId += 1
  listeners.forEach(listener => listener({ id, message, type, ...options }))
}

function ToastItem({ id, message, title, type = 'success', action, duration = 4000, onRemove }) {
  const [paused, setPaused] = useState(false)
  const reduceMotion = useReducedMotion()
  const Icon = ICONS[type] ?? ICONS.success
  const color = COLORS[type] ?? COLORS.success

  useEffect(() => {
    if (paused) return undefined
    const timer = setTimeout(() => onRemove(id), duration)
    return () => clearTimeout(timer)
  }, [duration, id, onRemove, paused])

  return (
    <Motion.div
      role={type === 'error' || type === 'warning' ? 'alert' : 'status'}
      aria-live={type === 'error' || type === 'warning' ? 'assertive' : 'polite'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      layout
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
      transition={{ duration: reduceMotion ? 0.08 : 0.22, ease: MOTION_EASE_OUT }}
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 'var(--space-3)',
        width: 'min(320px, calc(100vw - var(--space-8)))',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
        background: 'var(--color-surface-elevated)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 'var(--space-1)',
          background: color.text,
        }}
      />
      <Icon size={18} strokeWidth={1.8} aria-hidden="true" style={{ color: color.text, marginTop: '2px' }} />
      <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
        <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
          {title ?? type.charAt(0).toUpperCase() + type.slice(1)}
        </strong>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
          {message}
        </p>
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            style={{
              justifySelf: 'start',
              border: 0,
              background: 'transparent',
              color: color.text,
              fontWeight: 700,
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {action.label}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onRemove(id)}
        style={{
          display: 'inline-grid',
          placeItems: 'center',
          width: '28px',
          height: '28px',
          border: 0,
          borderRadius: 'var(--radius-sm)',
          background: 'transparent',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
        }}
      >
        <X size={15} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </Motion.div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handler = toast => setToasts(previous => [...previous, toast])
    listeners.add(handler)
    return () => listeners.delete(handler)
  }, [])

  const remove = useCallback((id) => {
    setToasts(previous => previous.filter(toast => toast.id !== id))
  }, [])

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 'var(--space-6)',
        right: 'var(--space-6)',
        zIndex: 9999,
        display: 'grid',
        gap: 'var(--space-3)',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence initial={false}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} {...toast} onRemove={remove} />
        ))}
      </AnimatePresence>
    </div>
  )
}

export function useToast() {
  return { showToast }
}
