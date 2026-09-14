'use client'
import { cloneElement, isValidElement } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import TrikMedLogo from '../TrikMedLogo'
import Alert from '../ui/Alert'
import Badge from '../ui/Badge'
import { Button, IconButton } from '../ui/Button'
import Card from '../ui/Card'
import FormField from '../ui/FormField'
import { Link } from '../../utils/navigation'

const MotionDiv = motion.div

export const authInputStyle = {
  width: '100%',
  minHeight: '46px',
  borderRadius: 'var(--radius-btn)',
  padding: '0 var(--space-4)',
  background: 'var(--color-surface)',
  border: 'calc((var(--space-0-5) + var(--space-1)) / 4) solid var(--color-border)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--text-body)',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  boxSizing: 'border-box',
  transition: 'border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out)',
}

export function SkipToContent({ target = 'auth-main' }) {
  return (
    <a
      href={`#${target}`}
      className="tm-skip-link"
      style={{
        position: 'absolute',
        left: 'var(--space-4)',
        top: 'var(--space-4)',
        zIndex: 50,
      }}
    >
      Skip to authentication form
    </a>
  )
}

export function AuthShell({
  children,
  eyebrow,
  heroTitle,
  heroAccent,
  heroText,
  heroItems = [],
  stats = [],
  backTo,
  backLabel = 'Back',
  contentId = 'auth-main',
  maxWidth = 460,
}) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)', position: 'relative' }}>
      <SkipToContent target={contentId} />
      <section
        className="hidden lg:flex lg:w-[56%]"
        aria-hidden="true"
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(145deg, var(--color-navy-deep), var(--color-navy))',
          color: 'var(--color-text-inverse)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(110deg, rgba(232,102,61,0.14), transparent 36%, rgba(26,92,181,0.2))',
            opacity: 0.75,
          }}
        />
        <div style={{ width: '100%', maxWidth: 620, margin: 'auto', padding: 'var(--space-16)', position: 'relative', zIndex: 1 }}>
          <Link to="/" tabIndex={-1} style={{ display: 'inline-block', marginBottom: 'var(--space-16)' }}>
            <TrikMedLogo size="lg" dark />
          </Link>
          {eyebrow ? (
            <Badge variant="coral" size="lg" type="outline" style={{ marginBottom: 'var(--space-5)', background: 'rgba(255,255,255,0.06)' }}>
              {eyebrow}
            </Badge>
          ) : null}
          <h1
            style={{
              margin: '0 0 var(--space-5)',
              maxWidth: 540,
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-h1)',
              fontWeight: 800,
              lineHeight: 1.05,
              color: 'var(--color-text-inverse)',
            }}
          >
            {heroTitle}
            {heroAccent ? (
              <>
                <br />
                <span style={{ color: 'var(--color-coral)' }}>{heroAccent}</span>
              </>
            ) : null}
          </h1>
          {heroText ? (
            <p style={{ margin: '0 0 var(--space-8)', maxWidth: 480, color: 'rgba(255,255,255,0.72)', fontSize: 'var(--text-body-lg)', lineHeight: 1.7 }}>
              {heroText}
            </p>
          ) : null}
          {heroItems.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--space-3)', maxWidth: 500 }}>
              {heroItems.map((item) => (
                <div
                  key={item.title}
                  style={{
                    border: 'calc(var(--space-0-5) / 2) solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.07)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                  }}
                >
                  <p style={{ margin: 0, color: 'var(--color-text-inverse)', fontSize: 'var(--text-sm)', fontWeight: 700 }}>{item.title}</p>
                  <p style={{ margin: 'var(--space-1) 0 0', color: 'rgba(255,255,255,0.55)', fontSize: 'var(--text-xs)', lineHeight: 1.5 }}>{item.text}</p>
                </div>
              ))}
            </div>
          ) : null}
          {stats.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-3)', maxWidth: 500, marginTop: 'var(--space-8)' }}>
              {stats.map((stat) => (
                <div key={stat.label} style={{ borderTop: 'calc(var(--space-0-5) / 2) solid rgba(255,255,255,0.18)', paddingTop: 'var(--space-3)' }}>
                  <strong style={{ display: 'block', color: 'var(--color-coral)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-h3)' }}>{stat.value}</strong>
                  <span style={{ color: 'rgba(255,255,255,0.58)', fontSize: 'var(--text-xs)' }}>{stat.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <main
        id={contentId}
        tabIndex={-1}
        className="w-full lg:w-[44%] flex items-center justify-center"
        style={{ padding: 'var(--space-6)', minHeight: '100vh' }}
      >
        <MotionDiv
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth }}
        >
          {backTo ? (
            <Link
              to={backTo}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
              {backLabel}
            </Link>
          ) : null}
          <div className="lg:hidden" style={{ marginBottom: 'var(--space-5)' }}>
            <Link to="/" aria-label="TrikMed home">
              <TrikMedLogo size="md" />
            </Link>
          </div>
          <Card variant="elevated" style={{ borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}>
            {children}
          </Card>
        </MotionDiv>
      </main>
    </div>
  )
}

export function AuthHeader({ badge, title, subtitle, children }) {
  return (
    <Card.Header
      style={{ display: 'grid', padding: 'var(--space-8) var(--space-8) 0', gap: 'var(--space-3)' }}
    >
      {badge ? <Badge variant={badge.variant || 'coral'} type={badge.type || 'subtle'}>{badge.label}</Badge> : null}
      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h2)', fontWeight: 800, color: 'var(--color-navy)' }}>
          {title}
        </h2>
        {subtitle ? <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-body)', lineHeight: 1.6 }}>{subtitle}</p> : null}
      </div>
      {children}
    </Card.Header>
  )
}

