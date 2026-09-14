'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Star, Phone, MessageSquare, Clock, Award,
  BookOpen, Globe, MapPin, Calendar, ChevronLeft,
} from 'lucide-react'
import { Button } from '../ui/Button'

const DS = {
  bg: '#F7F9FF', cardBg: '#ffffff', border: '#DDE4F0',
  primary: '#0F2D5E', accent: '#E5402B', secondary: '#1A5CB5',
  textMuted: '#6B7A9A', textSubtle: '#9DBDE8',
  badgeBg: '#FFE9E6', badgeText: '#C0311C', darkBg: '#0A1E40',
}

// ── Demo fallback data (used when API is unavailable) ─────────────────────────
const DEMO = {
  clinic_name: 'Sharma Clinic',
  doctor_name: 'Dr. Ramesh Sharma',
  specialization: 'General Physician',
  qualification: 'MBBS, MD (Internal Medicine)',
  experience_years: 14,
  consultation_fee: 500,
  doctor_phone: '+91 98765 43210',
  whatsapp_number: '+91 98765 43210',
  city: 'Jaipur',
  address_line1: '12, MG Road, Vaishali Nagar',
  languages: 'Hindi,English',
  bio: 'Dr. Ramesh Sharma is a highly experienced General Physician with over 14 years of practice in Jaipur. He specialises in preventive care, chronic disease management, and lifestyle medicine, treating patients with compassion and evidence-based care.',
  rating: 4.7,
  total_reviews: 128,
  total_patients: 1840,
  morning_start: '09:00 AM',
  morning_end: '01:00 PM',
  slot_duration_mins: 15,
  status: 'active',
  timings: [
    { day: 'Monday',    morning: '9:00 AM – 1:00 PM', evening: '5:00 PM – 8:00 PM', available: true  },
    { day: 'Tuesday',   morning: '9:00 AM – 1:00 PM', evening: '5:00 PM – 8:00 PM', available: true  },
    { day: 'Wednesday', morning: '9:00 AM – 1:00 PM', evening: '—',                  available: true  },
    { day: 'Thursday',  morning: '9:00 AM – 1:00 PM', evening: '5:00 PM – 8:00 PM', available: true  },
    { day: 'Friday',    morning: '9:00 AM – 1:00 PM', evening: '5:00 PM – 8:00 PM', available: true  },
    { day: 'Saturday',  morning: '9:00 AM – 12:00 PM',evening: '—',                  available: true  },
    { day: 'Sunday',    morning: '—',                  evening: '—',                  available: false },
  ],
  reviews: [
    { name: 'Priya K.',  rating: 5, date: 'Apr 10, 2025', text: 'Very thorough diagnosis. Explained everything clearly. The WhatsApp booking is so convenient!' },
    { name: 'Suresh M.', rating: 5, date: 'Apr 5, 2025',  text: 'Quick appointment, minimal wait. QR scan booking was instant. Highly recommend.' },
    { name: 'Anita R.',  rating: 4, date: 'Mar 28, 2025', text: 'Good doctor, professional. Could improve waiting area comfort.' },
    { name: 'Rajesh P.', rating: 5, date: 'Mar 20, 2025', text: 'Best GP in Jaipur. Has been treating our family for 5+ years.' },
    { name: 'Meena S.',  rating: 4, date: 'Mar 12, 2025', text: 'Very knowledgeable and patient. Takes time to explain the condition.' },
  ],
  expertise: ['Fever & Infections', 'Diabetes Management', 'Hypertension', 'Respiratory Issues', 'Thyroid Disorders', 'Preventive Health'],
  education: [
    { degree: 'MBBS',                   institute: 'SMS Medical College, Jaipur', year: '2008' },
    { degree: 'MD (Internal Medicine)', institute: 'AIIMS, Delhi',                year: '2012' },
  ],
}

const RATING_DIST = { 5: 85, 4: 28, 3: 10, 2: 3, 1: 2 }

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function Stars({ rating, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size}
          style={{ color: i <= Math.round(rating) ? '#f59e0b' : '#e5e7eb', fill: i <= Math.round(rating) ? '#f59e0b' : 'none' }} />
      ))}
    </div>
  )
}

