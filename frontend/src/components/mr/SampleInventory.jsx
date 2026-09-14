'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, FlaskConical, X, ChevronDown, ChevronUp,
  Trash2, Search,
} from 'lucide-react'
import { getVisits, addVisit, getBrandHistory, saveBrandHistory, cutoffDate } from '../../../lib/samples'
import { showToast } from '../ui/Toast'
import api from '../../services/api'

// ── Design tokens ──────────────────────────────────────────────────────────────
const NAVY   = '#0F2342'
const BORDER = '#E5E7EB'
const MUTED  = '#6B7280'
const BG     = '#F9FAFB'
const RED    = '#E5402B'
const MAX_DRUGS = 20

const DATE_RANGES = [
  { label: 'Last 7 days',  days: 7  },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'All time',     days: 0  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
const todayISO  = () => new Date().toISOString().slice(0, 10)
const uid       = () => Math.random().toString(36).slice(2, 11)
const emptyDrug = () => ({ _id: uid(), brandName: '', quantity: '1', batchNumber: '', expiryDate: '' })

function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d} ${mo[Number(m) - 1]} ${y}`
}

// Shared inline-style base for inputs / selects
const f = (extra = {}) => ({
  height: 36, borderRadius: 8, padding: '0 10px',
  border: `1px solid ${BORDER}`, fontSize: 13,
  color: NAVY, outline: 'none', background: '#fff',
  boxSizing: 'border-box', fontFamily: 'inherit',
  width: '100%', ...extra,
})

function FieldLabel({ text, required }) {
  return (
    <label style={{ fontSize: 11, fontWeight: 600, color: MUTED, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {text}{required && <span style={{ color: RED, marginLeft: 2 }}>*</span>}
    </label>
  )
}

// ── Single drug row inside the form ───────────────────────────────────────────
function DrugRow({ drug, isLast, isOnly, brandHistory, brandRefs, onChange, onRemove, onAddNext }) {
  const listId = `bl-${drug._id}`

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(170px,1fr) 64px 106px 124px 32px',
      gap: 6,
      alignItems: 'center',
      minWidth: 520,
      padding: '5px 0',
      borderBottom: `1px solid #F3F4F6`,
    }}>
      {/* Brand + datalist autocomplete */}
      <div style={{ position: 'relative' }}>
        <input
          ref={el => { if (el) brandRefs.current[drug._id] = el }}
          list={listId}
          value={drug.brandName}
          onChange={e => onChange(drug._id, 'brandName', e.target.value)}
          placeholder="Drug brand…"
          style={f()}
        />
        <datalist id={listId}>
          {brandHistory.slice(0, 50).map(b => <option key={b} value={b} />)}
        </datalist>
      </div>

      {/* Quantity — Enter on last row adds new row */}
      <input
        type="number" min={1} step={1}
        value={drug.quantity}
        onChange={e => {
          const v = parseInt(e.target.value, 10)
          onChange(drug._id, 'quantity', isNaN(v) || v < 1 ? '1' : String(v))
        }}
        onKeyDown={e => { if (e.key === 'Enter' && isLast) { e.preventDefault(); onAddNext() } }}
        style={f({ textAlign: 'center', paddingLeft: 4, paddingRight: 4 })}
      />

      {/* Batch # */}
      <input
        value={drug.batchNumber}
        onChange={e => onChange(drug._id, 'batchNumber', e.target.value)}
        placeholder="Batch…"
        style={f()}
      />

      {/* Expiry */}
      <input
        type="date"
        value={drug.expiryDate}
        onChange={e => onChange(drug._id, 'expiryDate', e.target.value)}
        style={f()}
      />

      {/* Remove */}
      <button
        onClick={() => onRemove(drug._id)}
        disabled={isOnly}
        title={isOnly ? 'Need at least one drug' : 'Remove row'}
        style={{
          width: 30, height: 30, borderRadius: 6, border: 'none', cursor: isOnly ? 'not-allowed' : 'pointer',
          background: isOnly ? 'transparent' : '#FFF1F2',
          color: isOnly ? '#D1D5DB' : '#E11D48',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'background 0.15s',
        }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ── Log Visit modal ────────────────────────────────────────────────────────────
function LogVisitModal({ onClose, onSaved }) {
  const [mrId,       setMrId]       = useState('')
  const [visitDate,  setVisitDate]  = useState(todayISO())
  const [visitNotes, setVisitNotes] = useState('')
  const [drugs,      setDrugs]      = useState([emptyDrug()])
  const [errors,     setErrors]     = useState({})
  const [saving,     setSaving]     = useState(false)
  const [brandHistory, setBrandHistory] = useState([])
  const [mrList,     setMrList]     = useState([])
  const brandRefs = useRef({})

  useEffect(() => {
    setBrandHistory(getBrandHistory())
    api.get('/mr').then(data => setMrList(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  useEffect(() => {
    const fn = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  function updateDrug(id, field, value) {
    setDrugs(prev => prev.map(d => d._id === id ? { ...d, [field]: value } : d))
  }

  function removeDrug(id) {
    setDrugs(prev => prev.filter(d => d._id !== id))
  }

  function addDrug() {
    if (drugs.length >= MAX_DRUGS) return
    const d = emptyDrug()
    setDrugs(prev => [...prev, d])
    // focus the brand field of the newly added row after render
    setTimeout(() => brandRefs.current[d._id]?.focus(), 50)
  }

  function handleSave() {
    // Filter out rows with no brand name
    const filled = drugs.filter(d => d.brandName.trim())

    const e = {}
    if (!mrId)            e.mrId      = 'Select an MR'
    if (!visitDate)       e.visitDate = 'Visit date is required'
    if (filled.length === 0)  e.drugs = 'Add at least one drug with a brand name'
    else if (filled.some(d => Number(d.quantity) < 1)) e.drugs = 'All drugs need quantity ≥ 1'

    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    const mr = mrList.find(m => String(m.id) === mrId)

    const drugEntries = filled.map(d => ({
      brandName: d.brandName.trim(),
      quantity:  Number(d.quantity),
      ...(d.batchNumber.trim() ? { batchNumber: d.batchNumber.trim() } : {}),
      ...(d.expiryDate         ? { expiryDate:  d.expiryDate         } : {}),
    }))

    addVisit({
      mrId, mrName: mr?.full_name ?? mrId,
      visitDate, visitNotes: visitNotes.trim(),
      drugs: drugEntries,
    })
    saveBrandHistory(drugEntries.map(d => d.brandName))

    const n = drugEntries.length
    showToast(`Visit logged with ${n} drug${n !== 1 ? 's' : ''}`, 'success')
    setSaving(false)
    onSaved()
    onClose()
  }

  const filledCount = drugs.filter(d => d.brandName.trim()).length

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(4px)' }}
        onClick={onClose} />

      {/* Sheet */}
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative', zIndex: 10,
          background: '#fff', borderRadius: 16,
          width: '100%', maxWidth: 620,
          maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
        }}
      >
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '17px 20px 15px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FlaskConical size={16} style={{ color: NAVY }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>Log Sample Visit</span>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
            <X size={14} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>

          {/* Visit-level fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <FieldLabel text="MR" required />
              <div style={{ position: 'relative' }}>
                <select value={mrId} onChange={e => { setMrId(e.target.value); setErrors(v => ({ ...v, mrId: undefined })) }}
                  style={{ ...f(), paddingRight: 28, appearance: 'none', cursor: 'pointer', borderColor: errors.mrId ? RED : BORDER, color: mrId ? NAVY : MUTED }}>
                  <option value="" disabled>Select MR…</option>
                  {mrList.map(mr => (
                    <option key={mr.id} value={String(mr.id)}>{mr.full_name} — {mr.company_name}</option>
                  ))}
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: MUTED, pointerEvents: 'none' }} />
              </div>
              {errors.mrId && <p style={{ fontSize: 11, color: RED, marginTop: 4 }}>{errors.mrId}</p>}
            </div>

            <div>
              <FieldLabel text="Visit Date" required />
              <input type="date" value={visitDate}
                onChange={e => { setVisitDate(e.target.value); setErrors(v => ({ ...v, visitDate: undefined })) }}
                style={f({ borderColor: errors.visitDate ? RED : BORDER })} />
              {errors.visitDate && <p style={{ fontSize: 11, color: RED, marginTop: 4 }}>{errors.visitDate}</p>}
            </div>
          </div>

          {/* Drugs section */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <FieldLabel text={`Drugs Sampled`} required />
                {errors.drugs && <p style={{ fontSize: 11, color: RED, marginTop: 2 }}>{errors.drugs}</p>}
              </div>
              <span style={{ fontSize: 11, color: MUTED }}>
                {drugs.length}/{MAX_DRUGS} rows · Enter in Qty adds next row
              </span>
            </div>

            {/* Column headers */}
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(170px,1fr) 64px 106px 124px 32px', gap: 6, minWidth: 520, paddingBottom: 6, marginBottom: 2 }}>
                {['Drug Brand', 'Qty', 'Batch #', 'Expiry (opt)', ''].map(h => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</span>
                ))}
              </div>

              {/* Drug rows */}
              <div style={{ overflowX: 'auto' }}>
                {drugs.map((drug, i) => (
                  <DrugRow
                    key={drug._id}
                    drug={drug}
                    isLast={i === drugs.length - 1}
                    isOnly={drugs.length === 1}
                    brandHistory={brandHistory}
                    brandRefs={brandRefs}
                    onChange={updateDrug}
                    onRemove={removeDrug}
                    onAddNext={addDrug}
                  />
                ))}
              </div>
            </div>

            {/* Add row button */}
            {drugs.length < MAX_DRUGS && (
              <button onClick={addDrug}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  marginTop: 10, padding: '6px 14px', borderRadius: 8,
                  border: `1.5px dashed ${BORDER}`, background: 'transparent',
                  color: MUTED, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.color = NAVY }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED }}
              >
                <Plus size={13} /> Add another drug
              </button>
            )}
          </div>

          {/* Visit notes */}
          <div>
            <FieldLabel text="Visit Notes" />
            <textarea
              value={visitNotes}
              onChange={e => setVisitNotes(e.target.value)}
              placeholder="Anything notable about this visit…"
              rows={2}
              style={{ ...f(), height: 'auto', padding: '8px 10px', resize: 'vertical', lineHeight: '1.5' }}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ flex: '0 0 auto', height: 40, padding: '0 20px', borderRadius: 10, border: `1.5px solid ${BORDER}`, background: '#fff', color: NAVY, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 1, height: 40, borderRadius: 10, border: 'none', background: NAVY, color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
            {saving ? 'Saving…' : `Save Visit${filledCount > 0 ? ` (${filledCount} drug${filledCount !== 1 ? 's' : ''})` : ''}`}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Expandable visit row ───────────────────────────────────────────────────────
function VisitRow({ visit }) {
  const [expanded, setExpanded] = useState(false)
  const totalQty = visit.drugs.reduce((s, d) => s + d.quantity, 0)

  return (
    <>
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'grid',
          gridTemplateColumns: '108px 1fr 64px 64px 1.4fr 30px',
          gap: 12, minWidth: 560,
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: expanded ? 'none' : `1px solid ${BG}`,
          cursor: 'pointer',
          background: expanded ? '#F0F4FF' : '#fff',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = BG }}
        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = expanded ? '#F0F4FF' : '#fff' }}
      >
        <span style={{ fontSize: 12, color: MUTED, whiteSpace: 'nowrap' }}>{formatDate(visit.visitDate)}</span>

        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: NAVY, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{visit.mrName}</p>
        </div>

        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 20, background: '#EEF2FF', color: NAVY, borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
          {visit.drugs.length}
        </span>

        <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{totalQty}</span>

        <span style={{ fontSize: 12, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {visit.visitNotes || '—'}
        </span>

        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: MUTED }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>

      {/* Drug detail expansion */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden', borderBottom: `1px solid ${BORDER}` }}
          >
            <div style={{ background: '#F8FAFF', padding: '10px 16px 16px 28px', overflowX: 'auto' }}>
              {/* Drug mini-table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 100px 110px', gap: 8, minWidth: 400, paddingBottom: 7, marginBottom: 2, borderBottom: `1px solid ${BORDER}` }}>
                {['Drug Brand', 'Qty', 'Batch #', 'Expiry'].map(h => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                ))}
              </div>
              {visit.drugs.map((d, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 52px 100px 110px', gap: 8, minWidth: 400, padding: '7px 0', borderBottom: i < visit.drugs.length - 1 ? `1px solid ${BG}` : 'none', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: NAVY, fontWeight: 500 }}>{d.brandName}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{d.quantity}</span>
                  <span style={{ fontSize: 12, color: MUTED }}>{d.batchNumber || '—'}</span>
                  <span style={{ fontSize: 12, color: MUTED }}>{d.expiryDate ? formatDate(d.expiryDate) : '—'}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Visit log table ────────────────────────────────────────────────────────────
function VisitTable({ visits }) {
  if (visits.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 16px', gap: 12 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FlaskConical size={24} style={{ color: '#9CA3AF' }} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, color: '#4B5563', textAlign: 'center' }}>No sample visits logged yet.</p>
        <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>Click "Log Samples" to start tracking.</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
      {/* Header row */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '108px 1fr 64px 64px 1.4fr 30px', gap: 12, minWidth: 560, padding: '10px 16px', background: BG, borderBottom: `1px solid ${BORDER}` }}>
          {['Date', 'MR', 'Drugs', 'Total Qty', 'Notes', ''].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</span>
          ))}
        </div>
      </div>
      {/* Data rows */}
      <div style={{ overflowX: 'auto' }}>
        {visits.map(v => <VisitRow key={v.id} visit={v} />)}
      </div>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function SampleInventory() {
  const [visits,      setVisits]      = useState([])
  const [modalOpen,   setModalOpen]   = useState(false)
  const [mrFilter,    setMrFilter]    = useState('all')
  const [rangeDays,   setRangeDays]   = useState(30)
  const [brandSearch, setBrandSearch] = useState('')
  const [mrList,      setMrList]      = useState([])

  const load = useCallback(() => setVisits(getVisits()), [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    api.get('/mr').then(data => setMrList(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const cutoff = rangeDays > 0 ? cutoffDate(rangeDays) : null

  const filtered = visits.filter(v => {
    if (mrFilter !== 'all' && v.mrId !== mrFilter) return false
    if (cutoff && v.visitDate < cutoff) return false
    if (brandSearch) {
      const q = brandSearch.toLowerCase()
      return v.drugs.some(d => d.brandName.toLowerCase().includes(q))
    }
    return true
  })

  const sel = {
    height: 34, borderRadius: 8, padding: '0 10px',
    border: `1px solid ${BORDER}`, background: '#fff',
    fontSize: 13, color: NAVY, outline: 'none', cursor: 'pointer',
    fontFamily: 'inherit',
  }

  return (
    <div>
      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* MR filter */}
          <select value={mrFilter} onChange={e => setMrFilter(e.target.value)} style={sel}>
            <option value="all">All MRs</option>
            {mrList.map(mr => <option key={mr.id} value={String(mr.id)}>{mr.full_name}</option>)}
          </select>

          {/* Date range */}
          <select value={rangeDays} onChange={e => setRangeDays(Number(e.target.value))} style={sel}>
            {DATE_RANGES.map(r => <option key={r.days} value={r.days}>{r.label}</option>)}
          </select>

          {/* Drug brand search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, color: MUTED, pointerEvents: 'none' }} />
            <input
              value={brandSearch}
              onChange={e => setBrandSearch(e.target.value)}
              placeholder="Search drug brand…"
              style={{ ...sel, paddingLeft: 28, width: 170, cursor: 'text' }}
            />
            {brandSearch && (
              <button onClick={() => setBrandSearch('')}
                style={{ position: 'absolute', right: 7, background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center', padding: 2 }}>
                <X size={12} />
              </button>
            )}
          </div>

          <span style={{ fontSize: 12, color: MUTED, whiteSpace: 'nowrap' }}>
            {filtered.length} {filtered.length === 1 ? 'visit' : 'visits'}
          </span>
        </div>

        <button onClick={() => setModalOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: NAVY, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Plus size={14} /> Log Samples
        </button>
      </div>

      {/* ── Visit log ── */}
      <VisitTable visits={filtered} />

      {/* ── Modal ── */}
      <AnimatePresence>
        {modalOpen && <LogVisitModal onClose={() => setModalOpen(false)} onSaved={load} />}
      </AnimatePresence>
    </div>
  )
}
