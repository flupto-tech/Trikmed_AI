'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function getPages(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)
  const pages = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)
  if (start > 2) pages.push('start-ellipsis')
  for (let page = start; page <= end; page += 1) pages.push(page)
  if (end < totalPages - 1) pages.push('end-ellipsis')
  pages.push(totalPages)
  return pages
}

function PageButton({ children, active = false, disabled = false, ariaLabel, onClick }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-current={active ? 'page' : undefined}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'inline-grid',
        placeItems: 'center',
        minWidth: 'max(var(--touch-target-min, 0px), 34px)',
        height: '34px',
        minHeight: 'max(var(--touch-target-min, 0px), 34px)',
        padding: '0 var(--space-2)',
        borderRadius: 'var(--radius-md)',
        border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
        background: active ? 'var(--color-navy)' : 'var(--color-surface)',
        color: active ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  )
}

/**
 * Pagination control.
 *
 * @param {object} props
 * @param {number} props.currentPage
 * @param {number} props.totalPages
 * @param {(page: number) => void} props.onPageChange
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showLabel = true,
  className = '',
  style = {},
}) {
  const safePage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1))
  const pages = getPages(safePage, totalPages)

  return (
    <nav
      aria-label="Pagination"
      className={className}
      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', ...style }}
    >
      <PageButton
        ariaLabel="Go to previous page"
        disabled={safePage <= 1}
        onClick={() => onPageChange?.(safePage - 1)}
      >
        <ChevronLeft size={16} strokeWidth={1.8} aria-hidden="true" />
      </PageButton>
      {pages.map(page => (
        typeof page === 'number' ? (
          <PageButton
            key={page}
            active={page === safePage}
            ariaLabel={`Go to page ${page}`}
            onClick={() => onPageChange?.(page)}
          >
            {page}
          </PageButton>
        ) : (
          <span key={page} aria-hidden="true" style={{ color: 'var(--color-text-muted)', padding: '0 var(--space-1)' }}>
            ...
          </span>
        )
      ))}
      <PageButton
        ariaLabel="Go to next page"
        disabled={safePage >= totalPages}
        onClick={() => onPageChange?.(safePage + 1)}
      >
        <ChevronRight size={16} strokeWidth={1.8} aria-hidden="true" />
      </PageButton>
      {showLabel ? (
        <span style={{ marginLeft: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Page {safePage} of {totalPages}
        </span>
      ) : null}
    </nav>
  )
}
