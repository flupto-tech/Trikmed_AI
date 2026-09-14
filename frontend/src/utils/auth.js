'use client'
import { canDo } from '../config/roles'
import { storage } from './storage'

const MOCK_SESSION_KEY = 'trikmed_session'
const API_TOKEN_KEY = 'trikmed_token'
const API_USER_KEY = 'trikmed_user'

const USERS = {
  // Clinic users — different clinic_role for each
  'demo@trikmed.com':      { password:'demo1234',  role:'clinic', clinic_role:'doctor_owner', name:'Dr. Rajesh Sharma' },
  'owner@trikmed.com':     { password:'demo1234',  role:'clinic', clinic_role:'owner',        name:'Vikash Panwar (Owner)' },
  'recep@trikmed.com':     { password:'demo1234',  role:'clinic', clinic_role:'receptionist', name:'Sunita Receptionist' },
  'staff@trikmed.com':     { password:'demo1234',  role:'clinic', clinic_role:'staff',        name:'Raju Helper' },
  // Admin / internal users
  'admin@trikmed.com':     { password:'admin1234', role:'admin',      name:'TrikMed Admin' },
  'super@trikmed.com':     { password:'super1234', role:'super',      name:'Vikram Mehta',   zone:null,          city:null     },
  'zone@trikmed.com':      { password:'zone1234',  role:'zone',       name:'Amit Singh',     zone:'North Zone',  city:null     },
  'city@trikmed.com':      { password:'city1234',  role:'city',       name:'Rahul Verma',    zone:'North Zone',  city:'Jaipur' },
  'sales@trikmed.com':     { password:'sales1234', role:'sales',      name:'Rohit Sharma',   zone:'North Zone',  city:'Jaipur' },
  'mr@trikmed.com':        { password:'mr1234',    role:'mr',         name:'Suresh Kumar',   zone:'North Zone',  city:'Jaipur' },
  'installer@trikmed.com': { password:'install1234', role:'installer',name:'Manoj Tiwari',   zone:'North Zone',  city:'Jaipur' },
}

export const PORTAL_ROLES = ['super','zone','city','sales','mr','installer','hr','clinic']

const normalizeSession = (user = {}, extra = {}) => ({
  id:          user.id || null,
  email:       user.email || extra.email || '',
  role:        user.role || 'clinic',
  clinic_role: user.clinic_role || null,
  clinic_id:   user.clinic_id || null,
  name:        user.name || 'User',
  zone:        user.zone || null,
  city:        user.city || null,
  custom_permissions: user.custom_permissions || undefined,
  loginAt:     extra.loginAt || user.loginAt || Date.now(),
})

const getMockSession = () => {
  const session = storage.getJson(MOCK_SESSION_KEY)
  if (!session) return null

  const canonical = USERS[session.email]
  if (canonical?.clinic_role && session.clinic_role !== canonical.clinic_role) {
    const updated = { ...session, clinic_role: canonical.clinic_role }
    storage.setJson(MOCK_SESSION_KEY, updated)
    return updated
  }

  return session
}

export function login(email, password) {
  const user = USERS[email]
  if (!user || user.password !== password) {
    return { success: false, error: 'Invalid email or password' }
  }
  clearSession()
  const session = normalizeSession(user, { email })
  storage.setJson(MOCK_SESSION_KEY, session)
  return { success: true, user: session }
}

export function loginAs(sessionData) {
  clearSession()
  const session = normalizeSession(sessionData)
  storage.setJson(MOCK_SESSION_KEY, session)
  return { success: true, user: session }
}

export function logout() {
  clearSession()
}

export function getSession() {
  const apiUser = getUser()
  if (apiUser) return normalizeSession(apiUser)
  return getMockSession()
}

export function isLoggedIn() {
  return !!getSession()
}

// ── API-ready auth helpers ────────────────────────────────────────────────────

export const getToken = () =>
  storage.get(API_TOKEN_KEY) || ''

// Returns API user + merges any doctor-saved custom_permissions from localStorage
export const getUser = () => {
  try {
    const user = storage.getJson(API_USER_KEY)
    if (!user) return null
    // Load custom permissions saved by doctor (PATCH /staff/:id/permissions)
    const customPerms = storage.getJson(`trikmed_perms_${user.id}`)
    if (customPerms) {
      return { ...user, custom_permissions: customPerms }
    }
    return user
  } catch { return null }
}

export const setSession = (token, user) => {
  storage.remove(MOCK_SESSION_KEY)
  storage.set(API_TOKEN_KEY, token)
  storage.setJson(API_USER_KEY, normalizeSession(user))
}

export const clearSession = () => {
  storage.remove(API_TOKEN_KEY)
  storage.remove(API_USER_KEY)
  storage.remove(MOCK_SESSION_KEY)
}

export const getUserRole  = () => getSession()?.role      || null
export const getClinicId  = () => getSession()?.clinic_id || null

// ── Clinic-role helpers ───────────────────────────────────────────────────────
// Reads from trikmed_user (API) first, then trikmed_session (mock), defaults 'staff'
export const getClinicRole = () =>
  getSession()?.clinic_role || 'staff'

export const isOwner        = () => { const r = getClinicRole(); return r === 'owner' || r === 'doctor_owner' }
export const isDoctor       = () => { const r = getClinicRole(); return r === 'doctor' || r === 'doctor_owner' }
export const isReceptionist = () => getClinicRole() === 'receptionist'

// can('view_revenue') → boolean  — uses new granular permission system
// Works for both API users (with custom_permissions) and mock session users
export const can = (featureKey) => {
  // Fallback: mock session user — no custom overrides, use role defaults
  const session = getSession()
  if (!session) return false
  return canDo(session, featureKey)
}
