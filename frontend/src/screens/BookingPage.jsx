'use client'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from '../utils/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ChevronLeft, Calendar, Clock, Phone, User, MessageCircle, Zap, MapPin, Star } from 'lucide-react'
import { clinicInfo, doctorInfo } from '../data/mockData'
import { formatPhone, isValidPhone, phoneError, phoneInputValue } from '../utils/phone'

// ─── Slot data ────────────────────────────────────────────────────────────────
const ALL_SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
                   '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30']

const BOOKED_TODAY    = new Set(['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','14:00','14:30'])
const BOOKED_TOMORROW = new Set(['09:00','09:30','10:00'])

const SOURCE_LABELS = {
  google:     'via Google Business',
  justdial:   'via Just Dial',
  missedcall: 'via Missed Call',
  'qr-clinic':'via Clinic QR Code',
  walkin:     'Walk-in Booking',
  default:    'Online Booking',
}

const SOURCE_COLORS = {
  google:     '#1a73e8',
  justdial:   '#d44200',
  missedcall: '#7c3aed',
  'qr-clinic':'#1A5CB5',
  walkin:     '#d97706',
  default:    '#1A5CB5',
}

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
}
function tomorrowLabel() {
  const d = new Date(); d.setDate(d.getDate() + 1)
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
}

// ─── OTP Input ────────────────────────────────────────────────────────────────
function OtpInput({ otp, setOtp, onComplete }) {
  const refs = [useRef(), useRef(), useRef(), useRef()]

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[i] = val; setOtp(next)
    if (val && i < 3) refs[i + 1].current?.focus()
    if (next.every(d => d !== '') && next.join('').length === 4) onComplete()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs[i - 1].current?.focus()
  }

  return (
    <div className="flex gap-3 justify-center">
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className="w-14 h-14 text-center text-[24px] font-bold rounded-xl border-2 outline-none transition-all"
          style={{
            borderColor: digit ? '#1A5CB5' : '#DDE4F0',
            color: '#0F2D5E',
            background: digit ? '#EFF6FF' : '#fff',
          }}
          autoFocus={i === 0}
        />
      ))}
    </div>
  )
}

