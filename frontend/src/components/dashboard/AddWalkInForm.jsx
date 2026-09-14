'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ChevronDown, ChevronUp, CheckCircle, AlertTriangle,
  Printer, MessageSquare, Plus, UserCheck, UserPlus,
} from 'lucide-react'
import { generateToken, getClinicConfig } from '../../../lib/rxStorage'
import { getFeeConfig, FEE_DEFAULTS } from '../../../lib/fees'
import { flagVitals, vitalsToStorage, hasAnyVital } from '../../../lib/vitals'
import { dashboardApi } from '../../services/dashboardApi'
import { trapFocus, getFocusableElements } from '../ui/focusUtils'

// ── Constants ──────────────────────────────────────────────────────────────────

const COMPLAINT_CHIPS = [
  'Fever', 'Cough / Cold', 'Body pain', 'BP check', 'Sugar check',
  'Stomach pain', 'Headache', 'Skin', 'Pediatric', 'Follow-up', 'Other',
]

const C = {
  navy:   '#0F2342',
  muted:  '#6B7A9A',
  border: '#E5E7EB',
  green:  '#16A34A',
  amber:  '#D97706',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().split('T')[0] }

function rawDigits(str) {
  let digits = (str || '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  return digits.slice(0, 10)
}

function formatPhone(raw) {
  const d = rawDigits(raw)
  return d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d
}

function calcAgeFromDob(dobStr) {
  if (!dobStr) return ''
  const today = new Date()
  const b = new Date(dobStr)
  let age = today.getFullYear() - b.getFullYear()
  const m = today.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--
  return String(Math.max(0, age))
}

function fmtDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtTime12(t24) {
  if (!t24) return ''
  const [h, m] = t24.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function generateTimeSlots(timings) {
  if (!timings) return []
  const slots = []
  function addRange(from, to) {
    if (!from || !to) return
    let [h, m] = from.split(':').map(Number)
    const [eh, em] = to.split(':').map(Number)
    while (h * 60 + m < eh * 60 + em) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
      m += 15
      if (m >= 60) { h++; m -= 60 }
    }
  }
  addRange(timings.morningFrom, timings.morningTo)
  addRange(timings.eveningFrom, timings.eveningTo)
  return slots
}

// ── Small UI primitives ────────────────────────────────────────────────────────

function SLabel({ children, optional }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 6px' }}>
      {children}
      {optional && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4, color: '#9CA3AF' }}>(optional)</span>}
    </p>
  )
}

function SHead({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 16px' }}>
      <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: '#C0C9D8', textTransform: 'uppercase', letterSpacing: '.08em', whiteSpace: 'nowrap' }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
    </div>
  )
}

