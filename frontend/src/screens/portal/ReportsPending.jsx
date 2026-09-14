'use client'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from '../../utils/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ClipboardCheck, Upload, CheckCircle, Lock } from 'lucide-react'
import { getReviewsPending, daysAgo } from '../../../lib/reviews'
import { getSession } from '../../utils/auth'
import ReportsUploadModal from '../../components/portal/ReportsUploadModal'

const C = {
  page:   '#F4F5F7',
  card:   '#FFFFFF',
  border: '#E4E6EB',
  text:   '#0F2342',
  muted:  '#6B7A9A',
  teal:   '#0D9488',
  amber:  '#D97706',
  green:  '#16A34A',
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }) {
  const map = {
    uploaded: { label: 'Reports Added',   bg: '#DCFCE7', color: '#166534', border: '#BBF7D0', emoji: '📷' },
    awaiting: { label: 'Awaiting Reports', bg: '#F3F4F6', color: '#374151', border: '#E5E7EB', emoji: '📋' },
    manual:   { label: 'Manual Review',    bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', emoji: '✋' },
  }
  const s = map[status] || map.awaiting
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:8, fontSize:12, fontWeight:600, background:s.bg, color:s.color, border:`1px solid ${s.border}`, whiteSpace:'nowrap' }}>
      {s.emoji} {s.label}
    </span>
  )
}

const FILTERS = ['All', 'Reports Added', 'Awaiting', 'Today', 'This Week']

function checkAccess(clinicRole) {
  if (clinicRole === 'owner' || clinicRole === 'doctor_owner') return true
  try {
    const cfg = JSON.parse(localStorage.getItem('trikmed.clinic.config') || '{}')
    const saved = cfg.rolePerms?.[clinicRole]?.canViewReportsPending
    if (saved !== undefined) return saved
  } catch {}
  return ['owner', 'doctor_owner', 'doctor', 'receptionist'].includes(clinicRole)
}

