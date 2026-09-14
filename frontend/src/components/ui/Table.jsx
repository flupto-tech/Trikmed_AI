'use client'
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'

function alignStyle(align = 'left') {
  return {
    textAlign: align,
    justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
  }
}

/**
 * Semantic responsive table wrapper.
 *
 * @param {object} props
 * @param {string} [props.aria-label]
 * @param {boolean} [props.zebra]
 * @param {boolean} [props.stickyHeader]
 */
function Table({ children, className = '', style = {}, zebra = false, stickyHeader = false, ...props }) {
  return (
    <div
      className={['tm-table-enter', className].filter(Boolean).join(' ')}
      style={{
        width: '100%',
        overflowX: 'auto',
        border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
    >
      <table
        data-zebra={zebra ? 'true' : undefined}
        data-sticky-header={stickyHeader ? 'true' : undefined}
        style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '640px' }}
        {...props}
      >
        {children}
      </table>
      <style>{`
        table[data-zebra="true"] tbody tr:nth-child(even) {
          background: var(--color-surface-subtle);
          --badge-subtle-bg: var(--color-surface);
        }
        table[data-zebra="true"] tbody tr:hover {
          --badge-subtle-bg: var(--color-surface);
        }
        @media (max-width: 767px) {
          table {
            min-width: 0 !important;
            display: block;
          }
          table thead {
            display: none;
          }
          table tbody {
            display: grid;
            gap: var(--space-3);
            padding: var(--space-3);
          }
          table tbody tr {
            display: grid;
            gap: var(--space-3);
            padding: var(--space-4);
            border: calc(var(--space-0-5) / 2) solid var(--color-border);
            border-radius: var(--radius-lg);
            background: var(--color-surface);
            box-shadow: var(--shadow-xs);
          }
          table[data-zebra="true"] tbody tr:nth-child(even) {
            background: var(--color-surface);
          }
          table tbody td {
            display: grid !important;
            grid-template-columns: minmax(112px, 38%) minmax(0, 1fr);
            gap: var(--space-3);
            align-items: start;
            width: 100%;
            max-width: none !important;
            padding: 0 !important;
            border-bottom: 0 !important;
            text-align: left !important;
            justify-content: stretch !important;
            white-space: normal !important;
            overflow: visible !important;
          }
          table tbody td::before {
            content: attr(data-label);
            color: var(--color-text-muted);
            font-size: var(--text-xs);
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }
          table tbody td:not([data-label]) {
            grid-template-columns: 1fr;
          }
          table tbody td:not([data-label])::before {
            content: none;
          }
        }
      `}</style>
    </div>
  )
}

function Head({ children, className = '', style = {} }) {
  return (
    <thead className={className} style={{ background: 'var(--color-surface-subtle)', ...style }}>
      {children}
    </thead>
  )
}

function HeadCell({
  children,
  align = 'left',
  width,
  sortable = false,
  sortDirection,
  onSort,
  className = '',
  style = {},
}) {
  const SortIcon = sortDirection === 'asc' ? ChevronUp : sortDirection === 'desc' ? ChevronDown : ChevronsUpDown

  return (
    <th
      scope="col"
      aria-sort={sortable ? (sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none') : undefined}
      className={className}
      style={{
        width,
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
        color: 'var(--color-text-muted)',
        fontSize: 'var(--text-xs)',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...alignStyle(align),
        ...style,
      }}
    >
      {sortable ? (
        <button
          type="button"
          onClick={onSort}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            border: 0,
            background: 'transparent',
            color: 'inherit',
            font: 'inherit',
            cursor: 'pointer',
            textTransform: 'inherit',
            letterSpacing: 'inherit',
          }}
        >
          {children}
          <SortIcon size={13} strokeWidth={1.8} aria-hidden="true" />
        </button>
      ) : children}
    </th>
  )
}

function Body({ children, className = '', style = {} }) {
  return <tbody className={className} style={style}>{children}</tbody>
}

function Row({ children, onRowClick, className = '', style = {}, ...props }) {
  const rowBackground = style.background ?? style.backgroundColor
  const badgeSurface = rowBackground && rowBackground !== 'var(--color-surface)' && rowBackground !== 'transparent'
    ? { '--badge-subtle-bg': 'var(--color-surface)' }
    : {}
  const handleKeyDown = event => {
    if (!onRowClick) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onRowClick(event)
    }
  }

  return (
    <tr
      className={['tm-table-row-enter', className].filter(Boolean).join(' ')}
      onClick={onRowClick}
      onKeyDown={handleKeyDown}
      tabIndex={onRowClick ? 0 : undefined}
      style={{
        cursor: onRowClick ? 'pointer' : undefined,
        transition: 'background var(--duration-fast) var(--ease-out)',
        ...badgeSurface,
        ...style,
      }}
      {...props}
    >
      {children}
    </tr>
  )
}

function Cell({ children, align = 'left', mono = false, truncate = false, mobileLabel, className = '', style = {}, ...props }) {
  return (
    <td
      className={className}
      data-label={mobileLabel || props['data-label']}
      title={truncate && typeof children === 'string' ? children : undefined}
      style={{
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
        color: 'var(--color-text-primary)',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
        fontSize: mono ? 'var(--text-mono, var(--text-sm))' : 'var(--text-body)',
        verticalAlign: 'middle',
        whiteSpace: truncate ? 'nowrap' : undefined,
        overflow: truncate ? 'hidden' : undefined,
        textOverflow: truncate ? 'ellipsis' : undefined,
        maxWidth: truncate ? '240px' : undefined,
        ...alignStyle(align),
        ...style,
      }}
      {...props}
    >
      {children}
    </td>
  )
}

Table.Head = Head
Table.HeadCell = HeadCell
Table.Body = Body
Table.Row = Row
Table.Cell = Cell

export default Table
export { Table, Head, HeadCell, Body, Row, Cell }
