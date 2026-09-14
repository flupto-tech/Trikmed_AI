'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Calendar, Plus, ChevronLeft, ChevronRight,
  CheckCircle, X, ArrowUpRight, ArrowDownRight, Clock,
  IndianRupee, UserCheck, Stethoscope, Users, AlertCircle,
  Eye,
} from 'lucide-react'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { Button, FilterChip, FilterChipGroup } from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import Table from '../../components/ui/Table'
import { can } from '../../utils/auth'
import { dashboardApi } from '../../services/dashboardApi'
import { initAppts as initApptsMapped } from '../../utils/queueData'
import { getCabinSettings, getActiveSlot, assignSlot } from '../../../lib/cabinSettings'
import AddWalkInForm from '../../components/dashboard/AddWalkInForm'
import VitalsModal, { vitalsState, vitalsFilledCount, VitalsInline } from '../../components/dashboard/VitalsModal'
import { trapFocus, getFocusableElements } from '../../components/ui/focusUtils'
// TODO: Ashutosh uncomment ↓
// import { dashboardApi } from '../../services/dashboardApi'

// ─── Design tokens ────────────────────────────────────────────────────────────
const STATUS = {
  booked:      { label: 'Booked',     bg: '#f3f4f6', color: 'var(--tm-text-muted,#6b7280)',  border: '#e5e7eb', rowBorder: '#d1d5db' },
  paid:        { label: 'Paid ✓',    bg: '#fffbeb', color: '#d97706',  border: '#fde68a', rowBorder: '#f59e0b' },
  vitals_done: { label: 'Vitals ✓', bg: '#f0fdf4', color: '#16a34a',  border: '#bbf7d0', rowBorder: '#22c55e' },
  in_cabin:    { label: 'In Cabin',  bg: '#eff6ff', color: '#2563eb',  border: '#bfdbfe', rowBorder: '#3b82f6' },
  completed:   { label: 'Done',       bg: '#EFF6FF', color: '#1A5CB5',  border: '#BFDBFE', rowBorder: '#1A5CB5' },
  no_show:     { label: 'No-show',   bg: '#fff1f2', color: '#e11d48',  border: '#fecdd3', rowBorder: '#f43f5e' },
  cancelled:   { label: 'Cancelled', bg: '#f9fafb', color: '#9ca3af',  border: '#e5e7eb', rowBorder: '#e5e7eb' },
}

