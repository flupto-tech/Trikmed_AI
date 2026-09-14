'use client'
import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { trapFocus, getFocusableElements } from './focusUtils'
import { drawerPanelTransition, modalBackdropTransition } from './motionConfig'

const WIDTHS = {
  sm: '360px',
  md: '480px',
  lg: '600px',
  full: '100%',
}

function panelPosition(position) {
  if (position === 'left') return { left: 0, top: 0, bottom: 0 }
  if (position === 'bottom') return { left: 0, right: 0, bottom: 0 }
  return { right: 0, top: 0, bottom: 0 }
}

/**
 * Accessible side drawer / sheet.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {Function} props.onClose
 * @param {string} props.title
 * @param {'right'|'left'|'bottom'} [props.position]
 * @param {'sm'|'md'|'lg'|'full'} [props.size]
 */
export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  position = 'right',
  size = 'md',
  children,
  footer,
}) {
  const panelRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()
  const reduceMotion = useReducedMotion()
  const mobilePosition = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? 'bottom' : position

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
      trapFocus(event, panelRef.current)
    }

    document.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => getFocusableElements(panelRef.current)[0]?.focus())

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, open])

  return (
    <AnimatePresence>
      {open ? (
        <Motion.div
          {...modalBackdropTransition(reduceMotion)}
          onMouseDown={event => {
            if (event.target === event.currentTarget) onClose?.()
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(3px)',
          }}
        >
          <Motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={subtitle ? descriptionId : undefined}
            {...drawerPanelTransition(mobilePosition, reduceMotion)}
            style={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              width: mobilePosition === 'bottom' ? '100%' : WIDTHS[size] ?? WIDTHS.md,
              maxWidth: '100%',
              height: mobilePosition === 'bottom' ? 'min(86vh, 720px)' : '100%',
              maxHeight: '100%',
              borderRadius: mobilePosition === 'bottom' ? 'var(--radius-xl) var(--radius-xl) 0 0' : 0,
              background: 'var(--color-surface)',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden',
              ...panelPosition(mobilePosition),
            }}
          >
            <header
              style={{
                display: 'flex',
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
                aria-label="Close drawer"
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
            <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-6)' }}>{children}</div>
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
          </Motion.aside>
        </Motion.div>
      ) : null}
    </AnimatePresence>
  )
}
