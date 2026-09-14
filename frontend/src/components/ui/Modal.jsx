'use client'
import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { trapFocus, getFocusableElements } from './focusUtils'
import { modalBackdropTransition, modalPanelTransition } from './motionConfig'

const SIZES = {
  sm: '400px',
  md: '560px',
  lg: '720px',
  xl: '900px',
  fullscreen: 'calc(100vw - var(--space-8))',
}

/**
 * Accessible modal dialog.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {Function} props.onClose
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {'sm'|'md'|'lg'|'xl'|'fullscreen'} [props.size]
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
  closeOnBackdrop = true,
}) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
      trapFocus(event, dialogRef.current)
    }

    document.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => {
      const first = getFocusableElements(dialogRef.current)[0]
      first?.focus()
    })

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, open])

  return (
    <AnimatePresence>
      {open ? (
        <Motion.div
          aria-hidden="false"
          {...modalBackdropTransition(reduceMotion)}
          onMouseDown={event => {
            if (closeOnBackdrop && event.target === event.currentTarget) onClose?.()
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: 'var(--space-4)',
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <Motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={subtitle ? descriptionId : undefined}
            {...modalPanelTransition(reduceMotion)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: 'min(100%, ' + (SIZES[size] ?? SIZES.md) + ')',
              maxHeight: size === 'fullscreen' ? 'calc(100vh - var(--space-8))' : 'calc(100vh - var(--space-16))',
              borderRadius: size === 'fullscreen' ? 'var(--radius-xl)' : 'var(--radius-xl)',
              background: 'var(--color-surface)',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden',
            }}
          >
            <header
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 'var(--space-4)',
                padding: 'var(--space-6)',
                borderBottom: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
              }}
            >
              <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
                <h2 id={titleId} style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h3)' }}>
                  {title}
                </h2>
                {subtitle ? (
                  <p id={descriptionId} style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    {subtitle}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={onClose}
                style={{
                  display: 'inline-grid',
                  placeItems: 'center',
                  width: '34px',
                  height: '34px',
                  border: 0,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface-subtle)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <X size={16} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </header>
            <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-6)' }}>
              {children}
            </div>
            {footer ? (
              <footer
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-4) var(--space-6)',
                  borderTop: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
                }}
              >
                {footer}
              </footer>
            ) : null}
          </Motion.div>
        </Motion.div>
      ) : null}
    </AnimatePresence>
  )
}
