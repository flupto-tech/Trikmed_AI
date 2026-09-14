'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Users, Calendar, Clock, BarChart2, X, FlaskConical } from 'lucide-react'
import MRList        from '../../components/mr/MRList'
import AddMRDialog   from '../../components/mr/AddMRDialog'
import MRTodayQueue  from '../../components/mr/MRTodayQueue'
import MRUpcoming    from '../../components/mr/MRUpcoming'
import MRAnalytics   from '../../components/mr/MRAnalytics'
import SampleInventory from '../../components/mr/SampleInventory'
import BackButton    from '../../components/ui/BackButton'
import api           from '../../services/api'

const NAVY = '#0F2342'

const TABS = [
  { key: 'all',       label: 'All MRs',       icon: Users        },
  { key: 'today',     label: "Today's Queue",  icon: Clock        },
  { key: 'upcoming',  label: 'Upcoming',       icon: Calendar     },
  { key: 'analytics', label: 'Analytics',      icon: BarChart2    },
  { key: 'samples',   label: 'Samples',        icon: FlaskConical },
]

// ── MR Detail drawer ──────────────────────────────────────────────────────────
function MRDetailDrawer({ mr, onClose }) {
  useEffect(() => {
    if (!mr) return
    const fn = e => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [mr, onClose])

  return (
    <AnimatePresence>
      {mr && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', justifyContent: 'flex-end' }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'relative', zIndex: 10,
              width: '360px', maxWidth: '100vw',
              background: 'white',
              borderLeft: '1px solid #E5E7EB',
              height: '100vh',
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.1)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '52px', height: '52px',
                borderRadius: '12px',
                background: '#EEF2FF',
                color: '#0F2342',
                fontSize: '18px',
                fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {(mr.full_name || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '18px', fontWeight: '700', color: '#0F2342', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mr.full_name}</p>
                <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mr.company_name}</p>
              </div>
              <button
                onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: '8px', border: 'none', background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', flexShrink: 0 }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Stats row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              background: '#F9FAFB',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <div>
                <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500', marginBottom: '4px' }}>Total Visits</p>
                <p style={{ fontSize: '22px', fontWeight: '700', color: '#0F2342' }}>{mr.total_visits ?? 0}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500', marginBottom: '4px' }}>Avg Rating</p>
                <p style={{ fontSize: '22px', fontWeight: '700', color: '#0F2342' }}>
                  {mr.avg_rating ? Number(mr.avg_rating).toFixed(1) + ' ★' : '—'}
                </p>
              </div>
            </div>

            {/* Info fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <InfoField label="Phone"       value={mr.phone} />
              {mr.email       && <InfoField label="Email"       value={mr.email} />}
              {mr.designation && <InfoField label="Designation" value={mr.designation} />}
              {mr.territory   && <InfoField label="Territory"   value={mr.territory} />}
            </div>

            {/* Visit history placeholder */}
            <div style={{
              background: '#F0F4FF',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
              color: '#6B7280',
              fontSize: '13px',
            }}>
              Recent visit history — coming soon
            </div>

            {/* Edit button */}
            <button style={{
              background: '#0F2342',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              width: '100%',
              marginTop: 'auto',
              fontFamily: 'inherit',
            }}>
              Edit Profile
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function InfoField({ label, value }) {
  return (
    <div style={{
      background: '#F9FAFB',
      borderRadius: '10px',
      padding: '12px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}>
      <p style={{ fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ fontSize: '14px', fontWeight: '500', color: '#0F2342' }}>{value}</p>
    </div>
  )
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      paddingBottom: '4px',
      marginBottom: '16px',
      WebkitOverflowScrolling: 'touch',
    }}>
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              whiteSpace: 'nowrap',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              fontFamily: 'inherit',
              background: isActive ? NAVY    : '#F3F4F6',
              color:      isActive ? '#fff'  : '#6B7280',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ── Search bar ────────────────────────────────────────────────────────────────
function SearchBar({ value, onChange }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '12px 16px',
      marginBottom: '16px',
      border: '1px solid #E5E7EB',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <Search size={16} style={{ color: '#9CA3AF', flexShrink: 0 }} />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search name, phone, company…"
        style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px', fontFamily: 'inherit', color: '#1F2937', background: 'transparent' }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', padding: 0 }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

const contentVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0,      transition: { duration: 0.12 } },
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MRManagerPage() {
  const [tab,            setTab]            = useState('all')
  const [rawSearch,      setRawSearch]      = useState('')
  const [search,         setSearch]         = useState('')
  const [addOpen,        setAddOpen]        = useState(false)
  const [detailMR,       setDetailMR]       = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const debounceRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(rawSearch), 300)
    return () => clearTimeout(debounceRef.current)
  }, [rawSearch])

  const handleTabChange = useCallback(key => {
    setTab(key)
    setRawSearch('')
    setSearch('')
  }, [])

  const refresh = useCallback(() => setRefreshTrigger(n => n + 1), [])

  const handleBlock = useCallback(async mr => {
    const reason = window.prompt(
      mr.status === 'blocked'
        ? 'Unblocking MR — confirm?'
        : 'Reason for blocking this MR (required):'
    )
    if (reason === null) return  // cancelled
    try {
      if (mr.status === 'blocked') {
        await api.post(`/mr/${mr.id}/unblock`)
      } else {
        if (!reason.trim()) { alert('A reason is required to block an MR.'); return }
        await api.post(`/mr/${mr.id}/block`, { blocked_reason: reason.trim() })
      }
      refresh()
    } catch (err) {
      alert(err?.detail || err?.message || 'Action failed')
    }
  }, [refresh])

  const handleDelete = useCallback(async mr => {
    if (!window.confirm(`Delete ${mr.full_name}? This cannot be undone.`)) return
    try {
      await api.delete(`/mr/${mr.id}`)
      refresh()
    } catch (err) {
      alert(err?.detail || err?.message || 'Delete failed')
    }
  }, [refresh])

  return (
    <main style={{ padding: '16px', background: '#F9FAFB', minHeight: '100vh' }}>
      <BackButton />

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0F2342' }}>MR Manager</h1>
        <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
          Manage medical representatives visiting your clinic
        </p>
      </div>

      {/* Tabs */}
      <TabBar active={tab} onChange={handleTabChange} />

      {/* Search */}
      {tab === 'all' && (
        <SearchBar value={rawSearch} onChange={setRawSearch} />
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} variants={contentVariants} initial="initial" animate="animate" exit="exit">
          {tab === 'all' && (
            <MRList
              search={search}
              refreshTrigger={refreshTrigger}
              onRowClick={setDetailMR}
              onEdit={() => {}}
              onBlock={handleBlock}
              onDelete={handleDelete}
            />
          )}
          {tab === 'today'     && <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #F3F4F6', padding: '16px' }}><MRTodayQueue /></div>}
          {tab === 'upcoming'  && <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #F3F4F6', padding: '16px' }}><MRUpcoming /></div>}
          {tab === 'analytics' && <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #F3F4F6', padding: '16px' }}><MRAnalytics /></div>}
          {tab === 'samples'   && <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #F3F4F6', padding: '16px' }}><SampleInventory /></div>}
        </motion.div>
      </AnimatePresence>

      {/* Fixed Add MR button */}
      {tab !== 'samples' && (
        <button
          onClick={() => setAddOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0F2342',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 20px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(15,35,66,0.3)',
            zIndex: 50,
            fontFamily: 'inherit',
          }}
        >
          <Plus size={18} /> Add MR
        </button>
      )}

      {/* Modals */}
      <AddMRDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => {
          setAddOpen(false)
          refresh()
        }}
      />
      <MRDetailDrawer mr={detailMR} onClose={() => setDetailMR(null)} />
    </main>
  )
}
