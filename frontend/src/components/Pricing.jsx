'use client'
import { useState } from 'react'
import { motion as Motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useNavigate } from '../utils/navigation'
import Badge from './ui/Badge'
import { Button } from './ui/Button'
import Card from './ui/Card'
import { FilterChip } from './ui/FilterChip'
import { FilterChipGroup } from './ui/FilterChipGroup'

const plans = [
  {
    name: 'Starter',
    monthly: 999,
    desc: 'Perfect for solo practitioners',
    features: ['1 doctor', 'WhatsApp booking', 'Appointment reminders', 'Daily WhatsApp reports', 'Email support'],
    popular: false,
    cta: 'Start Free Trial',
  },
  {
    name: 'Growth',
    monthly: 1999,
    desc: 'Most popular for growing clinics',
    features: ['Up to 3 doctors', 'Everything in Starter', 'QR code appointments', 'Missed call recovery', 'Priority support'],
    popular: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'Pro',
    monthly: 3999,
    desc: 'For multi-specialty clinics',
    features: ['Unlimited doctors', 'Everything in Growth', 'Advanced analytics', 'Custom WhatsApp flows', 'Dedicated manager'],
    popular: false,
    cta: 'Contact Sales',
  },
]

function formatPrice(plan, billing) {
  const value = billing === 'yearly' ? plan.monthly * 10 : plan.monthly
  return `Rs ${value.toLocaleString('en-IN')}`
}

export default function Pricing() {
  const [billing, setBilling] = useState('monthly')
  const navigate = useNavigate()

  return (
    <section id="pricing" aria-label="TrikMed pricing" style={{ padding: 'var(--space-24) var(--space-6)', background: 'var(--color-surface)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Motion.div
          style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <p className="eyebrow" style={{ color: 'var(--color-coral)', marginBottom: 'var(--space-4)' }}>Pricing</p>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)', color: 'var(--color-navy)', lineHeight: 1.12 }}>
            Simple pricing for serious clinics.
          </h2>
          <p style={{ margin: 'var(--space-4) auto 0', maxWidth: '430px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-lg)', lineHeight: 1.7 }}>
            No setup fees. No hidden charges. Cancel anytime.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-6)' }}>
            <FilterChipGroup value={billing} onChange={setBilling} aria-label="Billing period">
              <FilterChip value="monthly">Monthly</FilterChip>
              <FilterChip value="yearly">Yearly <span style={{ marginLeft: 'var(--space-1)' }}><Badge variant="green" size="sm">Save 20%</Badge></span></FilterChip>
            </FilterChipGroup>
          </div>
        </Motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 items-stretch" style={{ gap: 'var(--space-6)' }}>
          {plans.map((plan, index) => (
            <Motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                variant={plan.popular ? 'elevated' : 'default'}
                selected={plan.popular}
                style={{ height: '100%', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', overflow: 'visible' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h3)', color: 'var(--color-text-primary)' }}>{plan.name}</h3>
                    <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{plan.desc}</p>
                  </div>
                  {plan.popular ? <Badge variant="coral" type="solid">Popular</Badge> : null}
                </div>
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4vw, 3rem)', color: 'var(--color-navy)', lineHeight: 1 }}>
                    {formatPrice(plan, billing)}
                  </strong>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                    {billing === 'yearly' ? '/yr' : '/mo'}
                  </span>
                  {billing === 'yearly' ? <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--color-success-text)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>2 months free included</p> : null}
                </div>
                <ul style={{ display: 'grid', gap: 'var(--space-3)', margin: '0 0 var(--space-8)', padding: 0, listStyle: 'none', flex: 1 }}>
                  {plan.features.map(feature => (
                    <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                      <Check size={16} strokeWidth={1.8} color="var(--color-coral)" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant={plan.popular ? 'coral' : 'primary'} fullWidth onClick={() => navigate('/signup')}>
                  {plan.cta}
                </Button>
              </Card>
            </Motion.div>
          ))}
        </div>
        <p style={{ textAlign: 'center', margin: 'var(--space-8) 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          Questions about plans? See the FAQ below or book a guided demo.
        </p>
      </div>
    </section>
  )
}