function FocusInput({ value, onChange, placeholder, type = 'text', readOnly = false, maxLength, style: extra, autoFocus }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type} value={value} placeholder={placeholder} readOnly={readOnly}
      maxLength={maxLength} autoFocus={autoFocus}
      onChange={e => !readOnly && onChange(e.target.value)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width: '100%', boxSizing: 'border-box',
        border: `1.5px solid ${focused ? C.navy : C.border}`,
        borderRadius: 8, padding: '9px 12px',
        fontSize: 14, color: C.navy, background: readOnly ? '#F9FAFB' : '#fff',
        outline: 'none', fontFamily: 'inherit',
        cursor: readOnly ? 'default' : 'text',
        opacity: readOnly ? 0.75 : 1,
        transition: 'border .15s',
        ...extra,
      }}
    />
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AddWalkInForm({ onClose, onSuccess }) {
  const dialogRef = useRef(null)

  // ── State ──────────────────────────────────────────────────────────────────

  // Phone + lookup
  const [phoneInput,      setPhoneInput]      = useState('')
  const [matchedPatient,  setMatchedPatient]  = useState(null)
  const [lastVisit,       setLastVisit]       = useState(null)
  const [editDetails,     setEditDetails]     = useState(false)

  // Patient details
  const [name,      setName]      = useState('')
  const [ageMode,   setAgeMode]   = useState('years')
  const [ageYears,  setAgeYears]  = useState('')
  const [dob,       setDob]       = useState('')
  const [gender,    setGender]    = useState('')
  const [address,   setAddress]   = useState('')
  const [emergency, setEmergency] = useState('')

  // Complaint
  const [selectedChips, setSelectedChips] = useState(new Set())
  const [complaint,     setComplaint]     = useState('')
  const [otherText,     setOtherText]     = useState('')

  // Appointment time
  const [timeMode,   setTimeMode]   = useState('now')
  const [schedDate,  setSchedDate]  = useState(todayStr())
  const [schedTime,  setSchedTime]  = useState('')

  // Doctor
  const [doctorId, setDoctorId] = useState('dr001')

  // Vitals
  const [vitalsOpen, setVitalsOpen] = useState(false)
  const [vitals, setVitals] = useState({ temp: '', sbp: '', dbp: '', pulse: '', spo2: '', weight: '', notes: '' })

  // Payment
  const [consultType,   setConsultType]   = useState('new')
  const [customFee,     setCustomFee]     = useState('')
  const [payMode,       setPayMode]       = useState('cash')
  const [cashReceived,  setCashReceived]  = useState('')
  const [upiPaid,       setUpiPaid]       = useState(false)

  // Config loaded from storage
  const [fees,       setFees]      = useState(FEE_DEFAULTS)
  const [clinicCfg,  setClinicCfg] = useState(null)
  const [doctors,    setDoctors]   = useState([])
  const [timeSlots,  setTimeSlots] = useState([])

  // Result / success screen
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result,     setResult]     = useState(null)

  // Keep keyboard focus inside the walk-in overlay while it is open.
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

  // ── Load config ────────────────────────────────────────────────────────────
  useEffect(() => {
    const cfg = getClinicConfig()
    if (cfg) {
      setClinicCfg(cfg)
      if (cfg.doctors?.length) {
        setDoctors(cfg.doctors)
        setDoctorId(cfg.doctors.find(d => d.isPrimary)?.id || cfg.doctors[0].id)
      }
      if (cfg.timings) setTimeSlots(generateTimeSlots(cfg.timings))
    }
    const f = getFeeConfig()
    setFees(f)
    setCashReceived(String(f.newPatientFee))
  }, [])

  // ── Phone lookup (runs when 10 valid digits entered) ─────────────────────
  useEffect(() => {
    const digits = rawDigits(phoneInput)
    if (digits.length < 10) {
      setMatchedPatient(null)
      setLastVisit(null)
      return
    }

    // Look up patient from backend (not local storage)
    const lookupPatientFromBackend = async () => {
      try {
        const allPatients = await dashboardApi.getPatients?.() || []
        const found = allPatients.find(p => rawDigits(p.phone || '') === digits)
        setMatchedPatient(found || null)
        if (found) {
          setLastVisit(null) // TODO: compute from backend appointment history if needed
          if (!editDetails) {
            setName(found.name || '')
            setAgeYears(String(found.age || ''))
            setGender(found.gender || '')
            setAddress(found.address || '')
          }
        }
      } catch (e) {
        console.error('Patient lookup error:', e)
        setMatchedPatient(null)
      }
    }

    lookupPatientFromBackend()
  }, [phoneInput]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-detect consultation type ──────────────────────────────────────────
  useEffect(() => {
    if (matchedPatient && lastVisit && lastVisit.daysAgo <= fees.followUpWindowDays) {
      setConsultType('followup')
      setCashReceived(String(fees.followUpFee))
    } else {
      setConsultType('new')
      setCashReceived(String(fees.newPatientFee))
    }
  }, [matchedPatient, lastVisit, fees.followUpWindowDays, fees.followUpFee, fees.newPatientFee])

  // ── Helpers ────────────────────────────────────────────────────────────────

  function effectiveFee() {
    if (consultType === 'free')     return 0
    if (consultType === 'custom')   return Number(customFee) || 0
    if (consultType === 'followup') return fees.followUpFee
    return fees.newPatientFee
  }

  function toggleChip(chip) {
    setSelectedChips(prev => {
      const next = new Set(prev)
      if (next.has(chip)) next.delete(chip)
      else next.add(chip)
      const parts = Array.from(next).filter(c => c !== 'Other')
      if (next.has('Other') && otherText.trim()) parts.push(otherText.trim())
      setComplaint(parts.join(', '))
      return next
    })
  }

  function submitLabel() {
    if (submitting) return 'Adding…'
    const fee = effectiveFee()
    if (timeMode === 'scheduled' && schedTime) return `Schedule for ${fmtTime12(schedTime)}`
    if (consultType === 'free')    return 'Add to Queue (Free)'
    if (payMode === 'skip')        return 'Add to Queue (Payment Pending)'
    return `Add to Queue & Collect ₹${fee}`
  }

  const digits    = rawDigits(phoneInput)
  const validPhone = digits.length === 10 && /^[6-9]/.test(digits)
  const canSubmit  = name.trim().length > 0 && validPhone && !submitting
  const fee        = effectiveFee()
  const change     = payMode === 'cash' ? Math.max(0, (Number(cashReceived) || 0) - fee) : 0
  const vFlags     = flagVitals(vitals)
  const nextToken  = timeMode === 'now' ? generateToken(todayStr()) : generateToken(schedDate || todayStr())

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const age = ageMode === 'dob' ? Number(calcAgeFromDob(dob)) || undefined : Number(ageYears) || undefined
      const isScheduled = timeMode === 'scheduled' && schedDate && schedTime
      const apptDate = isScheduled ? schedDate : todayStr()
      const apptTime = isScheduled
        ? schedTime
        : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
      const vitalsData = hasAnyVital(vitals) ? vitalsToStorage(vitals) : {}

      const payload = {
        name: name.trim(),
        phone: digits,
        age,
        gender: gender || '',
        address: address.trim(),
        emergency: emergency.trim(),
        complaint: complaint.trim() || 'General consultation',
        doctorId,
        appointmentDate: apptDate,
        appointmentTime: apptTime,
        paymentAmount: fee,
        paymentMode: payMode,
        consultationType: consultType,
        vitals: vitalsData,
      }

      const finalResult = await dashboardApi.addWalkin(payload)
      setResult(finalResult)
      onSuccess?.(finalResult)
    } 
    catch (e) {
      console.error('Walk-in submission error:', e)
      setSubmitError(e?.detail || e?.message || 'Could not add this walk-in. Please check the connection and try again.')
    } 
    finally {
      setSubmitting(false)
    }
  }

  // ── Print receipt ──────────────────────────────────────────────────────────
  function printReceipt() {
    if (!result) return
    const clinic  = clinicCfg?.clinic || {}
    const doctor  = doctors.find(d => d.id === doctorId) || doctors[0] || {}
    const typeLong = { new: 'New Consultation', followup: 'Follow-up', free: 'Free', custom: 'Custom' }[consultType] || 'Consultation'
    const modeStr  = { cash: 'Cash', upi: 'UPI', card: 'Card', skip: 'Pending' }[result.payment.mode] || ''
    const statusStr = result.payment.status === 'paid' ? 'PAID' : result.payment.status === 'free' ? 'FREE' : 'PENDING'
    const now = new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    const w = window.open('', '_blank', 'width=320,height=560')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title><style>
      body{font-family:'Courier New',monospace;font-size:12px;padding:12px;margin:0;max-width:290px;line-height:1.5}
      hr{border:none;border-top:1px dashed #aaa;margin:8px 0}.c{text-align:center}.b{font-weight:bold}
    </style></head><body>
      <div class="c b" style="font-size:14px">${clinic.name || 'Clinic'}</div>
      <div class="c">${clinic.address || ''}</div>
      <div class="c">Ph: ${clinic.phone || ''}</div>
      <hr>
      <div>${now} &nbsp;&nbsp; Token #${result.appointment.token}</div>
      <div>Patient: ${name} &middot; ${digits}</div>
      <div>Doctor: Dr. ${doctor.name || ''}</div>
      <div>Type: ${typeLong}</div>
      <hr>
      <div class="b">Amount: &#8377;${result.payment.amount}</div>
      <div>Mode: ${modeStr}</div>
      <div>Status: ${statusStr}</div>
      <hr>
      <div class="c">Thank you for visiting</div>
      <script>window.onload=function(){window.print()}</script>
    </body></html>`)
    w.document.close()
  }

  // ── WhatsApp receipt ────────────────────────────────────────────────────────
  function sendWhatsApp() {
    if (!result || !digits) return
    const clinic  = clinicCfg?.clinic || {}
    const typeLong = { new: 'New Consultation', followup: 'Follow-up', free: 'Free', custom: 'Custom' }[consultType] || 'Consultation'
    const text = [
      `*${clinic.name || 'Clinic'} – Visit Receipt*`,
      `Date: ${new Date().toLocaleDateString('en-IN')}`,
      `Token: #${result.appointment.token}`,
      `Patient: ${name}`,
      `Type: ${typeLong}`,
      `Amount: ₹${result.payment.amount} (${result.payment.mode === 'skip' ? 'Pending' : result.payment.mode.toUpperCase()})`,
      ``,
      `Thank you for visiting!`,
    ].join('\n')
    window.open(`https://wa.me/91${digits}?text=${encodeURIComponent(text)}`, '_blank')
  }

  // ── Reset form ─────────────────────────────────────────────────────────────
  function resetForm() {
    setPhoneInput(''); setMatchedPatient(null); setLastVisit(null); setEditDetails(false)
    setName(''); setAgeMode('years'); setAgeYears(''); setDob(''); setGender(''); setAddress(''); setEmergency('')
    setSelectedChips(new Set()); setComplaint(''); setOtherText('')
    setTimeMode('now'); setSchedDate(todayStr()); setSchedTime('')
    setVitalsOpen(false); setVitals({ temp: '', sbp: '', dbp: '', pulse: '', spo2: '', weight: '', notes: '' })
    setConsultType('new'); setCustomFee(''); setPayMode('cash'); setCashReceived(String(fees.newPatientFee)); setUpiPaid(false)
    setResult(null)
  }

  // ── Overlay backdrop style ────────────────────────────────────────────────
  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 60,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: '16px', paddingTop: '24px',
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
    overflowY: 'auto',
  }

  const panelStyle = {
    width: '100%', maxWidth: 520,
    background: '#fff', borderRadius: 16,
    boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
    overflow: 'hidden', marginBottom: 24,
  }

  // ── SUCCESS SCREEN ─────────────────────────────────────────────────────────
  if (result) {
    const typeLong = { new: 'New Consultation', followup: 'Follow-up', free: 'Free', custom: 'Custom' }[consultType] || ''
    const payDesc  = result.payment.status === 'free'    ? 'Free'
                   : result.payment.status === 'pending' ? 'Payment pending'
                   : `₹${result.payment.amount} collected`
    return (
      <div style={overlayStyle} onClick={onClose}>
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="walkin-success-title"
          aria-describedby="walkin-success-description"
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          onClick={e => e.stopPropagation()}
          style={{ ...panelStyle, padding: 32, textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={30} style={{ color: C.green }} />
          </div>
          <h2 id="walkin-success-title" style={{ fontSize: 20, fontWeight: 800, color: C.navy, margin: '0 0 6px' }}>{name} added</h2>
          <p id="walkin-success-description" style={{ fontSize: 14, color: C.muted, margin: '0 0 24px' }}>
            Token #{result.appointment.token} &middot; {typeLong} &middot; {payDesc}
          </p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <button onClick={printReceipt}
              style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: C.navy, fontFamily: 'inherit' }}>
              <Printer size={14} /> Print receipt
            </button>
            {digits && (
              <button onClick={sendWhatsApp}
                style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#ECFDF5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: C.green, fontFamily: 'inherit' }}>
                <MessageSquare size={14} /> WhatsApp
              </button>
            )}
          </div>
          <button onClick={resetForm}
            style={{ width: '100%', padding: '12px', borderRadius: 12, background: C.navy, border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
            <Plus size={16} /> Add another walk-in
          </button>
          <button type="button" onClick={onClose}
            style={{ width: '100%', padding: '11px', borderRadius: 12, background: '#fff', border: `1.5px solid #E5E7EB`, cursor: 'pointer', color: C.muted, fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
            Close
          </button>
        </motion.div>
      </div>
    )
  }

  // ── MAIN FORM ──────────────────────────────────────────────────────────────
  const fieldLocked = !!matchedPatient && !editDetails

  return (
    <div style={overlayStyle} onClick={onClose}>
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="walkin-form-title"
        aria-describedby="walkin-form-description"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
        onClick={e => e.stopPropagation()}
        style={panelStyle}>

        {/* ── Header ── */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 id="walkin-form-title" style={{ fontSize: 17, fontWeight: 800, color: C.navy, margin: 0 }}>Add Walk-in</h2>
            <p id="walkin-form-description" style={{ fontSize: 12, color: C.muted, margin: '2px 0 0' }}>Quick booking for on-spot patients</p>
          </div>
          <button type="button" aria-label="Close walk-in form" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#F3F4F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
            <X size={15} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* ── PHONE ── */}
          <div>
            <SLabel>Phone Number</SLabel>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 600, color: '#9CA3AF', pointerEvents: 'none' }}>+91</span>
              <input
                type="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(formatPhone(e.target.value))}
                placeholder="98765 43210"
                autoFocus
                maxLength={11}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: `1.5px solid ${validPhone ? '#16A34A' : C.border}`,
                  borderRadius: 8, padding: '10px 14px 10px 40px',
                  fontSize: 16, fontFamily: 'inherit', color: C.navy,
                  outline: 'none', letterSpacing: '.04em', transition: 'border .15s', background: '#fff',
                }}
              />
            </div>
            {!validPhone && digits.length > 0 && digits.length < 10 && (
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Enter 10-digit number</p>
            )}
            {validPhone && digits.length === 10 && !/^[6-9]/.test(digits) && (
              <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>Must start with 6–9</p>
            )}

            {/* Lookup result */}
            <AnimatePresence>
              {validPhone && matchedPatient && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <UserCheck size={14} style={{ color: C.green, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>Welcome back, {matchedPatient.name?.split(' ')[0]}!</span>
                      {lastVisit && lastVisit.daysAgo <= fees.followUpWindowDays && (
                        <span style={{ fontSize: 10, fontWeight: 800, background: C.green, color: '#fff', padding: '2px 8px', borderRadius: 4, letterSpacing: '.04em' }}>FOLLOW-UP</span>
                      )}
                    </div>
                    {lastVisit && (
                      <p style={{ fontSize: 12, color: '#4B5563', margin: '4px 0 0', paddingLeft: 22 }}>
                        Last visit: {fmtDate(lastVisit.date)} · {lastVisit.daysAgo}d ago{lastVisit.reason ? ` · ${lastVisit.reason}` : ''}
                      </p>
                    )}
                    {!lastVisit && <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0', paddingLeft: 22 }}>Returning patient — no completed visits on record</p>}
                  </div>
                  <button onClick={() => setEditDetails(v => !v)}
                    style={{ fontSize: 12, color: C.green, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit', padding: 0, whiteSpace: 'nowrap' }}>
                    {editDetails ? 'Lock details' : 'Edit details'}
                  </button>
                </motion.div>
              )}
              {validPhone && !matchedPatient && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ marginTop: 10, padding: '8px 14px', borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserPlus size={14} style={{ color: '#1A5CB5' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF' }}>NEW PATIENT</span>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>— profile will be saved</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── PATIENT DETAILS ── */}
          <div>
            <SHead>Patient Details</SHead>

            {/* Name */}
            <div style={{ marginBottom: 12 }}>
              <SLabel>Full Name</SLabel>
              <FocusInput value={name} onChange={setName} placeholder="Patient's full name" readOnly={fieldLocked} />
            </div>

            {/* Age mode toggle */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <SLabel>Age</SLabel>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[['years', 'Age (yrs)'], ['dob', 'Date of birth']].map(([m, l]) => (
                    <button key={m} onClick={() => setAgeMode(m)}
                      style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1.5px solid', fontFamily: 'inherit',
                        background: ageMode === m ? C.navy : '#fff', color: ageMode === m ? '#fff' : C.muted, borderColor: ageMode === m ? C.navy : C.border }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {ageMode === 'years' ? (
                <FocusInput type="number" value={ageYears} onChange={setAgeYears} placeholder="0 – 120" readOnly={fieldLocked} />
              ) : (
                <div>
                  <FocusInput type="date" value={dob} onChange={v => { setDob(v); setAgeYears(calcAgeFromDob(v)) }} readOnly={fieldLocked} />
                  {dob && <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Age: {calcAgeFromDob(dob)} years</p>}
                </div>
              )}
            </div>

            {/* Gender */}
            <div style={{ marginBottom: 12 }}>
              <SLabel>Gender</SLabel>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Male', 'Female', 'Other'].map(g => (
                  <button key={g} onClick={() => !fieldLocked && setGender(g === gender ? '' : g)}
                    style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1.5px solid', cursor: fieldLocked ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all .15s',
                      background: gender === g ? C.navy : '#fff', color: gender === g ? '#fff' : '#374151',
                      borderColor: gender === g ? C.navy : C.border, opacity: fieldLocked ? 0.75 : 1 }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Address */}
            <div style={{ marginBottom: 12 }}>
              <SLabel optional>Locality / Area</SLabel>
              <FocusInput value={address} onChange={setAddress} placeholder="e.g. Vaishali Nagar" readOnly={fieldLocked} />
            </div>

            {/* Emergency */}
            <div>
              <SLabel optional>Emergency Contact</SLabel>
              <FocusInput value={emergency} onChange={setEmergency} placeholder="Name & phone number" />
            </div>
          </div>

          {/* ── CHIEF COMPLAINT ── */}
          <div>
            <SHead>Chief Complaint</SHead>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {COMPLAINT_CHIPS.map(chip => (
                <button key={chip} onClick={() => toggleChip(chip)}
                  style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', fontFamily: 'inherit', transition: 'all .15s',
                    background: selectedChips.has(chip) ? C.navy : '#fff',
                    color: selectedChips.has(chip) ? '#fff' : '#374151',
                    borderColor: selectedChips.has(chip) ? C.navy : C.border }}>
                  {chip}
                </button>
              ))}
            </div>
            {selectedChips.has('Other') && (
              <div style={{ marginBottom: 8 }}>
                <FocusInput value={otherText} onChange={v => {
                  setOtherText(v)
                  const parts = Array.from(selectedChips).filter(c => c !== 'Other')
                  if (v.trim()) parts.push(v.trim())
                  setComplaint(parts.join(', '))
                }} placeholder="Describe complaint…" />
              </div>
            )}
            <textarea
              value={complaint}
              onChange={e => setComplaint(e.target.value)}
              placeholder="Chief complaint (required)"
              rows={2}
              style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', color: C.navy, outline: 'none', resize: 'none', background: '#fff' }}
            />
          </div>

          {/* ── APPOINTMENT TIME ── */}
          <div>
            <SHead>Appointment Time</SHead>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Walk-in now */}
              <label style={{ display: 'flex', gap: 12, padding: '14px', borderRadius: 10, border: `2px solid ${timeMode === 'now' ? C.navy : C.border}`, cursor: 'pointer', background: timeMode === 'now' ? '#F0F4FF' : '#fff', transition: 'all .15s' }}>
                <input type="radio" name="wf_timeMode" value="now" checked={timeMode === 'now'} onChange={() => setTimeMode('now')} style={{ marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: 0 }}>Walk-in now — Auto-queue</p>
                  <p style={{ fontSize: 12, color: C.muted, margin: '3px 0 0' }}>System assigns next available slot</p>
                  {timeMode === 'now' && (
                    <p style={{ fontSize: 12, color: '#1A5CB5', margin: '6px 0 0', fontWeight: 700 }}>
                      Token #{nextToken} · Est. wait ~{Math.max(0, nextToken - 1) * 15} min
                    </p>
                  )}
                </div>
              </label>

              {/* Schedule */}
              <label style={{ display: 'flex', gap: 12, padding: '14px', borderRadius: 10, border: `2px solid ${timeMode === 'scheduled' ? C.navy : C.border}`, cursor: 'pointer', background: timeMode === 'scheduled' ? '#F0F4FF' : '#fff', transition: 'all .15s' }}>
                <input type="radio" name="wf_timeMode" value="scheduled" checked={timeMode === 'scheduled'} onChange={() => setTimeMode('scheduled')} style={{ marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: 0 }}>Schedule specific time</p>
                  <p style={{ fontSize: 12, color: C.muted, margin: '3px 0 0' }}>For patients coming at a fixed time later</p>
                  {timeMode === 'scheduled' && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
                      <input type="date" value={schedDate} min={todayStr()} onChange={e => setSchedDate(e.target.value)}
                        style={{ flex: 1, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: C.navy, outline: 'none', fontFamily: 'inherit', background: '#fff' }} />
                      <select value={schedTime} onChange={e => setSchedTime(e.target.value)}
                        style={{ flex: 1, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: C.navy, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                        <option value="">Select time</option>
                        {timeSlots.length > 0
                          ? timeSlots.map(t => <option key={t} value={t}>{fmtTime12(t)}</option>)
                          : ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','16:00','17:00','17:30','18:00','18:30','19:00','19:30'].map(t => (
                              <option key={t} value={t}>{fmtTime12(t)}</option>
                            ))
                        }
                      </select>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* ── DOCTOR (only if > 1) ── */}
          {doctors.length > 1 && (
            <div>
              <SHead>Doctor</SHead>
              <select value={doctorId} onChange={e => setDoctorId(e.target.value)}
                style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 14, color: C.navy, background: '#fff', outline: 'none', fontFamily: 'inherit' }}>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>Dr. {d.name}{d.specialty ? ` — ${d.specialty}` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {/* ── VITALS (collapsible) ── */}
          <div>
            <button onClick={() => setVitalsOpen(v => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${vitalsOpen ? C.navy : C.border}`, background: vitalsOpen ? '#F0F4FF' : '#F9FAFB', cursor: 'pointer', fontFamily: 'inherit' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: 0 }}>
                  Vitals <span style={{ fontWeight: 400, color: C.muted, fontSize: 12 }}>(optional — can be filled later by compounder)</span>
                </p>
              </div>
              {vitalsOpen ? <ChevronUp size={16} style={{ color: C.muted, flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: C.muted, flexShrink: 0 }} />}
            </button>

            <AnimatePresence>
              {vitalsOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                  <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><SLabel optional>Temperature (°F)</SLabel>
                        <FocusInput type="number" value={vitals.temp} onChange={v => setVitals(p => ({...p, temp: v}))} placeholder="98.6" /></div>
                      <div><SLabel optional>Pulse (bpm)</SLabel>
                        <FocusInput type="number" value={vitals.pulse} onChange={v => setVitals(p => ({...p, pulse: v}))} placeholder="72" /></div>
                    </div>

                    <div>
                      <SLabel optional>Blood Pressure (mmHg)</SLabel>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FocusInput type="number" value={vitals.sbp} onChange={v => setVitals(p => ({...p, sbp: v}))} placeholder="Systolic" style={{ flex: 1 }} />
                        <span style={{ color: C.muted, fontWeight: 700, fontSize: 20, lineHeight: 1 }}>/</span>
                        <FocusInput type="number" value={vitals.dbp} onChange={v => setVitals(p => ({...p, dbp: v}))} placeholder="Diastolic" style={{ flex: 1 }} />
                      </div>
                      {vFlags.highBP && (
                        <p style={{ fontSize: 12, color: C.amber, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AlertTriangle size={12} /> High BP — please note
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><SLabel optional>SpO₂ (%)</SLabel>
                        <FocusInput type="number" value={vitals.spo2} onChange={v => setVitals(p => ({...p, spo2: v}))} placeholder="99" />
                        {vFlags.lowSpo2 && <p style={{ fontSize: 12, color: C.amber, marginTop: 4 }}>⚠ Low SpO₂</p>}
                      </div>
                      <div><SLabel optional>Weight (kg)</SLabel>
                        <FocusInput type="number" value={vitals.weight} onChange={v => setVitals(p => ({...p, weight: v}))} placeholder="65" /></div>
                    </div>

                    <div>
                      <SLabel optional>Notes</SLabel>
                      <textarea value={vitals.notes} onChange={e => setVitals(p => ({...p, notes: e.target.value}))}
                        placeholder="Any additional observations…" rows={2}
                        style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', color: C.navy, outline: 'none', resize: 'none', background: '#fff' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── PAYMENT ── */}
          <div>
            <SHead>Payment</SHead>
            <div style={{ background: '#F9FAFB', borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Consult type + fee display */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 4px' }}>Consultation</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: C.navy, margin: 0 }}>
                    {consultType === 'new' ? 'New consultation' : consultType === 'followup' ? 'Follow-up' : consultType === 'free' ? 'Free' : 'Custom'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <select value={consultType} onChange={e => { setConsultType(e.target.value); if (e.target.value !== 'custom') setCashReceived(e.target.value === 'followup' ? String(fees.followUpFee) : e.target.value === 'free' ? '0' : String(fees.newPatientFee)) }}
                    style={{ border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, color: C.navy, background: '#fff', outline: 'none', fontFamily: 'inherit' }}>
                    <option value="new">New (₹{fees.newPatientFee})</option>
                    <option value="followup">Follow-up (₹{fees.followUpFee})</option>
                    <option value="free">Free</option>
                    <option value="custom">Custom</option>
                  </select>
                  <span style={{ fontSize: 24, fontWeight: 800, color: C.navy }}>₹{fee}</span>
                </div>
              </div>

              {/* Custom fee input */}
              {consultType === 'custom' && (
                <div>
                  <SLabel>Custom amount (₹)</SLabel>
                  <FocusInput type="number" value={customFee} onChange={v => { setCustomFee(v); setCashReceived(v) }} placeholder="Enter amount" />
                </div>
              )}

              {/* Payment mode */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 8px' }}>Payment Mode</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['cash','💵 Cash'],['upi','📱 UPI'],['card','💳 Card'],['skip','Skip']].map(([m, l]) => {
                    const avail = m === 'skip' || fees.acceptedModes.includes(m)
                    return (
                      <button key={m} onClick={() => { if (avail) { setPayMode(m); if (m !== 'upi') setUpiPaid(false) } }}
                        style={{ flex: 1, padding: '9px 4px', borderRadius: 8, border: '1.5px solid', cursor: avail ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', transition: 'all .15s',
                          background: payMode === m ? C.navy : '#fff',
                          color: payMode === m ? '#fff' : avail ? '#374151' : '#D1D5DB',
                          borderColor: payMode === m ? C.navy : avail ? C.border : '#E5E7EB',
                          opacity: avail ? 1 : 0.45 }}>
                        {l}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Cash details */}
              {payMode === 'cash' && consultType !== 'free' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <SLabel>Amount received (₹)</SLabel>
                    <FocusInput type="number" value={cashReceived} onChange={v => setCashReceived(v)} placeholder={String(fee)} />
                  </div>
                  <div>
                    <SLabel>Change due (₹)</SLabel>
                    <div style={{ padding: '9px 12px', borderRadius: 8, background: change > 0 ? '#FEF3C7' : '#F9FAFB', border: `1.5px solid ${C.border}`, fontSize: 16, fontWeight: 800, color: change > 0 ? C.amber : C.navy }}>
                      ₹{change}
                    </div>
                  </div>
                </div>
              )}

              {/* UPI details */}
              {payMode === 'upi' && consultType !== 'free' && (
                <div>
                  {fees.upiQrDataUrl ? (
                    <div style={{ textAlign: 'center' }}>
                      <img src={fees.upiQrDataUrl} alt="UPI QR" style={{ width: 130, height: 130, objectFit: 'contain', border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 8 }} />
                      <p style={{ fontSize: 13, color: C.muted, margin: '0 0 10px' }}>
                        Scan & pay <strong>₹{fee}</strong>{fees.upiId ? ` to ${fees.upiId}` : ''}
                      </p>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.navy }}>
                        <input type="checkbox" checked={upiPaid} onChange={e => setUpiPaid(e.target.checked)} />
                        Mark as paid (after patient confirms)
                      </label>
                    </div>
                  ) : (
                    <div style={{ padding: '10px 14px', background: '#FEF3C7', borderRadius: 8, fontSize: 12, color: '#92400E' }}>
                      <strong>UPI QR not uploaded.</strong> Go to Settings → Fees & Payment to upload clinic QR image.
                      {fees.upiId && <div style={{ marginTop: 4 }}>UPI ID: <strong>{fees.upiId}</strong></div>}
                    </div>
                  )}
                </div>
              )}

              {/* Skip warning */}
              {payMode === 'skip' && (
                <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: '#FEF3C7', borderRadius: 8, alignItems: 'flex-start' }}>
                  <AlertTriangle size={14} style={{ color: C.amber, flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: '#92400E', margin: 0 }}>
                    <strong>Payment pending</strong> — a pending record will be created. Collect before or after the appointment.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>{/* end scrollable body */}

        {/* ── Footer ── */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, background: '#fff' }}>
          {!name.trim() && validPhone && (
            <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', marginBottom: 8 }}>Enter patient name to continue</p>
          )}
          {submitError && (
            <div role="alert" style={{ marginBottom: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', fontSize: 12, fontWeight: 600 }}>
              {submitError}
            </div>
          )}
          <button onClick={handleSubmit} disabled={!canSubmit}
            style={{ width: '100%', padding: '13px', borderRadius: 12, background: canSubmit ? C.navy : '#9CA3AF', color: '#fff', border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', transition: 'background .15s' }}>
            {submitLabel()}
          </button>
        </div>

      </motion.div>
    </div>
  )
}
