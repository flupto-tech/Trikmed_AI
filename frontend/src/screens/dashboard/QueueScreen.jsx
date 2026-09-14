'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Monitor, IndianRupee, UserCheck, CheckCircle, X,
  MessageCircle, Stethoscope, Users, AlertCircle, ExternalLink,
} from 'lucide-react'
import { appointments as rawAppts } from '../../data/mockData'
import { clinicInfo } from '../../data/mockData'
import { QUEUE_STATUS, todayStr, fmtToken, loadQueueState, saveQueueState, normalizeQueueRows } from '../../utils/queueData'
import { getCabinSettings, getActiveSlot, assignSlot } from '../../../lib/cabinSettings'
import Badge from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import Table from '../../components/ui/Table'
import { can } from '../../utils/auth'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { dashboardApi } from '../../services/dashboardApi'
import { trapFocus, getFocusableElements } from '../../components/ui/focusUtils'
// TODO: Ashutosh uncomment ↓

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 5000); return () => clearTimeout(t) }, [onDone])
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 px-4 py-3 shadow-2xl"
      style={{ background: '#0A1E40', border: '1px solid rgba(157,189,232,0.3)', maxWidth: '360px', borderRadius: '8px' }}
    >
      <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: '#25D366' }}>
        <MessageCircle size={13} className="text-white" />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-blue-400 mb-0.5">WhatsApp Sent</p>
        <p className="text-[13px] text-white/85 leading-snug">{msg}</p>
      </div>
    </motion.div>
  )
}

