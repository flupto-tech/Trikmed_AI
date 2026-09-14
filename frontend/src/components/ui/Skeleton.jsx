'use client'

const VARIANT_STYLES = {
  text: {
    height: 'var(--text-body)',
    width: '100%',
    borderRadius: 'var(--radius-sm)',
  },
  rect: {
    width: '100%',
    height: 'var(--space-12)',
    borderRadius: 'var(--radius-md)',
  },
  circle: {
    width: 'var(--space-10)',
    height: 'var(--space-10)',
    borderRadius: 'var(--radius-full)',
  },
  card: {
    width: '100%',
    minHeight: '128px',
    borderRadius: 'var(--radius-lg)',
  },
}

/**
 * Shimmer placeholder primitive for loading layouts.
 *
 * @param {object} props
 * @param {'text'|'rect'|'circle'|'card'} [props.variant]
 * @param {string|number} [props.width]
 * @param {string|number} [props.height]
 * @param {string} [props.borderRadius]
 */
export default function Skeleton({
  variant = 'rect',
  width,
  height,
  borderRadius,
  className = '',
  style = {},
  ...props
}) {
  return (
    <span
      aria-hidden="true"
      className={['tm-skeleton', className].filter(Boolean).join(' ')}
      style={{
        display: 'block',
        background: 'linear-gradient(90deg, var(--color-border) 0%, var(--color-surface-subtle) 50%, var(--color-border) 100%)',
        backgroundSize: '200% 100%',
        ...(VARIANT_STYLES[variant] ?? VARIANT_STYLES.rect),
        ...(width !== undefined ? { width } : {}),
        ...(height !== undefined ? { height } : {}),
        ...(borderRadius ? { borderRadius } : {}),
        ...style,
      }}
      {...props}
    />
  )
}
