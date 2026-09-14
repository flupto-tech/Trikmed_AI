'use client'
import { useState } from 'react'
import { Building2, ShieldCheck, UserRound } from 'lucide-react'
import { Link, useNavigate } from '../utils/navigation'
import { login } from '../utils/auth'
import {
  AuthAlert,
  AuthBody,
  AuthHeader,
  AuthShell,
  AuthTextField,
  Button,
  DemoDetails,
  DividerLabel,
  PasswordField,
  ShortcutButton,
  ShortcutGrid,
} from '../components/auth/AuthScaffold'

const DEMO_ROLES = [
  { label: 'Clinic Demo', sub: 'demo@trikmed.com', email: 'demo@trikmed.com', pass: 'demo1234', icon: <Building2 size={18} strokeWidth={1.8} /> },
  { label: 'Admin Demo', sub: 'admin@trikmed.com', email: 'admin@trikmed.com', pass: 'admin1234', icon: <ShieldCheck size={18} strokeWidth={1.8} /> },
  { label: 'Super Admin', sub: 'Vikram Mehta', email: 'super@trikmed.com', pass: 'super1234', icon: <UserRound size={18} strokeWidth={1.8} /> },
  { label: 'Zone Manager', sub: 'Amit Singh', email: 'zone@trikmed.com', pass: 'zone1234', icon: <UserRound size={18} strokeWidth={1.8} /> },
  { label: 'City Manager', sub: 'Rahul Verma', email: 'city@trikmed.com', pass: 'city1234', icon: <UserRound size={18} strokeWidth={1.8} /> },
  { label: 'Sales', sub: 'Rohit Sharma', email: 'sales@trikmed.com', pass: 'sales1234', icon: <UserRound size={18} strokeWidth={1.8} /> },
  { label: 'MR', sub: 'Suresh Kumar', email: 'mr@trikmed.com', pass: 'mr1234', icon: <UserRound size={18} strokeWidth={1.8} /> },
  { label: 'Installer', sub: 'Manoj Tiwari', email: 'installer@trikmed.com', pass: 'install1234', icon: <UserRound size={18} strokeWidth={1.8} /> },
]

export default function Login() {
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
    await new Promise(r => setTimeout(r, 700))
    const result = login(email, password)
    if (result.success) {
      const role = result.user.role
      if (role === 'admin') navigate('/admin')
      else if (['super', 'zone', 'city', 'sales', 'mr', 'installer'].includes(role)) navigate('/portal')
      else navigate('/dashboard')
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Secure clinic access"
      heroTitle="The AI receptionist"
      heroAccent="your clinic needs"
      heroText="Automate appointments, missed-call recovery, reminders, and patient follow-ups through one focused WhatsApp-first clinic system."
      heroItems={[
        { title: '24/7 coverage', text: 'AI responds when your front desk is busy.' },
        { title: 'WhatsApp native', text: 'Patients stay in the app they already use.' },
        { title: 'Role aware', text: 'Clinic and portal users land in the right workspace.' },
        { title: 'Fast setup', text: 'Demo credentials are available without cluttering the form.' },
      ]}
      stats={[
        { value: '500+', label: 'Clinics ready' },
        { value: '60%', label: 'No-show reduction' },
        { value: '24/7', label: 'AI response' },
      ]}
    >
      <AuthHeader
        badge={{ label: 'Clinic OS' }}
        title="Welcome back"
        subtitle={(
          <>
            Choose a dedicated portal from the login selection page, or sign in here with your demo credentials.{' '}
            <Link to="/signup" style={{ color: 'var(--color-text-link)', fontWeight: 700 }}>Request signup</Link>
          </>
        )}
      />
      <AuthBody>
        <AuthAlert error={error} />
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-4)' }} noValidate>
          <AuthTextField
            id="login-email"
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
            id="login-password"
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
            Sign in
          </Button>
        </form>
        <DividerLabel>demo access</DividerLabel>
        <DemoDetails title="Demo section">
          <ShortcutGrid columns="repeat(auto-fit, minmax(140px, 1fr))">
            {DEMO_ROLES.map((item) => (
              <ShortcutButton
                key={item.email}
                title={item.label}
                subtitle={item.sub}
                icon={item.icon}
                onClick={() => {
                  setEmail(item.email)
                  setPassword(item.pass)
                  setError('')
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
