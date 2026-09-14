'use client'
import { MessageCircle } from 'lucide-react'
import { Link } from '../utils/navigation'
import TrikMedLogo from './TrikMedLogo'

const columns = {
  Product: [
    ['Features', '#features'],
    ['Pricing', '#pricing'],
    ['How It Works', '#how-it-works'],
    ['FAQ', '#faq'],
  ],
  Company: [
    ['About', '#problem'],
    ['Demo', '#'],
    ['Contact', '#contact'],
  ],
  Support: [
    ['Documentation', '#'],
    ['Privacy Policy', '#'],
    ['Terms of Service', '#'],
  ],
}

const socialLinks = [
  { label: 'WhatsApp', href: 'https://wa.me/919999999999?text=Hi%2C+I%27m+interested+in+TrikMed', icon: MessageCircle, color: '#25D366' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com', text: 'in', color: '#0A66C2' },
  { label: 'X', href: 'https://x.com', text: 'X', color: '#111111' },
]

export default function Footer() {
  return (
    <footer id="contact" style={{ background: 'var(--color-navy-deep)', color: 'var(--color-text-inverse)', padding: 'var(--space-20) var(--space-6) var(--space-12)', borderTop: 'calc(var(--space-0-5) / 2) solid rgba(255,255,255,0.08)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr]" style={{ gap: 'var(--space-12)', marginBottom: 'var(--space-16)' }}>
          <div>
            <Link to="/" aria-label="TrikMed home" className="inline-flex">
              <TrikMedLogo size="md" dark />
            </Link>
            <p style={{ margin: 'var(--space-5) 0 0', maxWidth: '260px', color: 'rgba(255,255,255,0.66)', lineHeight: 1.75, fontSize: 'var(--text-sm)' }}>
              AI receptionist for Indian clinics. Built on WhatsApp. Designed for zero missed patients.
            </p>
            <p style={{ margin: 'var(--space-5) 0 0', color: 'rgba(255,255,255,0.45)', fontSize: 'var(--text-xs)' }}>
              A product by Flupto Technologies
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
              {socialLinks.map(link => {
                const Icon = link.icon
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    style={{
                      display: 'inline-grid',
                      placeItems: 'center',
                      width: '38px',
                      height: '38px',
                      borderRadius: 'var(--radius-full)',
                      background: link.color,
                      color: 'var(--color-text-inverse)',
                      textDecoration: 'none',
                      fontWeight: 800,
                    }}
                  >
                    {Icon ? <Icon size={17} strokeWidth={1.8} aria-hidden="true" /> : link.text}
                  </a>
                )
              })}
            </div>
          </div>

          {Object.entries(columns).map(([heading, links]) => (
            <div key={heading}>
              <h2 style={{ margin: '0 0 var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-text-inverse)', fontWeight: 700 }}>
                {heading}
              </h2>
              <ul style={{ display: 'grid', gap: 'var(--space-3)', margin: 0, padding: 0, listStyle: 'none' }}>
                {links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} style={{ color: 'rgba(255,255,255,0.62)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-4)', paddingTop: 'var(--space-8)', borderTop: 'calc(var(--space-0-5) / 2) solid rgba(255,255,255,0.08)' }}>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: 'var(--text-xs)' }}>
            Copyright 2026 Flupto Technologies. All rights reserved.
          </p>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: 'var(--text-xs)' }}>
            Built for clinics that move fast.
          </p>
        </div>
      </div>
    </footer>
  )
}