// ─── Main booking page ────────────────────────────────────────────────────────
export default function BookingPage() {
  const [params]  = useSearchParams()
  const src       = params.get('src') || 'default'
  const srcLabel  = SOURCE_LABELS[src] || SOURCE_LABELS.default
  const srcColor  = SOURCE_COLORS[src] || SOURCE_COLORS.default

  // Steps: 'slots' → 'otp' → 'confirmed'
  const [step,         setStep]         = useState('slots')
  const [selectedDate, setSelectedDate] = useState('today')   // 'today' | 'tomorrow'
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [form,         setForm]         = useState({ name: '', phone: '', reason: '' })
  const [otp,          setOtp]          = useState(['', '', '', ''])
  const [resendTimer,  setResendTimer]  = useState(30)
  const [token,        setToken]        = useState(null)
  const [formError,    setFormError]    = useState('')

  const slots       = ALL_SLOTS
  const bookedSlots = selectedDate === 'today' ? BOOKED_TODAY : BOOKED_TOMORROW

  // Countdown for resend OTP
  useEffect(() => {
    if (step !== 'otp') return
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [step, resendTimer])

  const handleBook = () => {
    if (!selectedSlot) { setFormError('Please select a time slot'); return }
    if (!form.name.trim()) { setFormError('Please enter your name'); return }
    if (!isValidPhone(form.phone)) { setFormError(phoneError()); return }
    setFormError('')
    setStep('otp')
    setResendTimer(30)
  }

  const handleOtpComplete = () => {
    // Accept any 4-digit OTP in demo
    setTimeout(() => {
      setToken(`T-${12 + Math.floor(Math.random() * 6)}`)
      setStep('confirmed')
    }, 600)
  }

  const confirmedDate = selectedDate === 'today' ? todayLabel() : tomorrowLabel()
  const confirmedTime = selectedSlot
    ? new Date(`2000-01-01T${selectedSlot}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : ''

  const gcalUrl = () => {
    const base = 'https://www.google.com/calendar/render?action=TEMPLATE'
    const title = encodeURIComponent(`Appointment at ${clinicInfo.name}`)
    const details = encodeURIComponent(`Dr. ${doctorInfo.name} · Token ${token}`)
    const loc = encodeURIComponent(clinicInfo.address)
    return `${base}&text=${title}&details=${details}&location=${loc}`
  }

  return (
    <main style={{ background: '#F7F9FF', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#1A5CB5', padding: '0 16px', height: '56px',
        display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 28, height: 28, borderRadius: '7px',
            background: 'linear-gradient(135deg, #1A5CB5 0%, #1A5CB5 100%)',
            border: '1.5px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={13} color="white" fill="white" />
          </div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '16px' }}>
            Trik<span style={{ color: '#E5402B' }}>Med</span>
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)',
          background: 'rgba(255,255,255,0.12)', padding: '3px 10px', borderRadius: '12px' }}>
          {srcLabel}
        </span>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px 16px 40px' }}>
        <AnimatePresence mode="wait">

          {/* ── STEP 1: Slot Selection ── */}
          {step === 'slots' && (
            <motion.div key="slots"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="space-y-4">

              {/* Doctor card */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '20px',
                border: '1px solid #DDE4F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <div style={{ width: 64, height: 64, borderRadius: '16px', background: '#1A5CB5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                    RS
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '17px', fontWeight: 800, color: '#0F2D5E' }}>
                        {doctorInfo.name}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: srcColor,
                        background: src === 'default' ? '#F7F9FF' : SOURCE_COLORS[src] + '18',
                        padding: '2px 8px', borderRadius: '12px' }}>
                        {srcLabel}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#6B7A9A', marginTop: '3px' }}>
                      {doctorInfo.specialization}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={11} fill={s <= 4 ? '#f59e0b' : 'none'}
                            color={s <= 4 ? '#f59e0b' : '#d1d5db'} />
                        ))}
                        <span style={{ fontSize: '12px', color: '#6B7A9A', marginLeft: '2px' }}>4.8 (312)</span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#9DBDE8' }}>{doctorInfo.experience} exp.</span>
                    </div>
                  </div>
                </div>

                <div style={{ height: '1px', background: '#F7F9FF', margin: '14px 0' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <MapPin size={13} style={{ color: '#9DBDE8', marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#6B7A9A', lineHeight: 1.4 }}>{clinicInfo.address}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={13} style={{ color: '#9DBDE8' }} />
                    <span style={{ fontSize: '13px', color: '#6B7A9A' }}>
                      {clinicInfo.timings.days}, {clinicInfo.timings.open} – {clinicInfo.timings.close}
                    </span>
                  </div>
                </div>
              </div>

              {/* Date tabs */}
              <div style={{ display: 'flex', background: '#fff', borderRadius: '12px',
                border: '1px solid #DDE4F0', overflow: 'hidden' }}>
                {[
                  { key: 'today',    label: 'Today',    sub: todayLabel() },
                  { key: 'tomorrow', label: 'Tomorrow', sub: tomorrowLabel() },
                ].map(d => (
                  <button key={d.key} onClick={() => { setSelectedDate(d.key); setSelectedSlot(null) }}
                    style={{
                      flex: 1, padding: '14px 16px', border: 'none', cursor: 'pointer',
                      background: selectedDate === d.key ? '#F7F9FF' : '#fff',
                      borderRight: d.key === 'today' ? '1px solid #DDE4F0' : 'none',
                      borderBottom: selectedDate === d.key ? `2px solid ${srcColor}` : '2px solid transparent',
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ fontSize: '15px', fontWeight: 700,
                      color: selectedDate === d.key ? srcColor : '#6B7A9A' }}>{d.label}</div>
                    <div style={{ fontSize: '11px', color: '#9DBDE8', marginTop: '2px' }}>{d.sub}</div>
                  </button>
                ))}
              </div>

              {/* Slot grid */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '20px',
                border: '1px solid #DDE4F0' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#0F2D5E', marginBottom: '12px' }}>
                  Available Time Slots
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {slots.map(slot => {
                    const booked   = bookedSlots.has(slot)
                    const selected = selectedSlot === slot
                    return (
                      <button key={slot} disabled={booked}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          padding: '10px 8px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                          cursor: booked ? 'not-allowed' : 'pointer', transition: 'all 0.12s',
                          background: selected ? srcColor : booked ? '#f9fafb' : '#F7F9FF',
                          color: selected ? '#fff' : booked ? '#c8d8a0' : '#3a5a35',
                          border: selected ? `1.5px solid ${srcColor}` : booked ? '1.5px solid #F7F9FF' : '1.5px solid #DDE4F0',
                          textDecoration: booked ? 'line-through' : 'none',
                          opacity: booked ? 0.6 : 1,
                        }}>
                        {slot}
                        {booked && <div style={{ fontSize: '10px', color: '#c8d8a0', textDecoration: 'none', marginTop: '1px' }}>Booked</div>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Patient details form */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '20px',
                border: '1px solid #DDE4F0' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#0F2D5E', marginBottom: '14px' }}>
                  Your Details
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Name */}
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: '14px', top: '50%',
                      transform: 'translateY(-50%)', color: '#9DBDE8' }} />
                    <input type="text" placeholder="Full Name" value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      style={{ width: '100%', padding: '12px 14px 12px 38px', borderRadius: '10px',
                        border: '1.5px solid #DDE4F0', fontSize: '15px', color: '#0F2D5E',
                        outline: 'none', boxSizing: 'border-box', background: '#fff' }} />
                  </div>
                  {/* Phone */}
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={{ position: 'absolute', left: '14px', top: '50%',
                      transform: 'translateY(-50%)', color: '#9DBDE8' }} />
                    <input type="tel" inputMode="numeric" placeholder="98765 43210" value={formatPhone(form.phone)}
                      onChange={e => setForm(f => ({ ...f, phone: phoneInputValue(e.target.value) }))}
                      style={{ width: '100%', padding: '12px 14px 12px 38px', borderRadius: '10px',
                        border: '1.5px solid #DDE4F0', fontSize: '15px', color: '#0F2D5E',
                        outline: 'none', boxSizing: 'border-box', background: '#fff' }} />
                  </div>
                  {/* Reason (optional) */}
                  <textarea placeholder="Reason for visit (optional) — e.g. Fever, Follow-up"
                    value={form.reason} rows={2}
                    onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px',
                      border: '1.5px solid #DDE4F0', fontSize: '14px', color: '#0F2D5E',
                      outline: 'none', boxSizing: 'border-box', resize: 'none', background: '#fff',
                      fontFamily: 'system-ui, sans-serif' }} />
                </div>

                {formError && (
                  <p style={{ fontSize: '13px', color: '#e11d48', marginTop: '10px', fontWeight: 600 }}>
                    ⚠ {formError}
                  </p>
                )}
              </div>

              {/* OTP note */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                borderRadius: '12px', background: '#EFF6FF', border: '1px solid #EFF6FF' }}>
                <MessageCircle size={16} style={{ color: '#25D366', flexShrink: 0 }} />
                <p style={{ fontSize: '13px', color: '#1A5CB5', fontWeight: 500 }}>
                  An OTP will be sent to your WhatsApp to confirm the booking
                </p>
              </div>

              {/* Book button */}
              <button onClick={handleBook}
                style={{ width: '100%', padding: '16px', borderRadius: '14px', fontSize: '16px',
                  fontWeight: 700, color: '#fff', background: srcColor, border: 'none',
                  cursor: 'pointer', transition: 'opacity 0.15s',
                  boxShadow: `0 4px 16px ${srcColor}40` }}>
                Book Appointment →
              </button>
            </motion.div>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 'otp' && (
            <motion.div key="otp"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Back */}
              <button onClick={() => setStep('slots')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6B7A9A',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px',
                  fontWeight: 600, padding: 0 }}>
                <ChevronLeft size={16} /> Back
              </button>

              <div style={{ background: '#fff', borderRadius: '16px', padding: '28px 24px',
                border: '1px solid #DDE4F0', textAlign: 'center' }}>
                {/* WhatsApp icon */}
                <div style={{ width: 60, height: 60, borderRadius: '16px', background: '#EFF6FF',
                  border: '2px solid #EFF6FF', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 16px' }}>
                  <MessageCircle size={26} style={{ color: '#25D366' }} />
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F2D5E', marginBottom: '8px' }}>
                  Verify your WhatsApp
                </h2>
                <p style={{ fontSize: '14px', color: '#6B7A9A', marginBottom: '6px' }}>
                  We sent a 4-digit OTP to
                </p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#0F2D5E', marginBottom: '24px' }}>
                  {formatPhone(form.phone) || '98765 43210'}
                </p>

                <OtpInput otp={otp} setOtp={setOtp} onComplete={handleOtpComplete} />

                <p style={{ fontSize: '12px', color: '#9DBDE8', marginTop: '20px' }}>
                  {resendTimer > 0
                    ? `Resend OTP in ${resendTimer}s`
                    : <span style={{ color: srcColor, fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => setResendTimer(30)}>Resend OTP</span>
                  }
                </p>
              </div>

              {/* Selected slot summary */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px',
                border: '1px solid #DDE4F0', display: 'flex', gap: '16px' }}>
                <Calendar size={18} style={{ color: '#9DBDE8', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#0F2D5E' }}>{confirmedDate}</p>
                  <p style={{ fontSize: '13px', color: '#6B7A9A', marginTop: '2px' }}>
                    {confirmedTime} · {doctorInfo.name}
                  </p>
                </div>
              </div>

              <button onClick={handleOtpComplete}
                disabled={otp.some(d => d === '')}
                style={{ width: '100%', padding: '16px', borderRadius: '14px', fontSize: '16px',
                  fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer',
                  background: otp.every(d => d !== '') ? srcColor : '#DDE4F0',
                  transition: 'all 0.15s' }}>
                Confirm Booking
              </button>
            </motion.div>
          )}

          {/* ── STEP 3: Confirmed ── */}
          {step === 'confirmed' && (
            <motion.div key="confirmed"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Success card */}
              <div style={{ background: '#fff', borderRadius: '20px', padding: '32px 24px',
                border: '1px solid #DDE4F0', textAlign: 'center',
                boxShadow: '0 8px 32px rgba(45,90,39,0.1)' }}>

                {/* Check */}
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.1 }}
                  style={{ width: 80, height: 80, borderRadius: '50%', background: '#EFF6FF',
                    border: '3px solid #BFDBFE', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle size={40} style={{ color: '#1A5CB5' }} />
                </motion.div>

                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F2D5E', marginBottom: '6px' }}>
                  Booking Confirmed!
                </h2>
                <p style={{ fontSize: '14px', color: '#6B7A9A', marginBottom: '24px' }}>
                  See you soon, {form.name.split(' ')[0] || 'there'}!
                </p>

                {/* Token */}
                <div style={{ background: srcColor, borderRadius: '16px', padding: '20px',
                  marginBottom: '20px', boxShadow: `0 4px 20px ${srcColor}40` }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.65)',
                    letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Your Token Number
                  </p>
                  <p style={{ fontSize: '52px', fontWeight: 900, color: '#fff', letterSpacing: '-2px',
                    lineHeight: 1, fontFamily: 'monospace' }}>
                    {token}
                  </p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>
                    Show this at the reception
                  </p>
                </div>

                {/* Details */}
                <div style={{ background: '#F7F9FF', borderRadius: '12px', padding: '16px',
                  textAlign: 'left', marginBottom: '20px' }}>
                  {[
                    { icon: User,     label: 'Patient',  value: form.name },
                    { icon: Calendar, label: 'Date',     value: confirmedDate },
                    { icon: Clock,    label: 'Time',     value: confirmedTime },
                    { icon: MapPin,   label: 'Clinic',   value: clinicInfo.name },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px',
                      marginBottom: '10px' }}>
                      <r.icon size={14} style={{ color: '#9DBDE8', marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: '#9DBDE8', width: '56px', flexShrink: 0 }}>
                        {r.label}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F2D5E' }}>{r.value}</span>
                    </div>
                  ))}
                </div>

                {/* WhatsApp confirmation note */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px',
                  borderRadius: '10px', background: '#EFF6FF', border: '1px solid #EFF6FF',
                  marginBottom: '20px' }}>
                  <MessageCircle size={15} style={{ color: '#25D366', flexShrink: 0 }} />
                  <p style={{ fontSize: '13px', color: '#1A5CB5' }}>
                    Appointment details sent to your WhatsApp. You'll get a reminder 1 hour before.
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a href={gcalUrl()} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 700,
                      color: '#fff', background: srcColor, textDecoration: 'none' }}>
                    <Calendar size={16} /> Add to Google Calendar
                  </a>
                  <button onClick={() => { setStep('slots'); setSelectedSlot(null); setForm({ name: '', phone: '', reason: '' }); setOtp(['','','','']); setToken(null) }}
                    style={{ padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                      color: '#6B7A9A', background: '#F7F9FF', border: '1px solid #DDE4F0', cursor: 'pointer' }}>
                    ← Book Another Appointment
                  </button>
                </div>
              </div>

              {/* Footer */}
              <p style={{ textAlign: 'center', fontSize: '12px', color: '#9DBDE8' }}>
                Powered by <span style={{ fontWeight: 700, color: '#1A5CB5' }}>TrikMed</span> · Clinic Management AI
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
