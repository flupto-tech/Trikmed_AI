'use client'
import { motion as Motion } from 'framer-motion'
import { BarChart3, BellRing, CalendarDays, FileHeart, PhoneForwarded, QrCode } from 'lucide-react'
import Card from './ui/Card'

const features = [
  { icon: PhoneForwarded, title: 'Missed Call Recovery', body: 'Every missed call triggers an instant WhatsApp response so no patient is left waiting.' },
  { icon: CalendarDays, title: 'WhatsApp Booking', body: 'Patients choose slots directly in chat. No app download, account, or password required.' },
  { icon: BellRing, title: 'Smart Reminders', body: 'Automated reminders before appointments reduce no-shows and keep the day predictable.' },
  { icon: QrCode, title: 'QR Appointments', body: 'Place a QR code in your clinic and let walk-in patients book from their own phone.' },
  { icon: FileHeart, title: 'Prescription Follow-up', body: 'Medicine and revisit reminders help patients complete treatment after they leave.' },
  { icon: BarChart3, title: 'Daily Reports', body: 'Appointments, revenue, and patient activity arrive on WhatsApp every morning.' },
]

export default function Features() {
  return (
    <section id="features" aria-label="TrikMed features" style={{ padding: 'var(--space-24) var(--space-6)', background: 'var(--color-surface-subtle)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Motion.div
          style={{ textAlign: 'center', marginBottom: 'var(--space-16)' }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <p className="eyebrow" style={{ color: 'var(--color-coral)', marginBottom: 'var(--space-4)' }}>What TrikMed Does</p>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)', lineHeight: 1.12, color: 'var(--color-navy)' }}>
            Complete clinic management from one WhatsApp number.
          </h2>
          <p style={{ margin: 'var(--space-4) auto 0', maxWidth: '540px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-lg)', lineHeight: 1.7 }}>
            A premium workflow for doctors, receptionists, and patients without adding complexity.
          </p>
        </Motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--space-6)' }}>
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.48, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card variant="default" interactive style={{ height: '100%', padding: 'var(--space-6)' }}>
                  <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                    <span style={{ display: 'grid', placeItems: 'center', width: '52px', height: '52px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, #FFF1EC, #FFE4D8)', color: 'var(--color-coral)' }}>
                      <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h4)', color: 'var(--color-text-primary)' }}>
                        {feature.title}
                      </h3>
                      <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: 'var(--text-sm)' }}>
                        {feature.body}
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
