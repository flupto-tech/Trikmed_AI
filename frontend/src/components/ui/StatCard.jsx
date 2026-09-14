'use client'
import { useEffect, useRef, useState } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import Badge from './Badge'
import Skeleton from './Skeleton'

/**
 * KPI card with icon, value, trend, and loading state.
 *
 * @param {object} props
 * @param {Function} props.icon
 * @param {string} props.label
 * @param {string|number} props.value
 * @param {string} [props.color]
 * @param {string} [props.prefix]
 * @param {string} [props.suffix]
 * @param {'up'|'down'} [props.trend]
 * @param {string|number} [props.trendValue]
 * @param {string} [props.badge]
 * @param {Function} [props.onClick]
 * @param {boolean} [props.loading]
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  color = 'var(--color-blue)',
  prefix = '',
  suffix = '',
  trend,
  trendValue,
  badge,
  onClick,
  loading = false,
  className = '',
  style = {},
}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current || visible) return undefined
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.35 })

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [visible])

  if (loading) {
    return (
      <div
        className={['tm-stat-card-enter', className].filter(Boolean).join(' ')}
        style={{
          display: 'grid',
          gap: 'var(--space-4)',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-lg)',
          border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-sm)',
          ...style,
        }}
      >
        <Skeleton variant="circle" width="44px" height="44px" />
        <Skeleton variant="text" width="45%" />
        <Skeleton variant="text" width="70%" height="var(--text-h2)" />
      </div>
    )
  }

  const TrendIcon = trend === 'down' ? ArrowDownRight : ArrowUpRight
  const trendVariant = trend === 'down' ? 'red' : 'green'

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={['tm-stat-card-enter', 'tm-card-motion', className].filter(Boolean).join(' ')}
      data-interactive={onClick ? 'true' : undefined}
      style={{
        display: 'grid',
        gap: 'var(--space-4)',
        width: '100%',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-lg)',
        border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
        borderLeft: `3px solid ${color}`,
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-sm)',
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
        ...style,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <span
          aria-hidden="true"
          style={{
            display: 'grid',
            placeItems: 'center',
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
            color,
          }}
        >
          {Icon ? <Icon size={22} strokeWidth={1.8} /> : null}
        </span>
        {badge ? <Badge variant="blue" size="sm">{badge}</Badge> : null}
      </span>
      <span style={{ display: 'grid', gap: 'var(--space-1)' }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-h2)',
            fontWeight: 600,
            lineHeight: 1.15,
            color: 'var(--color-text-primary)',
          }}
        >
          {visible ? `${prefix}${value}${suffix}` : `${prefix}0${suffix}`}
        </span>
      </span>
      {trend && trendValue !== undefined ? (
        <Badge variant={trendVariant} type="subtle">
          <TrendIcon size={12} strokeWidth={1.8} aria-hidden="true" />
          {trendValue}
        </Badge>
      ) : null}
    </button>
  )
}