export default function ReportsPending() {
  const navigate  = useNavigate()
  const session   = getSession()
  const role      = session?.clinic_role || 'receptionist'

  if (!checkAccess(role)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.page, gap: 12 }}>
        <Lock size={36} color="#D3D1C7"/>
        <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Access Restricted</p>
        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>You don't have permission to view Reports Pending.</p>
      </div>
    )
  }

  const [entries,       setEntries]       = useState([])
  const [search,        setSearch]        = useState('')
  const [filter,        setFilter]        = useState('All')
  const [uploadModal,   setUploadModal]   = useState(null)
  const [page,          setPage]          = useState(1)
  const PER_PAGE = 50

  const refresh = useCallback(() => setEntries(getReviewsPending()), [])

  useEffect(() => {
    refresh()
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [refresh])

  const todayStr  = new Date().toISOString().split('T')[0]
  const weekStart = (() => {
    const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().split('T')[0]
  })()

  const filtered = useMemo(() => {
    let list = entries.filter(e => !e.completedAt)

    if (filter === 'Reports Added') list = list.filter(e => e.reportsStatus === 'uploaded')
    else if (filter === 'Awaiting')  list = list.filter(e => e.reportsStatus === 'awaiting')
    else if (filter === 'Today')     list = list.filter(e => e.consultationDate === todayStr)
    else if (filter === 'This Week') list = list.filter(e => e.consultationDate >= weekStart)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(e =>
        e.patientName?.toLowerCase().includes(q) ||
        e.patientPhone?.includes(q)
      )
    }

    return list.sort((a, b) => new Date(b.markedForReviewAt) - new Date(a.markedForReviewAt))
  }, [entries, filter, search, todayStr, weekStart])

  const paginated = filtered.slice(0, page * PER_PAGE)
  const hasMore   = filtered.length > paginated.length

  function handleRowClick(entry) {
    if (role === 'doctor' || role === 'doctor_owner') {
      navigate(`/portal/rx/review/${entry.id}`)
    } else if (role === 'receptionist') {
      setUploadModal(entry)
    }
  }

  const pendingCount   = entries.filter(e => !e.completedAt).length
  const uploadedCount  = entries.filter(e => !e.completedAt && e.reportsStatus === 'uploaded').length
  const awaitingCount  = entries.filter(e => !e.completedAt && e.reportsStatus === 'awaiting').length

  return (
    <div style={{ background: C.page, minHeight: '100vh', fontFamily: "'Segoe UI',Inter,sans-serif", color: C.text }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '20px 24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Reports Pending</h1>
            <p style={{ fontSize: 13, color: C.muted, margin: '3px 0 0' }}>
              Patients who left for tests and are returning for final consultation
            </p>
          </div>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Pending',  value: pendingCount,  bg: '#F3F4F6', color: C.muted },
              { label: 'Reports Added', value: uploadedCount, bg: '#DCFCE7', color: '#166534' },
              { label: 'Awaiting', value: awaitingCount, bg: '#FFFBEB', color: '#92400E' },
            ].map(s => (
              <div key={s.label} style={{ padding: '8px 14px', borderRadius: 10, background: s.bg, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: s.color, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '0 14px', background: '#fff', maxWidth: 400 }}>
          <Search size={15} color={C.muted}/>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by patient name or phone…"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: C.text, padding: '10px 0', background: 'transparent', fontFamily: 'inherit' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 0, display: 'flex' }}>×</button>
          )}
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1) }}
              style={{
                padding: '6px 14px', borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid',
                background:   filter === f ? C.teal : '#fff',
                color:        filter === f ? '#fff' : '#374151',
                borderColor:  filter === f ? C.teal : '#D1D5DB',
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: '20px 24px' }}>
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: '60px 24px', textAlign: 'center' }}>
            <ClipboardCheck size={40} color={C.muted} style={{ margin: '0 auto 12px' }}/>
            <p style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: '0 0 6px' }}>No patients pending review</p>
            <p style={{ fontSize: 13, color: C.muted, margin: 0, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
              Doctor will mark patients who need follow-up after tests from the OPD Console.
            </p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            {/* Table header — desktop */}
            <div className="hidden md:grid" style={{ display: 'grid', gridTemplateColumns: '1fr 130px 120px 80px 160px 1fr', gap: 12, padding: '10px 18px', background: '#F7F9FF', borderBottom: `1px solid ${C.border}` }}>
              {['Patient', 'Phone', 'Visit Date', 'Days Ago', 'Status', 'Action'].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.muted }}>{h}</span>
              ))}
            </div>

            <AnimatePresence initial={false}>
              {paginated.map((entry, i) => {
                const days = daysAgo(entry.consultationDate)
                const isDoctor = role === 'doctor' || role === 'doctor_owner'
                const isReceptionist = role === 'receptionist' || role === 'doctor_owner'

                return (
                  <motion.div key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    style={{ borderBottom: `1px solid ${C.border}` }}>
                    {/* Desktop row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 120px 80px 160px 1fr', gap: 12, padding: '14px 18px', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => handleRowClick(entry)}
                      onMouseEnter={e => e.currentTarget.style.background = '#F7F9FF'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                      {/* Patient */}
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{entry.patientName}</div>
                        {entry.testsRecommended && (
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Tests: {entry.testsRecommended}</div>
                        )}
                        {entry.diagnosis?.length > 0 && (
                          <div style={{ fontSize: 11, color: '#6366F1', marginTop: 1 }}>
                            Dx: {entry.diagnosis.join(', ')}
                          </div>
                        )}
                      </div>

                      <span style={{ fontSize: 13, color: C.muted, fontFamily: 'monospace' }}>
                        {entry.patientPhone || '—'}
                      </span>

                      <span style={{ fontSize: 13, color: C.text }}>{fmtDate(entry.consultationDate)}</span>

                      <span style={{ fontSize: 13, fontWeight: 600, color: days === 0 ? C.green : days <= 3 ? C.amber : '#E84C3D' }}>
                        {days === 0 ? 'Today' : `${days}d`}
                      </span>

                      <StatusBadge status={entry.reportsStatus}/>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                        {isReceptionist && (
                          <button onClick={() => setUploadModal(entry)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #0D9488', background: '#F0FDFA', color: '#0D9488', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            <Upload size={11}/> Add Reports
                          </button>
                        )}
                        {isDoctor && (
                          <button onClick={() => navigate(`/portal/rx/review/${entry.id}`)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #1A5CB5', background: '#EFF6FF', color: '#1A5CB5', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            <CheckCircle size={11}/> Open Consult
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mobile card */}
                    <div className="md:hidden" style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{entry.patientName}</div>
                          <div style={{ fontSize: 12, color: C.muted }}>{entry.patientPhone} · {fmtDate(entry.consultationDate)}</div>
                        </div>
                        <StatusBadge status={entry.reportsStatus}/>
                      </div>
                      {entry.testsRecommended && (
                        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Tests: {entry.testsRecommended}</div>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        {isReceptionist && (
                          <button onClick={() => setUploadModal(entry)}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 8, border: '1.5px solid #0D9488', background: '#F0FDFA', color: '#0D9488', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            <Upload size={12}/> Add Reports
                          </button>
                        )}
                        {isDoctor && (
                          <button onClick={() => navigate(`/portal/rx/review/${entry.id}`)}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 8, border: '1.5px solid #1A5CB5', background: '#EFF6FF', color: '#1A5CB5', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            <CheckCircle size={12}/> Open Consult
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {hasMore && (
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <button onClick={() => setPage(p => p + 1)}
                  style={{ padding: '8px 24px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', color: C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Load more ({filtered.length - paginated.length} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload modal */}
      <AnimatePresence>
        {uploadModal && (
          <ReportsUploadModal
            entry={uploadModal}
            onClose={() => setUploadModal(null)}
            onSaved={() => { setUploadModal(null); refresh() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
