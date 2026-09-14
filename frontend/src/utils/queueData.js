'use client'
// Queue data layer — bridges trikmed.appointments ↔ QueueScreen UI
// Storage uses canonical status values; QueueScreen uses legacy queueStatus names.
// All reads/writes go through rxStorage so QueueScreen, OPD Console, and
// Appointments stay in sync.

import {
  getAllAppointments,
  getTodayAppointments,
  generateToken,
  saveAppointment,
  KEYS,
} from '../../lib/rxStorage'

// ── Status display map (all possible values from both storage and legacy) ──────
export const QUEUE_STATUS = {
  booked:      { label: 'Booked',    bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb', rowBorder: '#d1d5db' },
  paid:        { label: 'Paid ✓',   bg: '#fffbeb', color: '#d97706', border: '#fde68a', rowBorder: '#f59e0b' },
  vitals_done: { label: 'Vitals ✓', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', rowBorder: '#22c55e' },
  in_cabin:    { label: 'In Cabin', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', rowBorder: '#3b82f6' },
  completed:   { label: 'Done',     bg: '#EFF6FF', color: '#1A5CB5', border: '#BFDBFE', rowBorder: '#1A5CB5' },
  no_show:     { label: 'No-show',  bg: '#fff1f2', color: '#e11d48', border: '#fecdd3', rowBorder: '#f43f5e' },
  cancelled:   { label: 'Cancelled',bg: '#f9fafb', color: '#9ca3af', border: '#e5e7eb', rowBorder: '#e5e7eb' },
}

// ── Bidirectional status mapping ───────────────────────────────────────────────
// Storage (canonical) → QueueScreen (UI legacy names)
const TO_QUEUE_STATUS = {
  confirmed:   'booked',
  paid:        'paid',
  vitals_done: 'vitals_done',
  in_cabin:    'in_cabin',
  done:        'completed',
  no_show:     'no_show',
  cancelled:   'cancelled',
}
// QueueScreen (UI) → Storage (canonical)
const FROM_QUEUE_STATUS = {
  booked:      'confirmed',
  paid:        'paid',
  vitals_done: 'vitals_done',
  in_cabin:    'in_cabin',
  completed:   'done',
  no_show:     'no_show',
  cancelled:   'cancelled',
}

export function todayStr() {
  return new Date().toISOString().split('T')[0]
}
export function fmtToken(n) {
  return `T-${String(n).padStart(2, '0')}`
}

/** Map an appointment from storage → QueueScreen row model */
function apptToRow(a, fallbackToken) {
  return {
    ...a,
    tokenNum:     a.tokenNum || a.token || fallbackToken,
    queueStatus:  a.queueStatus || TO_QUEUE_STATUS[a.status] || 'booked',
    paymentAmount: a.paymentAmount || null,
    patientName:  a.patientName || a.patient?.name || a.patient?.full_name || 'Walk-in Patient',
    patientPhone: a.patientPhone || a.patient?.phone || '',
    date:         a.date || a.appointment_date,
    time:         a.time || a.appointment_time,
    reason:       a.reason || a.notes || 'General consultation',
  }
}

export function normalizeQueueRows(rows = []) {
  return rows.map((row, index) => apptToRow(row, index + 1))
}

/**
 * Load today's queue from trikmed.appointments.
 * Falls back to processing raw mock data only if storage is empty.
 */
export function loadQueueState(raw = []) {
  const stored = getTodayAppointments()

  if (stored.length > 0) {
    return stored.map((a, i) => apptToRow(a, i + 1))
  }

  // No stored appointments yet — process raw mock for today
  if (!raw || raw.length === 0) return []
  return initAppts(raw).filter(a => a.date === todayStr())
}

/**
 * Persist QueueScreen state changes back to trikmed.appointments.
 * QueueScreen calls this in a useEffect on every state change.
 */
export function saveQueueState(rows) {
  if (!rows || rows.length === 0) return
  const all = getAllAppointments()
  const TODAY = todayStr()

  rows.forEach(row => {
    const idx = all.findIndex(a => a.id === row.id)
    const canonical = {
      ...row,
      status:        FROM_QUEUE_STATUS[row.queueStatus] || row.queueStatus,
      paymentAmount: row.paymentAmount ?? (idx >= 0 ? all[idx].paymentAmount : null),
      slot:          row.slot ?? (idx >= 0 ? all[idx].slot : null) ?? null,
      updatedAt:     new Date().toISOString(),
    }
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...canonical }
    } else if (row.date === TODAY || !row.date) {
      // API-sourced appointment not yet in localStorage — add it
      all.push(canonical)
    }
  })

  try {
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(all))
  } catch { /* quota */ }
}

/** Add a new walk-in appointment to storage and return as a queue row */
export function addWalkInToQueue({ patientName, patientPhone, reason, time, doctorId = 'dr001' }) {
  const today = todayStr()
  const token = generateToken(today)

  const saved = saveAppointment({
    patientId:       `p_${Date.now()}`,
    patientName:     patientName || 'Walk-in Patient',
    patientPhone:    patientPhone || '',
    doctorId,
    date:            today,
    time:            time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
    token,
    type:            'Walk-in',
    reason:          reason || 'General consultation',
    status:          'confirmed',
    vitals:          null,
    vitalsEnteredAt: null,
    paymentAmount:   null,
    notes:           '',
  })

  return apptToRow(saved, token)
}

// ── Legacy initAppts ── (used when storage has no data, processes raw mock data)
export function initAppts(raw) {
  const TODAY = todayStr()
  const byDate = {}
  raw.forEach(a => { if (!byDate[a.date]) byDate[a.date] = []; byDate[a.date].push(a) })
  const tokenMap = {}
  Object.entries(byDate).forEach(([, list]) => {
    ;[...list].sort((a, b) => a.time.localeCompare(b.time)).forEach((a, i) => { tokenMap[a.id] = i + 1 })
  })
  return raw.map(a => {
    const tokenNum = tokenMap[a.id]
    let queueStatus = 'booked'
    let paymentAmount = null
    if (a.status === 'completed') { queueStatus = 'completed'; paymentAmount = 300 + (tokenNum % 5) * 100 }
    else if (a.status === 'no-show') queueStatus = 'no_show'
    else if (a.status === 'cancelled') queueStatus = 'cancelled'
    else if (a.date === TODAY) {
      if (a.status === 'waiting') { queueStatus = 'in_cabin'; paymentAmount = 500 }
      else if (tokenNum === 8 || tokenNum === 9) { queueStatus = 'paid'; paymentAmount = 300 + (tokenNum % 5) * 100 }
    }
    return { ...a, queueStatus, tokenNum, paymentAmount }
  })
}

// Legacy key alias
export const QUEUE_STORAGE_KEY = KEYS.APPOINTMENTS
