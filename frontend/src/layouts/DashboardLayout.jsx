'use client'
import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from '../utils/navigation'
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  LayoutDashboard, Calendar, Users, MessageCircle, QrCode,
  Pill, Bell, PhoneCall, Settings, LogOut, Zap, ChevronLeft,
  ChevronRight, Menu, BellRing, ChevronDown, Monitor, UserCog,
  Stethoscope, Briefcase, IndianRupee,
} from 'lucide-react'
import TrikMedLogo from '../components/TrikMedLogo'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import { IconButton } from '../components/ui/Button'
import { getSession, getUser, getClinicRole, logout, can } from '../utils/auth'
import { ROLE_LABELS } from '../config/roles'
import { todayStats } from '../data/mockData'
import api from '../services/api'
import { pageTransition } from '../components/ui/motionConfig'

const ALL_NAV_ITEMS = [
  { navKey: 'dashboard',    icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard' },
  { navKey: 'opd-console',  icon: Stethoscope,     label: 'OPD Console',  path: '/portal/rx/new' },
  { navKey: 'appointments', icon: Calendar,        label: 'Appointments', path: '/dashboard/appointments' },
  { navKey: 'queue',        icon: Monitor,         label: 'Queue Screen', path: '/dashboard/queue' },
  { navKey: 'patients',     icon: Users,           label: 'Patients',     path: '/dashboard/patients' },
  { navKey: 'whatsapp',     icon: MessageCircle,   label: 'WhatsApp',     path: '/dashboard/whatsapp', badge: 3 },
  { navKey: 'qr',           icon: QrCode,          label: 'QR Codes',     path: '/dashboard/qr' },
  { navKey: 'rx-history',   icon: Pill,            label: 'Rx History',   path: '/portal/rx/history' },
  { navKey: 'revenue-reports', icon: IndianRupee,  label: 'Revenue Analytics', path: '/dashboard/revenue-reports' },
  { navKey: 'reminders',    icon: Bell,            label: 'Reminders',    path: '/dashboard/reminders' },
  { navKey: 'mr-manager',   icon: Briefcase,       label: 'MR Manager',   path: '/mr-manager' },
  { navKey: 'missed-calls', icon: PhoneCall,       label: 'Missed Calls', path: '/dashboard/missed-calls', badge: todayStats.missedCalls },
  { navKey: 'settings',     icon: Settings,        label: 'Settings',     path: '/portal/settings/clinic' },
  { navKey: 'staff',        icon: UserCog,         label: 'Staff',        path: '/dashboard/staff' },
]

// Role badge styles (shown in header next to user name)
const ROLE_HEADER_BADGE = {
  owner:        { bg: '#0F2D5E', color: '#fff' },
  doctor_owner: { bg: '#0F2D5E', color: '#fff' },
  doctor:       { bg: '#1A5CB5', color: '#fff' },
  receptionist: { bg: '#7C3AED', color: '#fff' },
  staff:        { bg: '#e5e7eb', color: '#374151' },
}

// Sidebar dark bg
const SBG = 'var(--color-navy-deep)'

function getActiveNavItem(navItems, pathname) {
  return [...navItems]
    .sort((a, b) => b.path.length - a.path.length)
    .find(item => item.path === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === item.path || pathname.startsWith(`${item.path}/`)
    )
}

function getFallbackTitle(pathname) {
  const segment = pathname.split('/').filter(Boolean).at(-1)
  if (!segment) return 'Dashboard'
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function SidebarItem({ item, collapsed }) {
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const isActive = item.path === '/dashboard'
    ? location.pathname === '/dashboard'
    : location.pathname.startsWith(item.path)
  const [hov, setHov] = useState(false)

  return (
    <NavLink
      to={item.path}
      aria-current={isActive ? 'page' : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onFocus={() => setHov(true)}
      onBlur={() => setHov(false)}
      className={`relative flex items-center gap-3 rounded-lg transition-all duration-150 group
        ${isActive
          ? 'text-white bg-white/[0.08]'
          : 'text-white/60 hover:text-white/90 hover:bg-white/[0.075]'
        }`}
      style={{
        minHeight: '44px',
        padding: collapsed ? '0 12px' : '0 16px 0 13px',
        borderLeft: isActive ? '3px solid var(--color-coral)' : '3px solid transparent',
      }}
    >
      <div className="relative flex-shrink-0 w-5 h-5 flex items-center justify-center">
        <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
      </div>
      {!collapsed && (
        <span className="relative text-[13.5px] whitespace-nowrap"
          style={{ fontWeight: isActive ? 600 : 500 }}>
          {item.label}
        </span>
      )}
      {!collapsed && item.badge ? (
        <span className="relative ml-auto text-[10px] font-bold text-white rounded min-w-[18px] h-[18px] flex items-center justify-center px-1"
          style={{ borderRadius: '4px', background: 'var(--color-coral)' }}>
          {item.badge}
        </span>
      ) : null}
      {collapsed && item.badge ? (
        <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold text-white w-4 h-4 flex items-center justify-center"
          style={{ borderRadius: '4px', background: 'var(--color-coral)' }}>
          {item.badge}
        </span>
      ) : null}
      <AnimatePresence>
        {collapsed && hov && (
          <Motion.div
            initial={reduceMotion ? { opacity: 0, x: 0 } : { opacity: 0, x: -4 }}
            animate={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0, x: 0 } : { opacity: 0, x: -4 }}
            transition={{ duration: reduceMotion ? 0.08 : 0.14 }}
            className="absolute left-full ml-3 px-2.5 py-1.5 border border-white/10 rounded-lg text-[13px] font-medium text-white whitespace-nowrap pointer-events-none z-50 shadow-xl"
            style={{ background: 'var(--color-navy-deep)' }}
          >
            {item.label}{item.badge ? ` (${item.badge})` : ''}
          </Motion.div>
        )}
      </AnimatePresence>
    </NavLink>
  )
}

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const session = getSession()
  const reduceMotion = useReducedMotion()

  // Permission-based nav filtering — read from session first so stale trikmed_user never overrides
  const clinicRole = session?.clinic_role || getClinicRole()
  const NAV_FEATURE_MAP = {
    appointments:  'page_appointments',
    queue:         'page_queue',
    patients:      'page_patients',
    whatsapp:      'page_whatsapp',
    qr:            'page_qr',
    'rx-history':  'page_prescriptions',
    'revenue-reports': 'page_revenue_reports',
    reminders:     'page_reminders',
    'missed-calls':'page_missed_calls',
    settings:      'page_settings',
    'mr-manager':  'page_mr_manager',
  }
  const isOwnerLevel = clinicRole === 'owner' || clinicRole === 'doctor_owner'
  const navItems = ALL_NAV_ITEMS.filter(item => {
    if (isOwnerLevel) return true  // owner / doctor_owner see every nav item
    if (item.navKey === 'dashboard') return true
    if (item.navKey === 'opd-console')  return clinicRole === 'doctor'
    if (item.navKey === 'settings') return clinicRole === 'doctor' || clinicRole === 'receptionist'
    const feat = NAV_FEATURE_MAP[item.navKey]
    return feat ? can(feat) : false
  })
  const roleBadge    = ROLE_HEADER_BADGE[clinicRole] || ROLE_HEADER_BADGE.staff
  const roleLabel    = ROLE_LABELS[clinicRole] || clinicRole

  // User display name (prefer API user, fall back to mock session)
  const currentUser  = getUser() || session
  const displayName  = currentUser?.name || session?.name || 'User'
  const activeItem = getActiveNavItem(navItems, location.pathname)
  const pageTitle = activeItem?.label || getFallbackTitle(location.pathname)
  const isDashboardHome = location.pathname === '/dashboard'
  const breadcrumbs = [
    { label: 'Dashboard', path: '/dashboard' },
    ...(pageTitle === 'Dashboard' ? [] : [{ label: pageTitle, path: activeItem?.path || location.pathname }]),
  ]

  // Fetch real clinic name from backend
  const [clinicName, setClinicName] = useState('')
  useEffect(() => {
    const clinicId = session?.clinic_id
    if (!clinicId) return
    api.get(`/clinics/${clinicId}`)
      .then(data => {
        const name = data?.clinic_name || data?.clinicName || ''
        if (name) setClinicName(name)
      })
      .catch(() => {})
  }, [session?.clinic_id])

  // Derived display: fall back to user's name while loading
  const displayClinicName = clinicName || session?.clinic_id || ''

  useEffect(() => {
    if (!session) navigate('/login')
  }, [])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMobileOpen(false)
      setNotifOpen(false)
      setProfileOpen(false)
    })
    return () => cancelAnimationFrame(frame)
  }, [location.pathname])

  useEffect(() => {
    const handleEscape = event => {
      if (event.key !== 'Escape') return
      setMobileOpen(false)
      setNotifOpen(false)
      setProfileOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    if (mobileOpen) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileOpen])

  if (!session) return null

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const notifications = [
    { id:1, text:'4 missed calls — auto WhatsApp sent', time:'10 min ago', type:'alert' },
    { id:2, text:'New appointment via QR Code — Amit Sharma', time:'23 min ago', type:'success' },
    { id:3, text:'Reminder sent to 6 patients for tomorrow', time:'1 hr ago', type:'info' },
    { id:4, text:'Priya Gupta confirmed her 3:30 PM slot', time:'2 hrs ago', type:'success' },
  ]

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: SBG }}>
      {/* Logo */}
      <div className={`flex items-center px-4 py-5 ${collapsed ? 'justify-center' : 'justify-between'}`}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <TrikMedLogo size="sm" dark />
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-coral)' }}>
            <Zap size={15} className="text-white" fill="white" />
          </div>
        )}
        <IconButton
          onClick={() => setCollapsed(!collapsed)}
          icon={collapsed ? ChevronRight : ChevronLeft}
          ariaLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className="hidden lg:flex on-dark"
          style={{
            width: 28,
            minWidth: 28,
            minHeight: 28,
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.72)',
            borderRadius: 'var(--radius-md)',
          }}
        />
      </div>

      {/* Clinic info pill */}
      {!collapsed && (
        <div className="mx-3 mt-4 mb-2 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[13px] font-semibold text-white/90 leading-snug" style={{ wordBreak: 'break-word' }}>{displayClinicName}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-xl animate-pulse flex-shrink-0" style={{ background: '#25D366' }} />
            <span className="text-[11px] font-medium" style={{ color: '#9DBDE8' }}>WhatsApp Active</span>
          </div>
        </div>
      )}

      {/* Nav items — filtered by role */}
      <nav aria-label="Sidebar navigation" className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <SidebarItem key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-4 rounded-lg transition-all ${collapsed ? 'justify-center' : ''}`}
          style={{ minHeight: '40px', color: '#9DBDE8' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(229,64,43,0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#9DBDE8'; e.currentTarget.style.background = 'transparent' }}
        >
          <LogOut size={16} />
          {!collapsed && <span className="text-[13.5px] font-medium">Logout</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      <a className="tm-dashboard-skip-link" href="#dashboard-main">Skip to dashboard content</a>
      <style>{`
        .tm-dashboard-skip-link {
          position: fixed;
          left: var(--space-4);
          top: var(--space-4);
          z-index: 100;
          transform: translateY(-140%);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          background: var(--color-navy);
          color: var(--color-text-inverse);
          font-size: var(--text-sm);
          font-weight: 700;
          text-decoration: none;
          box-shadow: var(--shadow-lg);
          transition: transform var(--duration-fast) var(--ease-out);
        }
        .tm-dashboard-skip-link:focus {
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .tm-dashboard-skip-link {
            transition: none;
          }
        }
      `}</style>
      {/* Desktop sidebar */}
      <Motion.aside
        animate={{ width: collapsed ? 64 : 232 }}
        transition={{ duration: reduceMotion ? 0.08 : 0.22, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col overflow-hidden flex-shrink-0"
        style={{ background: SBG }}
      >
        {renderSidebarContent()}
      </Motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.08 : 0.2 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setMobileOpen(false)}
            />
            <Motion.aside
              initial={reduceMotion ? { opacity: 0 } : { x: -250 }}
              animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { x: -250 }}
              transition={reduceMotion ? { duration: 0.08 } : { type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 bottom-0 w-[232px] z-50 lg:hidden"
              style={{ background: SBG }}
              aria-label="Mobile sidebar navigation"
            >
              {renderSidebarContent()}
            </Motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header style={{
          background: 'var(--color-surface)',
          minHeight: '64px',
          padding: '0 var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
          boxShadow: 'var(--shadow-xs)',
          flexShrink: 0,
        }}>
          {/* Left side: hamburger + page title + clinic info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', minWidth: 0 }}>
            {/* Mobile hamburger */}
            <IconButton
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              icon={Menu}
              ariaLabel="Open sidebar navigation"
              aria-haspopup="dialog"
              aria-expanded={mobileOpen}
              style={{ flexShrink: 0 }}
            />

            {/* Clinic logo icon */}
            <Avatar name={displayClinicName || displayName} size="md" shape="rounded" />

            {/* Page title + clinic name */}
            <div style={{ minWidth: 0 }}>
              <h1 style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-h4)', fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
                {pageTitle}
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayClinicName || displayName}
              </p>
            </div>
          </div>

          {/* Right side: badge + notifications + avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Role badge — hidden on small screens */}
            <Badge variant="navy" size="md" type="solid" className="hidden sm:inline-flex" style={{ letterSpacing: '0.03em' }}>
              {roleLabel.toUpperCase()}
            </Badge>

            {/* Notification bell */}
            <div style={{ position: 'relative' }}>
              <IconButton
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
                icon={BellRing}
                ariaLabel="Open notifications"
                aria-haspopup="menu"
                aria-expanded={notifOpen}
                aria-controls="dashboard-notification-menu"
                variant={notifOpen ? 'subtle' : 'ghost'}
                style={{ position: 'relative' }}
              />
              <span style={{ position: 'absolute', top: '8px', right: '8px', width: '7px', height: '7px', borderRadius: 'var(--radius-full)', background: 'var(--color-coral)', border: 'calc(var(--space-0-5) / 2) solid var(--color-surface)' }} />

              <AnimatePresence>
                {notifOpen && (
                  <Motion.div
                    id="dashboard-notification-menu"
                    role="menu"
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    style={{ position: 'fixed', right: 12, top: 72, width: '320px', maxWidth: 'calc(100vw - 24px)', overflow: 'hidden', zIndex: 50, background: 'var(--color-surface)', border: 'calc(var(--space-0-5) / 2) solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}
                  >
                    <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 'calc(var(--space-0-5) / 2) solid var(--color-border)' }}>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Notifications</span>
                      <button style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-link)', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Mark all read</button>
                    </div>
                    {notifications.map(n => (
                      <div key={n.id} role="menuitem" tabIndex={0} style={{ padding: 'var(--space-3) var(--space-4)', cursor: 'pointer', borderBottom: 'calc(var(--space-0-5) / 2) solid var(--color-border)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <p style={{ fontSize: 'var(--text-sm)', lineHeight: '1.4', color: 'var(--color-text-primary)' }}>{n.text}</p>
                        <p style={{ fontSize: 'var(--text-2xs)', marginTop: 'var(--space-1)', color: 'var(--color-text-muted)' }}>{n.time}</p>
                      </div>
                    ))}
                  </Motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
                aria-label="Open user profile menu"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-controls="dashboard-profile-menu"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', borderRadius: 'var(--radius-md)' }}
              >
                <Avatar name={displayName} size="sm" shape="rounded" />
                <ChevronDown size={13} style={{ color: 'var(--color-text-muted)' }} aria-hidden="true" />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <Motion.div
                    id="dashboard-profile-menu"
                    role="menu"
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    style={{ position: 'fixed', right: 12, top: 72, width: '224px', maxWidth: 'calc(100vw - 24px)', overflow: 'hidden', zIndex: 50, background: 'var(--color-surface)', border: 'calc(var(--space-0-5) / 2) solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}
                  >
                    <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: 'calc(var(--space-0-5) / 2) solid var(--color-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{displayName}</p>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: roleBadge.bg, color: roleBadge.color }}>
                          {roleLabel}
                        </span>
                      </div>
                      <p style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)', color: 'var(--color-text-muted)' }}>{session.email}</p>
                    </div>
                    <div style={{ padding: '8px' }}>
                      <NavLink
                        to="/dashboard/settings"
                        onClick={() => setProfileOpen(false)}
                        role="menuitem"
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <Settings size={14} /> Settings
                      </NavLink>
                      <button
                        onClick={handleLogout}
                        role="menuitem"
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--color-error-text)', border: 'none', background: 'none', cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-error-bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <LogOut size={14} /> Logout
                      </button>
                    </div>
                  </Motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {!isDashboardHome && (
          <div style={{ flexShrink: 0, minHeight: '40px', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0 var(--space-4)', background: 'var(--color-surface)', borderBottom: 'calc(var(--space-0-5) / 2) solid var(--color-border)' }}>
            <nav aria-label="Breadcrumb">
              <ol style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', listStyle: 'none', margin: 0, padding: 0 }}>
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1
                  return (
                    <li key={`${crumb.path}-${crumb.label}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {index > 0 ? <ChevronRight size={13} style={{ color: 'var(--color-text-muted)' }} aria-hidden="true" /> : null}
                      {isLast ? (
                        <span aria-current="page" style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>{crumb.label}</span>
                      ) : (
                        <NavLink to={crumb.path} style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', fontWeight: 600, textDecoration: 'none' }}>
                          {crumb.label}
                        </NavLink>
                      )}
                    </li>
                  )
                })}
              </ol>
            </nav>
          </div>
        )}

        {/* Page content */}
        <main id="dashboard-main" tabIndex={-1} className="flex-1 overflow-y-auto" style={{ background: 'var(--color-bg)' }}>
          <AnimatePresence mode="wait" initial={false}>
            <Motion.div
              key={location.pathname}
              className="tm-page-transition"
              style={{ minHeight: '100%' }}
              {...pageTransition(reduceMotion)}
            >
              {children}
            </Motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Click-outside to close dropdowns */}
      {(profileOpen || notifOpen) && (
        <div className="fixed inset-0 z-30" onClick={() => { setProfileOpen(false); setNotifOpen(false) }} />
      )}
    </div>
  )
}
