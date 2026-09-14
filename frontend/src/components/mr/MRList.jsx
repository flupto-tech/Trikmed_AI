'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, Star, Clock, MoreHorizontal,
  ShieldOff, Pencil, Trash2, User, Loader2, AlertCircle,
} from 'lucide-react'
import api from '../../services/api'

const NAVY = '#0F2342'

function statusBadge(status) {
  if (status === 'blocked') return { bg: '#FFF1F2', color: '#E11D48', label: 'Blocked' }
  return { bg: '#ECFDF5', color: '#065F46', label: 'Active' }
}

function Stars({ rating }) {
  if (!rating) return <span style={{ fontSize: '12px', color: '#9CA3AF' }}>—</span>
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
      <Star size={12} style={{ fill: '#F59E0B', color: '#F59E0B' }} />
      <span style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>{Number(rating).toFixed(1)}</span>
    </span>
  )
}

function RowMenu({ mr, onEdit, onBlock, onDelete }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        style={{
          padding: '6px', borderRadius: '8px', border: 'none',
          background: 'transparent', cursor: 'pointer',
          color: '#9CA3AF', display: 'flex', alignItems: 'center',
        }}
      >
        <MoreHorizontal size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute', right: 0, zIndex: 20, marginTop: '4px',
                width: '160px', background: 'white', borderRadius: '10px',
                border: '1px solid #E5E7EB', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                overflow: 'hidden', padding: '4px 0',
              }}
            >
              {[
                { label: 'Edit',   icon: Pencil,   color: '#374151', action: onEdit   },
                { label: mr.status === 'blocked' ? 'Unblock' : 'Block', icon: ShieldOff, color: '#374151', action: onBlock },
              ].map(item => (
                <button key={item.label}
                  onClick={e => { e.stopPropagation(); setOpen(false); item.action?.(mr) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', fontSize: '13px', color: item.color, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                >
                  <item.icon size={13} style={{ color: '#9CA3AF' }} />
                  {item.label}
                </button>
              ))}
              <div style={{ height: '1px', background: '#F3F4F6', margin: '4px 0' }} />
              <button
                onClick={e => { e.stopPropagation(); setOpen(false); onDelete?.(mr) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', fontSize: '13px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
              >
                <Trash2 size={13} /> Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function MRList({ search = '', onRowClick, onEdit, onBlock, onDelete, refreshTrigger }) {
  const [mrs,     setMrs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchMrs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get('/mr')
      setMrs(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.detail || err?.message || 'Failed to load MRs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMrs()
  }, [fetchMrs, refreshTrigger])

  // Client-side search filter
  const filtered = mrs.filter(mr => {
    const q = search.toLowerCase()
    return !q
      || String(mr.full_name || '').toLowerCase().includes(q)
      || String(mr.phone || '').includes(q)
      || String(mr.company_name || '').toLowerCase().includes(q)
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', gap: '10px', color: '#6B7280' }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '14px' }}>Loading MRs…</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', gap: '12px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={22} style={{ color: '#E11D48' }} />
        </div>
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#4B5563', textAlign: 'center' }}>{error}</p>
        <button
          onClick={fetchMrs}
          style={{ fontSize: '13px', color: NAVY, fontWeight: 600, background: 'none', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', gap: '12px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={22} style={{ color: '#9CA3AF' }} />
        </div>
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#4B5563' }}>
          {search ? 'No MRs match your search' : 'No MRs added yet'}
        </p>
        {!search && (
          <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Tap "Add MR" to register your first medical representative.</p>
        )}
      </div>
    )
  }

  return (
    <div>
      <AnimatePresence initial={false}>
        {filtered.map((mr, i) => {
          const badge = statusBadge(mr.status)
          const lastVisit = mr.last_visit_at
            ? new Date(mr.last_visit_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            : null

          return (
            <motion.div
              key={mr.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, delay: i * 0.03 }}
              onClick={() => onRowClick?.(mr)}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '10px',
                border: '1px solid #F3F4F6',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              {/* Top row: avatar + name + company + menu */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px',
                  borderRadius: '10px',
                  background: '#EEF2FF',
                  color: NAVY,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '700', fontSize: '14px',
                  flexShrink: 0,
                }}>
                  {(mr.full_name || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#0F2342', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mr.full_name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mr.company_name}{mr.designation ? ` · ${mr.designation}` : ''}
                  </div>
                </div>
                <div onClick={e => e.stopPropagation()}>
                  <RowMenu mr={mr} onEdit={onEdit} onBlock={onBlock} onDelete={onDelete} />
                </div>
              </div>

              {/* Bottom row: status + rating + phone + last visit */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: badge.bg,
                  color: badge.color,
                }}>
                  {badge.label}
                </span>

                <Stars rating={mr.avg_rating} />

                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9CA3AF' }}>
                  <Phone size={11} />
                  {mr.phone}
                </span>

                {lastVisit && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9CA3AF', marginLeft: 'auto' }}>
                    <Clock size={11} />
                    {lastVisit}
                  </span>
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
