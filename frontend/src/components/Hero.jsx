'use client'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { ArrowRight, Bot, CalendarCheck, CheckCircle2, ChevronDown, PhoneCall, ShieldCheck, X } from 'lucide-react'
import { useNavigate } from '../utils/navigation'
import api from '../services/api'
import { formatPhone, isValidPhone, phoneError, phoneInputValue } from '../utils/phone'
import { Button } from './ui/Button'
import Alert from './ui/Alert'
import Skeleton from './ui/Skeleton'
import TrikMedLogo from './TrikMedLogo'

const SPECIALTIES = [
  'General Physician', 'Pediatrician', 'Dermatologist', 'Gynecologist',
  'Orthopedic', 'ENT', 'Dentist', 'Ophthalmologist', 'Cardiologist', 'Other',
]

const fieldStyle = {
  width: '100%',
  minHeight: '42px',
  borderRadius: 'var(--radius-md)',
  padding: '0 var(--space-3)',
  border: 'calc(var(--space-0-5) / 2) solid rgba(255,255,255,0.16)',
  background: 'rgba(255,255,255,0.07)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

function BookDemoModal({ onClose }) {
  const [form, setForm] = useState({ clinic: '', doctor: '', specialty: SPECIALTIES[0], phone: '', city: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }))

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!isValidPhone(form.phone)) {
      setError(phoneError())
      return
    }
    setLoading(true)
    try {
      await api.post('/demo-requests', { ...form, phone: phoneInputValue(form.phone) })
      setSubmitted(true)
    } catch (err) {
      setError(err?.detail || err?.message || 'Could not book demo. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--space-4)',
        background: 'rgba(0,0,0,0.62)',
        backdropFilter: 'blur(6px)',
      }}
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <Motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-demo-title"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 'min(100%, 460px)',
          borderRadius: 'var(--radius-2xl)',
          border: 'calc(var(--space-0-5) / 2) solid rgba(255,255,255,0.12)',
          background: 'var(--color-navy)',
          boxShadow: 'var(--shadow-xl)',
          padding: 'var(--space-8)',
          position: 'relative',
          color: 'var(--color-text-inverse)',
        }}
      >
        <button
          type="button"
          aria-label="Close demo form"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 'var(--space-4)',
            right: 'var(--space-4)',
            display: 'inline-grid',
            placeItems: 'center',
            width: '34px',
            height: '34px',
            border: 0,
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.72)',
            cursor: 'pointer',
          }}
        >
          <X size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>

        {submitted ? (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
            <Skeleton variant="circle" width="64px" height="64px" style={{ margin: '0 auto var(--space-5)', background: 'var(--color-success-bg)' }} />
            <CheckCircle2 size={34} strokeWidth={1.8} style={{ color: 'var(--color-success-text)', marginTop: '-58px', marginBottom: 'var(--space-5)' }} aria-hidden="true" />
            <h2 id="book-demo-title" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h3)' }}>
              Demo booked
            </h2>
            <p style={{ margin: 'var(--space-2) auto 0', color: 'rgba(255,255,255,0.72)', lineHeight: 1.65 }}>
              Thanks, {form.doctor}. Our team will call {formatPhone(form.phone)} within 2 hours.
            </p>
            <Button variant="coral" onClick={onClose} style={{ marginTop: 'var(--space-6)' }}>
              Done
            </Button>
          </Motion.div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              <TrikMedLogo size="md" dark />
              <div>
                <h2 id="book-demo-title" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h3)' }}>
                  Book a Free Demo
                </h2>
                <p style={{ margin: 'var(--space-1) 0 0', color: 'rgba(255,255,255,0.62)', fontSize: 'var(--text-sm)' }}>
                  See TrikMed in action for your clinic.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {error ? <Alert variant="error" size="sm">{error}</Alert> : null}
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'var(--space-3)' }}>
                <Field label="Clinic name">
                  <input value={form.clinic} onChange={event => set('clinic', event.target.value)} placeholder="Sharma Clinic" required style={fieldStyle} />
                </Field>
                <Field label="Doctor name">
                  <input value={form.doctor} onChange={event => set('doctor', event.target.value)} placeholder="Dr. Ramesh Sharma" required style={fieldStyle} />
                </Field>
              </div>
              <Field label="Speciality">
                <span style={{ position: 'relative' }}>
                  <select value={form.specialty} onChange={event => set('specialty', event.target.value)} required style={{ ...fieldStyle, appearance: 'none', paddingRight: 'var(--space-10)' }}>
                    {SPECIALTIES.map(specialty => <option key={specialty} value={specialty} style={{ color: 'var(--color-text-primary)' }}>{specialty}</option>)}
                  </select>
                  <ChevronDown size={15} strokeWidth={1.8} aria-hidden="true" style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', pointerEvents: 'none' }} />
                </span>
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'var(--space-3)' }}>
                <Field label="Phone number">
                  <input type="tel" inputMode="numeric" value={formatPhone(form.phone)} onChange={event => set('phone', phoneInputValue(event.target.value))} placeholder="98765 43210" required style={fieldStyle} />
                </Field>
                <Field label="City">
                  <input value={form.city} onChange={event => set('city', event.target.value)} placeholder="Jaipur" required style={fieldStyle} />
                </Field>
              </div>
              <Button type="submit" variant="coral" size="lg" fullWidth isLoading={loading} rightIcon={<ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />} style={{ marginTop: 'var(--space-2)' }}>
                Schedule Demo Call
              </Button>
              <p style={{ margin: 0, textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 'var(--text-xs)' }}>
                Our team calls within 2 hours
              </p>
            </form>
          </>
        )}
      </Motion.div>
    </Motion.div>
  )
}

