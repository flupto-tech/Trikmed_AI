'use client'
import { useEffect, useRef, useState } from 'react'
import { motion as Motion, useInView } from 'framer-motion'

function Counter({ end, prefix = '', suffix = '' }) {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  useEffect(() => {
    if (!inView) return undefined
    let start
    let frame
    const duration = 1800
    const tick = timestamp => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * end))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [end, inView])

  return <span ref={ref}>{prefix}{value.toLocaleString('en-IN')}{suffix}</span>
}

const stats = [
  { end: 47, prefix: '', suffix: '%', label: 'Patients lost to missed calls', sub: 'of calls go unanswered daily' },
  { end: 2400000, prefix: 'Rs ', suffix: '', label: 'Revenue leaked per clinic', sub: 'annual average from missed appointments' },
  { end: 23, prefix: '', suffix: '/day', label: 'Appointments not booked', sub: 'patients who gave up before booking' },
]

export default function Stats() {
  return (
    <section aria-label="Clinic revenue loss statistics" style={{ padding: 'var(--space-20) var(--space-6)', background: 'var(--color-bg)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          style={{
            borderRadius: 'var(--radius-2xl)',
            background: 'var(--color-navy)',
            border: 'calc(var(--space-0-5) / 2) solid rgba(255,255,255,0.12)',
            boxShadow: 'var(--shadow-lg)',
            padding: 'var(--space-16) var(--space-8)',
            overflow: 'hidden',
          }}
        >
          <h2 style={{ margin: '0 0 var(--space-12)', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)', color: 'var(--color-text-inverse)', lineHeight: 1.14 }}>
            Every minute you wait, the leak gets bigger.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 'var(--space-8)' }}>
            {stats.map((stat, index) => (
              <Motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                style={{
                  textAlign: 'center',
                  padding: '0 var(--space-4)',
                  borderRight: index < 2 ? 'calc(var(--space-0-5) / 2) solid rgba(255,255,255,0.14)' : 'none',
                }}
              >
                <strong style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 'clamp(2.5rem, 5vw, 4.25rem)', lineHeight: 1, color: 'var(--color-coral)' }}>
                  <Counter end={stat.end} prefix={stat.prefix} suffix={stat.suffix} />
                </strong>
                <p style={{ margin: 'var(--space-4) 0 var(--space-1)', color: 'var(--color-text-inverse)', fontWeight: 700 }}>
                  {stat.label}
                </p>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.62)', fontSize: 'var(--text-sm)' }}>
                  {stat.sub}
                </p>
              </Motion.div>
            ))}
          </div>
          <p style={{ margin: 'var(--space-10) 0 0', paddingTop: 'var(--space-6)', borderTop: 'calc(var(--space-0-5) / 2) solid rgba(255,255,255,0.14)', textAlign: 'center', color: 'rgba(255,255,255,0.62)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
            These numbers reset when you refresh. The real losses do not.
          </p>
        </Motion.div>
      </div>
    </section>
  )
}
