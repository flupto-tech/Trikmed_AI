'use client'
import { Children, cloneElement, isValidElement } from 'react'

/**
 * Groups filter chips with single-select or multi-select behaviour.
 *
 * @param {object} props
 * @param {string|string[]} props.value
 * @param {(value: string|string[]) => void} props.onChange
 * @param {'single'|'multiple'} [props.type]
 */
export function FilterChipGroup({
  value,
  onChange,
  type = 'single',
  children,
  className = '',
  style = {},
  'aria-label': ariaLabel = 'Filters',
}) {
  const selectedValues = Array.isArray(value) ? value : value !== undefined ? [value] : []

  function handleSelect(nextValue) {
    if (type === 'multiple') {
      const exists = selectedValues.includes(nextValue)
      const nextValues = exists
        ? selectedValues.filter(item => item !== nextValue)
        : [...selectedValues, nextValue]
      onChange?.(nextValues)
      return
    }

    onChange?.(nextValue)
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={className}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 'var(--space-2)',
        ...style,
      }}
    >
      {Children.map(children, child => {
        if (!isValidElement(child)) return child
        const childValue = child.props.value
        return cloneElement(child, {
          isActive: selectedValues.includes(childValue),
          onClick: event => {
            child.props.onClick?.(event)
            handleSelect(childValue)
          },
        })
      })}
    </div>
  )
}

export default FilterChipGroup
