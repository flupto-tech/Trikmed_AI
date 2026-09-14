'use client'
/* global process */
import { useEffect, useState } from 'react'
import { Building2, ChevronDown, LockKeyhole, Phone, Stethoscope, UserCog } from 'lucide-react'
import { Link, useNavigate } from '../utils/navigation'
import { setSession } from '../utils/auth'
import { authApi } from '../services/authApi'
import { staffApi } from '../services/staffApi'
import { formatPhone, isValidPhone, phoneError, phoneInputValue } from '../utils/phone'
import { storage } from '../utils/storage'
import {
  AuthAlert,
  AuthBody,
  AuthHeader,
  AuthShell,
  AuthTextField,
  Button,
  DemoDetails,
  PasswordField,
  ShortcutButton,
  ShortcutGrid,
} from '../components/auth/AuthScaffold'

export default function LoginClinic() {
  const [loginMode, setLoginMode] = useState('owner')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [clinicId, setClinicId] = useState('')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [clinics, setClinics] = useState([])
  const [selectedDemoClinic, setSelectedDemoClinic] = useState(() => storage.get('trikmed.demoClinic') || 'CLN-001')
  const [showClinicSelector, setShowClinicSelector] = useState(false)
  const [clinicsLoading, setClinicsLoading] = useState(true)
  const [clinicUsers, setClinicUsers] = useState([])
  const [clinicUsersLoading, setClinicUsersLoading] = useState(false)
  const navigate = useNavigate()

  const loadClinicUsers = async (clinicId) => {
    if (!clinicId) return
    setClinicUsersLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${baseUrl}/public/clinic-users/${clinicId}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json().catch(() => [])
      setClinicUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load clinic users:', e)
      setClinicUsers([])
    } finally {
      setClinicUsersLoading(false)
    }
  }

  useEffect(() => {
    const loadClinics = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${baseUrl}/public/clinics`)
        if (!response.ok) throw new Error('Failed to fetch clinics')
        const data = await response.json().catch(() => [])
        setClinics(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error('Failed to load clinics:', e)
        setClinics([])
      } finally {
        setClinicsLoading(false)
      }
    }

    loadClinics()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadClinicUsers(selectedDemoClinic)
    }, 0)
    return () => clearTimeout(timer)
  }, [selectedDemoClinic])

  const currentDemoClinic = clinics.find(c => c.id === selectedDemoClinic)
  const clinicDisplayName = currentDemoClinic
    ? `${currentDemoClinic.clinic_name || 'Unnamed Clinic'} (${currentDemoClinic.city || '-'})`
    : 'Clinic not found'

  const handleOwnerSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const nextFieldErrors = {}
    if (!email.trim()) nextFieldErrors.email = 'Email address is required.'
    if (!password) nextFieldErrors.password = 'Password is required.'
    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors)
      setError('Please complete the required fields.')
      return
    }
    setFieldErrors({})
    setLoading(true)
    try {
      const res = await authApi.clinicLogin(email, password)
      setSession(res.token, res.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err?.message || err?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStaffSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const nextFieldErrors = {}
    if (!clinicId.trim()) nextFieldErrors.clinicId = 'Clinic ID is required.'
    if (!phone.trim()) nextFieldErrors.phone = 'Staff phone number is required.'
    if (!pin.trim()) nextFieldErrors.pin = 'PIN is required.'
    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors)
      setError('All fields are required.')
      return
    }
    if (!isValidPhone(phone)) {
      setFieldErrors({ phone: phoneError('Staff phone number') })
      setError(phoneError('Staff phone number'))
      return
    }
    if (!/^\d{4}$/.test(pin)) {
      setFieldErrors({ pin: 'PIN must be exactly 4 digits.' })
      setError('PIN must be exactly 4 digits.')
      return
    }

    setFieldErrors({})
    setLoading(true)
    try {
      const res = await staffApi.login({ clinic_id: clinicId.trim(), phone: phoneInputValue(phone), pin })
      setSession(res.token, res.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err?.message || err?.detail || 'Staff login failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (userId) => {
    setError('')
    setLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${baseUrl}/dev/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw data || { message: 'Demo login failed' }
      if (!data?.token || !data?.user) throw new Error('Demo login response was incomplete')
      setSession(data.token, data.user)
      navigate('/dashboard')
    } catch (err) {
      console.error('Clinic demo login failed:', err)
      setError(err?.detail || err?.message || 'Demo login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      backTo="/login"
      backLabel="Back to login selection"
      eyebrow="Clinic login"
      heroTitle="Run the clinic"
      heroAccent="from one secure console"
      heroText="Appointments, queue, staff access, WhatsApp conversations, and patient records stay together after login."
      heroItems={[
        { title: 'Owner controls', text: 'Manage settings, doctors, staff, and clinic access.' },
        { title: 'Staff PIN login', text: 'Fast reception access without sharing owner credentials.' },
        { title: 'Role safe', text: 'Permissions continue to follow the active login.' },
        { title: 'Live clinic data', text: 'The existing backend and session contracts are unchanged.' },
      ]}
    >
      <AuthHeader
        badge={{ label: 'Clinic Access', variant: 'coral' }}
        title="Clinic login"
        subtitle={(
          <>
            Owner, doctor, receptionist, or staff access. New clinic?{' '}
            <Link to="/signup" style={{ color: 'var(--color-text-link)', fontWeight: 700 }}>Request signup approval</Link>
          </>
        )}
      />
      <AuthBody>
        <div
          role="tablist"
          aria-label="Clinic login mode"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-2)',
            padding: 'var(--space-1)',
            borderRadius: 'var(--radius-lg)',
            border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
            background: 'var(--color-surface-subtle)',
          }}
        >
            {[
            { key: 'owner', label: 'Owner / Doctor', Icon: Stethoscope },
            { key: 'staff', label: 'Staff PIN', Icon: UserCog },
          ].map(({ key, label, Icon }) => {
            const ModeIcon = Icon
            return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={loginMode === key}
              onClick={() => {
                setLoginMode(key)
                setError('')
                setFieldErrors({})
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                minHeight: 40,
                borderRadius: 'var(--radius-btn)',
                border: 'none',
                cursor: 'pointer',
                background: loginMode === key ? 'var(--color-surface)' : 'transparent',
                color: loginMode === key ? 'var(--color-navy)' : 'var(--color-text-muted)',
                boxShadow: loginMode === key ? 'var(--shadow-xs)' : 'none',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
              }}
            >
              <ModeIcon size={15} strokeWidth={1.8} aria-hidden="true" />
              {label}
            </button>
          )})}
        </div>

        <AuthAlert error={error} />

        {loginMode === 'owner' ? (
          <form onSubmit={handleOwnerSubmit} style={{ display: 'grid', gap: 'var(--space-4)' }} noValidate>
            <AuthTextField
              id="clinic-owner-email"
              label="Email address"
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                setFieldErrors(current => ({ ...current, email: '' }))
              }}
              placeholder="doctor@clinic.com"
              required
              autoComplete="email"
              error={fieldErrors.email}
            />
            <PasswordField
              id="clinic-owner-password"
              value={password}
              onChange={e => {
                setPassword(e.target.value)
                setFieldErrors(current => ({ ...current, password: '' }))
              }}
              show={showPass}
              onToggle={() => setShowPass(s => !s)}
              error={fieldErrors.password}
            />
            <Button type="submit" isLoading={loading} fullWidth size="lg">
              Login to clinic
            </Button>
          </form>
        ) : (
          <form onSubmit={handleStaffSubmit} style={{ display: 'grid', gap: 'var(--space-4)' }} noValidate>
            <p style={{ margin: 0, padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', background: 'var(--color-info-bg)', color: 'var(--color-info-text)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
              Staff login uses the clinic ID, registered 10-digit phone number, and 4-digit PIN created by the clinic owner.
            </p>
            <AuthTextField
              id="staff-clinic-id"
              label="Clinic ID"
              value={clinicId}
              onChange={e => {
                setClinicId(e.target.value.toUpperCase())
                setFieldErrors(current => ({ ...current, clinicId: '' }))
              }}
              placeholder="CLN-001"
              required
              autoComplete="organization"
              icon={Building2}
              error={fieldErrors.clinicId}
            />
            <AuthTextField
              id="staff-phone"
              label="Registered phone"
              type="tel"
              inputMode="numeric"
              value={formatPhone(phone)}
              onChange={e => {
                setPhone(phoneInputValue(e.target.value))
                setFieldErrors(current => ({ ...current, phone: '' }))
              }}
              placeholder="98765 43210"
              required
              autoComplete="tel"
              icon={Phone}
              error={fieldErrors.phone}
            />
            <AuthTextField
              id="staff-pin"
              label="PIN"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={e => {
                setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                setFieldErrors(current => ({ ...current, pin: '' }))
              }}
              placeholder="4 digits"
              required
              autoComplete="one-time-code"
              maxLength={4}
              icon={LockKeyhole}
              error={fieldErrors.pin}
              style={{ letterSpacing: '0.18em' }}
            />
            <Button type="submit" isLoading={loading} fullWidth size="lg">
              Staff login
            </Button>
          </form>
        )}

        <DemoDetails title="Demo role shortcuts">
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowClinicSelector(!showClinicSelector)}
              aria-haspopup="listbox"
              aria-expanded={showClinicSelector}
              style={{
                width: '100%',
                minHeight: 46,
                padding: '0 var(--space-4)',
                border: 'calc((var(--space-0-5) + var(--space-1)) / 4) solid var(--color-border)',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-btn)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-3)',
                color: 'var(--color-navy)',
                fontWeight: 700,
                fontFamily: 'var(--font-body)',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
                <Building2 size={16} strokeWidth={1.8} aria-hidden="true" style={{ color: 'var(--color-blue)', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {clinicsLoading ? 'Loading clinics...' : clinicDisplayName}
                </span>
              </span>
              <ChevronDown size={15} strokeWidth={1.8} aria-hidden="true" style={{ flexShrink: 0, transform: showClinicSelector ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>

            {showClinicSelector && !clinicsLoading ? (
              <div
                role="listbox"
                aria-label="Demo clinic"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + var(--space-1))',
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  maxHeight: 240,
                  overflowY: 'auto',
                  border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-surface)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                {clinics.length === 0 ? (
                  <div style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
                    No clinics available
                  </div>
                ) : (
                  clinics.map(clinic => (
                    <button
                      key={clinic.id}
                      type="button"
                      role="option"
                      aria-selected={selectedDemoClinic === clinic.id}
                      onClick={() => {
                        setSelectedDemoClinic(clinic.id)
                        storage.set('trikmed.demoClinic', clinic.id)
                        setShowClinicSelector(false)
                      }}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3) var(--space-4)',
                        border: 'none',
                        borderBottom: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
                        background: selectedDemoClinic === clinic.id ? 'var(--color-blue-light)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      <span style={{ display: 'block', color: 'var(--color-navy)', fontSize: 'var(--text-sm)', fontWeight: 700 }}>{clinic.clinic_name || 'Unnamed'}</span>
                      <span style={{ display: 'block', marginTop: 'var(--space-1)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                        Dr. {clinic.doctor_name || 'Unknown'} - {clinic.city || '-'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', lineHeight: 1.6 }}>
            All demo shortcuts below are for <strong style={{ color: 'var(--color-navy)' }}>{clinicDisplayName}</strong>.
          </p>

          <ShortcutGrid columns="repeat(auto-fit, minmax(140px, 1fr))">
            {clinicUsersLoading ? (
              <p style={{ gridColumn: '1 / -1', margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
                Loading users...
              </p>
            ) : clinicUsers.length === 0 ? (
              <p style={{ gridColumn: '1 / -1', margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
                No active users found for this clinic.
              </p>
            ) : (
              clinicUsers.map((u) => (
                <ShortcutButton
                  key={u.id}
                  title={u.label}
                  subtitle={u.email || u.name}
                  onClick={() => handleDemoLogin(u.id)}
                  icon={<UserCog size={18} strokeWidth={1.8} />}
                />
              ))
            )}
          </ShortcutGrid>
        </DemoDetails>

        <p style={{ margin: 0, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
          TrikMed by <span style={{ color: 'var(--color-coral)', fontWeight: 700 }}>Flupto Technologies</span>
        </p>
      </AuthBody>
    </AuthShell>
  )
}
