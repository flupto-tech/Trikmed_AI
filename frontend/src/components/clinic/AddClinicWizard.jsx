'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, ChevronRight, Building2, User, MessageSquare,
  ClipboardList, AlertCircle, Loader,
} from 'lucide-react'
import { useNavigate } from '../../utils/navigation'

const DS = {
  bg: '#F7F9FF', cardBg: '#ffffff', border: '#DDE4F0',
  primary: '#0F2D5E', accent: '#E5402B', secondary: '#1A5CB5',
  textMuted: '#6B7A9A', textSubtle: '#9DBDE8',
  badgeBg: '#FFE9E6', badgeText: '#C0311C', darkBg: '#0A1E40',
}

const STEPS = [
  { id: 1, label: 'Basic Info',       icon: Building2     },
  { id: 2, label: 'Doctor Info',      icon: User          },
  { id: 3, label: 'WhatsApp & QR',   icon: MessageSquare },
  { id: 4, label: 'Review & Submit', icon: ClipboardList  },
]

const CITIES = ['Jaipur','Delhi','Mumbai','Ahmedabad','Pune','Hyderabad','Chennai','Kolkata','Bengaluru','Lucknow']
const ZONES  = ['North Zone','South Zone','West Zone','East Zone']
const SPECS  = ['General Physician','Pediatrician','Gynecologist','Orthopedic','Dermatologist','ENT','Dentist','Ophthalmologist','Cardiologist','Neurologist','Psychiatrist','Other']
const MRS    = ['Suresh Kumar','Priya Patel','Raj Malhotra','Sunita Rao','Ravi Kumar']
const SLOTS  = ['5','10','15','20','30','45','60']
const LANGS  = ['Hindi','English','Marathi','Tamil','Telugu','Kannada','Bengali','Gujarati','Punjabi','Malayalam']
const TIMES  = ['06:00 AM','07:00 AM','08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM','07:00 PM','08:00 PM','09:00 PM']

// ── Shared field primitives ──────────────────────────────────────────────────
const baseInput = {
  width: '100%', height: 42, borderRadius: 8, padding: '0 12px',
  border: `1px solid ${DS.border}`, fontSize: 13, color: DS.primary,
  outline: 'none', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit',
}

function FieldLabel({ label, required }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 600, color: DS.textMuted, display: 'block', marginBottom: 5 }}>
      {label}{required && <span style={{ color: DS.accent, marginLeft: 2 }}>*</span>}
    </label>
  )
}

function Input({ label, required, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={baseInput}
        onFocus={e => e.target.style.borderColor = DS.secondary}
        onBlur={e  => e.target.style.borderColor = DS.border} />
    </div>
  )
}

function Select({ label, required, value, onChange, options }) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...baseInput, cursor: 'pointer' }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Textarea({ label, required, value, onChange, placeholder, rows = 4 }) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        style={{ ...baseInput, height: 'auto', padding: '10px 12px', resize: 'vertical' }}
        onFocus={e => e.target.style.borderColor = DS.secondary}
        onBlur={e  => e.target.style.borderColor = DS.border} />
    </div>
  )
}

// ── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
      {STEPS.map((s, idx) => {
        const done   = s.id < current
        const active = s.id === current
        const Icon   = s.icon
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done || active ? DS.secondary : DS.border,
                border: `2px solid ${done || active ? DS.secondary : DS.border}`,
                transition: 'all 0.25s',
              }}>
                {done
                  ? <CheckCircle size={16} style={{ color: '#fff' }} />
                  : <Icon size={15} style={{ color: active ? '#fff' : DS.textMuted }} />
                }
              </div>
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? DS.secondary : DS.textMuted, whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div style={{ width: 56, height: 2, background: done ? DS.secondary : DS.border, margin: '0 6px', marginBottom: 20, transition: 'background 0.25s' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Initial form state ───────────────────────────────────────────────────────
const INIT = {
  // Step 1
  clinic_name: '', contact_phone: '', address_line1: '',
  city: CITIES[0], district: '', pincode: '', zone: ZONES[0], clinic_email: '',
  // Step 2
  doctor_name: '', specialization: SPECS[0], qualification: '',
  mci_registration_no: '', experience_years: '', doctor_phone: '',
  morning_start: '09:00 AM', morning_end: '01:00 PM',
  slot_duration_mins: '15', consultation_fee: '', languages: 'Hindi,English', bio: '',
  // Step 3
  whatsapp_number: '', whatsapp_display_name: '',
  assigned_mr_id: MRS[0], onboarding_notes: '', trial_start_date: '',
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AddClinicWizard({ onBack }) {
  const navigate = useNavigate()
  const [step, setStep]           = useState(1)
  const [form, setForm]           = useState(INIT)
  const [loading, setLoading]     = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]         = useState('')

  const set = field => val => setForm(f => ({ ...f, [field]: val }))

  const canNext = () => {
    if (step === 1) return form.clinic_name && form.contact_phone && form.address_line1
    if (step === 2) return form.doctor_name && form.consultation_fee
    if (step === 3) return form.whatsapp_number && form.trial_start_date
    return true
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status: 'onboarding' }),
      })
      const data = await res.json()
      if (res.ok) {
        setSubmitted(true)
        setTimeout(() => navigate('/portal/clinics'), 3000)
      } else {
        setError(data.message || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error — no backend connected. In production this would save the clinic.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (submitted) return (
    <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: DS.cardBg, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 48, textAlign: 'center', maxWidth: 440, width: '100%', marginTop: 40 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: DS.badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={32} style={{ color: DS.accent }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: DS.primary, margin: '0 0 8px' }}>Clinic Submitted!</h2>
        <p style={{ fontSize: 13, color: DS.textMuted, margin: '0 0 6px' }}>
          <strong>{form.clinic_name}</strong> has been submitted for onboarding.
        </p>
        <p style={{ fontSize: 13, color: DS.textSubtle, marginBottom: 28 }}>
          Redirecting to clinics list in 3 seconds…
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setSubmitted(false); setStep(1); setForm(INIT) }}
            style={{ flex: 1, height: 40, borderRadius: 8, border: `1px solid ${DS.border}`, background: 'transparent', fontSize: 13, color: DS.textMuted, cursor: 'pointer', fontWeight: 500 }}>
            Add Another
          </button>
          <button onClick={() => navigate('/portal/clinics')}
            style={{ flex: 1, height: 40, borderRadius: 8, border: 'none', background: DS.secondary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            View Clinics →
          </button>
        </div>
      </motion.div>
    </div>
  )

  // ── Wizard ───────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: DS.primary, margin: 0 }}>Add New Clinic</h1>
        <p style={{ fontSize: 13, color: DS.textMuted, marginTop: 4 }}>Fill in the details to onboard a new clinic onto TrikMed.</p>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <StepIndicator current={step} />

        <div style={{ background: DS.cardBg, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 32 }}>
          <AnimatePresence mode="wait">

            {/* ── Step 1: Basic Info ────────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: DS.primary, margin: '0 0 20px' }}>Clinic Basic Information</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <Input label="Clinic Name"    required value={form.clinic_name}    onChange={set('clinic_name')}    placeholder="e.g. Sharma Clinic" />
                  <Input label="Contact Phone"  required value={form.contact_phone}  onChange={set('contact_phone')}  placeholder="+91 98765 43210" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Input label="Address Line 1" required value={form.address_line1}  onChange={set('address_line1')}  placeholder="Street, building, landmark" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <Select label="City"    required value={form.city}     onChange={set('city')}     options={CITIES} />
                  <Input  label="District"        value={form.district}  onChange={set('district')}  placeholder="e.g. Jaipur" />
                  <Input  label="Pincode"         value={form.pincode}   onChange={set('pincode')}   placeholder="302001" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Select label="Zone"         value={form.zone}         onChange={set('zone')}         options={ZONES} />
                  <Input  label="Clinic Email" value={form.clinic_email} onChange={set('clinic_email')} type="email" placeholder="clinic@example.com" />
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Doctor Info ───────────────────────────────────── */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: DS.primary, margin: '0 0 20px' }}>Doctor Information</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <Input  label="Doctor Name"     required value={form.doctor_name}     onChange={set('doctor_name')}     placeholder="Dr. Ramesh Sharma" />
                  <Select label="Specialization"  required value={form.specialization}  onChange={set('specialization')}  options={SPECS} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <Input label="Qualification"       value={form.qualification}       onChange={set('qualification')}       placeholder="MBBS, MD (Medicine)" />
                  <Input label="MCI Registration No." value={form.mci_registration_no} onChange={set('mci_registration_no')} placeholder="MH-12345" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <Input label="Experience (Years)"   type="number" value={form.experience_years}  onChange={set('experience_years')}  placeholder="12" />
                  <Input label="Doctor Phone"                       value={form.doctor_phone}        onChange={set('doctor_phone')}        placeholder="+91 98765 43210" />
                  <Input label="Consultation Fee (₹)" required type="number" value={form.consultation_fee} onChange={set('consultation_fee')} placeholder="500" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <Select label="Morning Start"       value={form.morning_start}      onChange={set('morning_start')}      options={TIMES} />
                  <Select label="Morning End"         value={form.morning_end}        onChange={set('morning_end')}        options={TIMES} />
                  <Select label="Slot Duration (min)" value={form.slot_duration_mins} onChange={set('slot_duration_mins')} options={SLOTS} />
                </div>

                {/* Language picker */}
                <div style={{ marginBottom: 16 }}>
                  <FieldLabel label="Languages Spoken" />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 12px', border: `1px solid ${DS.border}`, borderRadius: 8, background: '#fff', minHeight: 48 }}>
                    {LANGS.map(lang => {
                      const sel = form.languages.split(',').includes(lang)
                      return (
                        <button key={lang} type="button"
                          onClick={() => {
                            const arr  = form.languages ? form.languages.split(',').filter(Boolean) : []
                            const next = sel ? arr.filter(l => l !== lang) : [...arr, lang]
                            set('languages')(next.join(','))
                          }}
                          style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${sel ? DS.secondary : DS.border}`, background: sel ? '#EFF6FF' : '#fff', color: sel ? DS.secondary : DS.textMuted, fontSize: 12, fontWeight: sel ? 700 : 400, cursor: 'pointer', transition: 'all 0.12s' }}>
                          {lang}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <Textarea label="Doctor Bio" value={form.bio} onChange={set('bio')} placeholder="Brief about the doctor, expertise, specializations…" rows={3} />
              </motion.div>
            )}

            {/* ── Step 3: WhatsApp & QR ─────────────────────────────────── */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: DS.primary, margin: '0 0 20px' }}>WhatsApp & QR Setup</p>

                <div style={{ padding: '14px 16px', borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', marginBottom: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: DS.secondary, margin: '0 0 3px' }}>WhatsApp Business Connection</p>
                  <p style={{ fontSize: 12, color: DS.textMuted, margin: 0 }}>This number handles all patient communication and appointment bookings. Ensure it's registered on WhatsApp Business.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <Input label="WhatsApp Number"       required value={form.whatsapp_number}       onChange={set('whatsapp_number')}       placeholder="+91 98765 43210" />
                  <Input label="WhatsApp Display Name"          value={form.whatsapp_display_name} onChange={set('whatsapp_display_name')} placeholder="Sharma Clinic" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <Select label="Assign MR"       value={form.assigned_mr_id}   onChange={set('assigned_mr_id')}   options={MRS} />
                  <Input  label="Trial Start Date" required type="date" value={form.trial_start_date} onChange={set('trial_start_date')} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <Textarea label="Onboarding Notes" value={form.onboarding_notes} onChange={set('onboarding_notes')} placeholder="Parking info, clinic contact person, entry instructions…" rows={4} />
                </div>

                {/* QR preview */}
                <div style={{ padding: '16px', borderRadius: 10, background: DS.bg, border: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 72, height: 72, borderRadius: 10, background: '#fff', border: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 9, color: DS.textSubtle, textAlign: 'center', lineHeight: 1.3 }}>QR generated after approval</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: DS.primary, margin: '0 0 4px' }}>
                      Booking QR for {form.clinic_name || 'this clinic'}
                    </p>
                    <p style={{ fontSize: 12, color: DS.textMuted, margin: 0 }}>
                      A unique QR code will be generated post City Manager approval. Patients scan this to book via WhatsApp instantly.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 4: Review & Submit ───────────────────────────────── */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: DS.primary, margin: '0 0 20px' }}>Review & Submit</p>

                {[
                  { title: 'Clinic Information', items: [
                    ['Clinic Name', form.clinic_name], ['Phone', form.contact_phone],
                    ['Address', form.address_line1],   ['City', form.city],
                    ['District', form.district],        ['Pincode', form.pincode],
                    ['Zone', form.zone],                ['Email', form.clinic_email],
                  ]},
                  { title: 'Doctor Information', items: [
                    ['Doctor Name', form.doctor_name],            ['Specialization', form.specialization],
                    ['Qualification', form.qualification],         ['MCI Reg. No.', form.mci_registration_no],
                    ['Experience', form.experience_years ? `${form.experience_years} yrs` : '—'],
                    ['Doctor Phone', form.doctor_phone],           ['Fee', form.consultation_fee ? `₹${form.consultation_fee}` : '—'],
                    ['Morning Hours', `${form.morning_start} – ${form.morning_end}`],
                    ['Slot', `${form.slot_duration_mins} min`],   ['Languages', form.languages || '—'],
                  ]},
                  { title: 'WhatsApp & Trial', items: [
                    ['WhatsApp No.', form.whatsapp_number],       ['Display Name', form.whatsapp_display_name],
                    ['Assigned MR', form.assigned_mr_id],          ['Trial Start', form.trial_start_date],
                    ['Notes', form.onboarding_notes || '—'],
                  ]},
                ].map(section => (
                  <div key={section.title} style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: DS.secondary, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>{section.title}</p>
                    <div style={{ background: DS.bg, borderRadius: 10, padding: '4px 16px' }}>
                      {section.items.map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${DS.border}` }}>
                          <span style={{ fontSize: 12, color: DS.textMuted }}>{k}</span>
                          <span style={{ fontSize: 12, fontWeight: 500, color: DS.primary, textAlign: 'right', maxWidth: '60%' }}>{v || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {error && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', marginTop: 12 }}>
                    <AlertCircle size={16} style={{ color: DS.accent, flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>
                  </div>
                )}

                <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fef3c7', border: '1px solid #fde68a', marginTop: 16 }}>
                  <p style={{ fontSize: 12, color: '#92400e', margin: 0, fontWeight: 500 }}>
                    After submission, this goes to the City Manager for approval before the installer is dispatched.
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* ── Navigation buttons ─────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 20, borderTop: `1px solid ${DS.border}` }}>
            <button onClick={() => step > 1 ? setStep(s => s - 1) : (onBack ? onBack() : navigate(-1))}
              style={{ height: 40, padding: '0 20px', borderRadius: 8, border: `1px solid ${DS.border}`, background: 'transparent', fontSize: 13, color: DS.textMuted, cursor: 'pointer', fontWeight: 500 }}>
              {step === 1 ? 'Cancel' : '← Back'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: DS.textSubtle }}>Step {step} of {STEPS.length}</span>
              {step < STEPS.length ? (
                <button onClick={() => canNext() && setStep(s => s + 1)} disabled={!canNext()}
                  style={{ height: 40, padding: '0 24px', borderRadius: 8, border: 'none', background: canNext() ? DS.secondary : '#e5e7eb', color: canNext() ? '#fff' : '#9ca3af', fontSize: 13, fontWeight: 700, cursor: canNext() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Next <ChevronRight size={14} />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading}
                  style={{ height: 40, padding: '0 24px', borderRadius: 8, border: 'none', background: DS.secondary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: loading ? 0.75 : 1 }}>
                  {loading
                    ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
                    : <><CheckCircle size={14} /> Submit Clinic</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
