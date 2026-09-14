'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, AlertTriangle, Thermometer, Activity } from 'lucide-react'
import { getSession } from '../../../src/utils/auth'

// ── Threshold helpers ─────────────────────────────────────────────────────────

function tempFlag(v)  {
  const n = Number(v)
  if (!n) return null
  if (n > 100.4 || n < 97) return 'yellow'
  return null
}
function pulseFlag(v) {
  const n = Number(v)
  if (!n) return null
  return (n > 100 || n < 60) ? 'yellow' : null
}
function spo2Flag(v) {
  const n = Number(v)
  if (!n) return null
  if (n < 90) return 'red'
  if (n < 94) return 'yellow'
  return null
}
function bpFlag(sbp, dbp) {
  const s = Number(sbp), d = Number(dbp)
  if (s > 180 || d > 110) return 'red'
  if (s > 140 || d > 90)  return 'yellow'
  return null
}

const FLAG_COLOR  = { yellow: '#D97706', red: '#EF4444' }
const FLAG_MSG    = {
  temp_high:  'Fever — high temperature',
  temp_low:   'Below normal temperature',
  pulse_high: 'Tachycardia — high pulse rate',
  pulse_low:  'Bradycardia — low pulse rate',
  spo2_warn:  'Low SpO₂ — monitor closely',
  spo2_crit:  'Critical SpO₂ — refer urgently!',
  bp_htn1:    'Stage 1 Hypertension',
  bp_urgent:  'Hypertensive urgency — refer immediately!',
}

function tempMsg(v)  {
  const n = Number(v)
  return n > 100.4 ? FLAG_MSG.temp_high : n < 97 ? FLAG_MSG.temp_low : null
}
function pulseMsg(v) {
  const n = Number(v)
  return n > 100 ? FLAG_MSG.pulse_high : n < 60 ? FLAG_MSG.pulse_low : null
}
function spo2Msg(v)  {
  const n = Number(v)
  return n < 90 ? FLAG_MSG.spo2_crit : n < 94 ? FLAG_MSG.spo2_warn : null
}
function bpMsg(sbp, dbp) {
  const s = Number(sbp), d = Number(dbp)
  if (s > 180 || d > 110) return FLAG_MSG.bp_urgent
  if (s > 140 || d > 90)  return FLAG_MSG.bp_htn1
  return null
}

// ── Primitives ────────────────────────────────────────────────────────────────

const C = {
  navy:   '#0F2342',
  muted:  '#6B7A9A',
  border: '#E5E7EB',
  green:  '#16A34A',
  amber:  '#D97706',
  red:    '#EF4444',
}

function VLabel({ children }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 5px' }}>
      {children}
    </p>
  )
}

function FlagPill({ flag, msg }) {
  if (!flag || !msg) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11, fontWeight: 600, color: FLAG_COLOR[flag] }}>
      <AlertTriangle size={11} /> {msg}
    </div>
  )
}

