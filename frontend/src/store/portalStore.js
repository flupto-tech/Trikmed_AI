'use client'
// ── Portal Store — module-level mutable state for demo reactivity ────────────
// All changes persist within the browser session (in-memory, no backend).
// API wiring: import authApi + setSession/clearSession, then uncomment TODOs below.
import { useState, useEffect } from 'react'
import { setSession, clearSession } from '../utils/auth'
// TODO: Ashutosh uncomment ↓ (auth API wiring)
// import { authApi } from '../services/authApi'
import {
  onboardingQueue as _ob,
  salesLeads as _leads,
  installationQueue as _installs,
  mrVisits as _visits,
  visitHistory as _history,
  portalClinics as _clinics,
} from '../data/portalData'

// Deep-copy initial state so mutations don't affect the source module
let _state = {
  onboardings: _ob.map(o => ({ ...o })),
  leads: _leads.map(l => ({ ...l })),
  installations: _installs.map(i => ({ ...i, steps: { ...i.steps } })),
  visits: _visits.map(v => ({ ...v })),
  visitLogs: _history.map(v => ({ ...v })),
  clinics: _clinics.map(c => ({ ...c })),
  issues: [],
  toast: null,
}

const listeners = new Set()
const notify = () => listeners.forEach(fn => fn())
const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn) }

// ─── React hook ──────────────────────────────────────────────────────────────
export function useStore() {
  const [, forceUpdate] = useState(0)
  useEffect(() => subscribe(() => forceUpdate(n => n + 1)), [])
  return _state
}

// ─── Toast helper (shown in dashboards) ──────────────────────────────────────
function showToast(msg, type = 'success') {
  _state = { ..._state, toast: { msg, type, id: Date.now() } }
  notify()
  setTimeout(() => {
    _state = { ..._state, toast: null }
    notify()
  }, 3000)
}

// ─── Actions ─────────────────────────────────────────────────────────────────
export const actions = {

  // City Manager: Approve / Reject onboarding
  approveOnboarding(id) {
    _state = {
      ..._state,
      onboardings: _state.onboardings.map(o =>
        o.id === id ? { ...o, status: 'approved' } : o
      ),
    }
    showToast('Clinic approved! Installer will be notified.')
  },

  rejectOnboarding(id) {
    _state = {
      ..._state,
      onboardings: _state.onboardings.map(o =>
        o.id === id ? { ...o, status: 'rejected' } : o
      ),
    }
    showToast('Onboarding rejected.', 'error')
  },

  // MR: Log a visit
  logVisit(clinicName, notes, followUp) {
    const log = {
      id: `VH${Date.now()}`,
      clinicName,
      notes,
      followUp,
      date: 'Today',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: 'done',
    }
    _state = {
      ..._state,
      visitLogs: [log, ..._state.visitLogs],
      visits: _state.visits.map(v =>
        v.clinic === clinicName ? { ...v, status: 'completed' } : v
      ),
    }
    showToast(`Visit to ${clinicName} logged successfully.`)
  },

  // Sales: Add new lead
  addLead(lead) {
    _state = { ..._state, leads: [{ ...lead, id: `LD${Date.now()}` }, ..._state.leads] }
    showToast(`Lead added: ${lead.clinic}`)
  },

  // Sales: Move lead to different stage
  moveLead(leadId, newStage) {
    _state = {
      ..._state,
      leads: _state.leads.map(l =>
        l.id === leadId ? { ...l, status: newStage } : l
      ),
    }
    showToast('Lead stage updated.')
  },

  // Installer: Update checklist steps
  updateInstallSteps(id, steps) {
    _state = {
      ..._state,
      installations: _state.installations.map(i =>
        i.id === id ? { ...i, steps: { ...steps } } : i
      ),
    }
    notify()
  },

  // Installer: Mark installation complete
  completeInstall(id) {
    const allDone = { whatsapp: true, qr: true, training: true, test: true, staff: true }
    _state = {
      ..._state,
      installations: _state.installations.map(i =>
        i.id === id ? { ...i, status: 'completed', steps: allDone } : i
      ),
    }
    showToast('Installation marked complete! City Manager notified.')
  },

  // Installer: Report issue
  reportIssue(installId, clinicName, issueText) {
    const issue = {
      id: `IS${Date.now()}`,
      installId,
      clinicName,
      issueText,
      reportedAt: new Date().toLocaleString('en-IN'),
      status: 'open',
    }
    _state = { ..._state, issues: [issue, ..._state.issues] }
    showToast('Issue reported. City Manager will follow up.', 'warning')
  },

  // Add Clinic: submit for approval (used by AddClinic.jsx)
  submitClinic(clinicData) {
    const ob = {
      id: `OB${Date.now()}`,
      ...clinicData,
      status: 'pending_approval',
      submittedDate: 'Today',
    }
    _state = { ..._state, onboardings: [..._state.onboardings, ob] }
    showToast('Clinic submitted for City Manager approval!')
  },

  clearToast() {
    _state = { ..._state, toast: null }
    notify()
  },

  // ── Auth actions (Step 12) ──────────────────────────────────────────────────
  loginClinic: async (email, password) => {
    // TODO: Ashutosh uncomment ↓
    // const res = await authApi.clinicLogin(email, password)
    // setSession(res.token, res.user)
    // _state = { ..._state, user: res.user }; notify()
    // return res.user
    // MOCK (keep until API ready):
    if (email === 'demo@trikmed.com' && password === 'demo1234') {
      const user = { id: '1', name: 'Dr. Sharma', role: 'clinic', clinic_id: 'CLN001' }
      setSession('mock_token', user)
      _state = { ..._state, user }; notify()
      return user
    }
    throw { message: 'Invalid credentials' }
  },

  loginAdmin: async (email, password) => {
    // TODO: Ashutosh uncomment ↓
    // const res = await authApi.adminLogin(email, password)
    // setSession(res.token, res.user)
    // _state = { ..._state, user: res.user }; notify()
    // return res.user
    // MOCK (keep until API ready):
    if (email === 'admin@trikmed.com' && password === 'admin1234') {
      const user = { id: '2', name: 'Amit Singh', role: 'admin', zone: 'North Zone' }
      setSession('mock_admin_token', user)
      _state = { ..._state, user }; notify()
      return user
    }
    throw { message: 'Invalid credentials' }
  },

  storeLogout: () => {
    // TODO: Ashutosh uncomment ↓
    // authApi.logout().catch(() => {})
    clearSession()
    _state = { ..._state, user: null }
    notify()
  },
}
