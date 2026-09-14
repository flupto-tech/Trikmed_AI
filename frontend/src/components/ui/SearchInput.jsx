'use client'
import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

/**
 * Debounced search input with clear affordance.
 *
 * @param {object} props
 * @param {string} [props.value]
 * @param {(value: string) => void} props.onChange
 * @param {number} [props.debounceMs]
 */
export default function SearchInput({
  value = '',
  onChange,
  debounceMs = 300,
  placeholder = 'Search',
  className = '',
  style = {},
  'aria-label': ariaLabel = 'Search',
  ...props
}) {
  const [draft, setDraft] = useState(value)
  const inputRef = useRef(null)
  const lastEmitted = useRef(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft !== lastEmitted.current) {
        lastEmitted.current = draft
        onChange?.(draft)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [debounceMs, draft, onChange])

  function clearSearch() {
    setDraft('')
    lastEmitted.current = ''
    onChange?.('')
    inputRef.current?.focus()
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      clearSearch()
      inputRef.current?.blur()
    }
    props.onKeyDown?.(event)
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        ...style,
      }}
    >
      <Search
        size={16}
        strokeWidth={1.8}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 'var(--space-3)',
          color: 'var(--color-text-muted)',
          pointerEvents: 'none',
        }}
      />
      <input
        ref={inputRef}
        role="searchbox"
        aria-label={ariaLabel}
        value={draft}
        onChange={event => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          width: '100%',
          minHeight: 'max(var(--touch-target-min, 0px), 40px)',
          padding: '0 var(--space-10) 0 var(--space-10)',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid var(--color-border)',
          background: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-body)',
          outline: 'none',
          boxShadow: 'var(--shadow-xs)',
        }}
        {...props}
      />
      {draft ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={clearSearch}
          style={{
            position: 'absolute',
            right: 'var(--space-2)',
            display: 'inline-grid',
            placeItems: 'center',
            width: '30px',
            minWidth: 'max(var(--touch-target-min, 0px), 30px)',
            height: '30px',
            minHeight: 'max(var(--touch-target-min, 0px), 30px)',
            border: 0,
            borderRadius: 'var(--radius-sm)',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={15} strokeWidth={1.8} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
