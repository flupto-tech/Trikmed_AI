'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCodeLib from 'qrcode'
import {
  Download, Printer, QrCode, Copy, CheckCircle, Smartphone, TrendingUp,
  Calendar, Users, Globe, Phone, ExternalLink,
  ArrowUpRight, ArrowDownRight, MapPin, BookOpen, Zap, MessageCircle,
} from 'lucide-react'
import { bookingSourceStats, missedCalls } from '../../data/mockData'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { Button } from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import api from '../../services/api'
import { getClinicId } from '../../utils/auth'

// ─── Source definitions ───────────────────────────────────────────────────────
const SOURCES = [
  {
    key: 'google', srcParam: 'google', logo: 'G',
    label: 'Google Business Profile',
    desc: 'Appears in Google Search and Google Maps',
    color: '#1a73e8', bg: '#e8f0fe', border: '#c5d8fb',
    buttonLabel: '"Book Appointment"',
    instructions: [
      'Go to business.google.com and sign in',
      'Click "Edit profile" → then the "Contact" tab',
      'Scroll to "Booking links" → click "+ Add link"',
      'Set link title: "Book Appointment"',
      'Paste your TrikMed link (copy from below)',
      'Click Save — link appears on Google within 24 hours',
    ],
  },
  {
    key: 'justdial', srcParam: 'justdial', logo: 'JD',
    label: 'Just Dial Listing',
    desc: 'Linked from your Just Dial clinic page',
    color: '#d44200', bg: '#fff0ea', border: '#fdcbb0',
    buttonLabel: '"Book Now"',
    instructions: [
      'Log in at business.justdial.com',
      'Select your clinic listing → "Edit Listing"',
      'Navigate to "Digital Services" → "Appointment Booking"',
      'Select "Add External Link" and paste your TrikMed URL',
      'Also print the QR code below and place on your JD page',
      'Patients scan or click to book — all tracked separately',
    ],
  },
]

