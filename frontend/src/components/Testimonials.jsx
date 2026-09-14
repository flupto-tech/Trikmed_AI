'use client'
import { motion as Motion } from 'framer-motion'
import { Star } from 'lucide-react'
import Avatar from './ui/Avatar'
import Badge from './ui/Badge'
import Card from './ui/Card'

const testimonials = [
  {
    quote: 'TrikMed recovered 40% of our missed patients in the first week. Setup took less time than training a new receptionist.',
    name: 'Dr. Priya Mehta',
    clinic: 'Mehta Clinic, Bhopal',
    highlight: '40% patients recovered',
  },
  {
    quote: 'My receptionist handled 50 calls a day. Now TrikMed handles most booking conversations automatically.',
    name: 'Dr. Arjun Singh',
    clinic: 'City Care, Jaipur',
    highlight: '80% calls automated',
  },
  {
    quote: 'Patients love booking on WhatsApp. Our no-show rate dropped from 30% to under 10% in one month.',
    name: 'Dr. Neha Gupta',
    clinic: 'Gupta Healthcare, Lucknow',
    highlight: 'No-shows below 10%',
  },
]

export default function Testimonials() {
  return (
    <section aria-label="Clinic testimonials" style={{ padding: 'var(--space-24) var(--space-6)', background: 'var(--color-surface-subtle)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Motion.div
          style={{ textAlign: 'center', marginBottom: 'var(--space-16)' }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <p className="eyebrow" style={{ color: 'var(--color-coral)', marginBottom: 'var(--space-4)' }}>Testimonials</p>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)', color: 'var(--color-navy)', lineHeight: 1.12 }}>
            Doctors across India trust TrikMed.
          </h2>
          <p style={{ margin: 'var(--space-4) auto 0', maxWidth: '460px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-lg)', lineHeight: 1.7 }}>
            Real workflow improvements from clinics that cannot afford missed patients.
          </p>
        </Motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 'var(--space-6)' }}>
          {testimonials.map((item, index) => (
            <Motion.div
              key={item.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card variant="default" interactive style={{ height: '100%', padding: 'var(--space-6)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-5)' }} aria-label="5 star rating">
                  {[0, 1, 2, 3, 4].map(star => <Star key={star} size={16} fill="var(--color-warning-border)" color="var(--color-warning-border)" aria-hidden="true" />)}
                </div>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-body)', lineHeight: 1.75, fontStyle: 'italic' }}>
                  &quot;{item.quote}&quot;
                </p>
                <div style={{ margin: 'var(--space-6) 0' }}>
                  <Badge variant="coral" type="subtle">{item.highlight}</Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', paddingTop: 'var(--space-5)', borderTop: 'calc(var(--space-0-5) / 2) solid var(--color-border)' }}>
                  <Avatar name={item.name} size="lg" />
                  <div>
                    <p style={{ margin: 0, color: 'var(--color-text-primary)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>{item.name}</p>
                    <p style={{ margin: 'var(--space-0-5) 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>{item.clinic}</p>
                  </div>
                </div>
              </Card>
            </Motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
