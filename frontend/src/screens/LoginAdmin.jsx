'use client'
import { useState } from 'react'
import { ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate } from '../utils/navigation'
import { setSession } from '../utils/auth'
import { authApi } from '../services/authApi'
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

const ADMIN_DEMO_ROLES = [
  { label: 'Super Admin', sub: 'Vikram Mehta', email: 'super@trikmed.com', pass: 'super1234', icon: <ShieldCheck size={18} strokeWidth={1.8} /> },
  { label: 'Zone Manager', sub: 'Amit Singh', email: 'zone@trikmed.com', pass: 'zone1234', icon: <UserRound size={18} strokeWidth={1.8} /> },
  { label: 'City Manager', sub: 'Rahul Verma', email: 'city@trikmed.com', pass: 'city1234', icon: <UserRound size={18} strokeWidth={1.8} /> },
  { label: 'Sales Person', sub: 'Rohit Sharma', email: 'sales@trikmed.com', pass: 'sales1234', icon: <UserRound size={18} strokeWidth={1.8} /> },
  { label: 'MR', sub: 'Suresh Kumar', email: 'mr@trikmed.com', pass: 'mr1234', icon: <UserRound size={18} strokeWidth={1.8} /> },
  { label: 'Installer', sub: 'Manoj Tiwari', email: 'installer@trikmed.com', pass: 'install1234', icon: <UserRound size={18} strokeWidth={1.8} /> },
  { label: 'HR Manager', sub: 'Neha HR', email: 'hr@trikmed.com', pass: 'hr1234', icon: <UserRound size={18} strokeWidth={1.8} /> },
]

export default function LoginAdmin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
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
      const res = await authApi.adminLogin(email, password)
      setSession(res.token, res.user)
      navigate('/portal')
    } catch (e) {
      setError(e?.message || e?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      backTo="/login"
      backLabel="Back to login selection"
      eyebrow="TrikMed team"
      heroTitle="Operations portal"
      heroAccent="for field and HQ teams"
      heroText="Manage clinic onboardings, demo requests, sales activity, MR visits, and zone performance from the TrikMed portal."
      heroItems={[
        { title: 'Role based access', text: 'Portal permissions continue to follow the signed-in team role.' },
        { title: 'Onboarding control', text: 'Review clinics, installers, demo requests, and field updates.' },
        { title: 'Regional visibility', text: 'Zone, city, and sales teams keep their own operating context.' },
        { title: 'Secure sessions', text: 'Existing token and session handling remains unchanged.' },
      ]}
    >
      <AuthHeader
        badge={{ label: 'Admin Portal', variant: 'blue' }}
        title="TrikMed team login"
        subtitle="For MRs, sales users, city managers, zone managers, installers, HR, and HQ staff."
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
          <ShieldCheck size={15} strokeWidth={1.8} aria-hidden="true" />
          Protected portal access
        </div>
      </AuthHeader>
      <AuthBody>
        <AuthAlert error={error} />
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-4)' }} noValidate>
          <AuthTextField
            id="admin-email"
            label="Email address"
            type="email"
            value={email}
            onChange={e => {
              setEmail(e.target.value)
              setFieldErrors(current => ({ ...current, email: '' }))
            }}
            placeholder="yourname@trikmed.com"
            required
            autoComplete="email"
            error={fieldErrors.email}
          />
          <PasswordField
            id="admin-password"
            value={password}
            onChange={e => {
              setPassword(e.target.value)
              setFieldErrors(current => ({ ...current, password: '' }))
            }}
            show={showPass}
            onToggle={() => setShowPass(s => !s)}
            autoComplete="current-password"
            error={fieldErrors.password}
          />
          <Button type="submit" variant="primary" isLoading={loading} fullWidth size="lg">
            Login to portal
          </Button>
        </form>
        <DemoDetails title="Admin demo login shortcuts">
          <ShortcutGrid columns="repeat(auto-fit, minmax(150px, 1fr))">
            {ADMIN_DEMO_ROLES.map((item) => (
              <ShortcutButton
                key={item.email}
                title={item.label}
                subtitle={item.sub}
                icon={item.icon}
                onClick={() => {
                  setEmail(item.email)
                  setPassword(item.pass)
                  setError('')
                  setFieldErrors({})
                }}
              />
            ))}
          </ShortcutGrid>
        </DemoDetails>
        <p style={{ margin: 0, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
          TrikMed by <span style={{ color: 'var(--color-coral)', fontWeight: 700 }}>Flupto Technologies</span>
        </p>
      </AuthBody>
    </AuthShell>
  )
}
