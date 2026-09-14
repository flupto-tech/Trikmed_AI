'use client'

/**
 * AddMRDialog — full form modal to register a Medical Representative.
 * Visual style matches AddClinicWizard design system.
 *
 * Props
 * -----
 * isOpen | open  boolean   controls visibility (supports both names)
 * onClose        () => void
 * onSuccess      (mr: object) => void  called after successful API save
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Loader2, ImagePlus, Trash2, CheckCircle, AlertCircle,
} from 'lucide-react'
import api from '../../services/api'

// ── Design tokens — mirrors AddClinicWizard DS ────────────────────────────────
const DS = {
  primary:   '#0F2D5E',
  secondary: '#1A5CB5',
  accent:    '#E5402B',
  textMuted: '#6B7A9A',
  border:    '#DDE4F0',
  bg:        '#F7F9FF',
}

const baseInput = {
  width: '100%', height: 42, borderRadius: 8, padding: '0 12px',
  border: `1px solid ${DS.border}`, fontSize: 13, color: DS.primary,
  outline: 'none', background: '#fff', boxSizing: 'border-box',
  fontFamily: 'inherit', transition: 'border-color 0.15s',
}

// ── Phone helpers ─────────────────────────────────────────────────────────────
function normalizePhone(raw) {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2)
  if (digits.startsWith('0')  && digits.length === 11) digits = digits.slice(1)
  return digits.slice(0, 10)
}

// ── Validation ────────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateField(name, value) {
  switch (name) {
    case 'full_name':
      if (!value.trim())           return 'Full name is required'
      if (value.trim().length < 2) return 'Must be at least 2 characters'
      return null
    case 'phone': {
      const d = normalizePhone(value)
      if (!d)             return 'Phone number is required'
      if (d.length !== 10) return 'Must be exactly 10 digits'
      return null
    }
    case 'email':
      if (!value.trim()) return null
      if (!EMAIL_RE.test(value.trim())) return 'Invalid email address'
      return null
    case 'company_name':
      if (!value.trim())           return 'Company name is required'
      if (value.trim().length < 2) return 'Must be at least 2 characters'
      return null
    default:
      return null
  }
}

function validateAll(form) {
  const errs = {}
  ;['full_name', 'phone', 'email', 'company_name'].forEach(k => {
    const e = validateField(k, form[k])
    if (e) errs[k] = e
  })
  return errs
}

// ── Primitives ────────────────────────────────────────────────────────────────
function FieldLabel({ label, required }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 600, color: DS.textMuted, display: 'block', marginBottom: 5 }}>
      {label}{required && <span style={{ color: DS.accent, marginLeft: 2 }}>*</span>}
    </label>
  )
}

function Field({ label, required, hint, error, children }) {
  return (
    <div>
      {label && <FieldLabel label={label} required={required} />}
      {children}
      {error
        ? <p style={{ fontSize: 11, color: DS.accent, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={11} style={{ flexShrink: 0 }} />{error}
          </p>
        : hint
        ? <p style={{ fontSize: 11, color: DS.textMuted, marginTop: 4 }}>{hint}</p>
        : null
      }
    </div>
  )
}

function PlainInput({ error, forwardRef, ...props }) {
  const style = { ...baseInput, ...(error ? { borderColor: DS.accent } : {}) }
  return (
    <input
      ref={forwardRef}
      style={style}
      onFocus={e => { if (!error) e.target.style.borderColor = DS.secondary }}
      onBlur={e  => { e.target.style.borderColor = error ? DS.accent : DS.border }}
      {...props}
    />
  )
}

function SectionHead({ title }) {
  return (
    <p style={{
      fontSize: 13, fontWeight: 700, color: DS.primary,
      margin: '0 0 14px', paddingBottom: 8,
      borderBottom: `1px solid ${DS.border}`,
    }}>
      {title}
    </p>
  )
}

// ── Company autocomplete ───────────────────────────────────────────────────────
function CompanyField({ value, onChange, error, onBlur }) {
  const [query,   setQuery]   = useState(value)
  const [options, setOptions] = useState([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [cursor,  setCursor]  = useState(-1)
  const debounce  = useRef(null)

  useEffect(() => { setQuery(value) }, [value])

  const fetchCompanies = useCallback(async q => {
    if (!q || q.length < 1) { setOptions([]); return }
    setLoading(true)
    try {
      const res = await fetch(
        `/api/v1/pharma-companies?search=${encodeURIComponent(q)}&limit=8`,
        { credentials: 'include' },
      )
      if (res.ok) {
        const data = await res.json()
        setOptions(Array.isArray(data) ? data : data.items ?? [])
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  function handleChange(e) {
    const v = e.target.value
    setQuery(v); onChange(v); setCursor(-1); setOpen(true)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => fetchCompanies(v), 300)
  }

  function select(name) { setQuery(name); onChange(name); setOpen(false); setOptions([]) }

  function handleKeyDown(e) {
    if (!open || !options.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, options.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter' && cursor >= 0) { e.preventDefault(); select(options[cursor].name ?? options[cursor]) }
    if (e.key === 'Escape') setOpen(false)
  }

  const inputStyle = { ...baseInput, ...(error ? { borderColor: DS.accent } : {}) }

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={e => { if (!error) e.target.style.borderColor = DS.secondary; query && setOpen(true) }}
        onBlur={e  => { e.target.style.borderColor = error ? DS.accent : DS.border; setTimeout(() => setOpen(false), 150); onBlur?.() }}
        placeholder="e.g., Sun Pharma, Cipla, USV"
        autoComplete="off"
        style={inputStyle}
      />
      {loading && (
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
          <Loader2 size={13} className="animate-spin" style={{ color: DS.textMuted }} />
        </span>
      )}
      <AnimatePresence>
        {open && (loading || options.length > 0) && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'absolute', zIndex: 30, top: '100%', marginTop: 4, width: '100%',
              background: '#fff', border: `1px solid ${DS.border}`, borderRadius: 8,
              boxShadow: '0 4px 12px rgba(15,45,94,0.1)', padding: '4px 0',
              maxHeight: 192, overflowY: 'auto', listStyle: 'none', margin: '4px 0 0',
            }}
          >
            {options.map((opt, i) => {
              const name = typeof opt === 'string' ? opt : (opt.name ?? '')
              return (
                <li
                  key={name + i}
                  onMouseDown={() => select(name)}
                  style={{
                    padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                    color: cursor === i ? DS.secondary : DS.primary,
                    background: cursor === i ? '#EFF6FF' : 'transparent',
                  }}
                >
                  {name}
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Photo upload ──────────────────────────────────────────────────────────────
const MAX_BYTES = 2 * 1024 * 1024

function PhotoUpload({ onUploaded, onError, onUploading }) {
  const [preview,   setPreview]   = useState(null)
  const [progress,  setProgress]  = useState(0)
  const [uploading, setUploading] = useState(false)
  const [done,      setDone]      = useState(false)
  const [err,       setErr]       = useState(null)
  const fileRef = useRef(null)

  function reset() {
    setPreview(null); setProgress(0); setUploading(false); setDone(false); setErr(null)
    onUploaded(null)
  }

  async function handleFile(file) {
    setErr(null)
    if (!file.type.startsWith('image/')) { setErr('Please select an image file'); return }
    if (file.size > MAX_BYTES)           { setErr('Image must be under 2 MB');    return }
    setPreview(URL.createObjectURL(file))
    setUploading(true); setDone(false); onUploading(true)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', 'visiting_card')

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/v1/upload')
    xhr.withCredentials = true
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      setUploading(false); onUploading(false)
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText)
          onUploaded(body.url ?? body.file_url ?? body.visiting_card_url)
          setDone(true); setProgress(100)
        } catch {
          setErr('Upload succeeded but response was unexpected')
          onError?.('Upload parse error')
        }
      } else {
        setErr('Upload failed — please try again')
        onError?.('Upload failed')
        setPreview(null)
      }
    }
    xhr.onerror = () => {
      setUploading(false); onUploading(false)
      setErr('Network error during upload'); onError?.('Network error'); setPreview(null)
    }
    xhr.send(fd)
  }

  return (
    <div>
      {!preview ? (
        <label
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 8, border: `2px dashed ${DS.border}`,
            borderRadius: 10, padding: '20px 16px', background: DS.bg, cursor: 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = DS.secondary; e.currentTarget.style.background = '#EFF6FF' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border;     e.currentTarget.style.background = DS.bg }}
        >
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', border: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImagePlus size={18} style={{ color: DS.textMuted }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: DS.primary, margin: 0 }}>Click to upload visiting card</p>
            <p style={{ fontSize: 11, color: DS.textMuted, marginTop: 2 }}>JPG, PNG, WEBP — max 2 MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
      ) : (
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: `1px solid ${DS.border}` }}>
          <img src={preview} alt="Visiting card preview" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
          {uploading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Loader2 size={20} className="animate-spin" style={{ color: '#fff' }} />
              <div style={{ width: 120, height: 4, background: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#fff', transition: 'width 0.3s' }} />
              </div>
              <p style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{progress}%</p>
            </div>
          )}
          {done && !uploading && (
            <div style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={13} style={{ color: '#fff' }} />
            </div>
          )}
          {!uploading && (
            <button type="button" onClick={reset}
              style={{ position: 'absolute', top: 8, left: 8, width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={12} style={{ color: '#fff' }} />
            </button>
          )}
        </div>
      )}
      {err && (
        <p style={{ fontSize: 11, color: DS.accent, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertCircle size={11} style={{ flexShrink: 0 }} />{err}
        </p>
      )}
    </div>
  )
}

// ── Success toast ─────────────────────────────────────────────────────────────
function SuccessToast({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.22 }}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 18px', borderRadius: 12,
            background: DS.secondary, color: '#fff',
            fontSize: 13, fontWeight: 600,
            boxShadow: '0 4px 20px rgba(26,92,181,0.3)',
          }}
        >
          <CheckCircle size={16} style={{ flexShrink: 0 }} />
          MR added successfully
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Initial state ─────────────────────────────────────────────────────────────
const BLANK = {
  full_name: '', phone: '', email: '',
  company_name: '', designation: '', territory: '', notes: '',
}

// ── Main dialog ───────────────────────────────────────────────────────────────
export default function AddMRDialog({ isOpen, open, onClose, onSuccess }) {
  const visible = isOpen ?? open ?? false

  const [form,          setForm]          = useState(BLANK)
  const [errors,        setErrors]        = useState({})
  const [touched,       setTouched]       = useState({})
  const [attempted,     setAttempted]     = useState(false)
  const [products,      setProducts]      = useState([])
  const [prodInput,     setProdInput]     = useState('')
  const [photoUrl,      setPhotoUrl]      = useState(null)
  const [photoLoading,  setPhotoLoading]  = useState(false)
  const [submitting,    setSubmitting]    = useState(false)
  const [globalError,   setGlobalError]   = useState(null)
  const [showToast,     setShowToast]     = useState(false)

  const firstRef = useRef(null)

  useEffect(() => {
    if (visible) {
      setForm(BLANK); setErrors({}); setTouched({}); setAttempted(false)
      setProducts([]); setProdInput(''); setPhotoUrl(null)
      setPhotoLoading(false); setSubmitting(false); setGlobalError(null)
      setTimeout(() => firstRef.current?.focus(), 80)
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const fn = e => { if (e.key === 'Escape' && !submitting) onClose?.() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [visible, submitting, onClose])

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    if (attempted || touched[key]) {
      const e = validateField(key, value)
      setErrors(errs => ({ ...errs, [key]: e }))
    }
    setGlobalError(null)
  }

  function handleBlur(key) {
    setTouched(t => ({ ...t, [key]: true }))
    const e = validateField(key, form[key])
    setErrors(errs => ({ ...errs, [key]: e }))
  }

  function addProduct() {
    const t = prodInput.trim()
    if (t && !products.includes(t)) setProducts(p => [...p, t])
    setProdInput('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setAttempted(true)
    const errs = validateAll(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      const first = ['full_name', 'phone', 'email', 'company_name'].find(k => errs[k])
      document.querySelector(`[data-field="${first}"]`)?.focus()
      return
    }
    if (photoLoading) { setGlobalError('Please wait — photo is still uploading.'); return }
    setSubmitting(true); setGlobalError(null)
    try {
      const body = {
        full_name:            form.full_name.trim(),
        phone:                normalizePhone(form.phone),
        email:                form.email.trim() || undefined,
        company_name:         form.company_name.trim(),
        designation:          form.designation.trim() || undefined,
        territory:            form.territory.trim() || undefined,
        notes:                form.notes.trim() || undefined,
        products_represented: products,
        visiting_card_url:    photoUrl ?? undefined,
      }
      const mr = await api.post('/mr', body)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
      onSuccess?.(mr); onClose?.()
    } catch (err) {
      let msg = 'Network error — please check your connection and try again.'
      if (err?.detail) msg = Array.isArray(err.detail) ? err.detail.map(d => d.msg).join(', ') : String(err.detail)
      else if (err?.message) msg = err.message
      setGlobalError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const busy        = submitting || photoLoading
  const phoneDigits = normalizePhone(form.phone)
  const phoneHint   = !errors.phone && phoneDigits.length === 10
    ? `Will save as: +91 ${phoneDigits.slice(0, 5)} ${phoneDigits.slice(5)}`
    : null

  return (
    <>
      <SuccessToast show={showToast} />

      <AnimatePresence>
        {visible && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">

            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
              onClick={() => !busy && onClose?.()}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'relative', zIndex: 10, width: '100%', maxWidth: 520,
                background: '#fff', borderRadius: 16, border: `1px solid ${DS.border}`,
                boxShadow: '0 20px 60px rgba(15,45,94,0.18)',
                display: 'flex', flexDirection: 'column', maxHeight: '92dvh',
              }}
            >
              {/* ── Header ──────────────────────────────────────────────────── */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                padding: '20px 24px 16px', borderBottom: `1px solid ${DS.border}`, flexShrink: 0,
              }}>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: DS.primary, margin: 0 }}>
                    Add Medical Representative
                  </h2>
                  <p style={{ fontSize: 12, color: DS.textMuted, margin: '3px 0 0' }}>
                    Register an MR to start managing their visits.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !busy && onClose?.()}
                  disabled={busy}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: `1px solid ${DS.border}`, background: 'transparent',
                    cursor: busy ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: DS.textMuted, flexShrink: 0, marginLeft: 12, marginTop: 2,
                    opacity: busy ? 0.4 : 1,
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* ── Scrollable body ──────────────────────────────────────────── */}
              <form
                id="add-mr-form"
                onSubmit={handleSubmit}
                noValidate
                style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
              >
                <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>

                  {/* Global error */}
                  <AnimatePresence>
                    {globalError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}
                      >
                        <AlertCircle size={14} style={{ color: DS.accent, marginTop: 1, flexShrink: 0 }} />
                        <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>{globalError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Personal Information ─────────────────────────────────── */}
                  <div>
                    <SectionHead title="Personal Information" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <Field label="Full Name" required error={errors.full_name}>
                        <PlainInput
                          data-field="full_name"
                          forwardRef={firstRef}
                          placeholder="e.g., Arjun Mehta"
                          value={form.full_name}
                          error={errors.full_name}
                          onChange={e => setField('full_name', e.target.value)}
                          onBlur={() => handleBlur('full_name')}
                        />
                      </Field>
                      <Field label="Phone" required error={errors.phone} hint={phoneHint}>
                        <PlainInput
                          data-field="phone"
                          type="tel"
                          placeholder="98765 43210"
                          autoComplete="off"
                          value={form.phone}
                          error={errors.phone}
                          onChange={e => setField('phone', e.target.value)}
                          onBlur={() => handleBlur('phone')}
                          maxLength={15}
                        />
                      </Field>
                    </div>
                  </div>

                  {/* ── Contact ──────────────────────────────────────────────── */}
                  <div>
                    <SectionHead title="Contact" />
                    <Field label="Email" error={errors.email} hint="Optional — for sending updates">
                      <PlainInput
                        data-field="email"
                        type="email"
                        placeholder="arjun@example.com"
                        value={form.email}
                        error={errors.email}
                        onChange={e => setField('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                      />
                    </Field>
                  </div>

                  {/* ── Professional Details ─────────────────────────────────── */}
                  <div>
                    <SectionHead title="Professional Details" />
                    <div style={{ marginBottom: 14 }}>
                      <Field label="Company Name" required error={errors.company_name}>
                        <CompanyField
                          value={form.company_name}
                          onChange={v => setField('company_name', v)}
                          onBlur={() => handleBlur('company_name')}
                          error={errors.company_name}
                        />
                      </Field>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <Field label="Designation" hint="e.g. Senior MR, TM">
                        <PlainInput
                          placeholder="e.g., Senior MR, Area Manager"
                          value={form.designation}
                          onChange={e => setField('designation', e.target.value)}
                        />
                      </Field>
                      <Field label="Territory" hint="Area they cover">
                        <PlainInput
                          placeholder="e.g., Jaipur South, Mumbai West"
                          value={form.territory}
                          onChange={e => setField('territory', e.target.value)}
                        />
                      </Field>
                    </div>
                  </div>

                  {/* ── Products Represented ─────────────────────────────────── */}
                  <div>
                    <SectionHead title="Products Represented" />
                    <Field hint='Type a product name and press Enter or "+"'>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          style={{ ...baseInput, flex: 1 }}
                          placeholder="Type product name and press Enter"
                          value={prodInput}
                          onChange={e => setProdInput(e.target.value)}
                          onFocus={e => e.target.style.borderColor = DS.secondary}
                          onBlur={e  => e.target.style.borderColor = DS.border}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addProduct() } }}
                        />
                        <button
                          type="button"
                          onClick={addProduct}
                          disabled={!prodInput.trim()}
                          style={{
                            width: 42, height: 42, borderRadius: 8, border: 'none', flexShrink: 0,
                            background: prodInput.trim() ? DS.secondary : '#e5e7eb',
                            color: prodInput.trim() ? '#fff' : '#9ca3af',
                            cursor: prodInput.trim() ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.15s',
                          }}
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    </Field>
                    {products.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                        <AnimatePresence>
                          {products.map(p => (
                            <motion.span
                              key={p}
                              initial={{ scale: 0.85, opacity: 0 }}
                              animate={{ scale: 1,    opacity: 1 }}
                              exit={{ scale: 0.85, opacity: 0 }}
                              transition={{ duration: 0.12 }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '4px 10px 4px 12px', borderRadius: 8,
                                fontSize: 12, fontWeight: 500,
                                background: '#EFF6FF', color: DS.secondary,
                                border: '1px solid #BFDBFE',
                              }}
                            >
                              {p}
                              <button
                                type="button"
                                onClick={() => setProducts(ps => ps.filter(x => x !== p))}
                                style={{ width: 16, height: 16, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DS.secondary, padding: 0 }}
                                aria-label={`Remove ${p}`}
                              >
                                <X size={10} />
                              </button>
                            </motion.span>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* ── Visiting Card ─────────────────────────────────────────── */}
                  <div>
                    <SectionHead title="Visiting Card" />
                    <PhotoUpload
                      onUploaded={url => setPhotoUrl(url)}
                      onUploading={v => setPhotoLoading(v)}
                      onError={msg => setGlobalError(`Photo: ${msg}`)}
                    />
                    <p style={{ fontSize: 11, color: DS.textMuted, marginTop: 6 }}>Upload the MR's business card (optional)</p>
                  </div>

                  {/* ── Notes ────────────────────────────────────────────────── */}
                  <div>
                    <SectionHead title="Notes" />
                    <FieldLabel label="Internal notes" />
                    <textarea
                      rows={3}
                      placeholder="Any private notes about this MR..."
                      value={form.notes}
                      onChange={e => setField('notes', e.target.value)}
                      style={{ ...baseInput, height: 'auto', padding: '10px 12px', resize: 'vertical' }}
                      onFocus={e => e.target.style.borderColor = DS.secondary}
                      onBlur={e  => e.target.style.borderColor = DS.border}
                    />
                    <p style={{ fontSize: 11, color: DS.textMuted, marginTop: 4 }}>Private — only you can see this</p>
                  </div>

                </div>

                {/* ── Footer ──────────────────────────────────────────────────── */}
                <div style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 12,
                  padding: '14px 24px', borderTop: `1px solid ${DS.border}`,
                  background: DS.bg,
                }}>
                  <p style={{ fontSize: 11, color: DS.textMuted, margin: 0 }}>
                    <span style={{ color: DS.accent }}>*</span> Required fields
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => !busy && onClose?.()}
                      disabled={busy}
                      style={{
                        height: 40, padding: '0 20px', borderRadius: 8,
                        border: `1px solid ${DS.border}`, background: 'transparent',
                        fontSize: 13, color: DS.textMuted,
                        cursor: busy ? 'not-allowed' : 'pointer',
                        fontWeight: 500, opacity: busy ? 0.5 : 1,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="add-mr-form"
                      disabled={busy}
                      style={{
                        height: 40, padding: '0 24px', borderRadius: 8, border: 'none',
                        background: busy ? '#9ca3af' : DS.secondary,
                        color: '#fff', fontSize: 13, fontWeight: 700,
                        cursor: busy ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'background 0.15s',
                        boxShadow: busy ? 'none' : '0 2px 8px rgba(26,92,181,0.3)',
                      }}
                    >
                      {submitting
                        ? <><Loader2 size={14} className="animate-spin" />Saving…</>
                        : photoLoading
                        ? <><Loader2 size={14} className="animate-spin" />Uploading…</>
                        : <><Plus size={14} />Add MR</>
                      }
                    </button>
                  </div>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