export function AuthBody({ children, style = {} }) {
  return <Card.Body style={{ display: 'grid', gap: 'var(--space-4)', padding: 'var(--space-6) var(--space-8) var(--space-8)', ...style }}>{children}</Card.Body>
}

export function AuthAlert({ error, success }) {
  if (error) return <Alert variant="error" size="sm">{error}</Alert>
  if (success) return <Alert variant="success" size="sm">{success}</Alert>
  return null
}

export function AuthTextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  error,
  hint,
  autoComplete,
  inputMode,
  maxLength,
  icon: Icon,
  rightSlot,
  style = {},
  ...props
}) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined

  return (
    <FormField label={label} htmlFor={id} required={required} error={error} hint={hint}>
      <div style={{ position: 'relative' }}>
        {Icon ? (
          <Icon
            size={16}
            strokeWidth={1.8}
            aria-hidden="true"
            style={{ position: 'absolute', left: 'var(--space-4)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
          />
        ) : null}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          style={{
            ...authInputStyle,
            ...(Icon ? { paddingLeft: 'calc(var(--space-8) + var(--space-4))' } : {}),
            ...(rightSlot ? { paddingRight: 'calc(var(--space-8) + var(--space-5))' } : {}),
            ...(error ? { borderColor: 'var(--color-error-border)', boxShadow: 'var(--shadow-focus-error)' } : {}),
            ...style,
          }}
          onFocus={(event) => {
            event.currentTarget.style.borderColor = error ? 'var(--color-error-text)' : 'var(--color-blue)'
            event.currentTarget.style.boxShadow = error ? 'var(--shadow-focus-error)' : 'var(--shadow-focus)'
          }}
          onBlur={(event) => {
            event.currentTarget.style.borderColor = error ? 'var(--color-error-border)' : 'var(--color-border)'
            event.currentTarget.style.boxShadow = error ? 'var(--shadow-focus-error)' : 'none'
          }}
          {...props}
        />
        {rightSlot ? <div style={{ position: 'absolute', right: 'var(--space-2)', top: '50%', transform: 'translateY(-50%)' }}>{rightSlot}</div> : null}
      </div>
    </FormField>
  )
}

export function PasswordField({ id, label = 'Password', value, onChange, show, onToggle, error, autoComplete = 'current-password', placeholder = 'Password', hint }) {
  return (
    <AuthTextField
      id={id}
      label={label}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required
      error={error}
      hint={hint}
      autoComplete={autoComplete}
      rightSlot={(
        <IconButton
          icon={show ? EyeOff : Eye}
          variant="ghost"
          ariaLabel={show ? 'Hide password' : 'Show password'}
          onClick={onToggle}
          style={{ width: '32px', minWidth: '32px', minHeight: '32px', color: 'var(--color-text-muted)' }}
        />
      )}
    />
  )
}

export function DividerLabel({ children = 'or' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      <span aria-hidden="true" style={{ flex: 1, height: 'calc(var(--space-0-5) / 2)', background: 'var(--color-border)' }} />
      {children}
      <span aria-hidden="true" style={{ flex: 1, height: 'calc(var(--space-0-5) / 2)', background: 'var(--color-border)' }} />
    </div>
  )
}

export function DemoDetails({ title = 'Demo login', children }) {
  return (
    <details
      style={{
        border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-surface-subtle)',
        padding: 'var(--space-3) var(--space-4)',
      }}
    >
      <summary style={{ cursor: 'pointer', color: 'var(--color-navy)', fontSize: 'var(--text-sm)', fontWeight: 700 }}>
        {title}
      </summary>
      <div style={{ display: 'grid', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
        {children}
      </div>
    </details>
  )
}

export function ShortcutGrid({ children, columns = 'repeat(2, minmax(0, 1fr))' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: columns, gap: 'var(--space-2)' }}>
      {children}
    </div>
  )
}

