'use client'
import { useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { ChevronDown, MessageCircle } from 'lucide-react'
import Card from './ui/Card'

const faqs = [
  {
    question: 'How does TrikMed connect with WhatsApp?',
    answer: 'TrikMed integrates with the official WhatsApp Business API. We handle setup for your WhatsApp Business number so your clinic can go live quickly without technical work.',
  },
  {
    question: 'Do patients need to download an app?',
    answer: 'No. Patients use WhatsApp or scan a QR code. There is no new app, account, password, or training needed.',
  },
  {
    question: 'What happens when a patient calls instead of messaging?',
    answer: 'TrikMed can follow up on missed calls with a WhatsApp message so patients can book instead of trying another clinic.',
  },
  {
    question: 'Can I manage multiple doctors or branches?',
    answer: 'Yes. TrikMed supports multiple doctors, clinic branches, schedules, booking pages, and WhatsApp flows.',
  },
  {
    question: 'How is patient data protected?',
    answer: 'Patient data is encrypted in transit and at rest. TrikMed is designed for healthcare workflows with careful access and privacy practices.',
  },
  {
    question: 'Can WhatsApp messages be customized?',
    answer: 'Yes. Clinic name, doctor name, language, tone, reminders, and booking messages can be customized for your workflow.',
  },
  {
    question: 'Is there a setup fee or annual contract?',
    answer: 'No setup fee and no annual lock-in. Plans are monthly, and clinics can upgrade or cancel from the dashboard.',
  },
]

function FAQItem({ faq, index }) {
  const [open, setOpen] = useState(false)
  const panelId = `faq-panel-${index}`
  const buttonId = `faq-button-${index}`

  return (
    <Motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
    >
      <Card
        variant="flat"
        style={{
          overflow: 'hidden',
          borderColor: open ? 'var(--color-coral)' : 'var(--color-border)',
          background: open ? 'rgba(232,102,61,0.04)' : 'var(--color-surface)',
        }}
      >
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(value => !value)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            minHeight: '64px',
            padding: 'var(--space-5) var(--space-6)',
            border: 0,
            background: 'transparent',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-body)',
            fontWeight: 700,
          }}
        >
          {faq.question}
          <Motion.span
            aria-hidden="true"
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'inline-grid',
              placeItems: 'center',
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-md)',
              background: open ? 'var(--color-coral)' : 'var(--color-surface-subtle)',
              color: open ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
              flexShrink: 0,
            }}
          >
            <ChevronDown size={16} strokeWidth={1.8} />
          </Motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open ? (
            <Motion.div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '0 var(--space-6) var(--space-5)' }}>
                <div style={{ height: 'calc(var(--space-0-5) / 2)', background: 'var(--color-border)', marginBottom: 'var(--space-4)' }} />
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.75 }}>
                  {faq.answer}
                </p>
              </div>
            </Motion.div>
          ) : null}
        </AnimatePresence>
      </Card>
    </Motion.div>
  )
}

export default function FAQ() {
  return (
    <section id="faq" aria-label="Frequently asked questions" style={{ padding: 'var(--space-24) var(--space-6)', background: 'var(--color-surface-subtle)' }}>
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        <Motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}
        >
          <p className="eyebrow" style={{ color: 'var(--color-coral)', marginBottom: 'var(--space-4)' }}>FAQ</p>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)', color: 'var(--color-navy)', lineHeight: 1.12 }}>
            Got questions? We have answers.
          </h2>
          <p style={{ margin: 'var(--space-4) auto 0', maxWidth: '460px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-lg)', lineHeight: 1.7 }}>
            Everything clinic owners usually ask before starting with TrikMed.
          </p>
        </Motion.div>

        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {faqs.map((faq, index) => <FAQItem key={faq.question} faq={faq} index={index} />)}
        </div>

        <Card variant="default" style={{ marginTop: 'var(--space-8)', padding: 'var(--space-6)', textAlign: 'center' }}>
          <p style={{ margin: '0 0 var(--space-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Still have questions?
          </p>
          <a
            href="https://wa.me/919999999999?text=Hi%2C+I+have+a+question+about+TrikMed"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              color: '#128C4A',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: 'var(--text-sm)',
            }}
          >
            <MessageCircle size={16} strokeWidth={1.8} aria-hidden="true" />
            Chat with us on WhatsApp
          </a>
        </Card>
      </div>
    </section>
  )
}
