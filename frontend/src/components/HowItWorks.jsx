'use client'
import { motion as Motion } from 'framer-motion'
import { Bot, MessageSquareText, Stethoscope } from 'lucide-react'
import Badge from './ui/Badge'
import Card from './ui/Card'

const steps = [
  {
    icon: MessageSquareText,
    title: 'Patient reaches out',
    sub: 'Multiple entry points',
    body: 'A patient sends a WhatsApp message, scans a QR code, or calls your clinic. TrikMed is ready every time.',
    tags: ['WhatsApp', 'QR scan', 'Missed call'],
  },
  {
    icon: Bot,
    title: 'AI handles the workflow',
    sub: 'Zero human effort',
    body: 'TrikMed replies, shows available slots, confirms the booking, and schedules reminders in under 30 seconds.',
    tags: ['Books slot', 'Confirms visit', 'Sets reminders'],
  },
  {
    icon: Stethoscope,
    title: 'Doctor stays organized',
    sub: 'Clean dashboard',
    body: 'Every appointment, patient note, and daily report is organized for the clinic team automatically.',
    tags: ['Schedule', 'History', 'Reports'],
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" aria-label="How TrikMed works" style={{ padding: 'var(--space-24) var(--space-6)', background: 'var(--color-surface)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Motion.div
          style={{ textAlign: 'center', marginBottom: 'var(--space-16)' }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <p className="eyebrow" style={{ color: 'var(--color-coral)', marginBottom: 'var(--space-4)' }}>How It Works</p>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)', color: 'var(--color-navy)', lineHeight: 1.12 }}>
            Live in 5 minutes. Running forever.
          </h2>
          <p style={{ margin: 'var(--space-4) auto 0', maxWidth: '520px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-lg)', lineHeight: 1.7 }}>
            No complex setup. TrikMed fits into the way your clinic already works.
          </p>
        </Motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-3" style={{ gap: 'var(--space-6)' }}>
          <div aria-hidden="true" className="hidden md:block" style={{ position: 'absolute', top: '54px', left: '16%', right: '16%', height: 'calc(var(--space-0-5) / 2)', background: 'linear-gradient(90deg, transparent, var(--color-border), var(--color-border), transparent)' }} />
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <Motion.div
                key={step.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.12 }}
                style={{ position: 'relative', zIndex: 1 }}
              >
                <Card variant="default" style={{ height: '100%', padding: 'var(--space-6)' }}>
                  <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                      <span style={{ display: 'grid', placeItems: 'center', width: '48px', height: '48px', borderRadius: 'var(--radius-full)', background: 'var(--color-coral)', color: 'var(--color-text-inverse)', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <Icon size={26} strokeWidth={1.8} color="var(--color-blue)" aria-hidden="true" />
                    </div>
                    <div>
                      <p style={{ margin: '0 0 var(--space-2)', color: 'var(--color-blue)', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {step.sub}
                      </p>
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h4)', color: 'var(--color-text-primary)' }}>
                        {step.title}
                      </h3>
                      <p style={{ margin: 'var(--space-3) 0 0', color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: 'var(--text-sm)' }}>
                        {step.body}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {step.tags.map(tag => <Badge key={tag} variant="blue" type="outline">{tag}</Badge>)}
                    </div>
                  </div>
                </Card>
              </Motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
