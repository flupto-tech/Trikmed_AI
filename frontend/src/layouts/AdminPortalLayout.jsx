'use client'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, NavLink } from '../utils/navigation'
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  LayoutDashboard, Building2, Users, IndianRupee, Settings, LogOut,
  Zap, ChevronLeft, ChevronRight, Menu, X, BellRing, ChevronDown,
  MapPin, Plus, ClipboardList,
  UserCog, List, Stethoscope, Pill, ClipboardCheck, Phone,
} from 'lucide-react'
import { getSession, logout, PORTAL_ROLES, } from '../utils/auth'
import { getPendingCount } from '../../lib/reviews'
import TrikMedLogo from '../components/TrikMedLogo'
import { ROLE_LABELS, ROLE_COLORS } from '../data/portalData'
import { ToastContainer } from '../components/ui/Toast'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import { IconButton } from '../components/ui/Button'
import { pageTransition } from '../components/ui/motionConfig'

const DS = {
  bg:'var(--color-bg)', sidebar:'var(--color-navy)', headerBg:'var(--color-surface)', headerBorder:'var(--color-border)',
  cardBg:'var(--color-surface)', cardBorder:'var(--color-border)', textPrimary:'var(--color-text-primary)', textMuted:'var(--color-text-muted)',
  textSubtle:'var(--color-text-muted)', accent:'var(--color-blue)', accentMid:'var(--color-blue)', accentLight:'var(--color-info-bg)',
  rowHover:'var(--color-surface-subtle)',
}

const NAV_CONFIG = {
  super: [
    { icon:LayoutDashboard, label:'Overview',     path:'/portal'            },
    { icon:Building2,       label:'All Clinics',  path:'/portal/clinics'    },
    { icon:MapPin,          label:'Zones',        path:'/portal/zones'      },
    { icon:Users,           label:'All Staff',    path:'/portal/team'       },
    { icon:UserCog,         label:'HR',           path:'/portal/hr'         },
    { icon:Phone,           label:'Demo Requests', path:'/portal/demo-requests' },
    { icon:Plus,            label:'Add Clinic',   path:'/portal/add-clinic' },
    { icon:ClipboardList,   label:'Unapproved Clinics',  path:'/portal/onboarding' },
  ],
  hr: [
    { icon:LayoutDashboard, label:'Overview',     path:'/portal'            },
    { icon:UserCog,         label:'HR Module',    path:'/portal/hr'         },
    { icon:Users,           label:'Team',         path:'/portal/team'       },
  ],
  zone: [
    { icon:LayoutDashboard, label:'Overview',     path:'/portal'            },
    { icon:MapPin,          label:'My Cities',    path:'/portal/zones'      },
    { icon:Building2,       label:'Clinics',      path:'/portal/clinics'    },
    { icon:Users,           label:'Staff',        path:'/portal/team'       },
    { icon:ClipboardList,   label:'Unapproved Clinics',  path:'/portal/onboarding' },
    { icon:Plus,            label:'Add Clinic',   path:'/portal/add-clinic' },
  ],
  city: [
    { icon:LayoutDashboard, label:'Overview',     path:'/portal'            },
    { icon:Users,           label:'My Team',      path:'/portal/team'       },
    { icon:Building2,       label:'Clinics',      path:'/portal/clinics'    },
    { icon:Plus,            label:'Add Clinic',   path:'/portal/add-clinic' },
    { icon:ClipboardList,   label:'Unapproved Clinics', path:'/portal/onboarding' },
  ],
  sales: [
    { icon:LayoutDashboard, label:'My Leads',     path:'/portal'            },
    { icon:Plus,            label:'Add Clinic',   path:'/portal/add-clinic' },
    { icon:Building2,       label:'Clinics',      path:'/portal/clinics'    },
    { icon:IndianRupee,     label:'Commission',   path:'/portal/commission'  },
  ],
  mr: [
    { icon:LayoutDashboard, label:"Today's Visits", path:'/portal'          },
    { icon:Building2,       label:'My Clinics',     path:'/portal/clinics'  },
  ],
  installer: [
    { icon:List,            label:'Install Queue',  path:'/portal'           },
    { icon:Building2,       label:'Clinics',        path:'/portal/clinics'   },
  ],
  clinic: [
    { icon:Stethoscope,    label:'OPD Console',    path:'/portal/rx/new'          },
    { icon:ClipboardCheck, label:'Reports Pending', path:'/portal/reports-pending',
      badgeKey:'reportsPending', permKey:'canViewReportsPending',
      defaultVisibleTo: ['owner','doctor_owner','doctor','receptionist'] },
    { icon:Pill,           label:'Rx History',     path:'/portal/rx/history'      },
    { icon:Settings,       label:'Settings',       path:'/portal/settings/clinic' },
  ],
}

