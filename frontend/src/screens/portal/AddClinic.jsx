'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode'
import { ChevronLeft, ChevronRight, Check, Building2, MapPin, Award, QrCode, CheckCircle, Copy, Download } from 'lucide-react'
import { useNavigate } from '../../utils/navigation'
import { generateClinicId } from '../../utils/clinicId'
import { showToast } from '../../components/ui/Toast'
import { portalApi } from '../../services/portalApi'
import { formatPhone, isValidPhone, phoneError, phoneInputValue } from '../../utils/phone'

const DS = {
  bg: '#F7F9FF', cardBg: '#ffffff', border: '#DDE4F0',
  primary: '#0F2342', accent: '#E5402B', secondary: '#1A5CB5',
  textMuted: '#6B7A9A',
}

const CITIES = ['Jaipur','Jodhpur','Delhi','Mumbai','Bangalore','Kolkata','Udaipur','Ajmer']
const ZONES  = ['North Zone','South Zone','West Zone','East Zone']
const SPECS  = ['General Physician','Pediatrician','Gynecologist','Orthopedic','Dermatologist','ENT','Dentist','Ophthalmologist','Cardiologist','Neurologist','Other']
const PLANS  = [
  { id: 'Basic',  price: '₹1,500/mo', features: ['Queue Management','Appointments','QR Booking'] },
  { id: 'Growth', price: '₹2,500/mo', features: ['Everything in Basic','WhatsApp Reminders','Patient History','Prescriptions'] },
  { id: 'Pro',    price: '₹3,500/mo', features: ['Everything in Growth','AI Rx Suggestions','Missed Calls','Analytics','Priority Support'] },
]
const MRS = ['Suresh Kumar','Priya Patel','Raj Malhotra','Sunita Rao','Ravi Kumar']

const STEPS = [
  { id: 1, label: 'Basic Info',   icon: Building2 },
  { id: 2, label: 'Address',      icon: MapPin    },
  { id: 3, label: 'Plan',         icon: Award     },
  { id: 4, label: 'Clinic ID+QR', icon: QrCode    },
  { id: 5, label: 'Confirm',      icon: CheckCircle },
]

const baseInput = {
  width: '100%', height: 42, borderRadius: 8, padding: '0 12px',
  border: `1px solid ${DS.border}`, fontSize: 13, color: DS.primary,
  outline: 'none', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit',
}

function Label({ text, required }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 600, color: DS.textMuted, display: 'block', marginBottom: 5 }}>
      {text}{required && <span style={{ color: DS.accent, marginLeft: 2 }}>*</span>}
    </label>
  )
}

function Field({ label, required, children }) {
  return <div style={{ marginBottom: 16 }}><Label text={label} required={required} />{children}</div>
}

