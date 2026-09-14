'use client'
import { useId, useState } from 'react'
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion'
import { MOTION_EASE_OUT } from './motionConfig'

const VARIANT_STYLES = {
  line: {
    list: { borderBottom: 'calc(var(--space-0-5) / 2) solid var(--color-border)' },
    tab: { borderRadius: 0, background: 'transparent' },
  },
  pill: {
    list: { padding: 'var(--space-1)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-subtle)' },
    tab: { borderRadius: 'var(--radius-sm)' },
  },
  'button-group': {
    list: { padding: 'var(--space-1)', borderRadius: 'var(--radius-md)', border: 'calc(var(--space-0-5) / 2) solid var(--color-border)' },
    tab: { borderRadius: 'var(--radius-sm)' },
  },
}

const SIZE_STYLES = {
  sm: { minHeight: 'max(var(--touch-target-min, 0px), 30px)', padding: '0 var(--space-3)', fontSize: 'var(--text-xs)' },
  md: { minHeight: 'max(var(--touch-target-min, 0px), 36px)', padding: '0 var(--space-4)', fontSize: 'var(--text-sm)' },
  lg: { minHeight: 'max(var(--touch-target-min, 0px), 44px)', padding: '0 var(--space-5)', fontSize: 'var(--text-body)' },
}

/**
 * Accessible tab control.
 *
 * @param {object} props
 * @param {{id: string, label: string, content: React.ReactNode}[]} props.tabs
 * @param {string} [props.value]
 * @param {(id: string) => void} [props.onChange]
 */
export default function Tabs({
  tabs = [],
  value,
  defaultValue,
  onChange,
  variant = 'line',
  size = 'md',
  className = '',
  style = {},
}) {
  const generatedId = useId()
  const reduceMotion = useReducedMotion()
  const [internalValue, setInternalValue] = useState(defaultValue ?? tabs[0]?.id)
  const activeValue = value ?? internalValue
  const activeIndex = Math.max(0, tabs.findIndex(tab => tab.id === activeValue))
  const activeTab = tabs[activeIndex]

  function selectTab(id) {
    setInternalValue(id)
    onChange?.(id)
  }

  function handleKeyDown(event) {
    if (!tabs.length) return
    let nextIndex = activeIndex
    if (event.key === 'ArrowRight') nextIndex = (activeIndex + 1) % tabs.length
    if (event.key === 'ArrowLeft') nextIndex = (activeIndex - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex !== activeIndex) {
      event.preventDefault()
      selectTab(tabs[nextIndex].id)
    }
  }

  const variantStyle = VARIANT_STYLES[variant] ?? VARIANT_STYLES.line

  return (
    <div className={className} style={{ display: 'grid', gap: 'var(--space-4)', ...style }}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: variant === 'line' ? 'var(--space-4)' : 'var(--space-1)',
          width: 'fit-content',
          ...variantStyle.list,
        }}
      >
        {tabs.map(tab => {
          const active = tab.id === activeValue
          const tabId = `${generatedId}-tab-${tab.id}`
          const panelId = `${generatedId}-panel-${tab.id}`
          return (
            <button
              key={tab.id}
              id={tabId}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls={panelId}
              tabIndex={active ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              style={{
                position: 'relative',
                border: 0,
                color: active ? 'var(--color-navy)' : 'var(--color-text-secondary)',
                background: active && variant !== 'line' ? 'var(--color-surface)' : 'transparent',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                cursor: 'pointer',
                ...variantStyle.tab,
                ...(SIZE_STYLES[size] ?? SIZE_STYLES.md),
              }}
            >
              {tab.label}
              {active && variant === 'line' ? (
                <Motion.span
                  layoutId={`${generatedId}-tabs-indicator`}
                  transition={{ duration: reduceMotion ? 0.08 : 0.18, ease: MOTION_EASE_OUT }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: '-1px',
                    height: '2px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-coral)',
                  }}
                />
              ) : null}
            </button>
          )
        })}
      </div>
      <AnimatePresence mode="wait">
        {activeTab ? (
          <Motion.div
            key={activeTab.id}
            id={`${generatedId}-panel-${activeTab.id}`}
            role="tabpanel"
            aria-labelledby={`${generatedId}-tab-${activeTab.id}`}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduceMotion ? 0.08 : 0.18, ease: MOTION_EASE_OUT }}
          >
            {activeTab.content}
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