// ─── CopyButton ───────────────────────────────────────────────────────────────
function CopyBtn({ text, small = false }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text.startsWith('http') ? text : `https://${text}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button type="button" onClick={copy}
      aria-label={copied ? 'Link copied' : 'Copy booking link'}
      className="flex items-center gap-1.5 font-semibold transition-all flex-shrink-0"
      style={{ fontSize: small ? '12px' : '13px', color: 'var(--color-blue)', border:'none', background:'transparent', cursor:'pointer', padding:0 }}>
      {copied ? <CheckCircle size={small ? 13 : 14} /> : <Copy size={small ? 13 : 14} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

async function downloadQrForUrl(url, filename) {
  const dataUrl = await QRCodeLib.toDataURL(url, {
    width: 240,
    margin: 2,
    color: { dark: '#0F2342', light: '#ffffff' },
  })
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

function SourceQrPreview({ url, label, accent = 'var(--color-blue)', size = 112 }) {
  const [dataUrl, setDataUrl] = useState(null)

  useEffect(() => {
    let active = true
    QRCodeLib.toDataURL(url, {
      width: size,
      margin: 1,
      color: { dark: '#0F2342', light: '#ffffff' },
    }).then((value) => {
      if (active) setDataUrl(value)
    }).catch(() => {
      if (active) setDataUrl(null)
    })
    return () => { active = false }
  }, [url, size])

  return (
    <div
      aria-label={`${label} QR preview`}
      style={{
        display:'inline-grid',
        placeItems:'center',
        width:size,
        height:size,
        borderRadius:'var(--radius-md)',
        background:'var(--color-surface)',
        border:'calc(var(--space-0-5) / 2) solid var(--color-border)',
        boxShadow:'var(--shadow-xs)',
        overflow:'hidden',
      }}
    >
      {dataUrl ? (
        <img src={dataUrl} alt={`${label} QR code`} width={size - 12} height={size - 12} style={{ display:'block', borderRadius:'var(--radius-sm)' }} />
      ) : (
        <span style={{ fontSize:'var(--text-xs)', fontWeight:800, color:accent }}>{label}</span>
      )}
    </div>
  )
}

function sourceConversion(key) {
  return key === 'qr' || key === 'walkin' ? 100 : key === 'google' ? 83 : key === 'justdial' ? 78 : 65
}

function sourceShare(value) {
  const total = bookingSourceStats.reduce((sum, row) => sum + row.thisMonth, 0)
  return total > 0 ? Math.round((value / total) * 100) : 0
}

// ─── SourceCard ───────────────────────────────────────────────────────────────
function SourceCard({ source, stats, bookingUrl = '', onActionError }) {
  const [open, setOpen] = useState(false)
  // Build per-source URL from the real booking URL base
  const base = bookingUrl || `https://trikmed.in/q/...`
  const url  = `${base}?src=${source.srcParam}`
  const displayUrl = url.replace('https://', '')
  const pct = Math.round(((stats.thisMonth - stats.lastMonth) / Math.max(stats.lastMonth, 1)) * 100)
  const up  = pct >= 0
  const conversion = sourceConversion(source.key)
  const downloadSourceQr = () => {
    downloadQrForUrl(url, `qr-${source.key}.png`).catch((e) => {
      console.error('Failed to download source QR:', e)
      onActionError?.('Could not generate this QR download. Please try again.')
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="ds-card qr-source-card">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 flex items-center justify-center font-bold text-[14px] flex-shrink-0"
            style={{ background: source.bg, color: source.color, border: `1px solid ${source.border}` }}>
            {source.logo}
          </div>
          <div>
            <h3 className="text-[15px] font-bold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>{source.label}</h3>
            <p className="text-[12px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{source.desc}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <div className="flex items-center gap-1 justify-end text-[12px] font-bold"
            style={{ color: up ? 'var(--color-success-text)' : 'var(--color-error-text)' }}>
            {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(pct)}%
          </div>
          <p className="text-[12px] font-semibold" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>
            {stats.thisMonth} this month
          </p>
        </div>
      </div>

      {/* URL row */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl mb-4"
        style={{ background: 'var(--color-surface-subtle)', border: 'calc(var(--space-0-5) / 2) solid var(--color-border)' }}>
        <span className="text-[12px] font-mono flex-1 truncate" style={{ color: 'var(--tm-text,#2D3748)' }}>{displayUrl}</span>
        <CopyBtn text={displayUrl} small />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label:'Bookings', value:stats.thisMonth },
          { label:'Conversion', value:`${conversion}%` },
          { label:'Share', value:`${sourceShare(stats.thisMonth)}%` },
        ].map(item => (
          <div key={item.label} className="rounded-xl p-3 text-center" style={{ background:'var(--color-surface-subtle)', border:'calc(var(--space-0-5) / 2) solid var(--color-border)' }}>
            <p className="text-[18px] font-bold leading-none" style={{ color:'var(--color-text-primary)' }}>{item.value}</p>
            <p className="text-[11px] mt-1" style={{ color:'var(--color-text-muted)' }}>{item.label}</p>
          </div>
        ))}
      </div>

      <p className="text-[12px] mb-4" style={{ color: 'var(--color-text-muted)' }}>
        Suggested listing CTA: <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{source.buttonLabel}</span>
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="secondary" icon={Download} onClick={downloadSourceQr}>Download QR</Button>
        <Button variant="secondary" icon={BookOpen} onClick={() => setOpen(!open)}>
          {open ? 'Hide Setup' : 'Setup Guide'}
        </Button>
        <Button icon={ExternalLink} iconPosition="right" className="ml-auto"
          onClick={() => window.open(`${url}`, '_blank')}>
          Preview Page
        </Button>
      </div>

      {/* Expandable instructions + QR */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex gap-5 mt-5 pt-5" style={{ borderTop: '1px solid #DDE4F0' }}>
              {/* Mini QR */}
              <div className="flex-shrink-0 text-center">
                <SourceQrPreview url={url} label={source.logo} accent={source.color} size={112} />
                <p className="text-[11px] mt-2 font-semibold" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Print & display</p>
              </div>
              {/* Step-by-step */}
              <div className="flex-1">
                <h4 className="text-[13px] font-bold mb-3" style={{ color: 'var(--tm-text,#0F2D5E)' }}>Setup Instructions</h4>
                <div className="space-y-2.5">
                  {source.instructions.map((step, i) => (
                    <div key={i} className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-xl text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: source.color }}>{i + 1}</span>
                      <p className="text-[13px] leading-snug" style={{ color: 'var(--tm-text,#2D3748)' }}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Missed Call Card ─────────────────────────────────────────────────────────
function MissedCallCard({ stats = { thisMonth: 0, lastMonth: 0 }, bookingUrl = '', clinicPhone = '', onActionError }) {
  const url = `${bookingUrl || 'https://trikmed.in/q/...'}?src=missedcall`
  const displayUrl = url.replace('https://', '')
  const todayMissed   = missedCalls.filter(m => m.date === 'Today').length
  const todayConverted = missedCalls.filter(m => m.date === 'Today' && m.convertedTo).length
  const pct = Math.round(((stats.thisMonth - stats.lastMonth) / Math.max(stats.lastMonth, 1)) * 100)
  const downloadSourceQr = () => {
    downloadQrForUrl(url, 'qr-missed-call.png').catch((e) => {
      console.error('Failed to download missed-call QR:', e)
      onActionError?.('Could not generate the missed-call QR download. Please try again.')
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="ds-card qr-source-card">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#f5f3ff', border: '1px solid #e9d5ff' }}>
          <Phone size={18} style={{ color: '#7c3aed' }} />
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-bold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>Missed Call Booking</h3>
          <p className="text-[12px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Auto WhatsApp sent when patient calls and you miss</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end text-[12px] font-bold" style={{ color: '#1A5CB5' }}>
            <ArrowUpRight size={13} />{pct}%
          </div>
          <p className="text-[12px] font-semibold" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{stats.thisMonth} this month</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-5">
        {/* Phone number */}
        <div className="col-span-1 rounded-xl p-4 text-center"
          style={{ background: '#f5f3ff', border: '1px solid #e9d5ff' }}>
          <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: '#7c3aed' }}>Clinic Number</p>
          <p className="text-[20px] font-bold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>{clinicPhone || '—'}</p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Share this everywhere</p>
        </div>

        {/* Today's stats */}
        <div className="col-span-1 rounded-xl p-4 text-center"
          style={{ background: 'var(--tm-surface2,#EFF6FF)', border: '1px solid #BFDBFE' }}>
          <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: '#1A5CB5' }}>Today</p>
          <p className="text-[28px] font-bold" style={{ color: 'var(--tm-text,#0F2D5E)', letterSpacing: '-1px' }}>
            {todayConverted}<span className="text-[16px] text-[#6B7A9A]">/{todayMissed}</span>
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Converted / Missed</p>
        </div>

        {/* Conversion rate */}
        <div className="col-span-1 rounded-xl p-4 text-center"
          style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: '#d97706' }}>Conversion</p>
          <p className="text-[28px] font-bold" style={{ color: 'var(--tm-text,#0F2D5E)', letterSpacing: '-1px' }}>
            {todayMissed > 0 ? Math.round((todayConverted / todayMissed) * 100) : 0}%
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Missed → Booked</p>
        </div>
      </div>

      {/* Auto-flow diagram */}
      <div className="flex items-center gap-2 mb-5 p-4 rounded-xl overflow-x-auto"
        style={{ background: 'var(--tm-surface2,#F7F9FF)', border: '1px solid #DDE4F0' }}>
        {[
          { icon: Phone, label: 'Missed Call', color: '#7c3aed', bg: '#f5f3ff' },
          { icon: Zap,   label: '60s Auto-detect', color: '#d97706', bg: '#fffbeb' },
          { icon: MessageCircle, label: 'WhatsApp Sent', color: '#25D366', bg: '#EFF6FF' },
          { icon: Calendar, label: 'Patient Books', color: '#1A5CB5', bg: '#EFF6FF' },
        ].map((s, i) => (
          <React.Fragment key={s.label}>
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <span className="text-[11px] font-semibold text-center" style={{ color: 'var(--tm-text-muted,#6B7A9A)', maxWidth: '60px' }}>{s.label}</span>
            </div>
            {i < 3 && <div className="h-px flex-1 min-w-[16px]" style={{ background: '#DDE4F0' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* URL + actions */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl mb-4"
        style={{ background: 'var(--tm-surface2,#F7F9FF)', border: '1px solid #DDE4F0' }}>
        <span className="text-[12px] font-mono flex-1 truncate" style={{ color: 'var(--tm-text,#2D3748)' }}>{displayUrl}</span>
        <CopyBtn text={displayUrl} small />
      </div>
      <div className="flex gap-3 flex-wrap">
        <Button variant="secondary" icon={Download} onClick={downloadSourceQr}>Download QR</Button>
        <Button icon={ExternalLink} iconPosition="right" className="ml-auto"
          onClick={() => window.open(url, '_blank')}>
          Preview Page
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Analytics Table ──────────────────────────────────────────────────────────
function AnalyticsTable() {
  const total = bookingSourceStats.reduce((s, r) => s + r.thisMonth, 0)
  return (
    <div className="ds-card qr-section-card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[16px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Source Analytics</h2>
          <p className="text-[13px] mt-1" style={{ color:'var(--color-text-muted)' }}>Compare booking volume, share, trend, and conversion quality.</p>
        </div>
        <span className="text-[13px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>
          {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Column headers */}
      <div className="qr-analytics-row qr-analytics-head grid gap-3 px-4 py-2 rounded-lg mb-2"
        style={{ background: 'var(--color-surface-subtle)' }}>
        {['Source', 'This Month', 'Last Month', 'Change', 'Share', 'Conv.'].map(h => (
          <span key={h} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      {bookingSourceStats.map(row => {
        const pct       = Math.round(((row.thisMonth - row.lastMonth) / Math.max(row.lastMonth, 1)) * 100)
        const share     = Math.round((row.thisMonth / total) * 100)
        const conv      = sourceConversion(row.key)
        const up        = pct >= 0
        return (
          <div key={row.key} className="qr-analytics-row grid gap-3 px-4 py-3 items-center rounded-lg"
            style={{ borderBottom: 'calc(var(--space-0-5) / 2) solid var(--color-border)' }}>
            {/* Source name */}
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-xl flex-shrink-0" style={{ background: row.color }} />
              <span className="text-[14px] font-semibold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>{row.label}</span>
            </div>
            {/* This month */}
            <span className="text-[15px] font-bold" style={{ color: row.color }}>{row.thisMonth}</span>
            {/* Last month */}
            <span className="text-[14px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{row.lastMonth}</span>
            {/* Change */}
            <span className="text-[13px] font-bold flex items-center gap-0.5"
              style={{ color: up ? 'var(--color-success-text)' : 'var(--color-error-text)' }}>
              {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {Math.abs(pct)}%
            </span>
            {/* Share bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-xl" style={{ background: 'var(--color-surface-subtle)' }}>
                <div className="h-2 rounded-xl transition-all" style={{ width: `${share}%`, background: row.color, minWidth: share > 0 ? 4 : 0 }} />
              </div>
              <span className="text-[12px] font-semibold flex-shrink-0" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{share}%</span>
            </div>
            {/* Conversion */}
            <span className="text-[13px] font-bold" style={{ color: conv >= 90 ? 'var(--color-success-text)' : conv >= 75 ? 'var(--color-warning-text)' : 'var(--color-error-text)' }}>
              {conv}%
            </span>
          </div>
        )
      })}

      {/* Totals row */}
      <div className="qr-analytics-row grid gap-3 px-4 py-3 items-center rounded-lg mt-1"
        style={{ background: 'var(--color-surface-subtle)' }}>
        <span className="text-[14px] font-bold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>Total</span>
        <span className="text-[15px] font-bold" style={{ color: '#1A5CB5' }}>{total}</span>
        <span className="text-[14px] font-semibold" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>
          {bookingSourceStats.reduce((s, r) => s + r.lastMonth, 0)}
        </span>
        <span className="text-[13px] font-bold flex items-center gap-0.5" style={{ color: '#1A5CB5' }}>
          <ArrowUpRight size={13} />
          {Math.round(((total - bookingSourceStats.reduce((s, r) => s + r.lastMonth, 0)) / bookingSourceStats.reduce((s, r) => s + r.lastMonth, 0)) * 100)}%
        </span>
        <span className="text-[13px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>100%</span>
        <span className="text-[13px] font-bold" style={{ color: '#1A5CB5' }}>87%</span>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function QRCodePage() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError,   setPageError]   = useState(null)
  const [clinicData,  setClinicData]  = useState(null)   // { clinic_name, booking_url, qr_code }
  const [qrDataUrl,   setQrDataUrl]   = useState(null)
  const [actionError, setActionError] = useState('')
  const [standeeOpen, setStandeeOpen] = useState(false)

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    setActionError('')
    try {
      const clinicId = getClinicId()
      if (!clinicId) throw new Error('No clinic ID in session — please log in again')
      const data = await api.get(`/clinics/${clinicId}/qr`)
      setClinicData(data)
      setQrDataUrl(null)
      // Generate the real QR code from the booking URL
      const dataUrl = await QRCodeLib.toDataURL(data.booking_url, {
        width: 200,
        margin: 2,
        color: { dark: '#0F2342', light: '#ffffff' },
      })
      setQrDataUrl(dataUrl)
    } catch (e) {
      console.error('Failed to load QR data:', e)
      setPageError(e?.detail || e?.message || 'Failed to load QR data')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  function downloadQr() {
    setActionError('')
    if (!qrDataUrl || !clinicData) {
      setActionError('QR code is still being prepared. Please try again in a moment.')
      return
    }
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `qr-${clinicData.qr_code}.png`
    a.click()
  }

  const totalBookings = bookingSourceStats.reduce((s, r) => s + r.thisMonth, 0)
  const clinicQrStats = bookingSourceStats.find(s => s.key === 'qr')
  const walkInStats = bookingSourceStats.find(s => s.key === 'walkin')
  const lastMonthBookings = bookingSourceStats.reduce((s, r) => s + r.lastMonth, 0)
  const topSource = bookingSourceStats.reduce((best, row) => row.thisMonth > best.thisMonth ? row : best, bookingSourceStats[0])

  // Derive display values — real data when loaded, sensible fallbacks while loading
  const clinicName   = clinicData?.clinic_name  || '…'
  const doctorName   = clinicData?.doctor_name  || ''
  const clinicCity   = clinicData?.city          || ''
  const bookingUrl   = clinicData?.booking_url  || ''
  const displayUrl   = bookingUrl.replace('https://', '')

  if (pageLoading) return <LoadingSpinner message="Loading QR data…" />
  if (pageError)   return <ErrorBanner message={pageError} onRetry={loadData} />

  return (
    <div className="ds-page qr-page space-y-8">
      <style>{`
        .qr-page {
          padding-inline: clamp(var(--space-4), 2vw, var(--space-6));
        }
        .qr-section-card,
        .qr-source-card {
          border: calc(var(--space-0-5) / 2) solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface);
          box-shadow: var(--shadow-sm);
        }
        .qr-source-card {
          padding: var(--space-5);
        }
        .qr-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
          margin-bottom: var(--space-4);
        }
        .qr-section-heading h2 {
          margin: 0;
          font-family: var(--font-display);
          font-size: var(--text-h4);
          font-weight: 700;
          color: var(--color-text-primary);
        }
        .qr-section-heading p {
          margin: var(--space-1) 0 0;
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }
        .qr-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--space-4);
        }
        .qr-source-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--space-4);
        }
        .qr-analytics-row {
          grid-template-columns: minmax(180px, 1fr) 90px 90px 80px minmax(120px, .75fr) 70px;
        }
        @media (max-width: 1100px) {
          .qr-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .qr-source-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 760px) {
          .qr-page {
            padding-inline: var(--space-3);
          }
          .qr-kpi-grid {
            grid-template-columns: 1fr;
          }
          .qr-section-heading {
            align-items: flex-start;
            flex-direction: column;
          }
          .qr-analytics-head {
            display: none;
          }
          .qr-analytics-row {
            grid-template-columns: 1fr 1fr;
            gap: var(--space-2) var(--space-4);
          }
          .qr-analytics-row > :first-child {
            grid-column: 1 / -1;
          }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="ds-section-title">Booking Sources</h1>
            <p className="ds-section-subtitle">Manage QR codes, online booking links, missed-call flows, walk-ins, and conversion analytics.</p>
          </div>
          <Button icon={ExternalLink} iconPosition="right" onClick={() => window.open(bookingUrl || '/q', '_blank')}>
            Open QR Link
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="blue" size="lg">{bookingSourceStats.length} active sources</Badge>
          <Badge variant="green" size="lg">Top source: {topSource?.label}</Badge>
          <Badge variant="default" size="lg">{clinicName}</Badge>
        </div>
      </div>

      {/* ── Summary stats ── */}
      {actionError ? (
        <div role="alert" style={{ padding: 'var(--space-3) var(--space-4)', border: 'calc(var(--space-0-5) / 2) solid var(--color-error-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-error-bg)', color: 'var(--color-error-text)', fontSize: 'var(--text-sm)', fontWeight: 650 }}>
          {actionError}
        </div>
      ) : null}

      <section>
      <div className="qr-section-heading">
        <div>
          <h2>Overview KPIs</h2>
          <p>Current month source performance at a glance.</p>
        </div>
      </div>
      <div className="qr-kpi-grid">
        {[
          { icon: TrendingUp, value: totalBookings, label: 'Total Bookings This Month', color: 'var(--color-text-primary)', bg: 'var(--color-blue-light)' },
          { icon: Globe,      value: bookingSourceStats.length, label: 'Active Booking Sources', color: 'var(--color-blue)', bg: 'var(--color-blue-light)' },
          { icon: Users,      value: '89',          label: 'New Patients via Links',    color: '#7c3aed', bg: '#f5f3ff' },
          { icon: Calendar,   value: '87%',         label: 'Avg Conversion Rate',       color: 'var(--color-warning-text)', bg: 'var(--color-warning-bg)' },
        ].map(s => (
          <div key={s.label} className="ds-stat-card" style={{ padding: 'var(--space-5) var(--space-6)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: s.bg }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <p className="text-[32px] font-bold leading-none" style={{ color: s.color, letterSpacing: '-1px' }}>{s.value}</p>
            <p className="text-[13px] font-medium mt-2" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{s.label}</p>
          </div>
        ))}
      </div>
      </section>

      {/* ── Online Booking Links ── */}
      <section>
        <div className="qr-section-heading">
          <div>
            <h2>Booking Sources</h2>
            <p>Google, JustDial, missed calls, clinic QR, and walk-ins tracked side by side.</p>
          </div>
          <span className="text-[13px]" style={{ color:'var(--color-text-muted)' }}>
            {totalBookings} bookings vs {lastMonthBookings} last month
          </span>
        </div>

        {/* SOURCE 1 + 2: Google + Just Dial */}
        <div className="qr-source-grid mb-4">
          {SOURCES.map(s => (
            <SourceCard key={s.key} source={s}
              stats={bookingSourceStats.find(b => b.key === s.key) || { thisMonth: 0, lastMonth: 0 }}
              bookingUrl={bookingUrl}
              onActionError={setActionError} />
          ))}
        </div>

        {/* SOURCE 3: Missed Call (full-width) */}
        <div className="mb-4">
          <MissedCallCard stats={bookingSourceStats.find(b => b.key === 'missedcall')} bookingUrl={bookingUrl} onActionError={setActionError} />
        </div>

        {/* SOURCE 4: Clinic QR + SOURCE 5: Walk-in info */}
        <div className="grid lg:grid-cols-2 gap-4">

          {/* Clinic QR */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="ds-card qr-source-card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--tm-surface2,#EFF6FF)', border: '1px solid #BFDBFE' }}>
                  <QrCode size={20} style={{ color: 'var(--tm-text,#0F2D5E)' }} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>Clinic QR Code</h3>
                  <p className="text-[12px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Print and display at reception desk</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end text-[12px] font-bold" style={{ color: '#1A5CB5' }}>
                  <ArrowUpRight size={13} />25%
                </div>
                <p className="text-[12px] font-semibold" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{clinicQrStats?.thisMonth} this month</p>
              </div>
            </div>

            {/* Real QR display */}
            <div className="p-6 text-center mb-4"
              style={{ background: 'linear-gradient(180deg, var(--color-surface) 0%, var(--color-blue-light) 100%)', border: 'calc(var(--space-0-5) / 2) solid var(--color-border)', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)' }}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#0F2342' }}>
                  <span className="text-white text-[10px] font-bold">TM</span>
                </div>
                <span className="font-bold text-[15px]" style={{ color: '#0F2342' }}>TrikMed</span>
              </div>
              <p className="text-[11px] mb-4" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Scan to Book Appointment</p>
              <div className="inline-block rounded-xl overflow-hidden p-3" style={{ background:'var(--color-surface)', border: 'calc(var(--space-0-5) / 2) solid var(--color-border)', boxShadow:'var(--shadow-sm)' }}>
                {qrDataUrl
                  ? <img src={qrDataUrl} alt="Booking QR Code" width={196} height={196} style={{ borderRadius: '8px', display: 'block' }} />
                  : <div style={{ width: 196, height: 196, background: '#F3F4F6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--tm-text-muted,#9CA3AF)' }}>Generating...</div>
                }
              </div>
              <div className="mt-3">
                <p className="font-bold text-[14px]" style={{ color: '#0F2342' }}>{clinicName}</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{clinicCity}</p>
              </div>
            </div>

            {/* Booking URL */}
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl mb-4"
              style={{ background: 'var(--color-surface-subtle)', border: 'calc(var(--space-0-5) / 2) solid var(--color-border)' }}>
              <span className="text-[12px] font-mono flex-1 truncate" style={{ color: 'var(--tm-text,#2D3748)' }}>{displayUrl}</span>
              <CopyBtn text={displayUrl} small />
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button variant="secondary" icon={Download} onClick={downloadQr}>Download PNG</Button>
              <Button variant="secondary" icon={Printer} onClick={() => setStandeeOpen(!standeeOpen)}>
                {standeeOpen ? 'Hide Print Preview' : 'Print Preview'}
              </Button>
              <Button icon={ExternalLink} iconPosition="right" className="ml-auto" onClick={() => window.open(bookingUrl || '/q', '_blank')}>
                Open Link
              </Button>
            </div>

            {/* Standee preview */}
            <AnimatePresence>
              {standeeOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl p-5 text-center relative overflow-hidden mt-4"
                    style={{ background: 'linear-gradient(135deg, #0F2342 0%, #0A1E40 100%)' }}>
                    <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Book Your Appointment</p>
                    <p className="text-white font-bold text-[16px] mb-0.5">{clinicName}</p>
                    <p className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>{doctorName}</p>
                    <div className="rounded-lg p-2 inline-block mb-2" style={{ background: 'var(--tm-surface,#fff)' }}>
                      {qrDataUrl
                        ? <img src={qrDataUrl} alt="Standee QR" width={90} height={90} style={{ borderRadius: 6, display: 'block' }} />
                        : <div style={{ width: 90, height: 90, background: '#F3F4F6', borderRadius: 6 }} />
                      }
                    </div>
                    <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.8)' }}>Scan with your phone camera</p>
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      <Smartphone size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{displayUrl}</span>
                    </div>
                  </div>
                  <p className="text-[12px] text-center mt-2" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Print at A5 and place at reception</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* SOURCE 5: Walk-in */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="ds-card qr-source-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                <MapPin size={18} style={{ color: '#d97706' }} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>Walk-in</h3>
                <p className="text-[12px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Receptionist adds manually via Appointments</p>
              </div>
              <div className="text-right ml-auto">
                <div className="flex items-center gap-1 justify-end text-[12px] font-bold" style={{ color: 'var(--color-success-text)' }}>
                  <ArrowUpRight size={13} />
                  {Math.round((((walkInStats?.thisMonth ?? 0) - (walkInStats?.lastMonth ?? 0)) / Math.max(walkInStats?.lastMonth ?? 1, 1)) * 100)}%
                </div>
                <p className="text-[12px] font-semibold" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{walkInStats?.thisMonth ?? 0} this month</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              {[
                { step: '1', text: 'Patient arrives at clinic without prior booking', color: '#d97706' },
                { step: '2', text: 'Receptionist clicks "Add Walk-in" on Appointments page', color: '#d97706' },
                { step: '3', text: 'System auto-assigns next available token number', color: '#1A5CB5' },
                { step: '4', text: 'Tagged as src=walkin automatically in analytics', color: '#1A5CB5' },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-xl text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: s.color }}>{s.step}</span>
                  <p className="text-[13px] leading-snug" style={{ color: 'var(--tm-text,#2D3748)' }}>{s.text}</p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'This Month', value: walkInStats?.thisMonth ?? 0, color: '#d97706', bg: '#fffbeb' },
                { label: 'Last Month', value: walkInStats?.lastMonth ?? 0, color: 'var(--tm-text-muted,#6b7280)', bg: '#f9fafb' },
                { label: 'Conversion', value: '100%', color: '#1A5CB5', bg: '#EFF6FF' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg, border: '1px solid #e5e7eb' }}>
                  <p className="text-[20px] font-bold leading-none" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2.5 p-3.5 rounded-xl"
              style={{ background: 'var(--tm-surface2,#EFF6FF)', border: '1px solid #BFDBFE' }}>
              <CheckCircle size={15} style={{ color: '#1A5CB5' }} />
              <p className="text-[13px]" style={{ color: 'var(--tm-text,#2D3748)' }}>
                Walk-ins are automatically tracked in source analytics — no extra setup needed
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Analytics Table ── */}
      <section>
        <div className="qr-section-heading">
          <div>
            <h2>Analytics</h2>
            <p>Spot high-performing booking sources and weak conversion points.</p>
          </div>
        </div>
        <AnalyticsTable />
      </section>

      {/* ── How it works ── */}
      <section>
      <div className="qr-section-heading">
        <div>
          <h2>Help / Booking Journey</h2>
          <p>Use this flow while explaining booking setup to clinic staff.</p>
        </div>
      </div>
      <div className="ds-card qr-section-card">
        <h2 className="text-[16px] font-semibold mb-5" style={{ color: 'var(--tm-text,#0F2D5E)' }}>How Patients Book Online</h2>
        <div className="space-y-4">
          {[
            { step: '1', text: 'Patient finds your clinic on Google / Just Dial / gets your missed-call WhatsApp', color: 'var(--tm-text,#0F2D5E)' },
            { step: '2', text: 'Scans the secure QR code and opens WhatsApp with the clinic QR code pre-filled', color: 'var(--tm-text,#0F2D5E)' },
            { step: '3', text: 'Sends START with the QR code to the shared TrikMed WhatsApp number', color: '#1A5CB5' },
            { step: '4', text: 'The booking conversation will be handled by the upcoming WhatsApp chatbot', color: '#1A5CB5' },
          ].map(s => (
            <div key={s.step} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0"
                style={{ background: s.color }}>{s.step}</div>
              <p className="text-[14px]" style={{ color: 'var(--tm-text,#0F2D5E)' }}>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
      </section>
    </div>
  )
}