export function ShortcutButton({ title, subtitle, onClick, icon, variant = 'default' }) {
  const content = (
    <>
      <span style={{ display: 'block', color: variant === 'coral' ? 'var(--color-coral)' : 'var(--color-navy)', fontSize: 'var(--text-xs)', fontWeight: 800 }}>
        {title}
      </span>
      {subtitle ? <span style={{ display: 'block', marginTop: 'var(--space-1)', color: 'var(--color-text-muted)', fontSize: 'var(--text-2xs)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</span> : null}
    </>
  )

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        width: '100%',
        minHeight: '52px',
        textAlign: 'left',
        border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-btn)',
        padding: 'var(--space-3)',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        transition: 'border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out)',
      }}
      onFocus={(event) => {
        event.currentTarget.style.borderColor = 'var(--color-blue)'
        event.currentTarget.style.boxShadow = 'var(--shadow-focus)'
      }}
      onBlur={(event) => {
        event.currentTarget.style.borderColor = 'var(--color-border)'
        event.currentTarget.style.boxShadow = 'none'
      }}
    >
      {isValidElement(icon) ? cloneElement(icon, { 'aria-hidden': 'true' }) : icon}
      <span style={{ minWidth: 0 }}>{content}</span>
    </button>
  )
}

export function Stepper({ steps, current }) {
  return (
    <ol aria-label="Signup progress" style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`, gap: 'var(--space-2)', listStyle: 'none', padding: 0, margin: 0 }}>
      {steps.map((step, index) => {
        const active = index === current
        const complete = index < current
        return (
          <li key={step.id} aria-current={active ? 'step' : undefined}>
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <span
                aria-hidden="true"
                style={{
                  height: '4px',
                  borderRadius: 'var(--radius-full)',
                  background: complete || active ? 'var(--color-coral)' : 'var(--color-border)',
                }}
              />
              <span style={{ color: active ? 'var(--color-navy)' : 'var(--color-text-muted)', fontSize: 'var(--text-xs)', fontWeight: active ? 800 : 600 }}>
                {step.label}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export { Button }