function VInput({ label, value, onChange, placeholder, min, max, step = 1, inputRef, onKeyDown, flag, flagMsg, unit }) {
  const [focused, setFocused] = useState(false)
  const borderColor = flag === 'red' ? C.red : flag === 'yellow' ? C.amber : focused ? C.navy : C.border
  return (
    <div>
      <VLabel>{label}{unit && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4, color: '#9CA3AF' }}>({unit})</span>}</VLabel>
      <input
        ref={inputRef}
        type="number"
        inputMode="decimal"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        min={min} max={max} step={step}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: `1.5px solid ${borderColor}`,
          borderRadius: 8, padding: '9px 11px',
          fontSize: 14, color: C.navy, background: '#fff',
          outline: 'none', fontFamily: 'inherit',
          transition: 'border .15s',
        }}
      />
      <FlagPill flag={flag} msg={flagMsg} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VitalsModal({ appt, onClose, onSave, onSaveAndSend }) {
  // initialise from existing vitals on the appointment
  const v0 = appt.vitals || {}
  const [sbp0, dbp0] = (v0.bp || '').split('/').map(s => s?.trim() || '')

  const [form, setForm] = useState({
    temp:   String(v0.temp   || ''),
    pulse:  String(v0.pulse  || ''),
    sbp:    sbp0 || '',
    dbp:    dbp0 || '',
    spo2:   String(v0.spo2   || ''),
    weight: String(v0.weight || ''),
    notes:  v0.notes || '',
  })
  const [saving, setSaving] = useState(false)

  const session = getSession()
  const recorder = session?.name || 'Receptionist'
  const nowStr   = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  // ── Refs for keyboard navigation ────────────────────────────────────────────
  const refs = {
    temp:   useRef(),
    pulse:  useRef(),
    sbp:    useRef(),
    dbp:    useRef(),
    spo2:   useRef(),
    weight: useRef(),
    notes:  useRef(),
  }
  const tabOrder = ['temp', 'pulse', 'sbp', 'dbp', 'spo2', 'weight', 'notes']

  function advanceFocus(current) {
    const idx = tabOrder.indexOf(current)
    if (idx < tabOrder.length - 1) {
      refs[tabOrder[idx + 1]].current?.focus()
    } else {
      doSave(false)
    }
  }

  function makeKeyDown(field) {
    return (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        advanceFocus(field)
      }
    }
  }

  // Escape to close
  useEffect(() => {
    const fn = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  // Auto-focus temp on open
  useEffect(() => { refs.temp.current?.focus() }, [])

  function setF(k) { return v => setForm(p => ({ ...p, [k]: v })) }

  // ── Flags ───────────────────────────────────────────────────────────────────
  const fTemp  = tempFlag(form.temp)
  const fPulse = pulseFlag(form.pulse)
  const fSpo2  = spo2Flag(form.spo2)
  const fBp    = bpFlag(form.sbp, form.dbp)

  // ── Build storage object ────────────────────────────────────────────────────
  function buildVitals() {
    const out = {}
    if (form.sbp && form.dbp) out.bp     = `${form.sbp}/${form.dbp}`
    if (form.temp)            out.temp   = form.temp
    if (form.pulse)           out.pulse  = Number(form.pulse)
    if (form.spo2)            out.spo2   = form.spo2
    if (form.weight)          out.weight = Number(form.weight)
    if (form.notes.trim())    out.notes  = form.notes.trim()
    return out
  }

  function hasAnyField() {
    return !!(form.temp || form.pulse || form.sbp || form.dbp || form.spo2 || form.weight || form.notes.trim())
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  function doSave(sendToCabin) {
    if (!hasAnyField()) return
    setSaving(true)
    const vitals = {
      ...buildVitals(),
      vitalsRecordedAt:    new Date().toISOString(),
      vitalsRecordedBy:    session?.id || 'receptionist',
      vitalsRecordedByName: recorder,
    }
    if (sendToCabin) {
      onSaveAndSend?.(appt.id, vitals)
    } else {
      onSave?.(appt.id, vitals)
    }
    onClose()
  }

  const canSave       = hasAnyField()
  const canSendToCabin = ['booked', 'paid', 'vitals_done'].includes(appt.queueStatus)

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          background: '#fff', borderRadius: 14,
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          maxHeight: '95vh',
        }}
      >
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.navy, margin: 0 }}>
              Vitals — {appt.patientName}
            </h2>
            <p style={{ fontSize: 12, color: C.muted, margin: '2px 0 0' }}>
              Token T-{String(appt.tokenNum || appt.token).padStart(2, '0')} · {appt.time}
            </p>
          </div>
          <button onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#F3F4F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* Instruction */}
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 16, background: '#F9FAFB', borderRadius: 8, padding: '8px 12px' }}>
            Tab or Enter to move between fields. All fields optional — fill what's available.
          </p>

          {/* 2-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>

            {/* LEFT: Temperature */}
            <VInput
              label="Temperature" unit="°F"
              value={form.temp} onChange={setF('temp')}
              placeholder="98.6" min={90} max={110} step={0.1}
              inputRef={refs.temp} onKeyDown={makeKeyDown('temp')}
              flag={fTemp} flagMsg={tempMsg(form.temp)}
            />

            {/* RIGHT: Blood Pressure */}
            <div>
              <VLabel>Blood Pressure <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4, color: '#9CA3AF' }}>(mmHg)</span></VLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  ref={refs.sbp} type="number" inputMode="decimal"
                  value={form.sbp} onChange={e => setF('sbp')(e.target.value)}
                  onKeyDown={makeKeyDown('sbp')}
                  placeholder="Systolic" min={60} max={250}
                  style={{ flex: 1, border: `1.5px solid ${fBp === 'red' ? C.red : fBp === 'yellow' ? C.amber : C.border}`, borderRadius: 8, padding: '9px 11px', fontSize: 14, color: C.navy, background: '#fff', outline: 'none', fontFamily: 'inherit' }}
                />
                <span style={{ color: C.muted, fontWeight: 700, fontSize: 18 }}>/</span>
                <input
                  ref={refs.dbp} type="number" inputMode="decimal"
                  value={form.dbp} onChange={e => setF('dbp')(e.target.value)}
                  onKeyDown={makeKeyDown('dbp')}
                  placeholder="Diastolic" min={40} max={150}
                  style={{ flex: 1, border: `1.5px solid ${fBp === 'red' ? C.red : fBp === 'yellow' ? C.amber : C.border}`, borderRadius: 8, padding: '9px 11px', fontSize: 14, color: C.navy, background: '#fff', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <FlagPill flag={fBp} msg={bpMsg(form.sbp, form.dbp)} />
            </div>

            {/* LEFT: Pulse */}
            <VInput
              label="Pulse rate" unit="bpm"
              value={form.pulse} onChange={setF('pulse')}
              placeholder="72" min={30} max={200}
              inputRef={refs.pulse} onKeyDown={makeKeyDown('pulse')}
              flag={fPulse} flagMsg={pulseMsg(form.pulse)}
            />

            {/* RIGHT: Weight */}
            <VInput
              label="Weight" unit="kg"
              value={form.weight} onChange={setF('weight')}
              placeholder="65" min={1} max={200}
              inputRef={refs.weight} onKeyDown={makeKeyDown('weight')}
            />

            {/* LEFT: SpO2 */}
            <div>
              <VInput
                label="SpO₂" unit="%"
                value={form.spo2} onChange={setF('spo2')}
                placeholder="99" min={70} max={100}
                inputRef={refs.spo2} onKeyDown={makeKeyDown('spo2')}
                flag={fSpo2} flagMsg={spo2Msg(form.spo2)}
              />
            </div>

            {/* RIGHT: Notes */}
            <div>
              <VLabel>Notes <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4, color: '#9CA3AF' }}>(optional)</span></VLabel>
              <textarea
                ref={refs.notes}
                value={form.notes}
                onChange={e => setF('notes')(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSave(false) } }}
                placeholder="e.g. patient feels weak, ate before BP…"
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '9px 11px', fontSize: 13, fontFamily: 'inherit', color: C.navy, outline: 'none', resize: 'none', background: '#fff' }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, background: '#F9FAFB', flexShrink: 0 }}>
          {/* Meta */}
          <p style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
            Recorded by <strong>{recorder}</strong> · {nowStr}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={onClose}
              style={{ padding: '10px 18px', borderRadius: 12, background: '#fff', border: `1.5px solid ${C.border}`, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.muted, fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button onClick={() => doSave(false)} disabled={!canSave || saving}
              style={{ flex: 1, padding: '10px 18px', borderRadius: 12, background: canSave ? C.navy : '#9CA3AF', color: '#fff', border: 'none', cursor: canSave ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
              {saving ? 'Saving…' : 'Save Vitals'}
            </button>
            {canSendToCabin && (
              <button onClick={() => doSave(true)} disabled={!canSave || saving}
                style={{ flex: 1, padding: '10px 18px', borderRadius: 12, background: canSave ? '#16A34A' : '#9CA3AF', color: '#fff', border: 'none', cursor: canSave ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                Save & Send to Cabin
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Exported helpers for row display ──────────────────────────────────────────

/** Vitals state used to drive the button appearance on the row */
export function vitalsState(appt) {
  const v = appt.vitals
  if (!v) return 'empty'
  const hasAny = v.bp || v.temp || v.pulse || v.spo2 || v.weight
  if (!hasAny) return 'empty'
  const hasFull = (v.bp) && v.temp && v.pulse
  return hasFull ? 'full' : 'partial'
}

/** Number of filled vital fields (out of 6) */
export function vitalsFilledCount(v) {
  if (!v) return 0
  return [v.bp, v.temp, v.pulse, v.spo2, v.weight, v.notes].filter(f => f && String(f).trim()).length
}

/** Color flags for inline row display */
export function rowVitalsFlags(v) {
  if (!v) return {}
  const [sbp, dbp] = (v.bp || '').split('/').map(Number)
  const spo2  = Number(v.spo2)
  const temp  = Number(v.temp)
  const pulse = Number(v.pulse)
  return {
    bp:    (sbp > 180 || dbp > 110) ? 'red' : (sbp > 140 || dbp > 90) ? 'amber' : 'normal',
    spo2:  spo2  > 0 && spo2  < 90 ? 'red' : spo2 > 0 && spo2 < 94 ? 'amber' : 'normal',
    temp:  temp  > 0 && (temp  > 100.4 || temp  < 97) ? 'amber' : 'normal',
    pulse: pulse > 0 && (pulse > 100  || pulse < 60)  ? 'amber' : 'normal',
  }
}

const FLAG_C = { normal: '#9CA3AF', amber: '#D97706', red: '#EF4444' }

/** Compact inline vitals summary for the row */
export function VitalsInline({ vitals }) {
  if (!vitals) return null
  const flags = rowVitalsFlags(vitals)
  const parts = []
  if (vitals.bp)     parts.push({ text: `BP ${vitals.bp}`,           color: FLAG_C[flags.bp]    })
  if (vitals.temp)   parts.push({ text: `T ${vitals.temp}°F`,         color: FLAG_C[flags.temp]  })
  if (vitals.pulse)  parts.push({ text: `P ${vitals.pulse}`,          color: FLAG_C[flags.pulse] })
  if (vitals.spo2)   parts.push({ text: `SpO₂ ${vitals.spo2}%`,      color: FLAG_C[flags.spo2]  })
  if (!parts.length) return null
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
      {parts.map((p, i) => (
        <span key={i} style={{ fontSize: 11, fontWeight: 600, color: p.color, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          {p.color === FLAG_C.red && <AlertTriangle size={9} />}
          {p.text}
        </span>
      ))}
    </div>
  )
}