function PhoneCard() {
  const messages = [
    { from: 'ai', name: 'TrikMed AI', body: 'Namaste. Would you like to book an appointment?', meta: '10:30 AM' },
    { from: 'patient', body: 'Yes, tomorrow 11 AM works.', meta: '10:31 AM' },
    { from: 'ai', body: 'Confirmed. Reminder set for 10 AM.', meta: '10:31 AM' },
  ]

  return (
    <div style={{ width: 'min(320px, 86vw)', borderRadius: '28px', overflow: 'hidden', background: '#ECE5DD', boxShadow: '0 0 0 1px var(--color-border), var(--shadow-xl)' }}>
      <div style={{ background: 'var(--color-navy)', padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--color-coral)', display: 'grid', placeItems: 'center', color: 'var(--color-text-inverse)' }}>
          <Bot size={18} strokeWidth={1.8} />
        </div>
        <div>
          <p style={{ margin: 0, color: 'var(--color-text-inverse)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>TrikMed AI</p>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.72)', fontSize: 'var(--text-xs)' }}>Online now</p>
        </div>
      </div>
      <div style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)', minHeight: '240px' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', borderRadius: 'var(--radius-full)', padding: 'var(--space-1) var(--space-3)', background: 'rgba(0,0,0,0.08)', color: '#555', fontSize: 'var(--text-2xs)' }}>
            <PhoneCall size={11} strokeWidth={1.8} /> Missed call recovered
          </span>
        </div>
        {messages.map((message, index) => (
          <Motion.div
            key={index}
            initial={{ opacity: 0, x: message.from === 'patient' ? 14 : -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + index * 0.35, duration: 0.35 }}
            style={{
              justifySelf: message.from === 'patient' ? 'end' : 'start',
              maxWidth: message.from === 'patient' ? '76%' : '88%',
              borderRadius: message.from === 'patient' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              padding: 'var(--space-3)',
              background: message.from === 'patient' ? 'var(--color-coral)' : 'var(--color-surface)',
              color: message.from === 'patient' ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            {message.name ? <p style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-2xs)', fontWeight: 700, color: 'var(--color-blue)' }}>{message.name}</p> : null}
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', lineHeight: 1.55 }}>{message.body}</p>
            <p style={{ margin: 'var(--space-1) 0 0', textAlign: 'right', fontSize: 'var(--text-2xs)', opacity: 0.65 }}>{message.meta}</p>
          </Motion.div>
        ))}
      </div>
    </div>
  )
}

export default function Hero() {
  const navigate = useNavigate()
  const [showDemo, setShowDemo] = useState(false)

  useEffect(() => {
    const open = () => setShowDemo(true)
    window.addEventListener('open-book-demo', open)
    return () => window.removeEventListener('open-book-demo', open)
  }, [])

  return (
    <section
      aria-label="TrikMed AI receptionist"
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        padding: 'calc(64px + var(--space-16)) var(--space-6) var(--space-20)',
        display: 'grid',
        alignItems: 'center',
        background: 'radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--color-coral) 16%, transparent), transparent 32%), radial-gradient(circle at 12% 76%, color-mix(in srgb, var(--color-navy) 14%, transparent), transparent 34%), var(--color-bg)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.42,
          backgroundImage: 'radial-gradient(circle, var(--color-border) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] items-center" style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', gap: 'var(--space-16)', width: '100%' }}>
        <div style={{ maxWidth: '680px' }}>
          {[
            <span key="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', borderRadius: 'var(--radius-full)', padding: 'var(--space-2) var(--space-4)', background: 'rgba(232,102,61,0.12)', border: 'calc(var(--space-0-5) / 2) solid rgba(232,102,61,0.28)', color: 'var(--color-coral)', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <ShieldCheck size={14} strokeWidth={1.8} /> Beta access for Indian clinics
            </span>,
            <h1 key="title" style={{ margin: 'var(--space-6) 0 var(--space-5)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-display)', lineHeight: 1.04, letterSpacing: '-0.04em', color: 'var(--color-navy)' }}>
              Meet TrikMed — your clinic&apos;s Healthcare Intelligence (HI)
            </h1>,
            <p key="copy" style={{ margin: 0, maxWidth: '600px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-lg)', lineHeight: 1.75 }}>
              Speak your prescription, automate bookings and missed-call recovery, and send reminders — all on WhatsApp, no app for your patients to download. Powered by the Flupto AI engine.
            </p>,
            <div key="actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginTop: 'var(--space-8)' }}>
              <Button variant="coral" size="lg" rightIcon={<ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />} onClick={() => setShowDemo(true)}>Book Free Demo</Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/login')}>Login</Button>
            </div>,
            <div key="stats" className="grid grid-cols-3" style={{ gap: 'var(--space-3)', marginTop: 'var(--space-8)', maxWidth: '560px' }}>
              {[
                ['500+', 'Clinics ready'],
                ['60%', 'No-show reduction'],
                ['24/7', 'AI response'],
              ].map(([value, label]) => (
                <div key={label} style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.72)', border: 'calc(var(--space-0-5) / 2) solid var(--color-border)', boxShadow: 'var(--shadow-xs)' }}>
                  <strong style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-h4)', color: 'var(--color-navy)' }}>{value}</strong>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>,
          ].map((node, index) => (
            <Motion.div key={index} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}>
              {node}
            </Motion.div>
          ))}
        </div>
        <Motion.div
          initial={{ opacity: 0, y: 36, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.44, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'grid', placeItems: 'center' }}
        >
          <Motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
            <PhoneCard />
          </Motion.div>
        </Motion.div>
      </div>

      <AnimatePresence>
        {showDemo ? <BookDemoModal onClose={() => setShowDemo(false)} /> : null}
      </AnimatePresence>
    </section>
  )
}
