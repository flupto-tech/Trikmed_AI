'use client'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Link, useNavigate } from '../utils/navigation'
import { Button } from './ui/Button'
import TrikMedLogo from './TrikMedLogo'

const links = [
  { label: 'Problem', href: '#problem' },
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 10)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const close = event => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [open])

  function scrollTo(href) {
    setOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function openDemo() {
    setOpen(false)
    window.dispatchEvent(new CustomEvent('open-book-demo'))
  }

  return (
    <>
      <nav
        aria-label="Main navigation"
        style={{
          position: 'fixed',
          inset: '0 0 auto 0',
          zIndex: 50,
          height: '64px',
          background: scrolled ? 'rgba(15,35,66,0.92)' : 'var(--color-navy)',
          borderBottom: 'calc(var(--space-0-5) / 2) solid rgba(255,255,255,0.12)',
          boxShadow: scrolled ? 'var(--shadow-md)' : 'none',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          transition: 'background var(--duration-normal) var(--ease-out), box-shadow var(--duration-normal) var(--ease-out)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            height: '100%',
            margin: '0 auto',
            padding: '0 var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
          }}
        >
          <Link to="/" aria-label="TrikMed home" className="flex-shrink-0">
            <TrikMedLogo size="md" dark />
          </Link>

          <div className="hidden lg:flex" style={{ alignItems: 'center', gap: 'var(--space-6)' }}>
            {links.map(link => (
              <button
                key={link.href}
                type="button"
                onClick={() => scrollTo(link.href)}
                style={{
                  position: 'relative',
                  border: 0,
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.72)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  padding: 'var(--space-2) 0',
                }}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex" style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/login/clinic')} style={{ color: 'var(--color-text-inverse)' }}>
              Clinic Login
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/login/admin')} style={{ color: 'var(--color-text-inverse)' }}>
              Admin Portal
            </Button>
            <Button variant="coral" size="sm" onClick={openDemo}>
              Book Demo
            </Button>
          </div>

          <button
            type="button"
            className="lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(value => !value)}
            style={{
              display: 'inline-grid',
              placeItems: 'center',
              width: '40px',
              height: '40px',
              border: 0,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.08)',
              color: 'var(--color-text-inverse)',
              cursor: 'pointer',
            }}
          >
            {open ? <X size={20} strokeWidth={1.8} aria-hidden="true" /> : <Menu size={20} strokeWidth={1.8} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open ? (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden"
            style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(8,14,28,0.58)', backdropFilter: 'blur(4px)' }}
            onMouseDown={event => {
              if (event.target === event.currentTarget) setOpen(false)
            }}
          >
            <Motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{
                marginLeft: 'auto',
                width: 'min(360px, 86vw)',
                minHeight: '100%',
                padding: '88px var(--space-6) var(--space-6)',
                background: 'var(--color-navy)',
                boxShadow: 'var(--shadow-xl)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
              }}
            >
              {links.map(link => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => scrollTo(link.href)}
                  style={{
                    minHeight: '44px',
                    border: 0,
                    borderBottom: 'calc(var(--space-0-5) / 2) solid rgba(255,255,255,0.10)',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.86)',
                    textAlign: 'left',
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-body)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {link.label}
                </button>
              ))}
              <div style={{ display: 'grid', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                <Button variant="secondary" fullWidth onClick={() => { setOpen(false); navigate('/login/clinic') }}>
                  Clinic Login
                </Button>
                <Button variant="secondary" fullWidth onClick={() => { setOpen(false); navigate('/login/admin') }}>
                  Admin Portal
                </Button>
                <Button variant="coral" fullWidth onClick={openDemo}>
                  Book Demo
                </Button>
              </div>
            </Motion.div>
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
