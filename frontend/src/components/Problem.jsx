'use client'
import { motion as Motion } from 'framer-motion'
import { Clock3, PhoneMissed, TrendingDown } from 'lucide-react'
import Card from './ui/Card'

const cards = [
  {
    icon: PhoneMissed,
    title: 'Missed calls become lost patients',
    body: 'Patients call while your team is busy. If nobody follows up quickly, they book elsewhere.',
  },
  {
    icon: Clock3,
    title: 'Manual follow-ups drain staff time',
    body: 'Reception teams juggle bookings, reminders, reports, and calls instead of helping people in the clinic.',
  },
  {
    icon: TrendingDown,
    title: 'No-shows quietly reduce revenue',
    body: 'Without reliable reminders, empty slots keep appearing in the schedule and revenue leaks every week.',
  },
]

export default function Problem() {
  return (
    <section id="problem" aria-label="The clinic operations problem" style={{ padding: 'var(--space-24) var(--space-6)', background: 'var(--color-surface)' }}>
      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] items-center" style={{ maxWidth: '1200px', margin: '0 auto', gap: 'var(--space-16)' }}>
        <Motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }}>
          <p className="eyebrow" style={{ marginBottom: 'var(--space-5)', color: 'var(--color-coral)' }}>The Problem</p>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)', lineHeight: 1.12, color: 'var(--color-navy)' }}>
            Clinics lose patients before the doctor ever meets them.
          </h2>
          <p style={{ margin: 'var(--space-5) 0 0', maxWidth: '520px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-lg)', lineHeight: 1.75 }}>
            Every unanswered call, forgotten reminder, and manual scheduling delay creates friction. TrikMed closes those gaps automatically on WhatsApp.
          </p>
        </Motion.div>
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {cards.map((card, index) => {
            const Icon = card.icon
            return (
              <Motion.div
                key={card.title}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <Card variant="flat" style={{ padding: 'var(--space-5)', borderLeft: '3px solid var(--color-coral)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                    <span style={{ display: 'grid', placeItems: 'center', width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'rgba(232,102,61,0.12)', color: 'var(--color-coral)', flexShrink: 0 }}>
                      <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h4)', color: 'var(--color-text-primary)' }}>
                        {card.title}
                      </h3>
                      <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--color-text-secondary)', lineHeight: 1.65, fontSize: 'var(--text-sm)' }}>
                        {card.body}
                      </p>
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