const SOURCE_EMOJI = { WhatsApp: '💬', 'QR Code': '📲', 'Walk-in': '🚶', Phone: '📞', Online: '🌐' }
const DAY_NAMES   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SOURCE_TYPES = ['WhatsApp', 'QR Code', 'Walk-in', 'Phone', 'Online']
const STATUS_BADGES = {
  booked:      { label: 'Booked',      variant: 'default', rowBorder: 'var(--color-border)' },
  paid:        { label: 'Paid',        variant: 'yellow',  rowBorder: 'var(--color-warning-border)' },
  vitals_done: { label: 'Vitals done', variant: 'green',   rowBorder: 'var(--color-success-border)' },
  in_cabin:    { label: 'In Cabin',    variant: 'blue',    rowBorder: 'var(--color-info-border)' },
  completed:   { label: 'Done',        variant: 'green',   rowBorder: 'var(--color-success-border)' },
  no_show:     { label: 'No-show',     variant: 'red',     rowBorder: 'var(--color-error-border)' },
  cancelled:   { label: 'Cancelled',   variant: 'default', rowBorder: 'var(--color-border)' },
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0') }
function formatDateLocal(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
function todayStr()    { const d = new Date(); return formatDateLocal(d) }
function tomorrowStr() { const d = new Date(); d.setDate(d.getDate() + 1); return formatDateLocal(d) }

function getMondayOfWeek(offset = 0) {
  const now    = new Date()
  const dow    = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getWeekDays(offset = 0) {
  const monday = getMondayOfWeek(offset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    return formatDateLocal(d)
  })
}

function getMonthCalendar(offset = 0) {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + offset
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  const shift = (first.getDay() === 0 ? 6 : first.getDay() - 1)
  const start = new Date(first); start.setDate(start.getDate() - shift)
  const weeks = []; const cur = new Date(start)
  for (let w = 0; w < 6; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      week.push({ dateStr: formatDateLocal(cur), day: cur.getDate(), inMonth: cur.getMonth() === ((month % 12 + 12) % 12) })
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
    if (cur > last && w >= 3) break
  }
  return { weeks, monthName: MONTH_NAMES[(month % 12 + 12) % 12], year: first.getFullYear() }
}

function longDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
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
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-payment-title"
        aria-describedby="appointment-payment-description"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="w-full max-w-xs"
        style={{ background: 'var(--tm-surface,#fff)', borderRadius: '12px', padding: '28px', boxShadow: '0 8px 40px rgba(0,0,0,0.16)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 id="appointment-payment-title" className="text-[18px] font-bold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>Mark as Paid</h2>
            <p id="appointment-payment-description" className="text-[12px] mt-0.5" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>
              T-{String(tokenNum).padStart(2, '0')} · {patient}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close payment dialog" className="w-8 h-8 flex items-center justify-center"
            style={{ background: 'var(--tm-surface2,#F7F9FF)', color: 'var(--tm-text,#2D3748)', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>

        <div>
          <label htmlFor="appointment-payment-amount" className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>
            Payment Amount
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-semibold"
              style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>₹</span>
            <input
              id="appointment-payment-amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="ds-input"
              style={{ paddingLeft: '28px' }}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && valid && onConfirm(parseInt(amount, 10))}
            />
          </div>
          {/* Quick amount buttons */}
          <div className="flex gap-3 mt-3">
            {[200, 300, 500, 700].map(v => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className="flex-1 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
                style={{
                  background: parseInt(amount) === v ? '#0F2D5E' : '#F7F9FF',
                  color:      parseInt(amount) === v ? '#fff'    : 'var(--tm-text,#2D3748)',
                  border: '1px solid #DDE4F0',
                }}
              >
                ₹{v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <Button variant="secondary" onClick={onClose} fullWidth>Cancel</Button>
          <Button leftIcon={<CheckCircle size={16} strokeWidth={1.8} aria-hidden="true" />} onClick={() => valid && onConfirm(parseInt(amount, 10))} disabled={!valid} fullWidth>
            Confirm {valid ? `₹${amount}` : ''}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── QueueBanner ──────────────────────────────────────────────────────────────
function QueueBanner({ appts, today, onSendToCabin, onSendNextToSlot, onComplete, maxSlots, parallelMode, activeSlotKey }) {
  const todayAppts   = useMemo(() =>
    appts.filter(a => a.date === today).sort((a, b) => a.tokenNum - b.tokenNum),
    [appts, today]
  )
  const inCabin      = todayAppts.find(a => a.queueStatus === 'in_cabin')
  const paidQueue    = todayAppts.filter(a => a.queueStatus === 'paid')
  const nextUp       = paidQueue[0]
  const waitingCnt   = paidQueue.length
  const bookedCnt    = todayAppts.filter(a => a.queueStatus === 'booked').length
  const completedCnt = todayAppts.filter(a => a.queueStatus === 'completed').length

  return (
    <div>
      {/* Section label */}
      <div className="flex items-center gap-3 mb-3">
        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--tm-text-muted,#6B7A9A)' }}>
          Live Queue — Today
        </span>
        {inCabin && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', background: '#FFE9E6', color: '#C0311C', border: '1px solid #E5402B' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E5402B', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Session Active
          </span>
        )}
      </div>
      <div style={{ height: '1px', background: '#e5e7eb', marginBottom: '16px' }} />

      {/* ── PARALLEL MODE: Slot cards ── */}
      {parallelMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Slot cards row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {['A', 'B', 'C'].slice(0, maxSlots).map(slot => {
              const appt = todayAppts.find(a => a.queueStatus === 'in_cabin' && a.slot === slot)
              const isActive = activeSlotKey === slot
              const hasPatient = !!appt

              const cardBorder = isActive ? '#16A34A' : hasPatient ? '#D97706' : '#DDE4F0'
              const cardBg     = isActive ? '#F0FDF4'  : hasPatient ? '#FFFBEB'  : '#fff'
              const badgeBg    = isActive ? '#16A34A'  : hasPatient ? '#D97706'  : '#9CA3AF'
              const labelColor = isActive ? '#15803D'  : hasPatient ? '#92400E'  : '#6B7A9A'
              const statusText = isActive ? 'WITH DOCTOR' : hasPatient ? 'IN CABIN' : 'EMPTY'

              return (
                <div key={slot} style={{ flex: '1 1 160px', borderRadius: 10, border: `2px solid ${cardBorder}`, background: cardBg, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{slot}</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: labelColor }}>
                      {statusText}
                    </span>
                    {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', marginLeft: 'auto', flexShrink: 0 }} />}
                  </div>

                  {hasPatient ? (
                    <>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tm-text,#0F2D5E)' }}>{appt.patientName}</div>
                      <div style={{ fontSize: 12, color: 'var(--tm-text-muted,#6B7A9A)' }}>{appt.reason || '—'}</div>
                      <button
                        onClick={() => onComplete(appt.id)}
                        style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6, border: `1px solid ${cardBorder}`, background: 'transparent', color: labelColor, cursor: 'pointer', width: 'fit-content', fontFamily: 'inherit', transition: 'background .15s' }}>
                        <CheckCircle size={11} /> Complete
                      </button>
                    </>
                  ) : (
                    <>
                      {nextUp ? (
                        <>
                          <div style={{ fontSize: 12, color: 'var(--tm-text-muted,#6B7A9A)' }}>Next: <strong style={{ color: 'var(--tm-text,#0F2D5E)' }}>{nextUp.patientName}</strong></div>
                          <button
                            onClick={() => onSendNextToSlot(slot)}
                            style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', cursor: 'pointer', width: 'fit-content', fontFamily: 'inherit', transition: 'background .15s' }}>
                            <UserCheck size={11} /> Send to Cabin
                          </button>
                        </>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--tm-text-muted,#9CA3AF)' }}>No patients waiting</div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Waiting', value: waitingCnt,   color: '#d97706' },
              { label: 'Done',    value: completedCnt, color: '#1A5CB5' },
              { label: 'Booked',  value: bookedCnt,    color: 'var(--tm-text-muted,#6b7280)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--tm-surface,#fff)', border: '1px solid #DDE4F0', borderRadius: '8px', padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '26px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--tm-text-muted,#6B7A9A)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── SINGLE MODE: In Cabin + Next Up + Stats ── */
        <div className="grid gap-4 queue-banner-grid" style={{ gridTemplateColumns: '1fr 1.6fr' }}>

          {/* LEFT: In Cabin card */}
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #1a3318' }}>
            <div style={{ background: '#0F2D5E', padding: '10px 18px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(255,255,255,0.6)' }}>
                Now In Cabin
              </span>
            </div>
            <div style={{ background: '#0F2D5E', padding: '20px 18px', minHeight: '140px', display: 'flex', flexDirection: 'column' }}>
              {inCabin ? (
                <>
                  <div style={{ fontSize: '48px', fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-2px' }}>
                    T-{String(inCabin.tokenNum).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: 600, color: '#fff', marginTop: '10px' }}>{inCabin.patientName}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginTop: '3px' }}>{inCabin.reason}</div>
                  <button
                    onClick={() => onComplete(inCabin.id)}
                    style={{ marginTop: 'auto', paddingTop: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, padding: '8px 16px', borderRadius: '6px', border: '1.5px solid rgba(255,255,255,0.35)', color: '#fff', background: 'transparent', cursor: 'pointer', width: 'fit-content', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'}
                  >
                    <CheckCircle size={13} /> Complete Visit
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>Cabin is empty</div>
                  {nextUp && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Send next patient in →</div>}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Next Up + Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ borderRadius: '12px', border: '1px solid #DDE4F0', background: 'var(--tm-surface,#ffffff)', padding: '16px 20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--tm-text,#2D3748)', marginBottom: '10px' }}>
                Next Up
              </div>
              {nextUp ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--tm-text,#0F2D5E)', lineHeight: 1, letterSpacing: '-1px' }}>
                      T-{String(nextUp.tokenNum).padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tm-text,#0F2D5E)', marginTop: '5px' }}>{nextUp.patientName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--tm-text-muted,#6B7A9A)', marginTop: '2px' }}>Paid ✓ · {nextUp.time}</div>
                  </div>
                  <button
                    onClick={() => !inCabin && onSendToCabin(nextUp.id)}
                    disabled={!!inCabin}
                    style={inCabin
                      ? { padding: '8px 16px', borderRadius: '6px', border: '1px solid #DDE4F0', color: '#DDE4F0', background: 'var(--tm-surface,#fff)', fontSize: '13px', fontWeight: 600, cursor: 'not-allowed', whiteSpace: 'nowrap' }
                      : { padding: '8px 16px', borderRadius: '6px', border: '1px solid #bfdbfe', color: '#2563eb', background: '#eff6ff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
                    onMouseEnter={e => { if (!inCabin) e.currentTarget.style.background = '#dbeafe' }}
                    onMouseLeave={e => { if (!inCabin) e.currentTarget.style.background = '#eff6ff' }}
                  >
                    {inCabin ? 'Cabin Busy' : <><UserCheck size={13} style={{ display: 'inline', marginRight: '4px' }} />Send to Cabin</>}
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '14px', color: 'var(--tm-text-muted,#6B7A9A)' }}>
                  {waitingCnt === 0 ? 'No patients waiting' : 'No paid patients yet'}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: 'Waiting', value: waitingCnt,   color: '#d97706' },
                { label: 'Done',    value: completedCnt, color: '#1A5CB5' },
                { label: 'Booked',  value: bookedCnt,    color: 'var(--tm-text-muted,#6b7280)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--tm-surface,#fff)', border: '1px solid #DDE4F0', borderRadius: '8px', padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--tm-text-muted,#6B7A9A)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, topBorder, trend, trendUp, trendGood }) {
  const goodColor  = trendGood ? '#1A5CB5' : '#dc2626'
  const badColor   = trendGood ? '#dc2626' : '#1A5CB5'
  const trendColor = trendUp ? goodColor : badColor
  const TrendIcon  = trendUp ? ArrowUpRight : ArrowDownRight

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: 'var(--tm-surface,#fff)', border: '1px solid #DDE4F0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `3px solid ${topBorder}` }}>
      <div style={{ padding: '20px 24px' }}>
        <p className="text-[36px] font-bold leading-none" style={{ color, letterSpacing: '-1.5px' }}>{value}</p>
        <p className="text-[13px] font-semibold mt-2" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{label}</p>
        <div className="flex items-center gap-1 mt-2">
          <div className="flex items-center gap-0.5 text-[12px] font-semibold" style={{ color: trendColor }}>
            <TrendIcon size={13} />{trend}
          </div>
          <span className="text-[11px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>vs last week</span>
        </div>
      </div>
    </div>
  )
}

function AppointmentStatusBadge({ status }) {
  const meta = STATUS_BADGES[status] || STATUS_BADGES.booked
  return <Badge variant={meta.variant} size="lg" type="subtle">{meta.label}</Badge>
}

function PaymentBadge({ amount }) {
  if (amount) {
    return (
      <Badge variant="green" size="lg" type="subtle">
        <IndianRupee size={12} strokeWidth={1.8} aria-hidden="true" />
        {amount}
      </Badge>
    )
  }
  return <Badge variant="yellow" size="lg" type="subtle">Pending</Badge>
}

function SourceBadge({ type }) {
  return <Badge variant="default" size="md" type="subtle">{type || 'Online'}</Badge>
}

function IconActionButton({ label, onClick, disabled = false, children, tone = 'default' }) {
  const toneStyle = {
    default: { color: 'var(--color-text-secondary)', background: 'var(--color-surface)' },
    blue: { color: 'var(--color-info-text)', background: 'var(--color-info-bg)' },
    green: { color: 'var(--color-success-text)', background: 'var(--color-success-bg)' },
    yellow: { color: 'var(--color-warning-text)', background: 'var(--color-warning-bg)' },
    red: { color: 'var(--color-error-text)', background: 'var(--color-error-bg)' },
  }[tone]

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        if (!disabled) onClick?.()
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        minWidth: 34,
        height: 34,
        borderRadius: 'var(--radius-md)',
        border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
        ...toneStyle,
      }}
    >
      {children}
    </button>
  )
}

function AppointmentActions({
  appt,
  inCabinExists,
  onView,
  onVitals,
  onMarkPaid,
  onCancel,
  onSendToCabin,
  onComplete,
}) {
  const vs = vitalsState(appt)
  const cnt = vitalsFilledCount(appt.vitals)
  const vitalsLabel = vs === 'full' ? 'Vitals complete' : vs === 'partial' ? `Update vitals (${cnt}/6)` : 'Add vitals'

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
      <IconActionButton label={`View ${appt.patientName}`} onClick={() => onView(appt)}>
        <Eye size={15} strokeWidth={1.8} aria-hidden="true" />
      </IconActionButton>
      {['booked','paid','vitals_done'].includes(appt.queueStatus) ? (
        <IconActionButton label={vitalsLabel} onClick={() => onVitals(appt)} tone={vs === 'full' ? 'green' : vs === 'partial' ? 'yellow' : 'default'}>
          <Stethoscope size={15} strokeWidth={1.8} aria-hidden="true" />
        </IconActionButton>
      ) : null}
      {appt.queueStatus === 'booked' ? (
        <>
          <IconActionButton label={`Mark ${appt.patientName} as paid`} onClick={() => onMarkPaid(appt)} tone="yellow">
            <IndianRupee size={15} strokeWidth={1.8} aria-hidden="true" />
          </IconActionButton>
          {can('action_cancel_appointment') ? (
            <IconActionButton label={`Cancel ${appt.patientName}`} onClick={() => onCancel(appt.id)} tone="red">
              <X size={15} strokeWidth={1.8} aria-hidden="true" />
            </IconActionButton>
          ) : null}
        </>
      ) : null}
      {appt.queueStatus === 'paid' ? (
        <IconActionButton label={inCabinExists ? 'Cabin busy' : `Send ${appt.patientName} to cabin`} onClick={() => onSendToCabin(appt.id)} disabled={inCabinExists} tone="blue">
          <UserCheck size={15} strokeWidth={1.8} aria-hidden="true" />
        </IconActionButton>
      ) : null}
      {appt.queueStatus === 'in_cabin' ? (
        <IconActionButton label={`Complete ${appt.patientName}'s visit`} onClick={() => onComplete(appt.id)} tone="green">
          <CheckCircle size={15} strokeWidth={1.8} aria-hidden="true" />
        </IconActionButton>
      ) : null}
    </div>
  )
}

function AppointmentsSkeleton() {
  return (
    <div className="ds-page" aria-label="Appointments loading" aria-busy="true" style={{ display: 'grid', gap: 'var(--space-8)', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-5)', alignItems: 'flex-start' }}>
        <div style={{ display: 'grid', gap: 'var(--space-2)', width: 'min(420px, 100%)' }}>
          <Skeleton variant="text" height="var(--text-h2)" width="58%" />
          <Skeleton variant="text" width="42%" />
        </div>
        <Skeleton variant="rect" width="132px" height="38px" borderRadius="var(--radius-btn)" />
      </div>
      <Card>
        <Card.Body style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <Skeleton variant="rect" height="46px" />
          <Skeleton variant="rect" height="74px" />
        </Card.Body>
      </Card>
      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 'var(--space-6)' }}>
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant="card" />)}
      </div>
      <Card>
        <Card.Body style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 140px', gap: 'var(--space-4)', alignItems: 'center' }}>
              <Skeleton variant="text" />
              <Skeleton variant="text" />
              <Skeleton variant="rect" height="26px" borderRadius="var(--radius-sm)" />
              <Skeleton variant="text" />
            </div>
          ))}
        </Card.Body>
      </Card>
    </div>
  )
}

function AppointmentMobileCard({ appt, index, handlers, inCabinExists }) {
  const meta = STATUS_BADGES[appt.queueStatus] || STATUS_BADGES.booked
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      onClick={() => handlers.onView(appt)}
      style={{
        display: 'grid',
        gap: 'var(--space-3)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
        borderLeft: `3px solid ${meta.rowBorder}`,
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        <div>
          <time style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>{appt.time || '--'}</time>
          <strong style={{ display: 'block', marginTop: 'var(--space-1)', color: 'var(--color-navy)', fontSize: 'var(--text-body)' }}>{appt.patientName}</strong>
          <span style={{ display: 'block', marginTop: 'var(--space-1)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{appt.patientPhone || 'No phone'}</span>
        </div>
        <AppointmentStatusBadge status={appt.queueStatus} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
        <Badge variant="navy" size="lg" type="outline">T-{String(appt.tokenNum).padStart(2, '0')}</Badge>
        <PaymentBadge amount={appt.paymentAmount} />
        <SourceBadge type={appt.type} />
      </div>
      <div>
        <p style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>{appt.reason || 'Consultation'}</p>
        <VitalsInline vitals={appt.vitals} />
      </div>
      <AppointmentActions appt={appt} inCabinExists={inCabinExists} {...handlers} />
    </motion.article>
  )
}

function AppointmentsDataTable({ appointments, handlers, inCabinExists }) {
  return (
    <Table aria-label="Appointments table" stickyHeader className="appointments-desktop-table">
      <Table.Head>
        <tr>
          <Table.HeadCell width="92px">Time</Table.HeadCell>
          <Table.HeadCell>Patient</Table.HeadCell>
          <Table.HeadCell>Phone</Table.HeadCell>
          <Table.HeadCell>Status</Table.HeadCell>
          <Table.HeadCell>Type</Table.HeadCell>
          <Table.HeadCell align="right">Actions</Table.HeadCell>
        </tr>
      </Table.Head>
      <Table.Body>
        {appointments.map((appt, index) => {
          const meta = STATUS_BADGES[appt.queueStatus] || STATUS_BADGES.booked
          return (
            <Table.Row
              key={appt.id}
              onRowClick={() => handlers.onView(appt)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handlers.onView(appt)
                }
              }}
              aria-label={`View appointment for ${appt.patientName}`}
              style={{
                borderLeft: `3px solid ${meta.rowBorder}`,
                background: index % 2 ? 'var(--color-surface)' : 'var(--color-surface-subtle)',
              }}
            >
              <Table.Cell mono mobileLabel="Time" style={{ fontWeight: 700, color: 'var(--color-text-secondary)' }}>{appt.time || '--'}</Table.Cell>
              <Table.Cell mobileLabel="Patient">
                <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
                  <strong style={{ color: 'var(--color-navy)', fontSize: 'var(--text-body)' }}>{appt.patientName}</strong>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                    T-{String(appt.tokenNum).padStart(2, '0')} / {appt.id}
                  </span>
                  <VitalsInline vitals={appt.vitals} />
                </div>
              </Table.Cell>
              <Table.Cell mobileLabel="Phone">{appt.patientPhone || '-'}</Table.Cell>
              <Table.Cell mobileLabel="Status"><AppointmentStatusBadge status={appt.queueStatus} /></Table.Cell>
              <Table.Cell mobileLabel="Type">
                <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
                  <SourceBadge type={appt.type} />
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{appt.reason || 'Consultation'}</span>
                  <PaymentBadge amount={appt.paymentAmount} />
                </div>
              </Table.Cell>
              <Table.Cell align="right" mobileLabel="Actions">
                <AppointmentActions appt={appt} inCabinExists={inCabinExists} {...handlers} />
              </Table.Cell>
            </Table.Row>
          )
        })}
      </Table.Body>
    </Table>
  )
}

function AppointmentDetailDrawer({ appt, onClose }) {
  if (!appt) return null
  return (
    <motion.aside
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 28 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Appointment details for ${appt.patientName}`}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        width: 'min(420px, 100vw)',
        background: 'var(--color-surface)',
        borderLeft: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)', padding: 'var(--space-5)', borderBottom: 'calc(var(--space-0-5) / 2) solid var(--color-border)' }}>
        <div>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Appointment</p>
          <h2 style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-navy)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-h3)' }}>{appt.patientName}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close appointment details" style={{ border: 'none', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', height: 36, width: 36, display: 'grid', placeItems: 'center' }}>
          <X size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
      <div style={{ padding: 'var(--space-5)', display: 'grid', gap: 'var(--space-4)', overflowY: 'auto' }}>
        <AppointmentStatusBadge status={appt.queueStatus} />
        {[
          ['Time', appt.time || '--'],
          ['Date', appt.date || '--'],
          ['Phone', appt.patientPhone || '-'],
          ['Reason', appt.reason || 'Consultation'],
          ['Source', appt.type || 'Online'],
          ['Token', `T-${String(appt.tokenNum).padStart(2, '0')}`],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-body)' }}>{value}</span>
          </div>
        ))}
        <VitalsInline vitals={appt.vitals} />
      </div>
    </motion.aside>
  )
}

// WalkInModal replaced by AddWalkInForm component

// ─── Main component ───────────────────────────────────────────────────────────
export default function Appointments() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError]     = useState(null)

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    try {
      const res = await dashboardApi.getAppointments()
      // normalize backend shape to what the UI expects
      const mapped = (res || []).map((a, i) => ({
        ...a,
        id: a.id,
        tokenNum: a.tokenNum || a.token || (i + 1),
        token: a.token || a.tokenNum || (i + 1),
        queueStatus: a.queueStatus || a.status || 'booked',
        paymentAmount: a.paymentAmount ?? null,
        patientName: a.patientName || a.patient?.name || a.patient?.full_name || 'Walk-in Patient',
        patientPhone: a.patientPhone || a.patient?.phone || '',
        date: a.date || a.scheduled_date || a.appointment_date,
        time: a.time || a.scheduled_time || a.appointment_time,
        reason: a.reason || a.notes || a.purpose || '',
      }))
      setAppts(initApptsMapped(mapped))
    } catch (e) {
      console.error('Failed to load appointments:', e)
      setPageError(e?.message || e?.detail || 'Failed to load appointments')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // wrapper to update appointment status via backend
  const updateAppointmentStatus = async (id, status, extra = {}) => {
    try {
      await dashboardApi.updateAppointment(id, { status, ...extra })
    } catch (e) {
      console.error('Failed to update appointment:', e)
      setPageError(e?.message || e?.detail || 'Failed to update appointment')
      // refresh list to remain consistent
      loadData()
      throw e
    }
  }

  const TODAY    = todayStr()
  const TOMORROW = tomorrowStr()

  // Calendar state
  const [viewMode,     setViewMode]     = useState('week')
  const [weekOffset,   setWeekOffset]   = useState(0)
  const [monthOffset,  setMonthOffset]  = useState(0)
  const [selectedDate, setSelectedDate] = useState(TODAY)

  // Filter state
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter,   setTypeFilter]   = useState('all')
  const [quickFilter,  setQuickFilter]  = useState('today')

  // UI state
  const [showWalkIn,    setShowWalkIn]    = useState(false)
  const [paymentModal,  setPaymentModal]  = useState(null) // { id, patientName, tokenNum }
  const [vitalsModal,   setVitalsModal]   = useState(null) // appt object
  const [selectedAppt,  setSelectedAppt]  = useState(null)
  const [toast,         setToast]         = useState(null) // { msg }
  const [appts,         setAppts]         = useState([])

  // Cabin / parallel consult config — read from shared helper on page load
  const cabinSettings = useMemo(() => getCabinSettings(), [])
  const activeSlotKey = useMemo(() => getActiveSlot(), [])

  // ── Calendar helpers ──
  const weekDays    = useMemo(() => getWeekDays(weekOffset),    [weekOffset])
  const monthCal    = useMemo(() => getMonthCalendar(monthOffset), [monthOffset])
  const thisWeekDays = useMemo(() => getWeekDays(0), [])

  const countByDate = useMemo(() => {
    const c = {}
    appts.forEach(a => { c[a.date] = (c[a.date] || 0) + 1 })
    return c
  }, [appts])

  // ── Filtered + grouped ──
  const filtered = useMemo(() => appts.filter(a => {
    if      (quickFilter === 'today')    { if (a.date !== TODAY)    return false }
    else if (quickFilter === 'tomorrow') { if (a.date !== TOMORROW) return false }
    else if (quickFilter === 'week')     { if (!thisWeekDays.includes(a.date)) return false }
    else if (quickFilter === 'noshow')   { if (a.queueStatus !== 'no_show')    return false }
    else if (quickFilter === 'walkin')   { if (a.type !== 'Walk-in')           return false }
    else if (selectedDate)               { if (a.date !== selectedDate)         return false }

    if (statusFilter !== 'all' && a.queueStatus !== statusFilter) return false
    if (typeFilter   !== 'all' && a.type        !== typeFilter)   return false
    if (search) {
      const q = search.toLowerCase()
      if (!a.patientName.toLowerCase().includes(q) && !a.patientPhone.includes(q) && !a.id.includes(q)) return false
    }
    return true
  }), [appts, quickFilter, selectedDate, statusFilter, typeFilter, search, TODAY, TOMORROW, thisWeekDays])

  const grouped = useMemo(() => {
    const g = {}
    filtered.forEach(a => { if (!g[a.date]) g[a.date] = []; g[a.date].push(a) })
    return Object.entries(g).sort(([a], [b]) => new Date(a) - new Date(b))
  }, [filtered])

  // ── Stat counts (global) ──
  const maxSlots      = cabinSettings.slots || 1
  const parallelMode  = maxSlots > 1
  const queueStats = useMemo(() => {
    const todayAppts = []
    const inCabinAppts = []
    let queued = 0
    let completed = 0
    let noShow = 0

    appts.forEach(a => {
      if (a.queueStatus === 'no_show') noShow += 1
      if (a.date !== TODAY) return
      todayAppts.push(a)
      if (a.queueStatus === 'in_cabin') inCabinAppts.push(a)
      if (['booked','paid','in_cabin'].includes(a.queueStatus)) queued += 1
      if (a.queueStatus === 'completed') completed += 1
    })

    const inCabinCount = inCabinAppts.length
    return {
      todayAppts,
      inCabinAppts,
      inCabinCount,
      inCabinExists: parallelMode ? inCabinCount >= maxSlots : inCabinCount > 0,
      counts: {
        total: todayAppts.length,
        queued,
        completed,
        noShow,
      },
    }
  }, [appts, TODAY, parallelMode, maxSlots])
  const { todayAppts, inCabinAppts, inCabinCount, inCabinExists, counts } = queueStats

  // ── Queue actions ──
  const openPaymentModal = (appt) => setPaymentModal({ id: appt.id, patientName: appt.patientName, tokenNum: appt.tokenNum })

  const markPaid = (id, amount) => {
    updateAppointmentStatus(id, 'paid', { paymentAmount: amount })
    setAppts(prev => prev.map(a => a.id === id ? { ...a, queueStatus: 'paid', paymentAmount: amount } : a))
    setPaymentModal(null)
  }

  const doSendToCabin = (id, slot) => {
    updateAppointmentStatus(id, 'in_cabin', slot ? { slot } : {})
    setAppts(prev => prev.map(a => a.id === id ? { ...a, queueStatus: 'in_cabin', slot: slot || null } : a))
  }

  // Auto-assign slot — called from table row "Send to Cabin" buttons
  const sendToCabin = (id) => {
    if (!parallelMode) {
      if (inCabinExists) return
      doSendToCabin(id, null)
      return
    }
    const freeSlot = assignSlot(inCabinAppts, maxSlots)
    if (!freeSlot) return // all slots full
    doSendToCabin(id, freeSlot)
  }

  // Send the next waiting (paid) patient to a specific slot — called from grey slot cards
  const sendNextToSlot = (slot) => {
    const next = todayAppts
      .filter(a => a.queueStatus === 'paid')
      .sort((a, b) => a.tokenNum - b.tokenNum)[0]
    if (!next) return
    doSendToCabin(next.id, slot)
  }

  const markComplete = (id) => {
    updateAppointmentStatus(id, 'done')
    setAppts(prev => prev.map(a => a.id === id ? { ...a, queueStatus: 'completed' } : a))
  }
  const markCancelled = (id) => {
    updateAppointmentStatus(id, 'cancelled')
    setAppts(prev => prev.map(a => a.id === id ? { ...a, queueStatus: 'cancelled' } : a))
  }

  function showToast(msg) {
    setToast({ msg })
    setTimeout(() => setToast(null), 3000)
  }

  const saveVitals = (id, vitals) => {
    const appt = appts.find(a => a.id === id)
    if (!appt) return
    // Advance to vitals_done if currently paid; otherwise keep status
    const nextStatus = appt.queueStatus === 'paid' ? 'vitals_done' : appt.queueStatus
    const storageStatus = { booked: 'confirmed', paid: 'paid', vitals_done: 'vitals_done' }[nextStatus] || nextStatus
    updateAppointmentStatus(id, storageStatus, {
      vitals:                vitals,
      vitalsEnteredAt:       new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      vitalsRecordedAt:      vitals.vitalsRecordedAt,
      vitalsRecordedBy:      vitals.vitalsRecordedBy,
      vitalsRecordedByName:  vitals.vitalsRecordedByName,
    })
    setAppts(prev => prev.map(a => a.id === id ? { ...a, vitals, queueStatus: nextStatus } : a))
    showToast(`Vitals saved for ${appt.patientName}`)
  }

  const saveVitalsAndSend = (id, vitals) => {
    saveVitals(id, vitals)
    // sendToCabin reads the updated appts, so schedule after state settles
    setTimeout(() => sendToCabin(id), 50)
  }

  const addWalkIn = ({ appointment }) => {
    setAppts(prev => [...prev, { ...appointment, queueStatus: appointment.queueStatus || 'booked', tokenNum: appointment.tokenNum || appointment.token }])
  }

  // ── Calendar helpers ──
  const selectDay = (dateStr) => { setSelectedDate(dateStr); setQuickFilter('custom') }
  const jumpToday = () => { setSelectedDate(TODAY); setWeekOffset(0); setMonthOffset(0); setQuickFilter('today') }
  const setQuick  = (key) => { setQuickFilter(key); if (key !== 'custom') setSelectedDate(null) }

  const weekLabel = (() => {
    const first = new Date(weekDays[0]); const last = new Date(weekDays[6])
    if (first.getMonth() === last.getMonth())
      return `${first.toLocaleDateString('en-IN', { day: 'numeric' })} – ${last.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
    return `${first.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${last.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
  })()

  // ── Active selected date for calendar highlight ──
  const calSelected = quickFilter === 'today' ? TODAY : quickFilter === 'tomorrow' ? TOMORROW : selectedDate
  const appointmentHandlers = {
    onView: setSelectedAppt,
    onVitals: setVitalsModal,
    onMarkPaid: openPaymentModal,
    onCancel: markCancelled,
    onSendToCabin: sendToCabin,
    onComplete: markComplete,
  }

  if (pageLoading) return <AppointmentsSkeleton />
  if (pageError)   return <ErrorBanner message={pageError} onRetry={loadData} />

  return (
    <div className="ds-page appointments-shell">
      <style>{`
        .appointments-shell {
          display: grid;
          gap: var(--space-8);
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
        }
        .appointments-page-header {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-5);
        }
        .appointments-calendar {
          margin-top: var(--space-1);
        }
        .appointments-calendar-toolbar {
          gap: var(--space-4);
          padding: var(--space-5) var(--space-6);
        }
        .appointments-calendar-strip {
          padding: var(--space-4) var(--space-5) var(--space-5);
          background: var(--tm-surface,#fff);
        }
        .appointments-stat-grid {
          gap: var(--space-6);
        }
        .appointments-live-queue {
          margin-top: var(--space-2);
        }
        .appointments-filter-grid {
          display: grid;
          grid-template-columns: minmax(260px, 1fr) 180px 160px 160px;
          align-items: center;
          gap: var(--space-4);
        }
        .appointments-filter-grid > * {
          min-width: 0;
          width: 100%;
        }
        .appointments-filter-chips {
          gap: var(--space-3);
        }
        .appointments-list {
          display: grid;
          gap: var(--space-8);
        }
        .appointments-date-section {
          display: grid;
          gap: var(--space-5);
          min-width: 0;
        }
        @media (max-width: 639px) {
          .appointments-desktop-table { display: none !important; }
          .appointments-shell { gap: var(--space-6); }
          .appointments-page-header { gap: var(--space-4); }
          .appointments-calendar-toolbar {
            padding: var(--space-4);
          }
          .appointments-calendar-strip {
            padding: var(--space-3) var(--space-4) var(--space-4);
          }
          .appointments-stat-grid {
            gap: var(--space-4);
          }
          .appointments-filter-grid {
            grid-template-columns: 1fr;
            gap: var(--space-3);
          }
          .appointments-filter-chips {
            gap: var(--space-2);
          }
          .appointments-list {
            gap: var(--space-6);
          }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .appointments-filter-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (min-width: 640px) {
          .appointments-mobile-list { display: none !important; }
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="appointments-page-header">
        <div>
          <h1 className="ds-section-title">Appointments</h1>
          <p className="ds-section-subtitle">{appts.length} total · {todayAppts.length} today</p>
        </div>
        {can('action_add_walkin') && (
          <Button leftIcon={<Plus size={16} strokeWidth={1.8} aria-hidden="true" />} onClick={() => setShowWalkIn(true)}>Add Walk-in</Button>
        )}
      </div>

      {/* ── Calendar Component (MOVED TO TOP) ── */}
      <div className="rounded-xl overflow-hidden appointments-calendar"
        style={{ background: 'var(--tm-surface,#fff)', border: '1px solid #DDE4F0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>

        {/* Toolbar — flex-wrap so it collapses to 2 rows on mobile */}
        <div className="appointments-calendar-toolbar flex flex-wrap items-center justify-between" style={{ borderBottom: '1px solid #F7F9FF' }}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={() => viewMode === 'week' ? setWeekOffset(w => w - 1) : setMonthOffset(m => m - 1)}
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors"
              style={{ background: 'var(--tm-surface2,#F7F9FF)', color: 'var(--tm-text,#2D3748)' }}
              onMouseEnter={e => e.currentTarget.style.background = '#DDE4F0'}
              onMouseLeave={e => e.currentTarget.style.background = '#F7F9FF'}
            ><ChevronLeft size={14} /></button>

            {/* Remove minWidth so it shrinks on mobile */}
            <span className="text-[13px] font-semibold flex-1 text-center truncate" style={{ color: 'var(--tm-text,#0F2D5E)' }}>
              {viewMode === 'week' ? weekLabel : `${monthCal.monthName} ${monthCal.year}`}
            </span>

            <button
              onClick={() => viewMode === 'week' ? setWeekOffset(w => w + 1) : setMonthOffset(m => m + 1)}
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors"
              style={{ background: 'var(--tm-surface2,#F7F9FF)', color: 'var(--tm-text,#2D3748)' }}
              onMouseEnter={e => e.currentTarget.style.background = '#DDE4F0'}
              onMouseLeave={e => e.currentTarget.style.background = '#F7F9FF'}
            ><ChevronRight size={14} /></button>

            <Button size="sm" variant="secondary" onClick={jumpToday} className="shrink-0">Today</Button>
          </div>

          <FilterChipGroup value={viewMode} onChange={setViewMode} className="shrink-0">
            <FilterChip value="week">Week</FilterChip>
            <FilterChip value="month">Month</FilterChip>
          </FilterChipGroup>
        </div>

        {/* Week strip */}
        {viewMode === 'week' && (
          <div className="appointments-calendar-strip">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 'var(--space-2)' }}>
              {weekDays.map(dateStr => {
                const d          = new Date(dateStr)
                const isToday    = dateStr === TODAY
                const isSelected = dateStr === calSelected
                const count      = countByDate[dateStr] || 0
                return (
                  <button key={dateStr} onClick={() => selectDay(dateStr)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                      padding: '10px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      background: isSelected ? '#0F2D5E' : isToday ? '#F7F9FF' : 'transparent',
                      outline: isToday && !isSelected ? '1px solid #DDE4F0' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F7F9FF' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? '#F7F9FF' : 'transparent' }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: isSelected ? 'rgba(255,255,255,0.65)' : 'var(--tm-text-muted,#6B7A9A)' }}>
                      {DAY_NAMES[d.getDay()]}
                    </span>
                    <span style={{ fontSize: '20px', fontWeight: 700, color: isSelected ? '#fff' : isToday ? 'var(--tm-text,#0F2D5E)' : 'var(--tm-text,#2D3748)', lineHeight: 1 }}>
                      {d.getDate()}
                    </span>
                    {isToday && !isSelected && (
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#0F2D5E', display: 'block' }} />
                    )}
                    {count > 0 ? (
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 6px', borderRadius: '10px', background: isSelected ? 'rgba(255,255,255,0.2)' : '#E5402B', color: '#fff' }}>
                        {count}
                      </span>
                    ) : (
                      <span style={{ height: '18px' }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Month grid */}
        {viewMode === 'month' && (
          <div style={{ padding: 'var(--space-5)' }}>
            <div className="grid grid-cols-7 mb-1">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <div key={d} className="text-center py-1">
                  <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{d}</span>
                </div>
              ))}
            </div>
            {monthCal.weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
                {week.map(({ dateStr, day, inMonth }) => {
                  const isToday    = dateStr === TODAY
                  const isSelected = dateStr === calSelected
                  const count      = countByDate[dateStr] || 0
                  return (
                    <button key={dateStr} onClick={() => selectDay(dateStr)}
                      className="flex flex-col items-center justify-center rounded-xl py-1.5 transition-all"
                      style={{
                        minHeight: '52px',
                        background: isSelected ? '#0F2D5E' : isToday ? '#F7F9FF' : 'transparent',
                        opacity: inMonth ? 1 : 0.35,
                        border: isSelected ? '1px solid #0F2D5E' : isToday ? '1px solid #DDE4F0' : '1px solid transparent',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F7F9FF' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? '#F7F9FF' : 'transparent' }}
                    >
                      <span className="text-[14px] font-bold"
                        style={{ color: isSelected ? '#fff' : isToday ? 'var(--tm-text,#0F2D5E)' : 'var(--tm-text,#2D3748)' }}>{day}</span>
                      {count > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 mt-0.5"
                          style={isSelected
                            ? { borderRadius: '10px', background: 'rgba(255,255,255,0.25)', color: '#fff' }
                            : { borderRadius: '10px', background: '#E5402B', color: '#fff' }}>
                          {count}
                        </span>
                      )}
                      {isToday && !isSelected && <span className="w-1 h-1 rounded-xl mt-0.5" style={{ background: '#0F2D5E' }} />}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="appointments-stat-grid grid grid-cols-2 sm:grid-cols-4">
        <StatCard label="Today's Total"  value={counts.total}     color="#1d4ed8" topBorder="#3b82f6" trend="↑ 12%" trendUp trendGood />
        <StatCard label="In Queue"       value={counts.queued}    color="#d97706" topBorder="#f59e0b" trend="↑ 8%"  trendUp trendGood />
        <StatCard label="Completed"      value={counts.completed} color="#1A5CB5" topBorder="#1A5CB5" trend="↑ 5%"  trendUp trendGood />
        <StatCard label="No-shows"       value={counts.noShow}    color="#dc2626" topBorder="#ef4444" trend="↓ 15%" trendUp={false} trendGood />
      </div>

      {/* ── Live Queue Banner ── */}
      <section className="appointments-live-queue">
        <QueueBanner
          appts={appts}
          today={TODAY}
          onSendToCabin={sendToCabin}
          onSendNextToSlot={sendNextToSlot}
          onComplete={markComplete}
          maxSlots={maxSlots}
          parallelMode={parallelMode}
          activeSlotKey={activeSlotKey}
        />
      </section>

      {/* ── Search + Filters ── */}
      <Card>
        <Card.Body style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <div className="appointments-filter-grid" role="search" aria-label="Appointment filters">
          <div className="relative flex-1" style={{ minWidth: '0' }}>
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }} />
            <input type="text" placeholder="Search patient, phone..."
              aria-label="Search appointments by patient, phone, or ID"
              value={search} onChange={e => setSearch(e.target.value)}
              className="ds-input" style={{ paddingLeft: '42px' }} />
          </div>
          <input
            type="date"
            aria-label="Filter appointments by date"
            value={calSelected || ''}
            onChange={e => selectDay(e.target.value)}
            className="ds-input"
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="ds-select" aria-label="Filter appointments by status">
            <option value="all">All Status</option>
            {Object.entries(STATUS_BADGES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="ds-select" aria-label="Filter appointments by source">
            <option value="all">All Sources</option>
            {SOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="appointments-filter-chips flex flex-wrap" role="group" aria-label="Quick appointment filters">
          {[
            { key: 'today',    label: 'Today' },
            { key: 'tomorrow', label: 'Tomorrow' },
            { key: 'week',     label: 'This Week' },
            { key: 'noshow',   label: 'No-shows' },
            { key: 'walkin',   label: 'Walk-ins' },
            { key: 'all',      label: 'All Dates' },
          ].map(pill => {
            const isActive = quickFilter === pill.key
            return (
              <FilterChip key={pill.key} isActive={isActive} onClick={() => setQuick(pill.key)}>
                {pill.label}
              </FilterChip>
            )
          })}
        </div>
        </Card.Body>
      </Card>

      {/* Appointment list */}
      <div className="appointments-list">
        {grouped.length === 0 ? (
          <Card>
            <EmptyState
              icon={Calendar}
              title="No appointments found"
              description="Try another date, clear the filters, or add a walk-in appointment."
              action={can('action_add_walkin') ? { label: 'Add Walk-in', onClick: () => setShowWalkIn(true) } : undefined}
            />
          </Card>
        ) : grouped.map(([date, dayAppts]) => {
          const isToday = date === TODAY
          const isTomorrow = date === TOMORROW
          const sorted = [...dayAppts].sort((a, b) => a.tokenNum - b.tokenNum)
          const dateBadge = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : null

          return (
            <section key={date} aria-labelledby={`appointments-${date}`} className="appointments-date-section">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `3px solid ${isToday ? 'var(--color-navy)' : isTomorrow ? 'var(--color-info-text)' : 'var(--color-border)'}`,
                  background: isToday || isTomorrow ? 'var(--color-blue-light)' : 'transparent',
                }}
              >
                <div>
                  <h2 id={`appointments-${date}`} style={{ margin: 0, color: 'var(--color-navy)', fontSize: 'var(--text-h4)', fontWeight: 700 }}>
                    {longDate(date)}
                  </h2>
                  <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                    {dayAppts.length} appointment{dayAppts.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {dateBadge ? <Badge variant={isToday ? 'navy' : 'blue'} type={isToday ? 'solid' : 'subtle'}>{dateBadge}</Badge> : null}
              </div>

              <div className="appointments-mobile-list">
                <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                  {sorted.map((appt, index) => (
                    <AppointmentMobileCard
                      key={appt.id}
                      appt={appt}
                      index={index}
                      handlers={appointmentHandlers}
                      inCabinExists={inCabinExists}
                    />
                  ))}
                </div>
              </div>

              <AppointmentsDataTable
                appointments={sorted}
                handlers={appointmentHandlers}
                inCabinExists={inCabinExists}
              />
            </section>
          )
        })}
      </div>

      {false && (
        <>
      {/* ── Appointment list ── */}
      <div className="space-y-6">
        {grouped.length === 0 && (
          <div className="rounded-xl text-center py-16"
            style={{ background: 'var(--tm-surface,#fff)', border: '1px solid #DDE4F0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--tm-surface2,#F7F9FF)', borderRadius: '12px' }}>
              <Calendar size={28} style={{ color: '#DDE4F0' }} />
            </div>
            <p className="text-[16px] font-semibold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>No appointments on this day</p>
            <p className="text-[13px] mt-1 mb-5" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Nothing scheduled yet for this date</p>
            {can('action_add_walkin') && (
              <Button leftIcon={<Plus size={16} strokeWidth={1.8} aria-hidden="true" />} onClick={() => setShowWalkIn(true)} className="mx-auto">Add Walk-in</Button>
            )}
          </div>
        )}

        {grouped.map(([date, dayAppts]) => {
          const isToday    = date === TODAY
          const isTomorrow = date === TOMORROW
          const sorted     = [...dayAppts].sort((a, b) => a.tokenNum - b.tokenNum)

          return (
            <div key={date}>
              {/* Date group header */}
              <div className="mb-3" style={{
                borderLeft: `3px solid ${isToday ? '#0F2D5E' : isTomorrow ? '#0891b2' : '#d1d5db'}`,
                background: isToday ? '#EFF6FF' : isTomorrow ? '#EFF6FF' : 'transparent',
                padding: '10px 16px',
                borderRadius: '0 6px 6px 0',
              }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--tm-text,#0F2D5E)' }}>{longDate(date)}</span>
                  {isToday    && <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#0F2D5E', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today</span>}
                  {isTomorrow && <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#0891b2', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tomorrow</span>}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--tm-text-muted,#6B7A9A)', marginTop: '2px' }}>
                  {dayAppts.length} appointment{dayAppts.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Table card */}
              <div className="rounded-xl overflow-hidden"
                style={{ background: 'var(--tm-surface,#fff)', border: '1px solid #DDE4F0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>

                {/*
                  ── MOBILE CARDS (< sm = < 640px) ──────────────────────────────
                  Rendered OUTSIDE ds-table-scroll so ds-table-scroll > * { min-width: 700px }
                  never applies here. Each card is naturally 100% wide on mobile.
                */}
                <div className="sm:hidden">
                  {sorted.map((appt, i) => {
                    const s = STATUS[appt.queueStatus] || STATUS.booked
                    return (
                      <motion.div
                        key={appt.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.025 }}
                        style={{ borderBottom: '1px solid #F7F9FF', borderLeft: `3px solid ${s.rowBorder}` }}
                      >
                        <div className="px-4 py-3">
                          {/* Token + Status */}
                          <div className="flex items-start justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[20px] font-bold font-mono" style={{ color: 'var(--tm-text,#0F2D5E)' }}>
                                T-{String(appt.tokenNum).padStart(2, '0')}
                              </span>
                              <span className="text-[11px] font-mono" style={{ color: '#DDE4F0' }}>{appt.id}</span>
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px',
                              borderRadius: '6px', background: s.bg, color: s.color,
                              border: `1px solid ${s.border}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {s.label}
                            </span>
                          </div>

                          {/* Time + Payment + Source */}
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-[13px] font-mono font-semibold" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{appt.time}</span>
                            {appt.paymentAmount ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '12px',
                                fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
                                background: '#e8f5e9', color: '#1b5e20', border: '1px solid #c8e6c9' }}>
                                <IndianRupee size={10} />{appt.paymentAmount}
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
                                background: '#fff3e0', color: '#e65100', border: '1px solid #ffcc80' }}>
                                Pending
                              </span>
                            )}
                            <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '4px',
                              background: 'var(--tm-surface2,#F7F9FF)', color: 'var(--tm-text-muted,#6B7A9A)' }}>{SOURCE_EMOJI[appt.type]} {appt.type}</span>
                          </div>

                          {/* Patient */}
                          <p className="text-[14px] font-semibold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>{appt.patientName}</p>
                          <p className="text-[12px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{appt.patientPhone}</p>
                          <VitalsInline vitals={appt.vitals} />
                          <p className="text-[12px] mb-2.5 mt-1" style={{ color: 'var(--tm-text,#2D3748)' }}>{appt.reason}</p>

                          {/* Actions — touch targets 44px min */}
                          <div className="flex items-center gap-3 flex-wrap">
                            {/* Vitals button — visible for waiting statuses only */}
                            {['booked','paid','vitals_done'].includes(appt.queueStatus) && (() => {
                              const vs = vitalsState(appt)
                              const cnt = vitalsFilledCount(appt.vitals)
                              return (
                                <button onClick={() => setVitalsModal(appt)}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                                    fontSize: 12, fontWeight: 700, minHeight: 40, border: '1.5px solid',
                                    background: vs === 'full' ? '#ECFDF5' : vs === 'partial' ? '#FFFBEB' : '#fff',
                                    color:      vs === 'full' ? '#16A34A' : vs === 'partial' ? '#D97706' : '#6B7280',
                                    borderColor:vs === 'full' ? '#BBF7D0' : vs === 'partial' ? '#FDE68A' : '#D1D5DB',
                                  }}>
                                  <Stethoscope size={13} />
                                  {vs === 'full' ? 'Vitals ✓' : vs === 'partial' ? `Update (${cnt}/6)` : '+ Vitals'}
                                </button>
                              )
                            })()}
                            {appt.queueStatus === 'booked' && (
                              <>
                                <button onClick={() => openPaymentModal(appt)}
                                  className="flex items-center gap-1.5 text-[13px] font-semibold px-3 rounded-xl transition-all"
                                  style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', minHeight: '44px' }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#fef3c7'}
                                  onMouseLeave={e => e.currentTarget.style.background = '#fffbeb'}>
                                  <IndianRupee size={13} /> Mark Paid
                                </button>
                                {can('action_cancel_appointment') && (
                                  <button onClick={() => markCancelled(appt.id)}
                                    className="flex items-center gap-1 text-[12px] font-semibold px-3 rounded-xl transition-all"
                                    style={{ color: 'var(--tm-text-muted,#6B7A9A)', border: '1px solid #DDE4F0', minHeight: '44px' }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#e11d48'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#6B7A9A'}>
                                    <X size={11} /> Cancel
                                  </button>
                                )}
                              </>
                            )}
                            {appt.queueStatus === 'paid' && (
                              <button onClick={() => sendToCabin(appt.id)} disabled={inCabinExists}
                                className="flex items-center gap-1.5 text-[13px] font-semibold px-3 rounded-xl transition-all"
                                style={inCabinExists
                                  ? { background: 'var(--tm-surface2,#F7F9FF)', color: '#DDE4F0', border: '1px solid #DDE4F0', cursor: 'not-allowed', minHeight: '44px' }
                                  : { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', cursor: 'pointer', minHeight: '44px' }}>
                                <UserCheck size={13} /> {inCabinExists ? 'Cabin Busy' : 'Send to Cabin'}
                              </button>
                            )}
                            {appt.queueStatus === 'in_cabin' && (
                              <button onClick={() => markComplete(appt.id)}
                                className="flex items-center gap-1.5 text-[13px] font-semibold px-3 rounded-xl transition-all"
                                style={{ background: 'var(--tm-surface2,#EFF6FF)', color: '#1A5CB5', border: '1px solid #BFDBFE', minHeight: '44px' }}>
                                <CheckCircle size={13} /> Complete Visit
                              </button>
                            )}
                            {['completed', 'no_show', 'cancelled'].includes(appt.queueStatus) && (
                              <span style={{ color: '#DDE4F0', fontSize: '13px' }}>—</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/*
                  ── DESKTOP TABLE (≥ sm = ≥ 640px) ─────────────────────────────
                  Wrapped in ds-table-scroll which sets min-width: 700px on children.
                  Safe here because viewport is wide enough (640px+).
                */}
                <div className="hidden sm:block ds-table-scroll">
                  {/* Column headers */}
                  <div className="px-5 py-2.5" style={{ background: 'var(--tm-surface2,#F7F9FF)', borderBottom: '1px solid #F7F9FF' }}>
                    <div className="grid items-center gap-3"
                      style={{ gridTemplateColumns: '36px 72px 1fr 1fr 80px 120px 110px 160px' }}>
                      {['#', 'Time', 'Patient', 'Reason / Source', 'Token', 'Payment', 'Status', 'Action'].map(h => (
                        <span key={h} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{h}</span>
                      ))}
                    </div>
                  </div>

                  {/* Desktop rows */}
                  {sorted.map((appt, i) => {
                    const s = STATUS[appt.queueStatus] || STATUS.booked
                    return (
                      <motion.div
                        key={appt.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.025 }}
                        style={{ borderBottom: '1px solid #F7F9FF', borderLeft: `3px solid ${s.rowBorder}` }}
                      >
                        <div className="px-5 grid items-center gap-3"
                          style={{ gridTemplateColumns: '36px 72px 1fr 1fr 80px 120px 110px 160px', minHeight: '60px' }}>

                          <span className="text-[12px] font-mono" style={{ color: '#DDE4F0' }}>{i + 1}</span>
                          <span className="text-[13px] font-mono font-semibold" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{appt.time}</span>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-[14px] font-semibold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>{appt.patientName}</p>
                              <span className="text-[10px] font-mono" style={{ color: '#DDE4F0' }}>{appt.id}</span>
                            </div>
                            <p className="text-[12px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{appt.patientPhone}</p>
                            <VitalsInline vitals={appt.vitals} />
                          </div>

                          <div>
                            <p className="text-[13px] truncate" style={{ color: 'var(--tm-text,#2D3748)' }}>{appt.reason}</p>
                            <p className="text-[12px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{appt.type}</p>
                          </div>

                          <div>
                            <span className="text-[14px] font-bold font-mono" style={{ color: 'var(--tm-text,#0F2D5E)' }}>
                              T-{String(appt.tokenNum).padStart(2, '0')}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock size={10} style={{ color: '#DDE4F0' }} />
                              <span className="text-[11px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{appt.duration || 15}m</span>
                            </div>
                          </div>

                          <div>
                            {appt.paymentAmount ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '13px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: '#e8f5e9', color: '#1b5e20', border: '1px solid #c8e6c9' }}>
                                <IndianRupee size={11} />{appt.paymentAmount}
                              </span>
                            ) : (
                              <span style={{ fontSize: '13px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: '#fff3e0', color: '#e65100', border: '1px solid #ffcc80', display: 'inline-block' }}>
                                Pending
                              </span>
                            )}
                          </div>

                          <span style={{ fontSize: '13px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: s.bg, color: s.color, border: `1px solid ${s.border}`, display: 'inline-block', whiteSpace: 'nowrap' }}>
                            {s.label}
                          </span>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {/* Vitals button */}
                            {['booked','paid','vitals_done'].includes(appt.queueStatus) && (() => {
                              const vs = vitalsState(appt)
                              const cnt = vitalsFilledCount(appt.vitals)
                              return (
                                <button onClick={() => setVitalsModal(appt)}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: '5px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                                    fontSize: 11, fontWeight: 700, border: '1.5px solid', whiteSpace: 'nowrap',
                                    background:   vs === 'full' ? '#ECFDF5' : vs === 'partial' ? '#FFFBEB' : '#fff',
                                    color:        vs === 'full' ? '#16A34A' : vs === 'partial' ? '#D97706' : '#6B7280',
                                    borderColor:  vs === 'full' ? '#BBF7D0' : vs === 'partial' ? '#FDE68A' : '#D1D5DB',
                                  }}>
                                  <Stethoscope size={11} />
                                  {vs === 'full' ? 'Vitals ✓' : vs === 'partial' ? `Vitals (${cnt}/6)` : '+ Vitals'}
                                </button>
                              )
                            })()}
                            {appt.queueStatus === 'booked' && (
                              <button onClick={() => openPaymentModal(appt)}
                                className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap"
                                style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fef3c7'}
                                onMouseLeave={e => e.currentTarget.style.background = '#fffbeb'}>
                                <IndianRupee size={12} /> Mark Paid
                              </button>
                            )}
                            {appt.queueStatus === 'paid' && (
                              <button onClick={() => sendToCabin(appt.id)} disabled={inCabinExists}
                                className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap"
                                style={inCabinExists
                                  ? { background: 'var(--tm-surface2,#F7F9FF)', color: '#DDE4F0', border: '1px solid #DDE4F0', cursor: 'not-allowed' }
                                  : { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', cursor: 'pointer' }}
                                onMouseEnter={e => { if (!inCabinExists) e.currentTarget.style.background = '#dbeafe' }}
                                onMouseLeave={e => { if (!inCabinExists) e.currentTarget.style.background = '#eff6ff' }}>
                                <UserCheck size={12} /> {inCabinExists ? 'Cabin Busy' : 'Send to Cabin'}
                              </button>
                            )}
                            {appt.queueStatus === 'in_cabin' && (
                              <button onClick={() => markComplete(appt.id)}
                                className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap"
                                style={{ background: 'var(--tm-surface2,#EFF6FF)', color: '#1A5CB5', border: '1px solid #BFDBFE' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                                onMouseLeave={e => e.currentTarget.style.background = '#EFF6FF'}>
                                <CheckCircle size={12} /> Complete
                              </button>
                            )}
                            {appt.queueStatus === 'booked' && can('action_cancel_appointment') && (
                              <button onClick={() => markCancelled(appt.id)}
                                className="flex items-center gap-1.5 text-[12px] font-semibold mt-1.5 transition-all"
                                style={{ color: 'var(--tm-text-muted,#6B7A9A)', fontSize: '11px' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#e11d48'}
                                onMouseLeave={e => e.currentTarget.style.color = '#6B7A9A'}>
                                <X size={10} /> Cancel
                              </button>
                            )}
                            {['completed', 'no_show', 'cancelled'].includes(appt.queueStatus) && (
                              <span className="text-[13px]" style={{ color: '#DDE4F0' }}>—</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

        </>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {showWalkIn && (
          <AnimatePresence>
            <AddWalkInForm onClose={() => setShowWalkIn(false)} onSuccess={addWalkIn} />
          </AnimatePresence>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {paymentModal && (
          <PaymentModal
            patient={paymentModal.patientName}
            tokenNum={paymentModal.tokenNum}
            onConfirm={(amount) => markPaid(paymentModal.id, amount)}
            onClose={() => setPaymentModal(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {vitalsModal && (
          <VitalsModal
            appt={vitalsModal}
            onClose={() => setVitalsModal(null)}
            onSave={saveVitals}
            onSaveAndSend={saveVitalsAndSend}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedAppt && (
          <AppointmentDetailDrawer
            appt={selectedAppt}
            onClose={() => setSelectedAppt(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            style={{
              position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
              background: '#0F2342', color: '#fff', borderRadius: 12,
              padding: '10px 20px', fontSize: 13, fontWeight: 600,
              boxShadow: '0 4px 24px rgba(0,0,0,0.18)', zIndex: 9999,
              display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            }}
          >
            <CheckCircle size={15} style={{ color: '#4ade80' }} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
