'use client'
import { cloneElement, isValidElement, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import { MOTION_EASE_OUT } from './motionConfig'

function isSelectable(item) {
  return item && item.type !== 'divider' && item.type !== 'header' && !item.disabled
}

/**
 * Accessible contextual menu.
 *
 * @param {object} props
 * @param {React.ReactElement} props.trigger
 * @param {Array} props.items
 * @param {'default'|'dark'} [props.variant]
 */
export default function DropdownMenu({
  trigger,
  items = [],
  variant = 'default',
  align = 'left',
  className = '',
  style = {},
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const wrapperRef = useRef(null)
  const menuRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const selectableIndexes = items.map((item, index) => isSelectable(item) ? index : -1).filter(index => index >= 0)

  useEffect(() => {
    if (!open) return undefined

    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false)
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        wrapperRef.current?.querySelector('button, [href], [tabindex]:not([tabindex="-1"])')?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function moveActive(direction) {
    if (!selectableIndexes.length) return
    const currentPosition = Math.max(0, selectableIndexes.indexOf(activeIndex))
    const nextPosition = (currentPosition + direction + selectableIndexes.length) % selectableIndexes.length
    setActiveIndex(selectableIndexes[nextPosition])
  }

  function activateItem(item) {
    if (!isSelectable(item)) return
    item.onSelect?.()
    if (item.type !== 'checkbox') {
      setOpen(false)
      wrapperRef.current?.querySelector('button, [href], [tabindex]:not([tabindex="-1"])')?.focus()
    }
  }

  function handleMenuKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveActive(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveActive(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(selectableIndexes[0] ?? 0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(selectableIndexes[selectableIndexes.length - 1] ?? 0)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      activateItem(items[activeIndex])
    }
  }

  const triggerNode = isValidElement(trigger)
    ? cloneElement(trigger, {
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        onClick: event => {
          trigger.props.onClick?.(event)
          setOpen(next => !next)
          setActiveIndex(selectableIndexes[0] ?? 0)
        },
      })
    : null

  return (
    <div ref={wrapperRef} className={className} style={{ position: 'relative', display: 'inline-block', ...style }}>
      {triggerNode}
      <AnimatePresence>
        {open ? (
        <Motion.div
          ref={menuRef}
          role="menu"
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: reduceMotion ? 0.08 : 0.16, ease: MOTION_EASE_OUT }}
          style={{
            position: 'absolute',
            zIndex: 50,
            top: 'calc(100% + var(--space-2))',
            [align === 'right' ? 'right' : 'left']: 0,
            minWidth: '220px',
            maxHeight: 'min(420px, calc(100vh - var(--space-8)))',
            overflowY: 'auto',
            padding: 'var(--space-2)',
            borderRadius: 'var(--radius-lg)',
            border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
            background: variant === 'dark' ? 'var(--color-navy)' : 'var(--color-surface-elevated)',
            color: variant === 'dark' ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {items.map((item, index) => {
            if (item.type === 'divider') {
              return <div key={item.id ?? index} role="separator" style={{ height: '1px', margin: 'var(--space-2) 0', background: 'var(--color-border)' }} />
            }
            if (item.type === 'header') {
              return (
                <div
                  key={item.id ?? index}
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    color: 'var(--color-text-muted)',
                    fontSize: 'var(--text-2xs)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {item.label}
                </div>
              )
            }
            const Icon = item.icon
            const active = index === activeIndex
            const destructive = item.destructive || item.type === 'destructive'
            return (
              <button
                key={item.id ?? index}
                type="button"
                role={item.type === 'checkbox' ? 'menuitemcheckbox' : 'menuitem'}
                aria-checked={item.type === 'checkbox' ? Boolean(item.checked) : undefined}
                disabled={item.disabled}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => activateItem(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  width: '100%',
                  minHeight: '36px',
                  padding: '0 var(--space-3)',
                  border: 0,
                  borderRadius: 'var(--radius-md)',
                  background: active ? 'var(--color-surface-subtle)' : 'transparent',
                  color: destructive ? 'var(--color-error-text)' : 'inherit',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  textAlign: 'left',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  opacity: item.disabled ? 0.45 : 1,
                }}
              >
                {item.type === 'checkbox' ? (
                  <span style={{ width: '16px' }}>
                    {item.checked ? <Check size={14} strokeWidth={1.8} aria-hidden="true" /> : null}
                  </span>
                ) : Icon ? (
                  <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
                ) : null}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.shortcut ? (
                  <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--color-text-muted)' }}>
                    {item.shortcut}
                  </kbd>
                ) : null}
              </button>
            )
          })}
        </Motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