function getActivePortalItem(navItems, pathname) {
  return [...navItems]
    .sort((a, b) => b.path.length - a.path.length)
    .find(item => item.path === '/portal'
      ? pathname === '/portal'
      : pathname === item.path || pathname.startsWith(`${item.path}/`)
    )
}

function getFallbackTitle(pathname) {
  const segment = pathname.split('/').filter(Boolean).at(-1)
  if (!segment || segment === 'portal') return 'Overview'
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function SidebarItem({ item, collapsed, badge = 0 }) {
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const isActive = item.path === '/portal'
    ? location.pathname === '/portal'
    : location.pathname.startsWith(item.path)
  const [hov, setHov] = useState(false)

  if (item.soon) {
    return (
      <div
        onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        style={{ display:'flex', alignItems:'center', gap:12, padding:collapsed?'0':'0 16px', minHeight:44, borderRadius:8, cursor:'not-allowed', opacity:0.5, position:'relative' }}>
        <item.icon size={18} strokeWidth={1.8} style={{ color:'rgba(255,255,255,0.5)', flexShrink:0 }}/>
        {!collapsed && (
          <>
            <span style={{ fontSize:13.5, fontWeight:500, color:'rgba(255,255,255,0.5)', whiteSpace:'nowrap' }}>{item.label}</span>
            <span style={{ marginLeft:'auto', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:3, background:'rgba(251,191,36,0.25)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.3)', letterSpacing:'0.04em' }}>SOON</span>
          </>
        )}
      </div>
    )
  }

  return (
    <NavLink to={item.path}
      aria-current={isActive ? 'page' : undefined}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onFocus={()=>setHov(true)} onBlur={()=>setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:12, padding:collapsed?'0 12px':'0 16px 0 13px', minHeight:44, borderRadius:8, border:'none', borderLeft:isActive ? '3px solid var(--color-coral)' : '3px solid transparent', cursor:'pointer', textDecoration:'none',
        background: isActive ? 'rgba(255,255,255,0.08)' : hov ? 'rgba(255,255,255,0.09)' : 'transparent',
        color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
        justifyContent: collapsed ? 'center' : 'flex-start',
        transition:'background 0.15s, color 0.15s', position:'relative' }}>
      <item.icon size={18} strokeWidth={isActive?2.2:1.8} style={{ flexShrink:0 }}/>
      {!collapsed && <span style={{ fontSize:13.5, fontWeight:isActive?600:500, whiteSpace:'nowrap', flex:1 }}>{item.label}</span>}
      {/* Badge — expanded sidebar */}
      {!collapsed && badge > 0 && (
        <span style={{ background:'var(--color-coral)', color:'#fff', borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:700, minWidth:18, textAlign:'center', flexShrink:0 }}>
          {badge}
        </span>
      )}
      {/* Badge dot — collapsed sidebar */}
      {collapsed && badge > 0 && (
        <span style={{ position:'absolute', top:8, right:8, width:8, height:8, borderRadius:'50%', background:'var(--color-coral)', border:'2px solid var(--color-navy)', flexShrink:0 }}/>
      )}
      <AnimatePresence>
        {collapsed && hov && (
          <Motion.div
            initial={reduceMotion ? { opacity:0, x:0 } : { opacity:0, x:-4 }}
            animate={{ opacity:1, x:0 }}
            exit={reduceMotion ? { opacity:0, x:0 } : { opacity:0, x:-4 }}
            transition={{ duration:reduceMotion ? 0.08 : 0.14 }}
            style={{ position:'absolute', left:'calc(100% + 12px)', background:DS.sidebar, border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'6px 12px', fontSize:13, fontWeight:500, color:'#fff', whiteSpace:'nowrap', zIndex:50, pointerEvents:'none', boxShadow:'0 4px 16px rgba(0,0,0,0.3)' }}>
            {item.label}{badge > 0 ? ` (${badge})` : ''}
          </Motion.div>
        )}
      </AnimatePresence>
    </NavLink>
  )
}

