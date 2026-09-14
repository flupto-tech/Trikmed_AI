'use client'
import { motion as Motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from './ui/Button'

export default function CTA() {
  return (
    <section aria-label="Book a TrikMed demo" style={{ padding: 'var(--space-20) var(--space-6)', background: 'var(--color-coral)', color: 'var(--color-text-inverse)' }}>
      <Motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          maxWidth: '980px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 'var(--space-8)',
          alignItems: 'center',
        }}
      >
        <div>
          <p className="eyebrow" style={{ marginBottom: 'var(--space-4)', color: 'rgba(255,255,255,0.78)' }}>Get Started Today</p>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)', lineHeight: 1.12, color: 'var(--color-text-inverse)' }}>
            Ready to stop missing patients?
          </h2>
          <p style={{ margin: 'var(--space-4) 0 0', maxWidth: '560px', color: 'rgba(255,255,255,0.78)', fontSize: 'var(--text-body-lg)', lineHeight: 1.7 }}>
            Book a guided demo and see how TrikMed fits your clinic workflow in minutes.
          </p>
        </div>
        <Button
          variant="secondary"
          size="lg"
          rightIcon={<ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />}
          onClick={() => window.dispatchEvent(new CustomEvent('open-book-demo'))}
          style={{ background: 'var(--color-surface)', color: 'var(--color-coral)', border: 'none', boxShadow: 'var(--shadow-coral)' }}
        >
          Book Free Demo
        </Button>
      </Motion.div>
    </section>
  )
}