function RatingBar({ label, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
      <span style={{ fontSize: 12, color: DS.textMuted, width: 36, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: DS.border, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 3, background: '#f59e0b', width: `${pct}%`, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 11, color: DS.textMuted, width: 22, textAlign: 'right', flexShrink: 0 }}>{count}</span>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DoctorProfile({ clinicId, onBack }) {
  const [doctor, setDoctor]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!clinicId) {
      setDoctor(DEMO)
      setLoading(false)
      return
    }
    fetch(`/api/clinics/${clinicId}`)
      .then(r => r.json())
      .then(data => { setDoctor(data); setLoading(false) })
      .catch(() => { setDoctor(DEMO); setLoading(false) })
  }, [clinicId])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, fontSize: 14, color: DS.textMuted }}>
      Loading doctor profile…
    </div>
  )
  if (!doctor) return null

  const initials    = (doctor.doctor_name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const languages   = (doctor.languages || '').split(',').filter(Boolean)
  const totalRev    = doctor.total_reviews || Object.values(RATING_DIST).reduce((a, b) => a + b, 0)
  const timings     = doctor.timings   || DEMO.timings
  const reviews     = doctor.reviews   || DEMO.reviews
  const expertise   = doctor.expertise || DEMO.expertise
  const education   = doctor.education || DEMO.education
  const rating      = doctor.rating    || 4.7

  const tabs = [
    { id: 'overview', label: 'Overview'          },
    { id: 'reviews',  label: `Reviews (${totalRev})` },
    { id: 'timings',  label: 'Timings'            },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 920, margin: '0 auto' }}>

      {/* Back button */}
      {onBack && (
        <button onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: DS.textMuted, fontSize: 13, padding: '0 0 16px', fontWeight: 500 }}>
          <ChevronLeft size={15} /> Back to Clinics
        </button>
      )}

      {/* ── Header Card ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: DS.cardBg, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ width: 92, height: 92, borderRadius: 16, background: `linear-gradient(135deg,${DS.secondary},${DS.primary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 30, fontWeight: 700, color: '#fff' }}>{initials}</span>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: DS.primary, margin: '0 0 4px' }}>{doctor.doctor_name}</h1>
                <p style={{ fontSize: 13, color: DS.textMuted, margin: '0 0 8px' }}>{doctor.specialization} · {doctor.qualification}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Stars rating={rating} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: DS.primary }}>{rating.toFixed(1)}</span>
                  <span style={{ fontSize: 12, color: DS.textMuted }}>({totalRev} reviews)</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {doctor.experience_years && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: DS.textMuted }}>
                      <Award size={12} style={{ color: DS.secondary }} /> {doctor.experience_years} yrs exp
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: DS.textMuted }}>
                    <MapPin size={12} style={{ color: DS.secondary }} /> {doctor.city}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: DS.textMuted }}>
                    <Globe size={12} style={{ color: DS.secondary }} /> {languages.join(', ')}
                  </span>
                </div>
              </div>

              {/* Fee */}
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 26, fontWeight: 700, color: DS.primary, margin: '0 0 2px' }}>₹{doctor.consultation_fee}</p>
                <p style={{ fontSize: 11, color: DS.textMuted, margin: '0 0 10px' }}>Consultation Fee</p>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: '#EFF6FF', color: DS.secondary, border: '1px solid #BFDBFE' }}>
                  {doctor.clinic_name}
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 flex-wrap mt-4">
              <Button
                icon={MessageSquare}
                className="border-none shadow-none focus:ring-green-400"
                style={{ background: '#25D366' }}
              >
                Book on WhatsApp
              </Button>
              <Button icon={Calendar}>Book Appointment</Button>
              {doctor.doctor_phone && (
                <Button variant="secondary" icon={Phone}>{doctor.doctor_phone}</Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stats Row ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Patients Seen', value: (doctor.total_patients || 1840).toLocaleString(), emoji: '👥' },
          { label: 'Experience',    value: `${doctor.experience_years || 14} Yrs`,           emoji: '🏅' },
          { label: 'Overall Rating',value: rating.toFixed(1),                                emoji: '⭐' },
          { label: 'Reviews',       value: totalRev,                                          emoji: '💬' },
        ].map(s => (
          <div key={s.label} style={{ background: DS.cardBg, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 22, margin: '0 0 2px' }}>{s.emoji}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: DS.primary, margin: '0 0 2px' }}>{s.value}</p>
            <p style={{ fontSize: 11, color: DS.textMuted, margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: DS.cardBg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ flex: 1, height: 36, borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: activeTab === t.id ? DS.secondary : 'transparent', color: activeTab === t.id ? '#fff' : DS.textMuted, transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>

        {/* Overview ─────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
            <div>
              {/* About */}
              <div style={{ background: DS.cardBg, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: DS.primary, margin: '0 0 12px' }}>About Doctor</h3>
                <p style={{ fontSize: 13, color: DS.textMuted, lineHeight: 1.75, margin: 0 }}>{doctor.bio || DEMO.bio}</p>
              </div>

              {/* Education */}
              <div style={{ background: DS.cardBg, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: DS.primary, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={15} style={{ color: DS.secondary }} /> Education & Qualifications
                </h3>
                {education.map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: DS.secondary, flexShrink: 0, marginTop: 5 }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: DS.primary, margin: '0 0 2px' }}>{e.degree}</p>
                      <p style={{ fontSize: 12, color: DS.textMuted, margin: 0 }}>{e.institute} · {e.year}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Expertise */}
              <div style={{ background: DS.cardBg, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: DS.primary, margin: '0 0 12px' }}>Areas of Expertise</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {expertise.map(e => (
                    <span key={e} style={{ fontSize: 12, fontWeight: 500, padding: '5px 14px', borderRadius: 6, background: DS.badgeBg, color: DS.primary, border: `1px solid ${DS.border}` }}>{e}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div>
              <div style={{ background: DS.cardBg, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: DS.primary, margin: '0 0 14px' }}>Clinic Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <MapPin size={14} style={{ color: DS.secondary, flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 12, color: DS.textMuted, margin: 0, lineHeight: 1.5 }}>{doctor.address_line1}, {doctor.city}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Clock size={14} style={{ color: DS.secondary, flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 12, color: DS.textMuted, margin: 0 }}>{doctor.morning_start} – {doctor.morning_end}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Globe size={14} style={{ color: DS.secondary, flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 12, color: DS.textMuted, margin: 0 }}>{languages.join(' · ')}</p>
                  </div>
                </div>
              </div>

              <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: DS.primary, margin: '0 0 12px' }}>Quick Info</h3>
                {[
                  ['Consultation Fee', `₹${doctor.consultation_fee}`],
                  ['Slot Duration',    `${doctor.slot_duration_mins || 15} min`],
                  ['Morning Hours',    `${doctor.morning_start} – ${doctor.morning_end}`],
                  ['Languages',        languages.slice(0, 2).join(', ')],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${DS.border}` }}>
                    <span style={{ fontSize: 12, color: DS.textMuted }}>{k}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: DS.primary }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reviews ──────────────────────────────────────────────────────── */}
        {activeTab === 'reviews' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
            {/* Breakdown */}
            <div style={{ background: DS.cardBg, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20, height: 'fit-content' }}>
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <p style={{ fontSize: 52, fontWeight: 700, color: DS.primary, margin: 0, lineHeight: 1 }}>{rating.toFixed(1)}</p>
                <Stars rating={rating} size={18} />
                <p style={{ fontSize: 12, color: DS.textMuted, marginTop: 6 }}>{totalRev} verified reviews</p>
              </div>
              {[5, 4, 3, 2, 1].map(star => (
                <RatingBar key={star} label={`${star} ★`} count={RATING_DIST[star]} total={totalRev} />
              ))}
            </div>

            {/* Review cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  style={{ background: DS.cardBg, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: DS.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.name[0]}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: DS.primary, margin: 0 }}>{r.name}</p>
                        <p style={{ fontSize: 11, color: DS.textMuted, margin: 0 }}>{r.date}</p>
                      </div>
                    </div>
                    <Stars rating={r.rating} size={12} />
                  </div>
                  <p style={{ fontSize: 13, color: DS.textMuted, margin: 0, lineHeight: 1.65 }}>{r.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Timings ──────────────────────────────────────────────────────── */}
        {activeTab === 'timings' && (
          <div style={{ background: DS.cardBg, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ padding: '12px 20px', borderBottom: `1px solid ${DS.border}`, background: DS.bg }}>
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr 80px', gap: 16 }}>
                {['Day', 'Morning', 'Evening', 'Status'].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: DS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                ))}
              </div>
            </div>
            {timings.map((t, i) => (
              <div key={t.day} style={{
                display: 'grid', gridTemplateColumns: '130px 1fr 1fr 80px', gap: 16, alignItems: 'center',
                padding: '14px 20px',
                borderBottom: i < timings.length - 1 ? `1px solid ${DS.border}` : 'none',
                background: !t.available ? '#fafafa' : 'transparent',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: DS.primary }}>{t.day}</span>
                <span style={{ fontSize: 13, color: DS.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {t.morning !== '—' && <Clock size={12} style={{ color: DS.secondary }} />}
                  {t.morning}
                </span>
                <span style={{ fontSize: 13, color: DS.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {t.evening !== '—' && <Clock size={12} style={{ color: DS.secondary }} />}
                  {t.evening}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textAlign: 'center', background: t.available ? '#EFF6FF' : '#f3f4f6', color: t.available ? DS.secondary : DS.textMuted }}>
                  {t.available ? 'Open' : 'Closed'}
                </span>
              </div>
            ))}
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${DS.border}`, background: DS.bg }}>
              <p style={{ fontSize: 12, color: DS.textMuted, margin: 0 }}>
                ⏱ Slot duration: {doctor.slot_duration_mins || 15} minutes · Walk-ins subject to availability
              </p>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  )
}
