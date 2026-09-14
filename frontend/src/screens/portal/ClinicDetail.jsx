'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import {
  ChevronLeft, Phone, MessageSquare, Wifi, WifiOff,
  Calendar, Users, TrendingUp, Copy, Download,
  MapPin, User, Award, Clock, Star, ExternalLink,
} from 'lucide-react'
import { useParams, useNavigate } from '../../utils/navigation'
import { portalApi } from '../../services/portalApi'
import { showToast } from '../../components/ui/Toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorBanner from '../../components/ui/ErrorBanner'

const DS = {
  bg: '#F7F9FF', cardBg: '#ffffff', border: '#DDE4F0',
  primary: '#0F2342', accent: '#E5402B', secondary: '#1A5CB5',
  textMuted: '#6B7A9A', textSubtle: '#9DBDE8', rowHover: '#F7F9FF',
}

const PLAN_COLORS = {
  Basic:  { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' },
  Growth: { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
  Pro:    { bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe' },
}
const STATUS_COLORS = {
  active:   { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  trial:    { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  pending_approval: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  approved: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  inactive: { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' },
  churned:  { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
}

function StatCard({ label, value, sub, color = DS.primary }) {
  return (
    <div style={{ background: DS.cardBg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '16px 20px' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: DS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color, margin: '6px 0 2px' }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: DS.textMuted, margin: 0 }}>{sub}</p>}
    </div>
  )
}

export default function ClinicDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [clinic, setClinic] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [qrModal, setQrModal] = useState(false)

  useEffect(() => {
    loadClinic()
  }, [id])

  const loadClinic = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await portalApi.getClinic(id)
      setClinic(data)
    } catch (e) {
      setError(e?.message || e?.detail || 'Failed to load clinic details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!clinic) return
    const bookingUrl = clinic.qr_booking_url
    if (!bookingUrl) return
    QRCode.toDataURL(bookingUrl, { width: 240, margin: 2, color: { dark: '#0F2342', light: '#ffffff' } })
      .then(url => setQrDataUrl(url))
      .catch(() => {})
  }, [clinic])

  if (loading) return <LoadingSpinner message="Loading clinic details…" />
  if (error) return <ErrorBanner message={error} onRetry={loadClinic} />
  if (!clinic) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ fontSize: 15, color: DS.textMuted }}>Clinic not found.</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: 12, background: DS.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          ← Go Back
        </button>
      </div>
    )
  }

  const plan   = PLAN_COLORS[clinic.plan_type] || PLAN_COLORS.Basic
  const status = STATUS_COLORS[clinic.status] || STATUS_COLORS.active
  const hasWhatsapp = clinic.whatsapp_number && clinic.whatsapp_number.length > 0
  const address = clinic.address_line1 || clinic.address_line2 || 'Address not available'
  const phone = clinic.contact_phone || clinic.whatsapp_number || 'N/A'
  const clinicName = clinic.clinic_name || clinic.clinicName || 'Unnamed Clinic'
  const doctorName = clinic.doctor_name || clinic.doctorName || 'Dr. —'
  const specialization = clinic.specialization || 'General Physician'
  const joinDate = clinic.created_at ? new Date(clinic.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: '2-digit' }) : clinic.submittedDate || 'N/A'
  const mrr = clinic.mrr || 0
  const appts = clinic.appts || 0

  function copyId() {
    navigator.clipboard?.writeText(clinic.id)
    showToast(`Clinic ID ${clinic.id} copied`, 'success')
  }

  function downloadQr() {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `qr-${clinic.qr_code || clinic.id}.png`
    a.click()
    showToast('QR code downloaded', 'success')
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      {/* Back */}
      <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: DS.textMuted, fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 20, padding: '4px 0', fontFamily: 'inherit' }}
        onMouseEnter={e => e.currentTarget.style.color = DS.primary}
        onMouseLeave={e => e.currentTarget.style.color = DS.textMuted}>
        <ChevronLeft size={15} /> Back to Clinics
      </button>

      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: DS.cardBg, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: DS.primary, margin: 0 }}>{clinicName}</h1>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: status.bg, color: status.color, border: `1px solid ${status.border}`, textTransform: 'capitalize' }}>{clinic.status}</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: plan.bg, color: plan.color, border: `1px solid ${plan.border}` }}>{clinic.plan_type}</span>
            </div>
            <p style={{ fontSize: 13, color: DS.textMuted, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <User size={12} /> {doctorName}
              <span style={{ margin: '0 4px' }}>·</span>
              <Award size={12} /> {specialization}
            </p>
            <p style={{ fontSize: 13, color: DS.textMuted, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={12} /> {address}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
              <button onClick={copyId} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: DS.primary, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Copy size={11} /> {clinic.id}
              </button>
              <span style={{ fontSize: 12, color: DS.textMuted }}>Joined {joinDate}</span>
              <span style={{ fontSize: 12, color: hasWhatsapp ? DS.secondary : '#dc2626', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                {hasWhatsapp ? <Wifi size={12} /> : <WifiOff size={12} />}
                WhatsApp {hasWhatsapp ? 'On' : 'Off'}
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <a href={`tel:${phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: DS.primary, border: `1.5px solid ${DS.border}`, borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>
              <Phone size={13} /> Call
            </a>
            <button onClick={() => setQrModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: DS.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              QR Code
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        <StatCard label="Monthly Appts" value={appts} sub="this month" />
        <StatCard label="Monthly Revenue" value={mrr > 0 ? `₹${mrr.toLocaleString()}` : '—'} sub="monthly revenue" color={mrr > 0 ? '#15803d' : DS.textMuted} />
        <StatCard label="Status" value={clinic.status} sub="current status" color={status.color} />
        <StatCard label="Plan" value={clinic.plan_type} sub="subscription plan" />
        <StatCard label="Created" value={joinDate} sub="onboarded date" />
      </div>

      {/* Two-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
        {/* Details */}
        <div style={{ background: DS.cardBg, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '20px 24px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: DS.primary, margin: '0 0 16px' }}>Clinic Info</h3>
          {[
            ['Clinic Name',      clinicName],
            ['Doctor Name',      doctorName],
            ['Specialization',   specialization],
            ['City',             clinic.city || '—'],
            ['Zone',             clinic.zone || '—'],
            ['Phone',            phone],
            ['WhatsApp',         clinic.whatsapp_number || '—'],
            ['Address',          address],
            ['Plan',             clinic.plan_type || '—'],
            ['Status',           clinic.status || '—'],
            ['Monthly Revenue',  mrr > 0 ? `₹${mrr.toLocaleString()}` : '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${DS.border}` }}>
              <span style={{ fontSize: 12, color: DS.textMuted, fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13, color: DS.primary, fontWeight: 500, textAlign: 'right', textTransform: label === 'Status' ? 'capitalize' : 'none' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* QR preview */}
        <div style={{ background: DS.cardBg, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '20px 24px', textAlign: 'center' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: DS.primary, margin: '0 0 4px' }}>Booking QR</h3>
          <p style={{ fontSize: 11, color: DS.textMuted, margin: '0 0 16px' }}>Patients scan to book appointment</p>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" style={{ width: 160, height: 160, borderRadius: 8, border: `1px solid ${DS.border}` }} />
          ) : (
            <div style={{ width: 160, height: 160, borderRadius: 8, background: DS.bg, border: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 12, color: DS.textMuted }}>
              Generating…
            </div>
          )}
          <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={downloadQr} disabled={!qrDataUrl}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: DS.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: qrDataUrl ? 'pointer' : 'not-allowed', opacity: qrDataUrl ? 1 : 0.5, fontFamily: 'inherit' }}>
              <Download size={12} /> Download
            </button>
            <a href={clinic.qr_booking_url || '#'} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', color: DS.primary, border: `1.5px solid ${DS.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              <ExternalLink size={12} /> Open Link
            </a>
          </div>
        </div>
      </div>

      {/* QR modal */}
      {qrModal && (
        <div onClick={() => setQrModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', maxWidth: 320 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: DS.primary, margin: '0 0 4px' }}>{clinicName}</h3>
            <p style={{ fontSize: 12, color: DS.textMuted, margin: '0 0 20px' }}>{clinic.qr_code || clinic.id}</p>
            {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width: 200, height: 200, borderRadius: 8 }} />}
            <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={downloadQr} style={{ background: DS.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Download PNG
              </button>
              <button onClick={() => setQrModal(false)} style={{ background: '#fff', color: DS.primary, border: `1.5px solid ${DS.border}`, borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
