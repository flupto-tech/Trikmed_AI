'use client'
import { useState, useEffect } from 'react'
import { Search, Phone, MapPin, Calendar, CheckCircle, Clock, X } from 'lucide-react'
import { motion } from 'framer-motion'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { portalApi } from '../../services/portalApi'

const DS = {
  bg: '#F7F9FF',
  cardBg: '#ffffff',
  cardBorder: '#DDE4F0',
  textPrimary: '#0F2D5E',
  textMuted: '#6B7A9A',
  textSubtle: '#9DBDE8',
  accent: '#1A5CB5',
  accentMid: '#1A5CB5',
  rowHover: '#F7F9FF',
  inputBorder: '#DDE4F0',
}

const STATUS_BADGE = {
  new: { bg: '#eff6ff', color: '#1a5cb5', border: '#bfdbfe', label: 'New' },
  contacted: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: 'Contacted' },
  scheduled: { bg: '#fef3c7', color: '#92400e', border: '#fde68a', label: 'Scheduled' },
  completed: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: 'Completed' },
  failed: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca', label: 'Failed' },
}

export default function DemoRequestsList() {
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError, setPageError] = useState(null)
  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const PER = 12

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    try {
      const res = await portalApi.getDemoRequests()
      setRequests(res || [])
    } catch (e) {
      setPageError(e?.message || e?.detail || 'Failed to load demo requests')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter by search and status
  let filtered = requests
  if (status !== 'all') {
    filtered = filtered.filter(r => r.status === status)
  }
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(r =>
      r.clinic?.toLowerCase().includes(q) ||
      r.doctor?.toLowerCase().includes(q) ||
      r.city?.toLowerCase().includes(q) ||
      r.phone?.includes(q)
    )
  }

  const total = filtered.length
  const pages = Math.ceil(total / PER)
  const rows = filtered.slice((page - 1) * PER, page * PER)

  const selectStyle = {
    height: 36,
    borderRadius: 8,
    padding: '0 10px',
    border: `1px solid ${DS.inputBorder}`,
    background: '#fff',
    fontSize: 13,
    color: DS.textPrimary,
    outline: 'none',
    cursor: 'pointer',
  }

  const inputStyle = {
    height: 36,
    borderRadius: 8,
    padding: '0 12px',
    border: `1px solid ${DS.inputBorder}`,
    background: '#fff',
    fontSize: 13,
    color: DS.textPrimary,
    outline: 'none',
    width: '100%',
  }

  return (
    <div style={{ padding: '20px 24px', background: DS.bg, minHeight: '100vh' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: DS.textPrimary, margin: 0 }}>
          Demo Requests
        </h1>
        <p style={{ fontSize: 13, color: DS.textMuted, margin: '4px 0 0' }}>
          Manage incoming free demo booking requests from clinics
        </p>
      </div>

      {/* Error Banner */}
      {pageError && <ErrorBanner error={pageError} />}

      {/* Filters & Search */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr auto',
          gap: 12,
          marginBottom: 20,
          alignItems: 'flex-end',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
              color: DS.textMuted,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Search
          </label>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: DS.textSubtle,
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Clinic name, doctor, city..."
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setPage(1)
              }}
              style={{
                ...inputStyle,
                paddingLeft: 36,
              }}
              onFocus={e => (e.target.style.borderColor = DS.accentMid)}
              onBlur={e => (e.target.style.borderColor = DS.inputBorder)}
            />
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
              color: DS.textMuted,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Status
          </label>
          <select
            value={status}
            onChange={e => {
              setStatus(e.target.value)
              setPage(1)
            }}
            style={selectStyle}
            onFocus={e => (e.style.borderColor = DS.accentMid)}
            onBlur={e => (e.style.borderColor = DS.inputBorder)}
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_BADGE).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            onClick={() => loadData()}
            style={{
              height: 36,
              borderRadius: 8,
              padding: '0 16px',
              background: DS.accentMid,
              color: '#fff',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={e => (e.target.style.opacity = '0.9')}
            onMouseLeave={e => (e.target.style.opacity = '1')}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Loading */}
      {pageLoading && <LoadingSpinner />}

      {/* Table */}
      {!pageLoading && rows.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            background: DS.cardBg,
            border: `1px solid ${DS.cardBorder}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
              color: DS.textPrimary,
            }}
          >
            <thead>
              <tr style={{ background: '#f8f9fb', borderBottom: `1px solid ${DS.cardBorder}` }}>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 700,
                    color: DS.textMuted,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Clinic
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 700,
                    color: DS.textMuted,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Doctor
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 700,
                    color: DS.textMuted,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Specialty
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 700,
                    color: DS.textMuted,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Phone
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 700,
                    color: DS.textMuted,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  City
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 700,
                    color: DS.textMuted,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 700,
                    color: DS.textMuted,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Requested
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const statusBadge = STATUS_BADGE[row.status] || STATUS_BADGE.new
                const createdDate = row.created_at
                  ? new Date(row.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'N/A'

                return (
                  <tr
                    key={row.id || idx}
                    style={{
                      borderBottom: `1px solid ${DS.cardBorder}`,
                      background: idx % 2 === 1 ? '#f8f9fb' : '#fff',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = DS.rowHover)}
                    onMouseLeave={e =>
                      (e.currentTarget.style.background = idx % 2 === 1 ? '#f8f9fb' : '#fff')
                    }
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{row.clinic}</td>
                    <td style={{ padding: '12px 16px' }}>{row.doctor}</td>
                    <td style={{ padding: '12px 16px', color: DS.textMuted, fontSize: 12 }}>
                      {row.specialty}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Phone size={14} style={{ color: DS.textSubtle }} />
                      <a
                        href={`tel:${row.phone}`}
                        style={{
                          color: DS.accent,
                          textDecoration: 'none',
                          fontWeight: 500,
                        }}
                        onMouseEnter={e => (e.target.style.textDecoration = 'underline')}
                        onMouseLeave={e => (e.target.style.textDecoration = 'none')}
                      >
                        {row.phone}
                      </a>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <MapPin size={14} style={{ color: DS.textSubtle }} />
                      <span>{row.city}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          background: statusBadge.bg,
                          color: statusBadge.color,
                          border: `1px solid ${statusBadge.border}`,
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 600,
                          display: 'inline-block',
                        }}
                      >
                        {statusBadge.label}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: DS.textMuted,
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Calendar size={14} />
                      {createdDate}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Empty State */}
      {!pageLoading && rows.length === 0 && (
        <div
          style={{
            background: DS.cardBg,
            border: `1px solid ${DS.cardBorder}`,
            borderRadius: 12,
            padding: '40px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircle size={28} style={{ color: '#15803d' }} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: DS.textPrimary, margin: '0 0 4px' }}>
            No demo requests
          </h3>
          <p style={{ fontSize: 13, color: DS.textMuted, margin: 0 }}>
            {search || status !== 'all' ? 'Try adjusting your filters' : 'Demo requests will appear here'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 20,
          }}
        >
          <span style={{ fontSize: 13, color: DS.textMuted }}>
            Showing <strong>{(page - 1) * PER + 1}</strong> to{' '}
            <strong>{Math.min(page * PER, total)}</strong> of <strong>{total}</strong>
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{
                height: 36,
                width: 36,
                borderRadius: 8,
                border: `1px solid ${DS.inputBorder}`,
                background: '#fff',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                opacity: page === 1 ? 0.5 : 1,
              }}
            >
              ← Prev
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  height: 36,
                  minWidth: 36,
                  borderRadius: 8,
                  border: `1px solid ${p === page ? DS.accentMid : DS.inputBorder}`,
                  background: p === page ? DS.accentMid : '#fff',
                  color: p === page ? '#fff' : DS.textPrimary,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(pages, page + 1))}
              disabled={page === pages}
              style={{
                height: 36,
                width: 36,
                borderRadius: 8,
                border: `1px solid ${DS.inputBorder}`,
                background: '#fff',
                cursor: page === pages ? 'not-allowed' : 'pointer',
                opacity: page === pages ? 0.5 : 1,
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
