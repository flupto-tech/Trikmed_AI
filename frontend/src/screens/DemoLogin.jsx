'use client'
import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Stethoscope, UserCog, UserRound } from 'lucide-react'
import TrikMedLogo from '../components/TrikMedLogo'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { SkipToContent } from '../components/auth/AuthScaffold'
import { useNavigate } from '../utils/navigation'
import { login, loginAs } from '../utils/auth'
import { storage } from '../utils/storage'

const MotionDiv = motion.div

function getInitials(name) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function getRedirect(role) {
  if (role === 'receptionist') return '/dashboard/appointments'
  return '/dashboard'
}

export default function DemoLogin() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [initialDemoData] = useState(() => {
    try {
      const staff = JSON.parse(storage.get('trikmed.staff') || '[]')
      const roles = JSON.parse(storage.get('trikmed.customRoles') || '[]')
      return { staff: staff.filter(s => s.showOnLogin), roles }
    } catch {
      return { staff: [], roles: [] }
    }
  })
  const [dynamicStaff] = useState(initialDemoData.staff)
  const [customRoles] = useState(initialDemoData.roles)

  function handleSelectDoctor() {
    login('demo@trikmed.com', 'demo1234')
    navigate('/dashboard')
  }

  function handleSelectReceptionist() {
    loginAs({ email: 'priya@trikmed.local', role: 'clinic', clinic_role: 'receptionist', name: 'Priya Singh' })
    navigate(getRedirect('receptionist'))
  }

  function handleSelectNurse() {
    loginAs({ email: 'sunita@trikmed.local', role: 'clinic', clinic_role: 'staff', name: 'Sunita Devi' })
    navigate(getRedirect('staff'))
  }

  function handleSelectStaff(member) {
    let clinic_role = member.role
    let custom_permissions = undefined

    if (member.role === 'custom' && member.customRoleId) {
      const customRole = customRoles.find(r => r.id === member.customRoleId)
      if (customRole) {
        clinic_role = 'staff'
        custom_permissions = customRole.permissions
      }
    }

    loginAs({
      email: `${member.id}@trikmed.local`,
      role: 'clinic',
      clinic_role,
      name: member.name,
      ...(custom_permissions ? { custom_permissions } : {}),
    })
    navigate(getRedirect(clinic_role))
  }

  function getRoleBadge(member) {
    if (member.role === 'doctor') return { label: 'DOCTOR', variant: 'blue' }
    if (member.role === 'receptionist') return { label: 'RECEPTIONIST', variant: 'purple' }
    if (member.role === 'custom') {
      const cr = customRoles.find(r => r.id === member.customRoleId)
      return { label: (cr?.name || 'CUSTOM').toUpperCase(), variant: 'default' }
    }
    return { label: 'STAFF', variant: 'default' }
  }

  const cards = [
    { key: 'doctor_owner', name: 'Dr. Rajesh Sharma', badge: 'DOCTOR / OWNER', variant: 'blue', icon: Stethoscope, onClick: handleSelectDoctor },
    { key: 'receptionist', name: 'Priya Singh', badge: 'RECEPTIONIST', variant: 'purple', icon: UserRound, onClick: handleSelectReceptionist },
    { key: 'nurse', name: 'Sunita Devi', badge: 'NURSE', variant: 'green', icon: UserCog, onClick: handleSelectNurse },
    ...dynamicStaff.map((member) => {
      const badge = getRoleBadge(member)
      return {
        key: member.id,
        name: member.name,
        badge: badge.label,
        variant: badge.variant,
        initials: getInitials(member.name),
        onClick: () => handleSelectStaff(member),
      }
    }),
  ]

  return (
    <div
      className="min-h-screen"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-4)',
        background: 'linear-gradient(145deg, var(--color-navy-deep), var(--color-navy))',
      }}
    >
      <SkipToContent target="demo-login-main" />
      <Button
        type="button"
        variant="secondary"
        leftIcon={<ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />}
        onClick={() => navigate('/')}
        style={{ position: 'absolute', top: 'var(--space-6)', left: 'var(--space-6)' }}
      >
        Back
      </Button>

      <main id="demo-login-main" tabIndex={-1} style={{ width: '100%', maxWidth: 880, display: 'grid', gap: 'var(--space-8)' }}>
        <MotionDiv
          initial={reduceMotion ? false : { opacity: 0, y: -12 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          style={{ textAlign: 'center', display: 'grid', justifyItems: 'center', gap: 'var(--space-4)' }}
        >
          <TrikMedLogo size="lg" dark />
          <Badge variant="coral" type="outline" size="lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
            Demo preview
          </Badge>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <h1 style={{ margin: 0, color: 'var(--color-text-inverse)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)', fontWeight: 800 }}>
              Choose your demo role
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.64)', fontSize: 'var(--text-body-lg)' }}>
              No password needed. Select a role to enter the demo workspace.
            </p>
          </div>
        </MotionDiv>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 'var(--space-4)' }}>
          {cards.map((card, index) => {
            const Icon = card.icon
            return (
              <MotionDiv
                key={card.key}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card variant="elevated" interactive style={{ height: '100%', background: 'rgba(255,255,255,0.96)' }}>
                  <Card.Body style={{ display: 'grid', justifyItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-6)' }}>
                    <div
                      aria-hidden="true"
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 54,
                        height: 54,
                        borderRadius: 'var(--radius-lg)',
                        background: card.variant === 'coral' ? 'rgba(232,102,61,0.12)' : 'var(--color-info-bg)',
                        color: card.variant === 'coral' ? 'var(--color-coral)' : 'var(--color-blue)',
                        fontWeight: 800,
                      }}
                    >
                      {Icon ? <Icon size={24} strokeWidth={1.8} /> : card.initials}
                    </div>
                    <div style={{ display: 'grid', justifyItems: 'center', gap: 'var(--space-2)', textAlign: 'center' }}>
                      <h2 style={{ margin: 0, color: 'var(--color-navy)', fontSize: 'var(--text-body)', fontWeight: 800 }}>
                        {card.name}
                      </h2>
                      <Badge variant={card.variant} type="subtle">{card.badge}</Badge>
                    </div>
                    <Button type="button" size="sm" fullWidth onClick={card.onClick}>
                      Enter demo
                    </Button>
                  </Card.Body>
                </Card>
              </MotionDiv>
            )
          })}
        </div>

        <p style={{ margin: 0, textAlign: 'center', color: 'rgba(255,255,255,0.32)', fontSize: 'var(--text-xs)' }}>
          TrikMed by <span style={{ color: 'var(--color-coral)', fontWeight: 700 }}>Flupto Technologies</span>
        </p>
      </main>
    </div>
  )
}
