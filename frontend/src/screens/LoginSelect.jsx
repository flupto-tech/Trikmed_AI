'use client'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Building2, Settings, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from '../utils/navigation'
import TrikMedLogo from '../components/TrikMedLogo'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { SkipToContent } from '../components/auth/AuthScaffold'

const MotionDiv = motion.div

const CARDS = [
  {
    icon: Building2,
    title: 'Clinic Login',
    subtitle: 'For doctors and clinic staff',
    desc: 'Open your clinic dashboard, appointments, queue, WhatsApp chats, and patient records.',
    path: '/login/clinic',
    badge: 'Clinic workspace',
    variant: 'coral',
  },
  {
    icon: Settings,
    title: 'Admin Portal',
    subtitle: 'For TrikMed team members',
    desc: 'Access onboarding, demo requests, MR activity, sales workflows, zones, and operations tools.',
    path: '/login/admin',
    badge: 'Operations portal',
    variant: 'blue',
  },
]

export default function LoginSelect() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

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
      <SkipToContent target="login-select-main" />
      <Link
        to="/"
        style={{
          position: 'absolute',
          top: 'var(--space-6)',
          left: 'var(--space-6)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          color: 'rgba(255,255,255,0.72)',
          textDecoration: 'none',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
        }}
      >
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        Home
      </Link>

      <main id="login-select-main" tabIndex={-1} style={{ width: '100%', maxWidth: 860, display: 'grid', gap: 'var(--space-8)' }}>
        <MotionDiv
          initial={reduceMotion ? false : { opacity: 0, y: -12 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          style={{ textAlign: 'center', display: 'grid', justifyItems: 'center', gap: 'var(--space-4)' }}
        >
          <TrikMedLogo size="lg" dark />
          <Badge variant="coral" type="outline" size="lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
            Secure sign in
          </Badge>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <h1 style={{ margin: 0, color: 'var(--color-text-inverse)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)', fontWeight: 800 }}>
              Choose your workspace
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.64)', fontSize: 'var(--text-body-lg)' }}>
              Select the right portal before signing in.
            </p>
          </div>
        </MotionDiv>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-5)' }}>
          {CARDS.map((card, index) => {
            const Icon = card.icon
            return (
              <MotionDiv
                key={card.path}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: index * 0.08 }}
              >
                <Card
                  variant="elevated"
                  interactive
                  style={{
                    height: '100%',
                    borderColor: 'rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.96)',
                  }}
                >
                  <Card.Body style={{ display: 'grid', gap: 'var(--space-5)', padding: 'var(--space-8)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
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
                        }}
                      >
                        <Icon size={24} strokeWidth={1.8} />
                      </div>
                      <Badge variant={card.variant} type="subtle">{card.badge}</Badge>
                    </div>
                    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                      <h2 style={{ margin: 0, color: 'var(--color-navy)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-h3)', fontWeight: 800 }}>
                        {card.title}
                      </h2>
                      <p style={{ margin: 0, color: card.variant === 'coral' ? 'var(--color-coral)' : 'var(--color-blue)', fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                        {card.subtitle}
                      </p>
                      <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-body)', lineHeight: 1.7 }}>
                        {card.desc}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={card.variant === 'coral' ? 'coral' : 'primary'}
                      fullWidth
                      rightIcon={<ShieldCheck size={16} strokeWidth={1.8} aria-hidden="true" />}
                      onClick={() => navigate(card.path)}
                    >
                      Continue
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
