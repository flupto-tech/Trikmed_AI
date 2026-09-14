'use client'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '../../../utils/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, X, CheckCircle, Printer, MessageCircle, ChevronDown,
  AlertTriangle, ZoomIn, FileText, IndianRupee, Bookmark,
} from 'lucide-react'
import { getPatient, savePrescription, finalizePrescription, getPatientPrescriptions, initDemoDataIfNeeded } from '../../../../lib/rxStorage'
import { getReviewById, finalizeReview, daysAgo } from '../../../../lib/reviews'
import { getFeeConfig } from '../../../../lib/fees'
import { savePayment } from '../../../../lib/payments'
import { COMMON_DIAGNOSES, COMMON_TESTS, QUICK_INSTRUCTIONS_EN } from '../../../../lib/mockData'
import { Button } from '../../../components/ui/Button'
import MedicineSearch from '../../../components/rx/MedicineSearch'
import MedicineRow from '../../../components/rx/MedicineRow'

const C = {
  page:   '#F4F5F7',
  card:   '#FFFFFF',
  border: '#E4E6EB',
  text:   '#0F2342',
  muted:  '#6B7A9A',
  coral:  '#E84C3D',
  blue:   '#1A5CB5',
  green:  '#16A34A',
  amber:  '#D97706',
  teal:   '#0D9488',
  surface:'#F8F9FA',
}

