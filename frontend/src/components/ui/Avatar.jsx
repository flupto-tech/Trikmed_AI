'use client'
import { createElement } from 'react'
import { User } from 'lucide-react'

const SIZE_STYLES = {
  xs: { width: '24px', height: '24px', fontSize: 'var(--text-2xs)' },
  sm: { width: '30px', height: '30px', fontSize: 'var(--text-xs)' },
  md: { width: '36px', height: '36px', fontSize: 'var(--text-sm)' },
  lg: { width: '44px', height: '44px', fontSize: 'var(--text-body)' },
  xl: { width: '56px', height: '56px', fontSize: 'var(--text-h4)' },
}

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'TM'
}

/**
 * User or clinic avatar with image, initials, or icon fallback.
 *
 * @param {object} props
 * @param {string} [props.name]
 * @param {string} [props.src]
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} [props.size]
 * @param {'circle'|'rounded'} [props.shape]
 * @param {Function} [props.icon]
 */
export default function Avatar({
  name = '',
  src,
  alt,
  size = 'md',
  shape = 'circle',
  icon = User,
  className = '',
  style = {},
}) {
  const dimensions = SIZE_STYLES[size] ?? SIZE_STYLES.md
  const radius = shape === 'rounded' ? 'var(--radius-md)' : 'var(--radius-full)'

  return (
    <span
      className={className}
      style={{
        display: 'inline-grid',
        placeItems: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        borderRadius: radius,
        background: 'var(--color-navy)',
        color: 'var(--color-text-inverse)',
        border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        lineHeight: 1,
        ...dimensions,
        ...style,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt ?? name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : name ? (
        <span aria-hidden={alt ? undefined : 'true'}>{getInitials(name)}</span>
      ) : (
        createElement(icon, { size: size === 'xl' ? 24 : 16, strokeWidth: 1.8, 'aria-hidden': 'true' })
      )}
    </span>
  )
}
