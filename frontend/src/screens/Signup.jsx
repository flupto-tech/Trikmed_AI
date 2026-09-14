'use client'
import { useMemo, useState } from 'react'
import { Building2, CheckCircle2, Phone, UserRound } from 'lucide-react'
import { Link, useNavigate } from '../utils/navigation'
import { authApi } from '../services/authApi'
import { formatPhone, isValidPhone, phoneError, phoneInputValue } from '../utils/phone'
import {
  AuthAlert,
  AuthBody,
  AuthHeader,
  AuthShell,
  AuthTextField,
  Button,
  PasswordField,
  Stepper,
} from '../components/auth/AuthScaffold'

const STEPS = [
  { id: 'clinic', label: 'Clinic' },
  { id: 'contact', label: 'Contact' },
  { id: 'security', label: 'Security' },
]

export default function Signup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ clinicName: '', doctorName: '', email: '', phone: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const update = field => event => {
    setError('')
    setFieldErrors(current => ({ ...current, [field]: '' }))
    setForm(current => ({ ...current, [field]: event.target.value }))
  }

  const stepError = useMemo(() => {
    if (step === 0 && (!form.clinicName.trim() || !form.doctorName.trim())) return 'Clinic name and doctor name are required.'
    if (step === 1 && (!form.email.trim() || !isValidPhone(form.phone))) return !form.email.trim() ? 'Email address is required.' : phoneError()
    if (step === 2 && form.password.length < 6) return 'Password must be at least 6 characters.'
    return ''
  }, [form, step])

  const canContinue = !stepError

  const handleNext = () => {
    if (!canContinue) {
      const nextFieldErrors = {}
      if (step === 0) {
        if (!form.clinicName.trim()) nextFieldErrors.clinicName = 'Clinic name is required.'
        if (!form.doctorName.trim()) nextFieldErrors.doctorName = 'Doctor name is required.'
      }
      if (step === 1) {
        if (!form.email.trim()) nextFieldErrors.email = 'Email address is required.'
        if (!isValidPhone(form.phone)) nextFieldErrors.phone = phoneError()
      }
      if (step === 2 && form.password.length < 6) nextFieldErrors.password = 'Password must be at least 6 characters.'
      setFieldErrors(nextFieldErrors)
      setError(stepError)
      return
    }
    setError('')
    setFieldErrors({})
    setStep(current => Math.min(current + 1, STEPS.length - 1))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setFieldErrors({ password: 'Password must be at least 6 characters.' })
      setError('Password must be at least 6 characters.')
      return
    }
    if (!isValidPhone(form.phone)) {
      setFieldErrors({ phone: phoneError() })
      setError(phoneError())
      return
    }
    setFieldErrors({})
    setLoading(true)
    try {
      const res = await authApi.signup({
        clinic_name: form.clinicName,
        doctor_name: form.doctorName,
        email: form.email,
        phone: phoneInputValue(form.phone),
        password: form.password,
      })
      if (res.status === 'pending_approval') {
        setSubmitted(true)
      } else if (res.token && res.user) {
        navigate('/dashboard')
      }
    } catch (e) {
      setError(e?.message || e?.detail || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      backTo="/login"
      backLabel="Back to login"
      eyebrow="Clinic signup"
      heroTitle="Start with"
      heroAccent="guided onboarding"
      heroText="Request a clinic account with the same approval flow, now presented as a clearer step-by-step authentication experience."
      heroItems={[
        { title: 'Approval first', text: 'New clinics are reviewed before access is granted.' },
        { title: 'Secure credentials', text: 'The signup payload and backend contract stay unchanged.' },
        { title: 'WhatsApp ready', text: 'Your clinic details prepare the automation setup.' },
        { title: 'Mobile friendly', text: 'The form stays single-column on small screens.' },
      ]}
      stats={[
        { value: '3', label: 'Focused steps' },
        { value: '14d', label: 'Trial ready' },
        { value: '0', label: 'Card required' },
      ]}
    >
      <AuthHeader
        badge={{ label: 'Request access', variant: 'coral' }}
        title={submitted ? 'Signup received' : 'Create clinic account'}
        subtitle={submitted ? 'Your clinic is pending admin approval. Once approved, sign in with the credentials you created.' : (
          <>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-text-link)', fontWeight: 700 }}>Sign in</Link>
          </>
        )}
      />
      <AuthBody>
        {submitted ? (
          <>
            <div style={{ display: 'grid', justifyItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-6) 0' }}>
              <div aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 72, height: 72, borderRadius: 'var(--radius-xl)', background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>
                <CheckCircle2 size={36} strokeWidth={1.8} />
              </div>
              <AuthAlert success="Signup received. Your clinic is pending admin approval." />
              <Button type="button" fullWidth onClick={() => navigate('/login/clinic')}>
                Go to clinic login
              </Button>
            </div>
          </>
        ) : (
          <>
            <Stepper steps={STEPS} current={step} />
            <AuthAlert error={error} />
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-4)' }} noValidate>
              {step === 0 ? (
                <>
                  <AuthTextField
                    id="signup-clinic-name"
                    label="Clinic name"
                    value={form.clinicName}
                    onChange={update('clinicName')}
                    placeholder="Sharma Clinic"
                    required
                    autoComplete="organization"
                    icon={Building2}
                    error={fieldErrors.clinicName}
                  />
                  <AuthTextField
                    id="signup-doctor-name"
                    label="Doctor name"
                    value={form.doctorName}
                    onChange={update('doctorName')}
                    placeholder="Dr. Rajesh Sharma"
                    required
                    autoComplete="name"
                    icon={UserRound}
                    error={fieldErrors.doctorName}
                  />
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <AuthTextField
                    id="signup-email"
                    label="Email address"
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    placeholder="doctor@clinic.com"
                    required
                    autoComplete="email"
                    error={fieldErrors.email}
                  />
                  <AuthTextField
                    id="signup-phone"
                    label="Phone number"
                    type="tel"
                    inputMode="numeric"
                    value={formatPhone(form.phone)}
                    onChange={e => {
                      setError('')
                      setFieldErrors(current => ({ ...current, phone: '' }))
                      setForm(current => ({ ...current, phone: phoneInputValue(e.target.value) }))
                    }}
                    placeholder="98765 43210"
                    required
                    autoComplete="tel"
                    icon={Phone}
                    error={fieldErrors.phone}
                  />
                </>
              ) : null}

              {step === 2 ? (
                <PasswordField
                  id="signup-password"
                  label="Password"
                  value={form.password}
                  onChange={update('password')}
                  show={showPass}
                  onToggle={() => setShowPass(s => !s)}
                  autoComplete="new-password"
                  placeholder="Minimum 6 characters"
                  hint="Use at least 6 characters."
                  error={fieldErrors.password}
                />
              ) : null}

              <div style={{ display: 'grid', gridTemplateColumns: step === 0 ? '1fr' : '1fr 1fr', gap: 'var(--space-3)' }}>
                {step > 0 ? (
                  <Button type="button" variant="secondary" onClick={() => { setError(''); setStep(current => Math.max(current - 1, 0)) }} fullWidth>
                    Back
                  </Button>
                ) : null}
                {step < STEPS.length - 1 ? (
                  <Button type="button" onClick={handleNext} fullWidth>
                    Continue
                  </Button>
                ) : (
                  <Button type="submit" variant="coral" isLoading={loading} fullWidth>
                    Request approval
                  </Button>
                )}
              </div>
            </form>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', lineHeight: 1.7, textAlign: 'center' }}>
              By signing up you agree to TrikMed account review and clinic approval before dashboard access.
            </p>
          </>
        )}
      </AuthBody>
    </AuthShell>
  )
}