export default function AddClinic() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [clinicId, setClinicId] = useState(null)

  const [form, setForm] = useState({
    clinicName: '', doctorName: '', specialization: 'General Physician',
    phone: '', whatsapp: '', city: 'Jaipur', zone: 'North Zone', mr: '',
    addressLine1: '', addressLine2: '', landmark: '', pincode: '',
    plan: 'Growth', loginEmail: '', loginPassword: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Generate the clinic ID on entering step 4. The secure QR is created by the backend after save.
  useEffect(() => {
    if (step === 4 && !clinicId) {
      const id = generateClinicId(form.city)
      setClinicId(id)
    }
  }, [step, clinicId, form.city])

  function canNext() {
    if (step === 1) return form.clinicName && form.doctorName && isValidPhone(form.phone) && (!form.whatsapp || isValidPhone(form.whatsapp)) && form.city && form.loginEmail && form.loginPassword.length >= 6
    if (step === 2) return form.addressLine1 && form.pincode
    if (step === 3) return !!form.plan
    if (step === 4) return !!clinicId
    return true
  }

  async function handleSave() {
    if (!isValidPhone(form.phone)) {
      showToast(phoneError(), 'error')
      return
    }
    if (form.whatsapp && !isValidPhone(form.whatsapp)) {
      showToast(phoneError('WhatsApp number'), 'error')
      return
    }
    setSaving(true)
    const record = { ...form, phone: phoneInputValue(form.phone), whatsapp: form.whatsapp ? phoneInputValue(form.whatsapp) : '', id: clinicId, status: 'approved' }
    try {
      const saved = await portalApi.addClinic(record)
      if (saved?.qr_booking_url) {
        QRCode.toDataURL(saved.qr_booking_url, { width: 220, margin: 2, color: { dark: DS.primary, light: '#ffffff' } })
          .then(dataUrl => setQrDataUrl(dataUrl))
          .catch(() => {})
      }
      setSaving(false)
      setStep(5)
      showToast('Clinic saved to backend', 'success')
    } catch (e) {
      setSaving(false)
      showToast(e?.detail || e?.message || 'Failed to save clinic', 'error')
    }
  }

  function downloadQr() {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `qr-${clinicId}.png`
    a.click()
    showToast('QR downloaded', 'success')
  }

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      {/* Back */}
      {step < 5 && (
        <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: DS.textMuted, fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 24, padding: '4px 0', fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.color = DS.primary}
          onMouseLeave={e => e.currentTarget.style.color = DS.textMuted}>
          <ChevronLeft size={15} /> Back
        </button>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: DS.primary, margin: '0 0 4px' }}>Add New Clinic</h1>
        <p style={{ fontSize: 13, color: DS.textMuted, margin: 0 }}>Step {step} of {STEPS.length} — {STEPS[step - 1].label}</p>
      </div>

      {/* Step indicators */}
      {step < 5 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            {STEPS.map((s) => {
              const done = step > s.id
              const active = step === s.id
              const Icon = s.icon
              return (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? DS.primary : active ? DS.secondary : DS.border, color: done || active ? '#fff' : DS.textMuted, transition: 'all 0.2s' }}>
                    {done ? <Check size={14} /> : <Icon size={14} />}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: active ? DS.primary : DS.textMuted, textAlign: 'center', maxWidth: 56 }}>{s.label}</span>
                </div>
              )
            })}
          </div>
          <div style={{ height: 4, background: DS.border, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: DS.primary, borderRadius: 2, width: `${progressPct}%`, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
          style={{ background: DS.cardBg, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '24px 28px' }}>

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <>
              <Field label="Clinic Name" required>
                <input style={baseInput} placeholder="e.g. Sharma Clinic" value={form.clinicName} onChange={e => set('clinicName', e.target.value)} />
              </Field>
              <Field label="Doctor Name" required>
                <input style={baseInput} placeholder="e.g. Dr. Ramesh Sharma" value={form.doctorName} onChange={e => set('doctorName', e.target.value)} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Specialization" required>
                  <select style={{ ...baseInput, cursor: 'pointer' }} value={form.specialization} onChange={e => set('specialization', e.target.value)}>
                    {SPECS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="City" required>
                  <select style={{ ...baseInput, cursor: 'pointer' }} value={form.city} onChange={e => { set('city', e.target.value); setClinicId(null); setQrDataUrl(null) }}>
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Phone" required>
                  <input style={baseInput} type="tel" inputMode="numeric" placeholder="98765 43210" value={formatPhone(form.phone)} onChange={e => set('phone', phoneInputValue(e.target.value))} />
                </Field>
                <Field label="WhatsApp Number">
                  <input style={baseInput} type="tel" inputMode="numeric" placeholder="Same as phone if blank" value={formatPhone(form.whatsapp)} onChange={e => set('whatsapp', phoneInputValue(e.target.value))} />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Clinic Login Email" required>
                  <input style={baseInput} type="email" placeholder="clinic@example.com" value={form.loginEmail} onChange={e => set('loginEmail', e.target.value)} />
                </Field>
                <Field label="Temporary Password" required>
                  <input style={baseInput} type="text" placeholder="Minimum 6 characters" value={form.loginPassword} onChange={e => set('loginPassword', e.target.value)} />
                </Field>
              </div>
              <div style={{ background: DS.bg, borderRadius: 8, padding: '10px 12px', margin: '-4px 0 16px' }}>
                <p style={{ fontSize: 12, color: DS.textMuted, margin: 0 }}>
                  These credentials create the clinic owner's login. The backend stores the password as a secure hash in users JSON.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Zone">
                  <select style={{ ...baseInput, cursor: 'pointer' }} value={form.zone} onChange={e => set('zone', e.target.value)}>
                    {ZONES.map(z => <option key={z}>{z}</option>)}
                  </select>
                </Field>
                <Field label="Assigned MR">
                  <select style={{ ...baseInput, cursor: 'pointer' }} value={form.mr} onChange={e => set('mr', e.target.value)}>
                    <option value="">Select MR…</option>
                    {MRS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </Field>
              </div>
            </>
          )}

          {/* STEP 2: Address */}
          {step === 2 && (
            <>
              <Field label="Address Line 1" required>
                <input style={baseInput} placeholder="Building/shop number, street" value={form.addressLine1} onChange={e => set('addressLine1', e.target.value)} />
              </Field>
              <Field label="Address Line 2">
                <input style={baseInput} placeholder="Area, locality (optional)" value={form.addressLine2} onChange={e => set('addressLine2', e.target.value)} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Landmark">
                  <input style={baseInput} placeholder="Near, opposite…" value={form.landmark} onChange={e => set('landmark', e.target.value)} />
                </Field>
                <Field label="Pincode" required>
                  <input style={baseInput} placeholder="302001" maxLength={6} value={form.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, ''))} />
                </Field>
              </div>
              <div style={{ background: DS.bg, borderRadius: 8, padding: '12px 14px', marginTop: 4 }}>
                <p style={{ fontSize: 12, color: DS.textMuted, margin: 0 }}>
                  Full address: <strong style={{ color: DS.primary }}>{[form.addressLine1, form.addressLine2, form.landmark, form.city, form.pincode].filter(Boolean).join(', ') || '—'}</strong>
                </p>
              </div>
            </>
          )}

          {/* STEP 3: Plan */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PLANS.map(p => (
                <div key={p.id} onClick={() => set('plan', p.id)}
                  style={{ border: `2px solid ${form.plan === p.id ? DS.primary : DS.border}`, borderRadius: 10, padding: '14px 18px', cursor: 'pointer', background: form.plan === p.id ? '#f0f4ff' : '#fff', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: DS.primary }}>{p.id}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: DS.secondary }}>{p.price}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {p.features.map(f => (
                      <span key={f} style={{ fontSize: 11, background: form.plan === p.id ? DS.primary : DS.bg, color: form.plan === p.id ? '#fff' : DS.textMuted, borderRadius: 4, padding: '2px 8px', fontWeight: 500 }}>{f}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 4: Clinic ID + QR */}
          {step === 4 && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: DS.textMuted, marginBottom: 20 }}>
                A unique clinic ID has been generated. The secure QR code will be created after saving.
              </p>
              <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: DS.primary, letterSpacing: '0.04em' }}>{clinicId || 'Generating…'}</span>
                {clinicId && (
                  <button onClick={() => { navigator.clipboard?.writeText(clinicId); showToast('Clinic ID copied', 'success') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.textMuted, display: 'flex', alignItems: 'center', padding: 4 }}>
                    <Copy size={15} />
                  </button>
                )}
              </div>
              <div style={{ width: 180, height: 180, borderRadius: 10, background: DS.bg, border: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 12, color: DS.textMuted, padding: 16 }}>
                Secure QR generated after save
              </div>
            </div>
          )}

          {/* STEP 5: Confirmation */}
          {step === 5 && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={28} style={{ color: '#15803d' }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: DS.primary, margin: '0 0 6px' }}>Clinic Added!</h2>
              <p style={{ fontSize: 13, color: DS.textMuted, margin: '0 0 20px' }}>
                <strong style={{ color: DS.primary }}>{form.clinicName}</strong> has been registered and approved.
              </p>
              <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '14px 18px', marginBottom: 20, textAlign: 'left' }}>
                {[
                  ['Clinic ID', clinicId],
                  ['Doctor', form.doctorName],
                  ['City', form.city],
                  ['Plan', form.plan],
                  ['MR', form.mr || '—'],
                  ['Login Email', form.loginEmail],
                  ['Temp Password', form.loginPassword],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${DS.border}` }}>
                    <span style={{ fontSize: 12, color: DS.textMuted }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: DS.primary }}>{v}</span>
                  </div>
                ))}
              </div>
              {qrDataUrl ? (
                <div style={{ marginBottom: 20 }}>
                  <img src={qrDataUrl} alt="Secure booking QR" style={{ width: 160, height: 160, borderRadius: 10, border: `1px solid ${DS.border}` }} />
                  <div style={{ marginTop: 10 }}>
                    <button onClick={downloadQr} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: DS.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <Download size={14} /> Download QR
                    </button>
                  </div>
                </div>
              ) : null}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => navigate('/portal/clinics')}
                  style={{ background: DS.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  View Clinics List
                </button>
                <button onClick={() => { setStep(1); setForm({ clinicName:'',doctorName:'',specialization:'General Physician',phone:'',whatsapp:'',city:'Jaipur',zone:'North Zone',mr:'',addressLine1:'',addressLine2:'',landmark:'',pincode:'',plan:'Growth',loginEmail:'',loginPassword:'' }); setClinicId(null); setQrDataUrl(null) }}
                  style={{ background: '#fff', color: DS.primary, border: `1.5px solid ${DS.border}`, borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Add Another
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav buttons */}
      {step < 5 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: DS.primary, border: `1.5px solid ${DS.border}`, borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <ChevronLeft size={15} /> {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: DS.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: canNext() ? 'pointer' : 'not-allowed', opacity: canNext() ? 1 : 0.5, fontFamily: 'inherit' }}>
              Next <ChevronRight size={15} />
            </button>
          ) : step === 4 ? (
            <button onClick={handleSave} disabled={!canNext() || saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: DS.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
              {saving ? 'Saving…' : 'Confirm & Add Clinic'}
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}