// ─── PaymentModal ─────────────────────────────────────────────────────────────
function PaymentModal({ patient, tokenNum, onConfirm, onClose }) {
  const dialogRef = useRef(null)
  const [amount, setAmount] = useState('')
  const valid = amount && parseInt(amount, 10) > 0

  useEffect(() => {
    const previousActiveElement = document.activeElement

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
      trapFocus(event, dialogRef.current)
    }

    document.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => getFocusableElements(dialogRef.current)[0]?.focus())

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousActiveElement && document.contains(previousActiveElement)) {
        previousActiveElement.focus?.()
      }
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="queue-payment-title"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-xs"
        style={{ background: 'var(--tm-surface,#fff)', borderRadius: '12px', padding: '28px', boxShadow: '0 8px 40px rgba(0,0,0,0.16)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 id="queue-payment-title" className="text-[18px] font-bold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>Mark as Paid</h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{fmtToken(tokenNum)} · {patient}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close payment dialog" className="w-8 h-8 flex items-center justify-center"
            style={{ background: 'var(--tm-surface2,#F7F9FF)', color: 'var(--tm-text,#2D3748)', borderRadius: '6px', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
        </div>
        <div>
          <label htmlFor="queue-payment-amount" className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>
            Payment Amount
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>₹</span>
            <input id="queue-payment-amount" type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)}
              className="ds-input" style={{ paddingLeft: '26px' }} autoFocus
              onKeyDown={e => e.key === 'Enter' && valid && onConfirm(parseInt(amount, 10))} />
          </div>
          <div className="flex gap-3 mt-3">
            {[200, 300, 500, 700].map(v => (
              <button key={v} onClick={() => setAmount(String(v))}
                className="flex-1 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
                style={{
                  background: parseInt(amount) === v ? '#0F2D5E' : '#F7F9FF',
                  color: parseInt(amount) === v ? '#fff' : 'var(--tm-text,#2D3748)',
                  border: '1px solid #DDE4F0',
                }}>₹{v}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" onClick={onClose} fullWidth>Cancel</Button>
          <Button icon={CheckCircle} onClick={() => valid && onConfirm(parseInt(amount, 10))} disabled={!valid} fullWidth>
            Confirm {valid ? `₹${amount}` : ''}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Reusable action buttons (used in both mobile card + desktop row) ─────────
function ActionCell({ appt, cabinFull, onPayment, onSendToCabin, onComplete, onCancel }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {appt.queueStatus === 'booked' && (
        <>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<IndianRupee size={14} strokeWidth={1.8} aria-hidden="true" />}
            onClick={() => onPayment(appt)}
            style={{ color: 'var(--color-warning-text)', borderColor: 'var(--color-warning-border)', background: 'var(--color-warning-bg)' }}
          >
            Mark Paid
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancel(appt.id)}
            style={{ color: 'var(--color-text-muted)', paddingInline: 'var(--space-2)' }}
          >
            Cancel
          </Button>
        </>
      )}
      {appt.queueStatus === 'paid' && (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={cabinFull ? <AlertCircle size={14} strokeWidth={1.8} aria-hidden="true" /> : <UserCheck size={14} strokeWidth={1.8} aria-hidden="true" />}
          onClick={() => onSendToCabin(appt.id)}
          disabled={!!cabinFull}
          style={{ color: 'var(--color-blue)', borderColor: 'var(--color-blue-border)', background: 'var(--color-blue-light)' }}
        >
          {cabinFull ? 'Cabin Busy' : 'Send to Cabin'}
        </Button>
      )}
      {appt.queueStatus === 'in_cabin' && can('action_complete_visit') && (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<CheckCircle size={14} strokeWidth={1.8} aria-hidden="true" />}
          onClick={() => onComplete(appt.id)}
          style={{ color: 'var(--color-blue)', borderColor: 'var(--color-blue-border)', background: 'var(--color-blue-light)' }}
        >
          Complete Visit
        </Button>
      )}
      {['completed', 'no_show', 'cancelled'].includes(appt.queueStatus) && (
        <span aria-label="No action available" style={{ color: 'var(--color-text-muted)' }}>-</span>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
function QueueSkeleton() {
  return (
    <div className="ds-page" aria-label="Queue loading" aria-busy="true" style={{ display: 'grid', gap: 'var(--space-5)', width: '100%', maxWidth: 1440, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
        <div style={{ display: 'grid', gap: 'var(--space-2)', width: 'min(520px, 100%)' }}>
          <Skeleton variant="text" height="var(--text-h2)" width="54%" />
          <Skeleton variant="text" width="42%" />
        </div>
        <Skeleton variant="rect" width="128px" height="44px" borderRadius="var(--radius-lg)" />
      </div>
      <Skeleton variant="card" height="144px" />
      <Skeleton variant="card" height="420px" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--space-3)' }}>
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant="card" height="86px" />)}
      </div>
    </div>
  )
}


function QueueMetric({ label, value, tone = 'navy' }) {
  const color = tone === 'coral' ? 'var(--color-coral)' : tone === 'blue' ? 'var(--color-blue)' : 'var(--color-navy)'

  return (
    <Card variant="flat" className="queue-metric">
      <Card.Body style={{ display: 'grid', gap: 'var(--space-1)', padding: 'var(--space-3) var(--space-4)' }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
        <strong style={{ color, fontFamily: 'var(--font-display)', fontSize: 'clamp(1.45rem, 2.2vw, 2rem)', lineHeight: 1 }}>{value}</strong>
      </Card.Body>
    </Card>
  )
}


export default function QueueScreen() {
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError,   setPageError]   = useState(null)

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    try {
      // TODO: Ashutosh uncomment ↓
      const res = await dashboardApi.getQueue()
      setAppts(normalizeQueueRows(res))
    } catch (e) {
      console.error('Failed to load queue:', e)
      setPageError(e?.message || e?.detail || 'Failed to load queue')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const TODAY = todayStr()

  const [appts,        setAppts]        = useState(() => loadQueueState(rawAppts))
  const [paymentModal, setPaymentModal] = useState(null)
  const [toasts,       setToasts]       = useState([])
  const [waLog,        setWaLog]        = useState([])
  const [currentTime,  setCurrentTime]  = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Cabin settings — read once on page load
  const { slots: maxSlots } = useMemo(() => getCabinSettings(), [])
  const parallelMode = maxSlots > 1
  const activeSlot   = useMemo(() => getActiveSlot(), [])

  // Persist to localStorage whenever state changes (LobbyDisplay reads this)
  useEffect(() => { saveQueueState(appts) }, [appts])

  // Today's appointments, sorted by token number
  const todayAppts = useMemo(() =>
    appts.filter(a => a.date === TODAY).sort((a, b) => a.tokenNum - b.tokenNum),
    [appts, TODAY]
  )

  const queueSummary = useMemo(() => {
    const inCabinAppts = []
    const paidQueue = []
    let bookedCnt = 0
    let doneCnt = 0

    todayAppts.forEach(a => {
      if (a.queueStatus === 'in_cabin') inCabinAppts.push(a)
      if (a.queueStatus === 'paid') paidQueue.push(a)
      if (a.queueStatus === 'booked') bookedCnt += 1
      if (a.queueStatus === 'completed') doneCnt += 1
    })

    const inCabin = inCabinAppts[0] || null
    return {
      inCabinAppts,
      inCabin,
      paidQueue,
      nextUp: paidQueue[0],
      waitingCnt: paidQueue.length,
      bookedCnt,
      doneCnt,
      cabinFull: parallelMode ? inCabinAppts.length >= maxSlots : !!inCabin,
    }
  }, [todayAppts, parallelMode, maxSlots])

  const { inCabinAppts, inCabin, paidQueue, nextUp, waitingCnt, bookedCnt, doneCnt, cabinFull } = queueSummary

  // ── Helpers ──
  const addToast = (msg) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, msg }])
  }
  const addWaEntry = (token, name, msg) =>
    setWaLog(prev => [{ id: Date.now(), token, name, msg, at: Date.now() }, ...prev].slice(0, 8))

  // ── Queue actions ──
  const updateAppointment = (id, changes) => {
    dashboardApi.updateAppointment(id, changes).catch(e => {
      setPageError(e?.message || e?.detail || 'Failed to update queue')
      loadData()
    })
  }

  const openPayment = (appt) => setPaymentModal({ id: appt.id, patientName: appt.patientName, tokenNum: appt.tokenNum })

  const markPaid = (id, amount) => {
    const appt = appts.find(a => a.id === id)
    if (!appt) return
    setAppts(prev => prev.map(a => a.id === id ? { ...a, queueStatus: 'paid', paymentAmount: amount } : a))
    updateAppointment(id, { queueStatus: 'paid', status: 'paid', paymentAmount: amount })
    setPaymentModal(null)
    const token = fmtToken(appt.tokenNum)
    const msg = `Your turn is coming soon. Token ${token}. Please be ready at reception.`
    addToast(`${appt.patientName.split(' ')[0]} — "${msg}"`)
    addWaEntry(token, appt.patientName, msg)
  }

  const sendToCabin = (id) => {
    if (cabinFull) return
    const appt = appts.find(a => a.id === id)
    if (!appt) return
    const slot = parallelMode ? assignSlot(inCabinAppts, maxSlots) : null
    if (parallelMode && !slot) return
    setAppts(prev => prev.map(a => a.id === id ? { ...a, queueStatus: 'in_cabin', slot: slot || null } : a))
    updateAppointment(id, { queueStatus: 'in_cabin', status: 'in_cabin', slot: slot || null })
    const nextInLine = paidQueue.find(a => a.id !== id)
    if (nextInLine) {
      const token = fmtToken(nextInLine.tokenNum)
      const msg = 'You are next. Please be ready at the reception counter.'
      addToast(`${nextInLine.patientName.split(' ')[0]} — "${msg}"`)
      addWaEntry(token, nextInLine.patientName, msg)
    }
  }

  // Send a specific patient to a specific slot (called from grey slot cards)
  const sendToSlot = (id, slot) => {
    const appt = appts.find(a => a.id === id)
    if (!appt) return
    setAppts(prev => prev.map(a => a.id === id ? { ...a, queueStatus: 'in_cabin', slot } : a))
    updateAppointment(id, { queueStatus: 'in_cabin', status: 'in_cabin', slot })
    const nextInLine = paidQueue.find(a => a.id !== id)
    if (nextInLine) {
      const token = fmtToken(nextInLine.tokenNum)
      const msg = 'You are next. Please be ready at the reception counter.'
      addToast(`${nextInLine.patientName.split(' ')[0]} — "${msg}"`)
      addWaEntry(token, nextInLine.patientName, msg)
    }
  }

  const markComplete  = (id) => {
    setAppts(prev => prev.map(a => a.id === id ? { ...a, queueStatus: 'completed' } : a))
    updateAppointment(id, { queueStatus: 'completed', status: 'completed' })
  }
  const markCancelled = (id) => {
    setAppts(prev => prev.map(a => a.id === id ? { ...a, queueStatus: 'cancelled' } : a))
    updateAppointment(id, { queueStatus: 'cancelled', status: 'cancelled' })
  }

  const dateLabel = currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const cabinSlots = useMemo(() => ['A', 'B', 'C'].slice(0, maxSlots), [maxSlots])
  const getCabinPatient = (slot) => {
    if (parallelMode) return todayAppts.find(a => a.queueStatus === 'in_cabin' && a.slot === slot)
    if (slot === 'A') return inCabin
    return todayAppts.find(a => a.queueStatus === 'in_cabin' && a.slot === slot)
  }
  const getStatusVariant = (status) => {
    if (status === 'in_cabin') return 'blue'
    if (status === 'completed') return 'green'
    if (status === 'paid') return 'yellow'
    if (status === 'cancelled' || status === 'no_show') return 'red'
    return 'default'
  }
  const rowTone = (status) => status === 'in_cabin'
    ? 'rgba(239, 246, 255, 0.86)'
    : status === 'paid'
      ? 'rgba(255, 251, 235, 0.72)'
      : 'var(--color-surface)'

  if (pageLoading) return <QueueSkeleton />
  if (pageError)   return <ErrorBanner message={pageError} onRetry={loadData} />

  return (
    <div className="ds-page queue-ops-shell">
      <style>{`
        .queue-ops-shell { display: grid; gap: var(--space-5); width: 100%; max-width: 1440px; margin: 0 auto; overflow-x: hidden; }
        .queue-ops-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: var(--space-4); }
        .queue-ops-title-row { display: flex; align-items: center; gap: var(--space-3); min-width: 0; }
        .queue-ops-icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: var(--radius-lg); background: var(--color-blue-light); color: var(--color-navy); flex-shrink: 0; }
        .queue-ops-title { margin: 0; color: var(--color-navy); font-family: var(--font-display); font-size: clamp(1.35rem, 2vw, 1.8rem); line-height: 1.15; font-weight: 800; }
        .queue-ops-subtitle { margin: var(--space-0-5) 0 0; color: var(--color-text-secondary); font-size: var(--text-sm); font-weight: 600; }
        .queue-header-actions { display: flex; align-items: center; justify-content: flex-end; gap: var(--space-2); flex-wrap: wrap; }
        .queue-clock { display: grid; gap: 0; min-width: 104px; padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); background: var(--color-surface); border: calc(var(--space-0-5) / 2) solid var(--color-border); box-shadow: var(--shadow-sm); }
        .queue-clock-time { color: var(--color-navy); font-family: var(--font-mono); font-size: var(--text-body); line-height: 1.1; font-weight: 800; }
        .queue-clock-day { color: var(--color-text-muted); font-size: 11px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; }
        .queue-cabin-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-3); }
        .queue-cabin-card { min-height: 100%; }
        .queue-cabin-body { display: grid; gap: var(--space-3); padding: var(--space-3) var(--space-4) var(--space-4); }
        .queue-cabin-patient { display: grid; grid-template-columns: auto minmax(0, 1fr); column-gap: var(--space-3); row-gap: var(--space-1); align-items: center; min-width: 0; }
        .queue-token { color: var(--color-navy); font-family: var(--font-mono); font-size: clamp(1.35rem, 2.3vw, 1.9rem); font-weight: 850; line-height: 1; letter-spacing: 0; }
        .queue-patient-name { color: var(--color-text-primary); font-size: var(--text-body); font-weight: 800; line-height: 1.2; overflow-wrap: anywhere; }
        .queue-patient-meta { color: var(--color-text-secondary); font-size: var(--text-sm); font-weight: 600; }
        .queue-patient-meta { grid-column: 1 / -1; }
        .queue-compact-empty { display: flex; align-items: center; gap: var(--space-3); min-height: 52px; padding: var(--space-2) var(--space-3); border-radius: var(--radius-lg); background: var(--color-surface-subtle); color: var(--color-text-secondary); }
        .queue-compact-empty-icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: var(--radius-md); background: var(--color-blue-light); color: var(--color-blue); flex-shrink: 0; }
        .queue-stat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--space-3); }
        .queue-work-area { display: grid; gap: var(--space-3); }
        .queue-work-card { box-shadow: var(--shadow-md); border-color: var(--color-border-strong, var(--color-border)); }
        .queue-work-header { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-4); padding: var(--space-4) var(--space-5); border-bottom: calc(var(--space-0-5) / 2) solid var(--color-border); background: var(--color-surface); }
        .queue-work-title { margin: 0; color: var(--color-navy); font-family: var(--font-display); font-size: var(--text-lg); font-weight: 800; }
        .queue-work-subtitle { margin: var(--space-1) 0 0; color: var(--color-text-secondary); font-size: var(--text-sm); font-weight: 600; }
        .queue-row { animation: queueSlideIn var(--duration-normal) var(--ease-out) both; }
        .queue-table-patient { display: grid; gap: var(--space-1); min-width: 0; }
        .queue-table-patient strong { color: var(--color-text-primary); font-weight: 750; }
        .queue-table-patient span { color: var(--color-text-muted); font-size: var(--text-sm); }
        .queue-mobile-cards { display: none; }
        .queue-mobile-card { display: grid; gap: var(--space-3); padding: var(--space-4); border: calc(var(--space-0-5) / 2) solid var(--color-border); border-left-width: 4px; border-radius: var(--radius-lg); background: var(--color-surface); box-shadow: var(--shadow-sm); }
        .queue-activity-card { overflow: hidden; }
        @keyframes queueSlideIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) { .queue-row { animation: none; } }
        @media (max-width: 1024px) {
          .queue-ops-header { grid-template-columns: 1fr; }
          .queue-header-actions { justify-content: flex-start; }
          .queue-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 720px) {
          .queue-ops-shell { gap: var(--space-4); }
          .queue-ops-title-row { align-items: flex-start; }
          .queue-ops-icon { width: 38px; height: 38px; }
          .queue-stat-grid { grid-template-columns: 1fr; }
          .queue-work-header { align-items: flex-start; flex-direction: column; }
          .queue-desktop-table { display: none; }
          .queue-mobile-cards { display: grid; gap: var(--space-3); padding: var(--space-4); background: var(--color-surface-subtle); }
        }
      `}</style>

      <header className="queue-ops-header">
        <div className="queue-ops-title-row">
          <span className="queue-ops-icon" aria-hidden="true"><Monitor size={20} strokeWidth={1.8} /></span>
          <div>
            <h1 className="queue-ops-title">Queue Screen</h1>
            <p className="queue-ops-subtitle">{clinicInfo?.name || 'Clinic'} · {dateLabel} · {todayAppts.length} appointments today</p>
          </div>
        </div>
        <div className="queue-header-actions">
          <div className="queue-clock" aria-label={`Current time ${currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}>
            <span className="queue-clock-time">{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="queue-clock-day">{currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          </div>
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Monitor size={18} strokeWidth={1.8} aria-hidden="true" />}
            rightIcon={<ExternalLink size={15} strokeWidth={1.8} aria-hidden="true" />}
            onClick={() => window.open('/lobby', '_blank', 'noopener,noreferrer')}
          >
            Lobby Display
          </Button>
        </div>
      </header>

      <section className="queue-cabin-grid" aria-label="Cabin queue controls">
        {cabinSlots.map((slot) => {
          const appt = getCabinPatient(slot)
          const isActive = activeSlot === slot
          const hasPatient = !!appt
          const nextPatient = nextUp
          const statusText = hasPatient ? (isActive ? 'Now with doctor' : 'In cabin') : 'Next patient'
          const accent = hasPatient ? 'var(--color-blue)' : 'var(--color-coral)'

          return (
            <Card key={slot} className="queue-cabin-card" style={{ borderTop: `3px solid ${accent}` }}>
              <Card.Header
                title={`Cabin ${slot}`}
                subtitle={statusText}
                action={<Badge variant={hasPatient ? 'blue' : nextPatient ? 'coral' : 'default'} size="md" type="subtle">{hasPatient ? 'Occupied' : nextPatient ? 'Ready' : 'Idle'}</Badge>}
              />
              <Card.Body className="queue-cabin-body">
                {hasPatient ? (
                  <>
                    <div className="queue-cabin-patient">
                      <span className="queue-token">{fmtToken(appt.tokenNum)}</span>
                      <strong className="queue-patient-name">{appt.patientName}</strong>
                      <span className="queue-patient-meta">{appt.reason || 'Consultation'} · {appt.time || '--'}</span>
                    </div>
                    {can('action_complete_visit') ? (
                      <Button
                        variant="secondary"
                        leftIcon={<CheckCircle size={16} strokeWidth={1.8} aria-hidden="true" />}
                        onClick={() => markComplete(appt.id)}
                        style={{ justifySelf: 'start', color: 'var(--color-blue)', borderColor: 'var(--color-blue-border)', background: 'var(--color-blue-light)' }}
                      >
                        Complete Visit
                      </Button>
                    ) : null}
                  </>
                ) : nextPatient ? (
                  <>
                    <div className="queue-cabin-patient">
                      <span className="queue-token">{fmtToken(nextPatient.tokenNum)}</span>
                      <strong className="queue-patient-name">{nextPatient.patientName}</strong>
                      <span className="queue-patient-meta">Paid · ready for consultation · {nextPatient.time || '--'}</span>
                    </div>
                    <Button
                      variant="secondary"
                      leftIcon={<UserCheck size={16} strokeWidth={1.8} aria-hidden="true" />}
                      onClick={() => (!parallelMode && slot === 'A') ? sendToCabin(nextPatient.id) : sendToSlot(nextPatient.id, slot)}
                      style={{ justifySelf: 'start', color: 'var(--color-blue)', borderColor: 'var(--color-blue-border)', background: 'var(--color-blue-light)' }}
                    >
                      Send to Cabin {slot}
                    </Button>
                  </>
                ) : (
                  <div className="queue-compact-empty">
                    <span className="queue-compact-empty-icon" aria-hidden="true"><Users size={16} strokeWidth={1.8} /></span>
                    <div>
                      <strong style={{ display: 'block', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>Cabin {slot} is ready</strong>
                      <span style={{ display: 'block', marginTop: '2px', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>No paid patients waiting</span>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          )
        })}
      </section>

      <section className="queue-work-area" aria-labelledby="queue-table-title">
        <Card className="queue-work-card" style={{ overflow: 'hidden' }}>
          <div className="queue-work-header">
            <div>
              <h2 id="queue-table-title" className="queue-work-title">Today&apos;s Queue</h2>
              <p className="queue-work-subtitle">Primary working list for payments, cabin assignment, completion, and cancellations.</p>
            </div>
            <Badge variant="blue" size="lg" type="outline">{todayAppts.length} sorted by token</Badge>
          </div>

          {todayAppts.length === 0 ? (
            <EmptyState icon={Users} title="No patients in queue" description="Patients will appear here after appointments are booked or walk-ins are added." style={{ padding: 'var(--space-8) var(--space-6)' }} />
          ) : (
            <>
              <div className="queue-desktop-table">
                <Table aria-label="Today's queue table" zebra stickyHeader style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                  <Table.Head>
                    <tr>
                      <Table.HeadCell width="110px">Token</Table.HeadCell>
                      <Table.HeadCell width="92px">Time</Table.HeadCell>
                      <Table.HeadCell>Patient</Table.HeadCell>
                      <Table.HeadCell width="130px">Payment</Table.HeadCell>
                      <Table.HeadCell width="140px">Status</Table.HeadCell>
                      <Table.HeadCell width="260px">Action</Table.HeadCell>
                    </tr>
                  </Table.Head>
                  <Table.Body>
                    <AnimatePresence initial={false}>
                      {todayAppts.map((appt, index) => {
                        const status = QUEUE_STATUS[appt.queueStatus] || QUEUE_STATUS.booked
                        const background = rowTone(appt.queueStatus)
                        return (
                          <motion.tr
                            key={appt.id}
                            layout
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.22, delay: Math.min(index * 0.012, 0.12) }}
                            className="queue-row"
                            style={{ background, borderLeft: `4px solid ${status.rowBorder}`, '--badge-subtle-bg': background === 'var(--color-surface)' ? 'var(--color-surface-subtle)' : 'var(--color-surface)' }}
                          >
                            <Table.Cell mono mobileLabel="Token" style={{ color: 'var(--color-navy)', fontWeight: 800 }}>{fmtToken(appt.tokenNum)}</Table.Cell>
                            <Table.Cell mono mobileLabel="Time">{appt.time || '--'}</Table.Cell>
                            <Table.Cell mobileLabel="Patient">
                              <div className="queue-table-patient">
                                <strong>{appt.patientName}</strong>
                                <span>{appt.patientPhone || appt.reason || 'Consultation'}</span>
                              </div>
                            </Table.Cell>
                            <Table.Cell mobileLabel="Payment">
                              {appt.paymentAmount ? (
                                <Badge variant="green" size="md" type="subtle">Rs {appt.paymentAmount}</Badge>
                              ) : (
                                <Badge variant="yellow" size="md" type="subtle">Pending</Badge>
                              )}
                            </Table.Cell>
                            <Table.Cell mobileLabel="Status">
                              <Badge variant={getStatusVariant(appt.queueStatus)} size="md" type="subtle">{status.label}</Badge>
                            </Table.Cell>
                            <Table.Cell mobileLabel="Action">
                              <ActionCell appt={appt} cabinFull={cabinFull} onPayment={openPayment} onSendToCabin={sendToCabin} onComplete={markComplete} onCancel={markCancelled} />
                            </Table.Cell>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </Table.Body>
                </Table>
              </div>

              <div className="queue-mobile-cards" aria-label="Today's queue mobile cards">
                <AnimatePresence initial={false}>
                  {todayAppts.map((appt, index) => {
                    const status = QUEUE_STATUS[appt.queueStatus] || QUEUE_STATUS.booked
                    return (
                      <motion.article
                        key={appt.id}
                        layout
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.22, delay: Math.min(index * 0.012, 0.12) }}
                        className="queue-mobile-card"
                        style={{ borderLeftColor: status.rowBorder }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                          <span className="queue-token" style={{ fontSize: 'var(--text-2xl)' }}>{fmtToken(appt.tokenNum)}</span>
                          <Badge variant={getStatusVariant(appt.queueStatus)} size="md" type="subtle">{status.label}</Badge>
                        </div>
                        <div className="queue-table-patient">
                          <strong>{appt.patientName}</strong>
                          <span>{appt.time || '--'} · {appt.patientPhone || appt.reason || 'Consultation'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                          {appt.paymentAmount ? <Badge variant="green" size="md" type="subtle">Rs {appt.paymentAmount}</Badge> : <Badge variant="yellow" size="md" type="subtle">Pending</Badge>}
                        </div>
                        <ActionCell appt={appt} cabinFull={cabinFull} onPayment={openPayment} onSendToCabin={sendToCabin} onComplete={markComplete} onCancel={markCancelled} />
                      </motion.article>
                    )
                  })}
                </AnimatePresence>
              </div>
            </>
          )}
        </Card>
      </section>

      <section className="queue-stat-grid" aria-label="Queue statistics">
        <QueueMetric label="Waiting" value={waitingCnt} tone="coral" />
        <QueueMetric label="Booked" value={bookedCnt} />
        <QueueMetric label="Completed" value={doneCnt} tone="blue" />
        <QueueMetric label="Total Today" value={todayAppts.length} />
      </section>

      <AnimatePresence>
        {waLog.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="queue-activity-card" aria-label="WhatsApp activity log">
            <Card>
              <Card.Header title="WhatsApp Activity" subtitle="Auto-triggered queue updates" action={<Badge variant="green" size="md" type="dot">Live</Badge>} />
              <Card.Body style={{ display: 'grid', gap: 'var(--space-3)' }}>
                {waLog.map(entry => (
                  <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr) auto', gap: 'var(--space-3)', alignItems: 'start', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-subtle)', '--badge-subtle-bg': 'var(--color-surface)' }}>
                    <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>
                      <MessageCircle size={18} strokeWidth={1.8} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ color: 'var(--color-navy)', fontSize: 'var(--text-body)' }}>{entry.name}</strong>
                      <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>&quot;{entry.msg}&quot;</p>
                    </div>
                    <Badge variant="default" size="md" type="subtle">{entry.token}</Badge>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-4 sm:right-6 z-[100] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 'calc(100vw - 32px)' }}>
        <AnimatePresence>
          {toasts.map(t => (
            <Toast key={t.id} msg={t.msg} onDone={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {paymentModal && (
          <PaymentModal patient={paymentModal.patientName} tokenNum={paymentModal.tokenNum} onConfirm={amount => markPaid(paymentModal.id, amount)} onClose={() => setPaymentModal(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

