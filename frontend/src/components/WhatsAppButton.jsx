'use client'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

export default function WhatsAppButton() {
  const [visible, setVisible] = useState(false)
  const [tooltip, setTooltip] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3000)
    const onScroll = () => {
      if (window.scrollY > 120) setVisible(true)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div style={{ position: 'fixed', right: 'var(--space-6)', bottom: 'var(--space-6)', zIndex: 45, display: 'grid', justifyItems: 'end', gap: 'var(--space-3)' }}>
      <AnimatePresence>
        {tooltip ? (
          <Motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            role="tooltip"
            style={{
              width: '220px',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-navy-deep)',
              color: 'var(--color-text-inverse)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <strong style={{ display: 'block', fontSize: 'var(--text-sm)' }}>Chat with us</strong>
            <span style={{ display: 'block', marginTop: 'var(--space-1)', color: 'rgba(255,255,255,0.68)', fontSize: 'var(--text-xs)', lineHeight: 1.55 }}>
              Questions about TrikMed? We reply on WhatsApp.
            </span>
          </Motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {visible ? (
          <Motion.a
            href="https://wa.me/919999999999?text=Hi%2C+I%27m+interested+in+TrikMed"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with TrikMed on WhatsApp"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            onMouseEnter={() => setTooltip(true)}
            onMouseLeave={() => setTooltip(false)}
            onFocus={() => setTooltip(true)}
            onBlur={() => setTooltip(false)}
            style={{
              position: 'relative',
              display: 'grid',
              placeItems: 'center',
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-full)',
              background: '#25D366',
              color: 'var(--color-text-inverse)',
              boxShadow: '0 8px 30px rgba(37,211,102,0.38)',
              textDecoration: 'none',
            }}
          >
            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: '#25D366', animation: 'tmWhatsAppPing 2.4s var(--ease-out) infinite', opacity: 0.22 }} />
            <MessageCircle size={27} strokeWidth={2} aria-hidden="true" style={{ position: 'relative' }} />
            <style>{`@keyframes tmWhatsAppPing { 0% { transform: scale(1); opacity: .22; } 70%, 100% { transform: scale(1.65); opacity: 0; } }`}</style>
          </Motion.a>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