export default function AdminPortalLayout({ children }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const session   = getSession()
  const reduceMotion = useReducedMotion()
  const [collapsed, setCollapsed]     = useState(false)
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [notifOpen, setNotifOpen]     = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [reportsBadge,    setReportsBadge]    = useState(0)
  const [clinicRolePerms, setClinicRolePerms] = useState({})

  useEffect(() => {
    if (!session || !PORTAL_ROLES.includes(session?.role)) navigate('/login')
  }, [])

  useEffect(() => {
    if (session?.role !== 'clinic') return
    const refresh = () => {
      setReportsBadge(getPendingCount())
      try {
        const cfg = JSON.parse(localStorage.getItem('trikmed.clinic.config') || '{}')
        setClinicRolePerms(cfg.rolePerms || {})
      } catch {
        // Ignore invalid local clinic config and keep default permissions.
      }
    }
    refresh()
    const id = setInterval(refresh, 3000)
    return () => clearInterval(id)
  }, [session?.role])

  const handleLogout = () => { logout(); navigate('/') }
  const allNavItems = NAV_CONFIG[session?.role] || []
  const clinicRole  = session?.clinic_role || 'staff'

  // Filter clinic nav items by permission — other portal roles show all items
  const navItems = session?.role !== 'clinic' ? allNavItems : allNavItems.filter(item => {
    if (!item.permKey) return true
    if (clinicRole === 'owner' || clinicRole === 'doctor_owner') return true
    const saved = clinicRolePerms[clinicRole]?.[item.permKey]
    if (saved !== undefined) return saved
    return item.defaultVisibleTo ? item.defaultVisibleTo.includes(clinicRole) : true
  })

  const roleStyle = ROLE_COLORS[session?.role] || ROLE_COLORS.super
  const roleLabel = ROLE_LABELS[session?.role] || session?.role
  const initials  = (session?.name || '').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
  const activeItem = getActivePortalItem(navItems, location.pathname)
  const pageTitle = activeItem?.label || getFallbackTitle(location.pathname)
  const breadcrumbs = [
    { label:'Portal', path:'/portal' },
    ...(pageTitle === 'Overview' ? [] : [{ label:pageTitle, path:activeItem?.path || location.pathname }]),
  ]

  // JS-based mobile detection — reliable regardless of CSS compilation
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
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

  if (!session || !PORTAL_ROLES.includes(session?.role)) return null

  const renderSidebarContent = (onClose) => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:DS.sidebar }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', padding:'18px 16px', borderBottom:'1px solid rgba(255,255,255,0.08)', justifyContent:collapsed?'center':'space-between' }}>
        {!collapsed && (
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <TrikMedLogo size="sm" dark />
          </div>
        )}
        {collapsed && (
          <div style={{ width:32, height:32, borderRadius:8, background:'var(--color-coral)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Zap size={15} color="#fff" fill="#fff"/>
          </div>
        )}
        {onClose && (
          <IconButton
            onClick={onClose}
            icon={X}
            ariaLabel="Close sidebar navigation"
            className="on-dark"
            style={{ width:32, minWidth:32, minHeight:32, background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)', flexShrink:0 }}
          />
        )}
      </div>

      {/* User info */}
      {!collapsed && (
        <div style={{ margin:'10px 12px 4px', padding:'10px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Avatar name={session?.name || initials} size="sm" />
            <div style={{ minWidth:0 }}>
              <p style={{ fontSize:12, fontWeight:600, color:'#fff', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{session?.name}</p>
              <span style={{ fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:3, background:roleStyle.bg, color:roleStyle.color, border:`1px solid ${roleStyle.border}` }}>{roleLabel}</span>
            </div>
          </div>
          {(session?.city || session?.zone) && (
            <p style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:6 }}>
              {session?.city || session?.zone}
            </p>
          )}
        </div>
      )}

      {/* Nav items */}
      <nav aria-label="Sidebar navigation" style={{ flex:1, padding:'8px 12px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
        {navItems.map(item => {
          const badge = item.badgeKey === 'reportsPending' ? reportsBadge : 0
          return <SidebarItem key={item.path+item.label} item={item} collapsed={collapsed} badge={badge}/>
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding:12, borderTop:'1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={handleLogout}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:collapsed?'0':'0 16px', minHeight:40, borderRadius:8, border:'none', cursor:'pointer', background:'transparent', color:'rgba(255,255,255,0.4)', justifyContent:collapsed?'center':'flex-start', fontSize:13.5, fontWeight:500, transition:'color 0.15s, background 0.15s' }}
          onMouseEnter={e=>{ e.currentTarget.style.background='rgba(239,68,68,0.12)'; e.currentTarget.style.color='#f87171' }}
          onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.4)' }}>
          <LogOut size={16} style={{ flexShrink:0 }}/>
          {!collapsed && 'Logout'}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:DS.bg }}>
      <a className="tm-portal-skip-link" href="#portal-main">Skip to portal content</a>
      {/* Desktop sidebar — only rendered on non-mobile */}
      {!isMobile && (
        <Motion.aside animate={{ width:collapsed?56:220 }} transition={{ duration:reduceMotion ? 0.08 : 0.22, ease:'easeInOut' }}
          className="portal-sidebar"
          style={{ background:DS.sidebar, flexShrink:0, overflow:'hidden', position:'relative', display:'flex', flexDirection:'column' }}>
          {renderSidebarContent()}
          {/* Edge toggle tab */}
          <button onClick={()=>setCollapsed(c=>!c)} title={collapsed?'Expand sidebar':'Collapse sidebar'}
            aria-label={collapsed?'Expand sidebar':'Collapse sidebar'}
            aria-expanded={!collapsed}
            style={{ position:'absolute', top:'50%', right:-12, transform:'translateY(-50%)', width:24, height:48, borderRadius:'0 8px 8px 0', background:DS.sidebar, border:`1px solid rgba(255,255,255,0.12)`, borderLeft:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.5)', zIndex:10, boxShadow:'2px 0 6px rgba(0,0,0,0.15)' }}
            onMouseEnter={e=>{ e.currentTarget.style.color='#fff'; e.currentTarget.style.background='#1A5CB5' }}
            onMouseLeave={e=>{ e.currentTarget.style.color='rgba(255,255,255,0.5)'; e.currentTarget.style.background=DS.sidebar }}>
            {collapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
          </button>
        </Motion.aside>
      )}

      {/* Mobile sidebar overlay — rendered only when mobileOpen */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <>
            <Motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration: reduceMotion ? 0.08 : 0.2 }}
              style={{ position:'fixed', inset:0, zIndex:40, background:'rgba(0,0,0,0.55)' }}
              onClick={()=>setMobileOpen(false)}/>
            <Motion.aside
              initial={reduceMotion ? { opacity:0 } : { x:-260 }}
              animate={reduceMotion ? { opacity:1 } : { x:0 }}
              exit={reduceMotion ? { opacity:0 } : { x:-260 }}
              transition={reduceMotion ? { duration:0.08 } : { type:'spring', damping:28, stiffness:280 }}
              aria-label="Mobile sidebar navigation"
              style={{ position:'fixed', left:0, top:0, bottom:0, width:260, zIndex:50, background:DS.sidebar, display:'flex', flexDirection:'column' }}>
              {renderSidebarContent(()=>setMobileOpen(false))}
            </Motion.aside>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .tm-portal-skip-link {
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
        .tm-portal-skip-link:focus {
          transform: translateY(0);
        }
        @media print {
          .portal-sidebar { display: none !important; }
          .portal-header  { display: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tm-portal-skip-link {
            transition: none;
          }
        }
      `}</style>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Header */}
        <header className="portal-header" style={{ display:'flex', alignItems:'center', gap:'var(--space-2)', padding:'0 var(--space-4)', height:60, flexShrink:0, background:DS.headerBg, borderBottom:`calc(var(--space-0-5) / 2) solid ${DS.headerBorder}`, boxShadow:'var(--shadow-xs)' }}>
          {/* Hamburger — only on mobile */}
          {isMobile && (
            <IconButton
              onClick={()=>setMobileOpen(true)}
              icon={Menu}
              ariaLabel="Open sidebar navigation"
              aria-haspopup="dialog"
              aria-expanded={mobileOpen}
              style={{ flexShrink:0 }}
            />
          )}
          <IconButton
            onClick={()=>navigate('/portal')}
            icon={LayoutDashboard}
            ariaLabel="Go to portal overview"
            variant="subtle"
            style={{ flexShrink:0, border:`calc(var(--space-0-5) / 2) solid ${DS.headerBorder}` }}
          />
          <div style={{ flex:1, minWidth:0 }}>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'var(--text-h4)', lineHeight:1.2, fontWeight:700, color:DS.textPrimary, margin:0 }}>{pageTitle}</h1>
            <p style={{ fontSize:'var(--text-xs)', color:DS.textMuted, margin:'var(--space-1) 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {session?.name} · {session?.city || session?.zone || 'All Zones'}
            </p>
          </div>
          {/* Role badge — only on desktop */}
          {!isMobile && (
            <Badge size="md" type="outline" style={{ background:roleStyle.bg, color:roleStyle.color, borderColor:roleStyle.border, letterSpacing:'0.04em' }}>
              {roleLabel.toUpperCase()}
            </Badge>
          )}
          {/* Notifications */}
          <div style={{ position:'relative' }}>
            <IconButton
              onClick={()=>{ setNotifOpen(p=>!p); setProfileOpen(false) }}
              icon={BellRing}
              ariaLabel="Open notifications"
              aria-haspopup="menu"
              aria-expanded={notifOpen}
              aria-controls="portal-notification-menu"
              variant={notifOpen ? 'subtle' : 'ghost'}
              style={{ position:'relative' }}
            />
            <span style={{ position:'absolute', top:6, right:6, width:7, height:7, borderRadius:'var(--radius-full)', background:'var(--color-coral)', border:'2px solid var(--color-surface)' }}/>
            <AnimatePresence>
              {notifOpen && (
                <Motion.div id="portal-notification-menu" role="menu" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:6 }} transition={{ duration:0.12 }}
                  style={{ position:'fixed', right:12, top:68, width:280, maxWidth:'calc(100vw - 24px)', background:DS.cardBg, border:`calc(var(--space-0-5) / 2) solid ${DS.cardBorder}`, borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-lg)', zIndex:50, overflow:'hidden' }}>
                  <div style={{ padding:'10px 16px', borderBottom:`1px solid ${DS.bg}` }}>
                    <span style={{ fontSize:13, fontWeight:600, color:DS.textPrimary }}>Notifications</span>
                  </div>
                  {['New clinic onboarded — Lotus Medical, Jaipur','2 clinics inactive for 3+ days','Installation pending: MedPoint Clinic (Apr 15)'].map((txt,i)=>(
                    <div key={i} role="menuitem" tabIndex={0} style={{ padding:'10px 16px', borderBottom:`1px solid ${DS.bg}`, cursor:'pointer' }}
                      onMouseEnter={e=>e.currentTarget.style.background=DS.rowHover}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <p style={{ fontSize:13, color:DS.textPrimary, margin:0 }}>{txt}</p>
                      <p style={{ fontSize:11, color:DS.textSubtle, margin:'2px 0 0' }}>{i+1}h ago</p>
                    </div>
                  ))}
                </Motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Profile */}
          <div style={{ position:'relative' }}>
            <button onClick={()=>{ setProfileOpen(p=>!p); setNotifOpen(false) }}
              aria-label="Open user profile menu"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              aria-controls="portal-profile-menu"
              style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px 4px 4px', borderRadius:10, border:'none', background:'transparent', cursor:'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.background=DS.bg}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <Avatar name={session?.name || initials} size="sm" />
              <ChevronDown size={13} style={{ color:DS.textSubtle }} aria-hidden="true" />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <Motion.div id="portal-profile-menu" role="menu" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:6 }} transition={{ duration:0.12 }}
                  style={{ position:'fixed', right:12, top:68, width:220, maxWidth:'calc(100vw - 24px)', background:DS.cardBg, border:`calc(var(--space-0-5) / 2) solid ${DS.cardBorder}`, borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-lg)', zIndex:50, overflow:'hidden' }}>
                  <div style={{ padding:'10px 14px', borderBottom:`1px solid ${DS.bg}` }}>
                    <p style={{ fontSize:13, fontWeight:600, color:DS.textPrimary, margin:0 }}>{session?.name}</p>
                    <p style={{ fontSize:12, color:DS.textSubtle, margin:'2px 0 0' }}>{session?.email}</p>
                  </div>
                  <div style={{ padding:8 }}>
                    <button onClick={handleLogout}
                      role="menuitem"
                      style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, border:'none', background:'transparent', cursor:'pointer', fontSize:13, color:'#ef4444', fontWeight:500 }}
                      onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <LogOut size={14}/> Logout
                    </button>
                  </div>
                </Motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <div style={{ flexShrink:0, minHeight:40, display:'flex', alignItems:'center', padding:'0 var(--space-4)', background:DS.headerBg, borderBottom:`calc(var(--space-0-5) / 2) solid ${DS.headerBorder}` }}>
          <nav aria-label="Breadcrumb">
            <ol style={{ display:'flex', alignItems:'center', gap:'var(--space-2)', listStyle:'none', margin:0, padding:0 }}>
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1
                return (
                  <li key={`${crumb.path}-${crumb.label}`} style={{ display:'flex', alignItems:'center', gap:'var(--space-2)' }}>
                    {index > 0 ? <ChevronRight size={13} style={{ color:DS.textMuted }} aria-hidden="true" /> : null}
                    {isLast ? (
                      <span aria-current="page" style={{ color:DS.textPrimary, fontSize:'var(--text-xs)', fontWeight:700 }}>{crumb.label}</span>
                    ) : (
                      <NavLink to={crumb.path} style={{ color:DS.textMuted, fontSize:'var(--text-xs)', fontWeight:600, textDecoration:'none' }}>
                        {crumb.label}
                      </NavLink>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        </div>

        <main id="portal-main" tabIndex={-1} style={{ flex:1, overflowY:'auto', background:DS.bg }}>
          <AnimatePresence mode="wait" initial={false}>
            <Motion.div
              key={location.pathname}
              className="tm-page-transition"
              style={{ minHeight:'100%' }}
              {...pageTransition(reduceMotion)}
            >
              {children}
            </Motion.div>
          </AnimatePresence>
        </main>
      </div>

      {(profileOpen||notifOpen) && (
        <div style={{ position:'fixed', inset:0, zIndex:30 }} onClick={()=>{ setProfileOpen(false); setNotifOpen(false) }}/>
      )}
      <ToastContainer />
    </div>
  )
}