function initials(name = '') { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?' }
function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Diagnosis input ──────────────────────────────────────────────────────────
function DiagnosisInput({ values, onChange }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])
  const filtered = COMMON_DIAGNOSES.filter(d => d.toLowerCase().includes(q.toLowerCase()) && !values.includes(d)).slice(0, 8)
  function add(d) { if (!values.includes(d)) onChange([...values, d]); setQ('') }
  function addRaw() { if (q.trim() && !values.includes(q.trim())) { onChange([...values, q.trim()]); setQ('') } }
  return (
    <div ref={ref} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', position: 'relative' }}>
      {values.map(d => (
        <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: C.coral, color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
          {d}
          <button onClick={() => onChange(values.filter(v => v !== d))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'rgba(255,255,255,.8)' }}><X size={11}/></button>
        </span>
      ))}
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', border: `1.5px dashed ${C.muted}`, borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12, color: C.muted, fontFamily: 'inherit' }}>
        <Plus size={11}/>Add
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.12)', width: 280, overflow: 'hidden' }}>
          <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}` }}>
            <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRaw() } if (e.key === 'Escape') setOpen(false) }}
              placeholder="Search or type diagnosis…"
              style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 8px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}/>
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filtered.length > 0 ? filtered.map(d => (
              <button key={d} onClick={() => { add(d); setOpen(false) }}
                style={{ display: 'block', width: '100%', padding: '8px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = C.surface}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                {d}
              </button>
            )) : (
              <div style={{ padding: '10px 12px', fontSize: 12, color: C.muted }}>
                {q ? `Press Enter to add "${q}"` : 'Type to search…'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Photo Viewer Modal ───────────────────────────────────────────────────────
function PhotoViewer({ photos, initialIndex, onClose }) {
  const [idx, setIdx] = useState(initialIndex)
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
        <img src={photos[idx].dataUrl} alt={photos[idx].filename}
          style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8 }}/>
        <button onClick={onClose} style={{ position: 'absolute', top: -14, right: -14, width: 30, height: 30, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14}/></button>
      </div>
      {photos.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {photos.map((p, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setIdx(i) }}
              style={{ width: 48, height: 48, borderRadius: 6, overflow: 'hidden', border: i === idx ? '2px solid #5EEAD4' : '2px solid transparent', background: 'none', cursor: 'pointer', padding: 0 }}>
              <img src={p.dataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({ defaultAmount, patientName, onConfirm, onClose }) {
  const [amount, setAmount] = useState(String(defaultAmount))
  const [mode,   setMode]   = useState('cash')
  const valid = amount && parseInt(amount, 10) > 0
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .95 }}
        style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 360, boxShadow: '0 8px 40px rgba(0,0,0,.18)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Review Visit Payment</div>
            <div style={{ fontSize: 12, color: C.muted }}>{patientName}</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}><X size={13}/></button>
        </div>
        <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Amount</label>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: 15, fontWeight: 600 }}>₹</span>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px 10px 28px', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            autoFocus onKeyDown={e => e.key === 'Enter' && valid && onConfirm(parseInt(amount, 10), mode)}/>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[150, 200, 300].map(v => (
            <button key={v} onClick={() => setAmount(String(v))}
              style={{ flex: 1, padding: '6px', borderRadius: 8, border: `1px solid ${C.border}`, background: parseInt(amount) === v ? C.text : C.surface, color: parseInt(amount) === v ? '#fff' : C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              ₹{v}
            </button>
          ))}
        </div>
        <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Mode</label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {['cash','upi','card'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1.5px solid ${mode === m ? C.teal : C.border}`, background: mode === m ? '#F0FDFA' : '#fff', color: mode === m ? C.teal : C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
              {m === 'cash' ? '💵 Cash' : m === 'upi' ? '📱 UPI' : '💳 Card'}
            </button>
          ))}
        </div>
        <Button onClick={() => valid && onConfirm(parseInt(amount, 10), mode)} disabled={!valid} style={{ width: '100%' }}>
          Confirm ₹{valid ? amount : '—'}
        </Button>
      </motion.div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function ReviewConsult({ reviewId, doctorId = 'dr001' }) {
  const navigate = useNavigate()
  useEffect(() => { initDemoDataIfNeeded() }, [])

  const [review,       setReview]       = useState(null)
  const [patient,      setPatient]      = useState(null)
  const [pastVisits,   setPastVisits]   = useState([])
  const [notFound,     setNotFound]     = useState(false)

  // Form state
  const [diagnosis,          setDiagnosis]          = useState([])
  const [medicines,          setMedicines]           = useState([])
  const [tests,              setTests]               = useState([])
  const [instructionTags,    setInstructionTags]     = useState([])
  const [instructionFreeText] = useState('')
  const [followUp,           setFollowUp]            = useState('')
  const [doctorNote,         setDoctorNote]          = useState('')

  // UI state
  const [saving,            setSaving]          = useState(false)
  const [, setShowCustomModal]  = useState(false)
  const [showTestDrop,      setShowTestDrop]     = useState(false)
  const [showMoreInstr,     setShowMoreInstr]    = useState(false)
  const [photoViewer,       setPhotoViewer]      = useState(null) // { index }
  const [paymentModal,      setPaymentModal]     = useState(false)
  const [toast,             setToast]            = useState(null)
  const testDropRef = useRef(null)

  const [fees,   setFees]   = useState(null)

  useEffect(() => {
    setFees(getFeeConfig())
  }, [])

  useEffect(() => {
    const entry = getReviewById(reviewId)
    if (!entry) { setNotFound(true); return }
    if (entry.completedAt) { navigate('/portal/reports-pending'); return }
    setReview(entry)
    const pt = entry.patientId ? getPatient(entry.patientId) : null
    setPatient(pt)
    if (pt) setPastVisits(getPatientPrescriptions(pt.id).slice(0, 4))
    // Pre-fill diagnosis from original
    if (entry.diagnosis?.length) setDiagnosis(entry.diagnosis)
  }, [reviewId])

  useEffect(() => {
    const h = e => { if (testDropRef.current && !testDropRef.current.contains(e.target)) setShowTestDrop(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3500) }

  function buildRx() {
    const instrEn = [...instructionTags, instructionFreeText].filter(Boolean).join('. ')
    return {
      patientId:      patient?.id,     patientName:    patient?.name || '',
      patientAge:     patient?.age || '', patientGender: patient?.gender || '',
      patientPhone:   patient?.phone || '', doctorId,
      diagnosis, medicines, tests,
      instructions:  { en: instrEn, hi: '' },
      followUp,
      followUpDate: (() => {
        if (!followUp || followUp === 'SOS') return null
        const d = new Date()
        if (followUp === '3 days')   d.setDate(d.getDate() + 3)
        else if (followUp === '1 week')  d.setDate(d.getDate() + 7)
        else if (followUp === '2 weeks') d.setDate(d.getDate() + 14)
        else if (followUp === '1 month') d.setMonth(d.getMonth() + 1)
        return d.toISOString()
      })(),
      doctorNote,
      status: 'finalized',
      date: new Date().toISOString(),
      reviewId: review?.id,
    }
  }

  async function handleFinalize(paymentAmount = null, paymentMode = null) {
    if (!patient) return
    setSaving(true)
    const rx      = buildRx()
    const saved   = savePrescription(rx)
    const final   = finalizePrescription(saved.id)
    finalizeReview(review.id, (final || saved).id)

    if (paymentAmount && paymentMode) {
      savePayment({
        patientId:       patient.id,
        appointmentId:   review.originalConsultationId || '',
        date:            new Date().toISOString().split('T')[0],
        amount:          paymentAmount,
        mode:            paymentMode,
        status:          'paid',
        consultationType:'followup',
      })
    }
    setSaving(false)
    showToast('Review consultation completed')
    setTimeout(() => navigate(`/portal/rx/${(final || saved).id}`), 1200)
  }

  function handleSaveAndFinalize() {
    if (!fees || !review) return
    const days = daysAgo(review.consultationDate)
    if (days <= fees.followUpWindowDays) {
      // Free — within follow-up window
      handleFinalize(null, null)
    } else {
      setPaymentModal(true)
    }
  }

  function toggleTest(t) { setTests(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]) }
  function toggleInstr(t) { setInstructionTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]) }
  function addMedicine(m) { if (medicines.find(x => x.id === m.id)) return; setMedicines(prev => [...prev, m]) }
  function updateMedicine(i, m) { setMedicines(prev => prev.map((x, j) => j === i ? m : x)) }
  function removeMedicine(i) { setMedicines(prev => prev.filter((_, j) => j !== i)) }

  const INSTR_QUICK = QUICK_INSTRUCTIONS_EN.slice(0, 6)
  const INSTR_MORE  = QUICK_INSTRUCTIONS_EN.slice(6)
  const fupOptions  = ['3 days', '1 week', '2 weeks', '1 month', 'SOS']
  const photos      = review?.reportsUploaded || []
  const hasReports  = photos.length > 0
  const daysSince   = review ? daysAgo(review.consultationDate) : 0
  const isFreeVisit = fees && daysSince <= fees.followUpWindowDays

  if (notFound) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.page }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>Review entry not found</div>
          <button onClick={() => navigate('/portal/reports-pending')}
            style={{ padding: '8px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontSize: 13, color: C.text, fontFamily: 'inherit' }}>
            Back to Reports Pending
          </button>
        </div>
      </div>
    )
  }

  if (!review || !patient) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Loading…</div>
  }

  return (
    <div style={{ background: C.page, minHeight: '100vh', fontFamily: "'Segoe UI',Inter,sans-serif", color: C.text }}>

      {/* Review visit banner */}
      <div style={{ background: 'linear-gradient(135deg,#0D9488,#0891B2)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Bookmark size={16} color="#fff"/>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>REVIEW VISIT — {patient.name}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', marginLeft: 12 }}>
            Original consultation: {fmtDate(review.consultationDate)} · {daysSince === 0 ? 'Today' : `${daysSince} day${daysSince > 1 ? 's' : ''} ago`}
          </span>
        </div>
        {isFreeVisit !== null && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: isFreeVisit ? 'rgba(22,163,74,.25)' : 'rgba(217,119,6,.25)', color: isFreeVisit ? '#A7F3D0' : '#FDE68A', border: `1px solid ${isFreeVisit ? 'rgba(22,163,74,.4)' : 'rgba(217,119,6,.4)'}` }}>
            {isFreeVisit ? 'FREE (within window)' : `Chargeable — ₹${fees?.followUpFee || 150}`}
          </span>
        )}
        <button onClick={() => navigate('/portal/reports-pending')}
          style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          ← Back to list
        </button>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto', minHeight: 'calc(100vh - 96px)' }}>

        {/* Left sidebar */}
        <div style={{ width: 210, flexShrink: 0, background: '#fff', borderRight: `1px solid ${C.border}`, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Patient */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 15, fontWeight: 700, color: '#fff' }}>
              {initials(patient.name)}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{patient.name}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{patient.age && `${patient.age}y`} {patient.gender && `· ${patient.gender}`}</div>
            {patient.phone && <div style={{ fontSize: 12, color: C.muted }}>{patient.phone}</div>}
          </div>

          {/* Original context */}
          <div style={{ background: '#F0FDFA', borderRadius: 8, padding: '10px 12px', border: '1px solid #99F6E4' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#0D9488', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Original Visit</div>
            {review.diagnosis?.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Diagnosis</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{review.diagnosis.join(', ')}</div>
              </div>
            )}
            {review.testsRecommended && (
              <div>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Tests ordered</div>
                <div style={{ fontSize: 12, color: C.text }}>{review.testsRecommended}</div>
              </div>
            )}
            {review.notes && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Notes</div>
                <div style={{ fontSize: 11, color: C.text, fontStyle: 'italic', lineHeight: 1.5 }}>"{review.notes}"</div>
              </div>
            )}
          </div>

          {/* Original vitals */}
          {review.vitals && Object.keys(review.vitals).length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Original Vitals</div>
              {[['BP', 'bp'], ['Pulse', 'pulse'], ['Temp', 'temp'], ['Weight', 'weight']].map(([lbl, k]) => review.vitals[k] ? (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: C.muted }}>{lbl}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{review.vitals[k]}</span>
                </div>
              ) : null)}
            </div>
          )}

          {/* Past visits */}
          {pastVisits.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Recent visits</div>
              {pastVisits.slice(0, 3).map(v => (
                <div key={v.id} style={{ padding: '6px 8px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface, marginBottom: 5, cursor: v.diagnosis?.length ? 'pointer' : 'default' }}
                  onClick={() => v.diagnosis?.length && setDiagnosis(prev => [...new Set([...prev, ...(v.diagnosis || [])])])}>
                  <div style={{ fontSize: 10, color: C.muted }}>{fmtDate(v.date)}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{v.diagnosis?.join(', ') || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right form */}
        <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 90 }}>

          {/* Reports section */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1.5px solid ${hasReports ? '#0D9488' : C.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: hasReports ? '#0D9488' : C.muted, textTransform: 'uppercase', letterSpacing: '.06em', flex: 1 }}>
                Test Reports {hasReports ? `(${photos.length} uploaded)` : ''}
              </span>
              {review.reportsStatus === 'manual' && (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}>Manual Review</span>
              )}
            </div>

            {hasReports ? (
              <div style={{ padding: '12px 14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  {photos.map((p, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}`, cursor: 'zoom-in' }}
                      onClick={() => setPhotoViewer({ index: i })}>
                      <img src={p.dataUrl} alt={p.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.0)', transition: 'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,.3)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,.0)'}>
                        <ZoomIn size={16} color="#fff" style={{ opacity: 0.8 }}/>
                      </div>
                    </div>
                  ))}
                </div>
                {photos[0]?.uploadedBy && (
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
                    Uploaded by {photos[0].uploadedBy} on {fmtDate(photos[0].uploadedAt)}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={18} color={C.muted}/>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>No digital reports — check paper reports patient is carrying</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {review.reportsStatus === 'manual' ? 'Patient marked for manual review by receptionist.' : 'Reports not yet uploaded by receptionist.'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Diagnosis */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Diagnosis</div>
            <DiagnosisInput values={diagnosis} onChange={setDiagnosis}/>
          </div>

          {/* Medicines */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', flex: 1 }}>Medicines</span>
            </div>
            {medicines.map((m, i) => (
              <MedicineRow key={m.id || i} medicine={m} index={i} doctorId={doctorId}
                onChange={v => updateMedicine(i, v)} onRemove={() => removeMedicine(i)}/>
            ))}
            <div style={{ padding: '10px 14px', borderTop: medicines.length > 0 ? `1px solid ${C.border}` : 'none' }}>
              <MedicineSearch doctorId={doctorId} onSelect={addMedicine} onAddCustom={() => setShowCustomModal(true)}/>
            </div>
          </div>

          {/* Tests / Labs */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Tests / Labs</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {tests.map(t => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '4px 12px', fontSize: 12, color: C.blue, fontWeight: 600 }}>
                  {t}
                  <button onClick={() => toggleTest(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#93C5FD' }}><X size={10}/></button>
                </span>
              ))}
              <div ref={testDropRef} style={{ position: 'relative' }}>
                <button onClick={() => setShowTestDrop(d => !d)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', border: `1.5px dashed ${C.border}`, borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12, color: C.muted, fontFamily: 'inherit' }}>
                  <Plus size={11}/>Add test
                </button>
                {showTestDrop && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 200, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.12)', width: 220, maxHeight: 280, overflowY: 'auto' }}>
                    {COMMON_TESTS.filter(t => !tests.includes(t)).map(t => (
                      <button key={t} onClick={() => { toggleTest(t); setShowTestDrop(false) }}
                        style={{ display: 'block', width: '100%', padding: '8px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = C.surface}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em' }}>Instructions</span>
              <button onClick={() => setShowMoreInstr(m => !m)} style={{ fontSize: 11, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                {showMoreInstr ? 'Less' : 'More'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {(showMoreInstr ? QUICK_INSTRUCTIONS_EN : INSTR_QUICK).map(t => {
                const active = instructionTags.includes(t)
                return (
                  <button key={t} onClick={() => toggleInstr(t)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 11px', border: `1px solid ${active ? C.blue : C.border}`, borderRadius: 8, fontSize: 12, cursor: 'pointer', background: active ? '#EFF6FF' : '#fff', color: active ? C.blue : C.muted, fontFamily: 'inherit', fontWeight: active ? 600 : 400 }}>
                    {active ? null : <Plus size={10}/>}{t}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Follow-up */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Follow-up</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {fupOptions.map(o => {
                const active = followUp === o
                return (
                  <button key={o} onClick={() => setFollowUp(active ? '' : o)}
                    style={{ padding: '6px 18px', border: `1.5px solid ${active ? C.blue : C.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer', background: active ? C.blue : '#fff', color: active ? '#fff' : C.text, fontWeight: active ? 700 : 400, fontFamily: 'inherit', transition: 'all .1s' }}>
                    {o}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Doctor note */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 7 }}>Doctor's Note <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(private)</span></div>
            <textarea value={doctorNote} onChange={e => setDoctorNote(e.target.value)} rows={2}
              placeholder="Clinical notes, reminders…"
              style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 7, padding: '7px 10px', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', background: C.surface, color: C.text }}/>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${C.border}`, padding: '10px 20px', display: 'flex', gap: 8, alignItems: 'center', zIndex: 100, boxShadow: '0 -2px 12px rgba(0,0,0,.06)' }}>
        {isFreeVisit !== null && (
          <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: isFreeVisit ? '#DCFCE7' : '#FFFBEB', color: isFreeVisit ? '#166534' : '#92400E', fontWeight: 600 }}>
            {isFreeVisit ? '✓ Free visit' : `₹${fees?.followUpFee || 150} chargeable`}
          </span>
        )}
        <div style={{ flex: 1 }}/>
        <button onClick={() => navigate('/portal/reports-pending')}
          style={{ padding: '8px 18px', border: `1px solid ${C.border}`, borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.text }}>
          Cancel
        </button>
        <Button onClick={handleSaveAndFinalize} disabled={saving || !patient} icon={CheckCircle}>
          {saving ? 'Saving…' : isFreeVisit ? 'Save & Finalize (Free)' : `Save & Finalize`}
        </Button>
      </div>

      {/* Photo viewer */}
      <AnimatePresence>
        {photoViewer && (
          <PhotoViewer photos={photos} initialIndex={photoViewer.index} onClose={() => setPhotoViewer(null)}/>
        )}
      </AnimatePresence>

      {/* Payment modal */}
      <AnimatePresence>
        {paymentModal && (
          <PaymentModal
            defaultAmount={fees?.followUpFee || 150}
            patientName={patient?.name || ''}
            onConfirm={(amount, mode) => { setPaymentModal(false); handleFinalize(amount, mode) }}
            onClose={() => setPaymentModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div key="toast" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            style={{ position: 'fixed', bottom: 76, left: '50%', transform: 'translateX(-50%)', background: '#0F2342', color: '#fff', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 24px rgba(0,0,0,.18)', zIndex: 200, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <CheckCircle size={14} style={{ color: '#4ade80' }}/>{toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
