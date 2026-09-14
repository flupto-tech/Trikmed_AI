'use client'
import { useState, useEffect } from 'react'
import { useNavigate, Link, NavLink } from '../utils/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Users, IndianRupee, TrendingUp, Search, LogOut,
  Zap, CheckCircle, BarChart2, ArrowUpRight, Plus, X,
  LayoutDashboard, Settings, ChevronLeft, ChevronRight,
  BellRing, ChevronDown, Menu,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { getSession, logout } from '../utils/auth'
import { adminStats, adminClinics, monthlyGrowth, cityDistribution } from '../data/mockData'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import { Button, IconButton } from '../components/ui/Button'
// TODO: Ashutosh uncomment ↓
// import { portalApi } from '../services/portalApi'

// ── Design tokens (mirror clinic dashboard) ───────────────────────────────────
const DS = {
  bg:           '#F7F9FF',
  sidebar:      '#0F2D5E',
  headerBg:     '#ffffff',
  headerBorder: '#DDE4F0',
  cardBg:       '#ffffff',
  cardBorder:   '#DDE4F0',
  textPrimary:  '#0F2D5E',
  textMuted:    '#6B7A9A',
  textSubtle:   '#9DBDE8',
  accent:       '#1A5CB5',
  accentMid:    '#1A5CB5',
  accentLight:  '#9DBDE8',
  inputBorder:  '#DDE4F0',
  rowHover:     '#F7F9FF',
}

// ── Badge styles ──────────────────────────────────────────────────────────────
const PLAN_BADGE = {
  Starter: { bg:'#dbeafe', color:'#1d4ed8', border:'#bfdbfe' },
  Growth:  { bg:'#ede9fe', color:'#6d28d9', border:'#ddd6fe' },
  Pro:     { bg:'#EFF6FF', color:'#1A5CB5', border:'#BFDBFE' },
}
const STATUS_BADGE = {
  active:   { bg:'#EFF6FF', color:'#1A5CB5', border:'#BFDBFE', label:'Active'   },
  trial:    { bg:'#fef3c7', color:'#92400e', border:'#fde68a', label:'Trial'    },
  inactive: { bg:'#f3f4f6', color:'#374151', border:'#e5e7eb', label:'Inactive' },
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:`1px solid ${DS.cardBorder}`, borderRadius:8, padding:'8px 12px', fontSize:12, boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}>
      <p style={{ color:DS.textMuted, marginBottom:4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color:p.color, fontWeight:600 }}>
          {p.name === 'revenue' ? `₹${(p.value/1000).toFixed(0)}K` : p.value} {p.name}
        </p>
      ))}
    </div>
  )
}

// ── Add Clinic modal ──────────────────────────────────────────────────────────
function AddClinicModal({ onClose }) {
  const inputCls = {
    width:'100%', height:40, borderRadius:8, padding:'0 12px',
    background:'#fff', border:`1px solid ${DS.inputBorder}`,
    fontSize:13, color:DS.textPrimary, outline:'none',
  }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'rgba(0,0,0,0.4)' }}
      onClick={onClose}>
      <motion.div initial={{ opacity:0, scale:0.96, y:16 }} animate={{ opacity:1, scale:1, y:0 }} transition={{ duration:0.18 }}
        style={{ background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:440, boxShadow:'0 16px 48px rgba(0,0,0,0.16)', border:`1px solid ${DS.cardBorder}` }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:DS.textPrimary }}>Add Clinic</h2>
          <IconButton icon={X} ariaLabel="Close" variant="ghost" onClick={onClose} />
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[
            { ph:'Clinic Name' }, { ph:'City' }, { ph:'Doctor Name' }, { ph:'WhatsApp (+91...)' },
          ].map(f => (
            <input key={f.ph} placeholder={f.ph} style={inputCls}
              onFocus={e=>{e.target.style.borderColor=DS.accentMid}} onBlur={e=>{e.target.style.borderColor=DS.inputBorder}}/>
          ))}
          <select style={{ ...inputCls, color:DS.textMuted }}>
            <option>Select Plan</option>
            <option>Starter — ₹999/mo</option>
            <option>Growth — ₹1,999/mo</option>
            <option>Pro — ₹3,999/mo</option>
          </select>
        </div>
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button fullWidth onClick={onClose}>Create Clinic</Button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Sidebar nav items ─────────────────────────────────────────────────────────
const adminNav = [
  { icon: LayoutDashboard, label: 'Overview',  section: 'overview' },
  { icon: Building2,       label: 'Clinics',   section: 'clinics'  },
  { icon: BarChart2,       label: 'Analytics', section: 'analytics'},
  { icon: Settings,        label: 'Settings',  section: 'settings' },
]

function SidebarItem({ item, active, onClick, collapsed }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        width:'100%', display:'flex', alignItems:'center', gap:12,
        padding: collapsed ? '0 0' : '0 16px',
        minHeight:44, borderRadius:8, border:'none', cursor:'pointer',
        background: active ? DS.accentMid : hov ? 'rgba(255,255,255,0.09)' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.6)',
        justifyContent: collapsed ? 'center' : 'flex-start',
        transition:'background 0.15s, color 0.15s', position:'relative',
      }}>
      <item.icon size={18} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink:0 }}/>
      {!collapsed && (
        <span style={{ fontSize:13.5, fontWeight: active ? 600 : 500, whiteSpace:'nowrap' }}>{item.label}</span>
      )}
      {collapsed && hov && (
        <div style={{ position:'absolute', left:'calc(100% + 12px)', background:DS.sidebar, border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'6px 12px', fontSize:13, fontWeight:500, color:'#fff', whiteSpace:'nowrap', zIndex:50, boxShadow:'0 4px 16px rgba(0,0,0,0.3)', pointerEvents:'none' }}>
          {item.label}
        </div>
      )}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate  = useNavigate()
  const session   = getSession()
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError,   setPageError]   = useState(null)

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    try {
      // TODO: Ashutosh uncomment ↓
      // const res = await portalApi.getOverview()
      // setOverview(res)
    } catch (e) {
      setPageError(e?.message || e?.detail || 'Failed to load admin dashboard')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const [search, setSearch]         = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [showModal, setShowModal]   = useState(false)
  const [page, setPage]             = useState(1)
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [section, setSection]       = useState('overview')
  const [notifOpen, setNotifOpen]   = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const PER_PAGE = 15

  useEffect(() => { if (!session || session.role !== 'admin') navigate('/login') }, [])
  if (!session || session.role !== 'admin') return null

  const handleLogout = () => { logout(); navigate('/') }

  const filtered = adminClinics.filter(c => {
    const q = search.toLowerCase()
    return (c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.id.includes(q))
      && (planFilter === 'all' || c.plan === planFilter)
  })
  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const mrr = adminClinics.reduce((a,c) => a + (c.status !== 'inactive' ? c.mrr : 0), 0)

  const statCards = [
    { icon:Building2,   label:'Total Clinics',       value:adminStats.totalClinics,                    sub:`+${adminStats.newClinicsThisMonth} this month`, color:'#1A5CB5', lightBg:'#EFF6FF' },
    { icon:CheckCircle, label:'Active Clinics',       value:adminStats.activeClinics,                   sub:`${adminStats.churnRate}% churn rate`,           color:'#1A5CB5', lightBg:'#EFF6FF' },
    { icon:BarChart2,   label:'Appointments / Month', value:adminStats.totalAppointments.toLocaleString(), sub:'Across all clinics',                         color:'#1d4ed8', lightBg:'#dbeafe' },
    { icon:IndianRupee, label:'MRR',                  value:`₹${(mrr/1000).toFixed(0)}K`,              sub:'Monthly recurring revenue',                     color:'#b45309', lightBg:'#fef3c7' },
  ]

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:DS.sidebar }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', padding:'20px 16px', borderBottom:'1px solid rgba(255,255,255,0.08)', justifyContent: collapsed ? 'center' : 'space-between' }}>
        {!collapsed && (
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#1A5CB5,#1A5CB5)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Zap size={15} color="#fff" fill="#fff"/>
            </div>
            <div>
              <span style={{ fontSize:15, fontWeight:700, color:'#fff' }}>Trik<span style={{ color:DS.accentLight }}>Med</span></span>
              <p style={{ fontSize:10, color:'rgba(255,255,255,0.35)', lineHeight:1, marginTop:2 }}>Admin Console</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#1A5CB5,#1A5CB5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Zap size={15} color="#fff" fill="#fff"/>
          </div>
        )}
        <button onClick={()=>setCollapsed(c=>!c)}
          className="hidden lg:flex"
          style={{ width:24, height:24, borderRadius:6, background:'rgba(255,255,255,0.06)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.35)' }}>
          {collapsed ? <ChevronRight size={13}/> : <ChevronLeft size={13}/>}
        </button>
      </div>

      {/* Admin tag */}
      {!collapsed && (
        <div style={{ margin:'12px 12px 4px', padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#fbbf24', letterSpacing:'0.04em' }}>ADMIN ACCESS</p>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{session.email}</p>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex:1, padding:'8px 12px', display:'flex', flexDirection:'column', gap:4, overflowY:'auto' }}>
        {adminNav.map(item => (
          <SidebarItem key={item.section} item={item} active={section===item.section}
            onClick={()=>{ setSection(item.section); setMobileOpen(false) }} collapsed={collapsed}/>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding:12, borderTop:'1px solid rgba(255,255,255,0.08)' }}>
        {!collapsed && (
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:8, marginBottom:4, fontSize:12, color:'rgba(255,255,255,0.45)', textDecoration:'none', transition:'color 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.color='rgba(255,255,255,0.8)'}
            onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.45)'}>
            ← Back to Landing
          </Link>
        )}
        <button onClick={handleLogout}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding: collapsed?'0':'0 16px', minHeight:40, borderRadius:8, border:'none', cursor:'pointer', background:'transparent', color:'rgba(255,255,255,0.4)', justifyContent: collapsed?'center':'flex-start', fontSize:13.5, fontWeight:500, transition:'color 0.15s, background 0.15s' }}
          onMouseEnter={e=>{ e.currentTarget.style.background='rgba(239,68,68,0.12)'; e.currentTarget.style.color='#f87171' }}
          onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.4)' }}>
          <LogOut size={16} style={{ flexShrink:0 }}/>
          {!collapsed && 'Logout'}
        </button>
      </div>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  if (pageLoading) return <LoadingSpinner message="Loading admin dashboard…" />
  if (pageError)   return <ErrorBanner message={pageError} onRetry={loadData} />

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:DS.bg }}>

      {/* Desktop sidebar */}
      <motion.aside animate={{ width: collapsed ? 64 : 232 }} transition={{ duration:0.22, ease:'easeInOut' }}
        className="hidden lg:flex flex-col overflow-hidden flex-shrink-0"
        style={{ background:DS.sidebar }}>
        <SidebarContent/>
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ position:'fixed', inset:0, zIndex:40, background:'rgba(0,0,0,0.5)' }}
              onClick={()=>setMobileOpen(false)}/>
            <motion.aside initial={{ x:-250 }} animate={{ x:0 }} exit={{ x:-250 }}
              transition={{ type:'spring', damping:28, stiffness:280 }}
              style={{ position:'fixed', left:0, top:0, bottom:0, width:232, zIndex:50, background:DS.sidebar }}
              className="lg:hidden">
              <SidebarContent/>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <header style={{ display:'flex', alignItems:'center', gap:16, padding:'0 24px', height:64, flexShrink:0, background:DS.headerBg, borderBottom:`1px solid ${DS.headerBorder}`, boxShadow:'0 1px 8px rgba(0,0,0,0.06)' }}>
          <button className="lg:hidden" onClick={()=>setMobileOpen(true)}
            style={{ padding:6, borderRadius:8, border:'none', background:'transparent', cursor:'pointer', color:DS.textMuted }}>
            <Menu size={20}/>
          </button>

          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary }}>TrikMed Admin Console</p>
            <p style={{ fontSize:12, color:DS.textMuted }}>Manage all clinics · {session.email}</p>
          </div>

          {/* Admin badge */}
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:6, background:'#fef3c7', border:'1px solid #fde68a' }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#92400e', letterSpacing:'0.04em' }}>ADMIN</span>
          </div>

          {/* Notification */}
          <div style={{ position:'relative' }}>
            <button onClick={()=>{ setNotifOpen(p=>!p); setProfileOpen(false) }}
              style={{ width:36, height:36, borderRadius:10, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:notifOpen?DS.bg:'transparent', color:DS.textMuted, position:'relative' }}
              onMouseEnter={e=>e.currentTarget.style.background=DS.bg}
              onMouseLeave={e=>e.currentTarget.style.background=notifOpen?DS.bg:'transparent'}>
              <BellRing size={18}/>
              <span style={{ position:'absolute', top:6, right:6, width:7, height:7, borderRadius:'50%', background:'#e05a2b', border:'2px solid #fff' }}/>
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div initial={{ opacity:0, y:6, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:6, scale:0.97 }}
                  transition={{ duration:0.12 }}
                  style={{ position:'absolute', right:0, top:48, width:300, background:'#fff', border:`1px solid ${DS.cardBorder}`, borderRadius:12, boxShadow:'0 4px 24px rgba(0,0,0,0.12)', zIndex:50, overflow:'hidden' }}>
                  <div style={{ padding:'10px 16px', borderBottom:`1px solid ${DS.bg}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:13, fontWeight:600, color:DS.textPrimary }}>Notifications</span>
                    <Button size="sm" variant="ghost" className="text-xs">Mark all read</Button>
                  </div>
                  {[
                    'New clinic signup — MediCare Jaipur',
                    '3 clinics upgraded to Pro plan',
                    'Monthly report ready for download',
                  ].map((txt,i) => (
                    <div key={i} style={{ padding:'10px 16px', borderBottom:`1px solid ${DS.bg}`, cursor:'pointer' }}
                      onMouseEnter={e=>e.currentTarget.style.background=DS.rowHover}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <p style={{ fontSize:13, color:DS.textPrimary }}>{txt}</p>
                      <p style={{ fontSize:11, color:DS.textSubtle, marginTop:2 }}>{i+1}h ago</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div style={{ position:'relative' }}>
            <button onClick={()=>{ setProfileOpen(p=>!p); setNotifOpen(false) }}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 8px 4px 4px', borderRadius:10, border:'none', background:'transparent', cursor:'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.background=DS.bg}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:DS.accent, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>
                AD
              </div>
              <ChevronDown size={13} style={{ color:DS.textSubtle }}/>
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div initial={{ opacity:0, y:6, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:6, scale:0.97 }}
                  transition={{ duration:0.12 }}
                  style={{ position:'absolute', right:0, top:48, width:200, background:'#fff', border:`1px solid ${DS.cardBorder}`, borderRadius:12, boxShadow:'0 4px 24px rgba(0,0,0,0.12)', zIndex:50, overflow:'hidden' }}>
                  <div style={{ padding:'10px 14px', borderBottom:`1px solid ${DS.bg}` }}>
                    <p style={{ fontSize:13, fontWeight:600, color:DS.textPrimary }}>Admin</p>
                    <p style={{ fontSize:12, color:DS.textSubtle, marginTop:1 }}>{session.email}</p>
                  </div>
                  <div style={{ padding:8 }}>
                    <button onClick={handleLogout}
                      style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, border:'none', background:'transparent', cursor:'pointer', fontSize:13, color:'#ef4444', fontWeight:500 }}
                      onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <LogOut size={14}/> Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflowY:'auto', background:DS.bg, padding:24 }}>

          {/* Page title + action */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
            <div>
              <h1 style={{ fontSize:20, fontWeight:700, color:DS.textPrimary, margin:0 }}>
                { section==='overview' ? 'Overview' : section==='clinics' ? 'All Clinics' : section==='analytics' ? 'Analytics' : 'Settings' }
              </h1>
              <p style={{ fontSize:13, color:DS.textMuted, marginTop:2 }}>
                { section==='overview' ? `${adminStats.totalClinics} clinics · ${adminStats.activeClinics} active` : `${filtered.length} clinics found` }
              </p>
            </div>
            <Button icon={Plus} onClick={() => setShowModal(true)}>Add Clinic</Button>
          </div>

          {/* ── OVERVIEW section ─────────────────────────────────────────── */}
          {(section==='overview' || section==='analytics') && (
            <>
              {/* Stat cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:24 }}>
                {statCards.map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                    style={{ background:DS.cardBg, border:`1px solid ${DS.cardBorder}`, borderRadius:12, padding:'18px 20px' }}>
                    <div style={{ width:36, height:36, borderRadius:8, background:s.lightBg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                      <s.icon size={17} style={{ color:s.color }}/>
                    </div>
                    <p style={{ fontSize:22, fontWeight:700, color:DS.textPrimary, margin:0 }}>{s.value}</p>
                    <p style={{ fontSize:12, color:DS.textMuted, marginTop:2 }}>{s.label}</p>
                    <p style={{ fontSize:11, color:DS.textSubtle, marginTop:4 }}>{s.sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* Charts */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16, marginBottom:24 }}>
                {/* Growth line chart */}
                <div style={{ background:DS.cardBg, border:`1px solid ${DS.cardBorder}`, borderRadius:12, padding:20 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                    <div>
                      <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary, margin:0 }}>Platform Growth</p>
                      <p style={{ fontSize:12, color:DS.textMuted, marginTop:2 }}>Clinics & appointments over time</p>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, background:'#EFF6FF', border:'1px solid #BFDBFE' }}>
                      <TrendingUp size={12} style={{ color:'#1A5CB5' }}/>
                      <span style={{ fontSize:11, fontWeight:600, color:'#1A5CB5' }}>+{Math.round(((127-82)/82)*100)}%</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={190}>
                    <LineChart data={monthlyGrowth} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={DS.cardBorder} />
                      <XAxis dataKey="month" tick={{ fill:DS.textSubtle, fontSize:11 }} axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fill:DS.textSubtle, fontSize:11 }} axisLine={false} tickLine={false}/>
                      <Tooltip content={<ChartTooltip/>}/>
                      <Line type="monotone" dataKey="clinics" stroke={DS.accent} strokeWidth={2} dot={{ fill:DS.accent, r:3 }} name="clinics"/>
                      <Line type="monotone" dataKey="appointments" stroke="#1A5CB5" strokeWidth={2} dot={{ fill:'#1A5CB5', r:3 }} name="appointments"/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* City bar chart */}
                <div style={{ background:DS.cardBg, border:`1px solid ${DS.cardBorder}`, borderRadius:12, padding:20 }}>
                  <div style={{ marginBottom:16 }}>
                    <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary, margin:0 }}>Clinics by City</p>
                    <p style={{ fontSize:12, color:DS.textMuted, marginTop:2 }}>Top 8 cities</p>
                  </div>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={cityDistribution} margin={{ top:4, right:4, left:-20, bottom:20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={DS.cardBorder} vertical={false}/>
                      <XAxis dataKey="city" tick={{ fill:DS.textSubtle, fontSize:10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end"/>
                      <YAxis tick={{ fill:DS.textSubtle, fontSize:11 }} axisLine={false} tickLine={false}/>
                      <Tooltip content={<ChartTooltip/>}/>
                      <Bar dataKey="clinics" fill={DS.accentMid} radius={[4,4,0,0]} name="clinics"/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Plan distribution */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
                {[
                  { plan:'Starter', count:adminClinics.filter(c=>c.plan==='Starter').length, color:'#1d4ed8', bg:'#dbeafe', price:'₹999'   },
                  { plan:'Growth',  count:adminClinics.filter(c=>c.plan==='Growth').length,  color:'#6d28d9', bg:'#ede9fe', price:'₹1,999' },
                  { plan:'Pro',     count:adminClinics.filter(c=>c.plan==='Pro').length,     color:'#1A5CB5', bg:'#EFF6FF', price:'₹3,999' },
                ].map(p => (
                  <div key={p.plan} style={{ background:DS.cardBg, border:`1px solid ${DS.cardBorder}`, borderRadius:12, padding:16, textAlign:'center' }}>
                    <p style={{ fontSize:24, fontWeight:700, color:DS.textPrimary, margin:0 }}>{p.count}</p>
                    <span style={{ display:'inline-block', marginTop:6, padding:'2px 10px', borderRadius:4, background:p.bg, color:p.color, fontSize:11, fontWeight:600, border:`1px solid ${PLAN_BADGE[p.plan].border}` }}>
                      {p.plan}
                    </span>
                    <p style={{ fontSize:11, color:DS.textSubtle, marginTop:6 }}>{p.price}/mo each</p>
                    <p style={{ fontSize:11, color:DS.textMuted, marginTop:2, fontWeight:500 }}>
                      MRR: ₹{(p.count * parseInt(p.price.replace(/[^0-9]/g,'')) / 1000).toFixed(0)}K
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── CLINICS TABLE section ────────────────────────────────────── */}
          {(section==='overview' || section==='clinics') && (
            <div style={{ background:DS.cardBg, border:`1px solid ${DS.cardBorder}`, borderRadius:12, overflow:'hidden' }}>
              {/* Table toolbar */}
              <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:12, padding:'14px 20px', borderBottom:`1px solid ${DS.cardBorder}` }}>
                {/* Search */}
                <div style={{ position:'relative', flex:1, minWidth:200 }}>
                  <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:DS.textSubtle }}/>
                  <input type="text" placeholder="Search clinics, city, ID…" value={search}
                    onChange={e=>{ setSearch(e.target.value); setPage(1) }}
                    style={{ width:'100%', height:36, borderRadius:8, padding:'0 12px 0 32px', border:`1px solid ${DS.inputBorder}`, background:'#fff', fontSize:13, color:DS.textPrimary, outline:'none' }}
                    onFocus={e=>e.target.style.borderColor=DS.accentMid}
                    onBlur={e=>e.target.style.borderColor=DS.inputBorder}/>
                </div>
                {/* Plan filter */}
                <select value={planFilter} onChange={e=>{ setPlanFilter(e.target.value); setPage(1) }}
                  style={{ height:36, borderRadius:8, padding:'0 10px', border:`1px solid ${DS.inputBorder}`, background:'#fff', fontSize:13, color:DS.textPrimary, outline:'none', cursor:'pointer' }}>
                  <option value="all">All Plans</option>
                  <option value="Starter">Starter</option>
                  <option value="Growth">Growth</option>
                  <option value="Pro">Pro</option>
                </select>
                <span style={{ fontSize:12, color:DS.textMuted }}>{filtered.length} clinics</span>
              </div>

              {/* Column headers */}
              <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 90px 80px 70px 90px', gap:12, padding:'10px 20px', background:DS.bg, borderBottom:`1px solid ${DS.cardBorder}` }}>
                {['ID','Clinic','Plan','Status','Appts','Joined'].map(h => (
                  <span key={h} style={{ fontSize:11, fontWeight:600, color:DS.textMuted, textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              {paginated.map((c, i) => {
                const sb = STATUS_BADGE[c.status] || STATUS_BADGE.inactive
                const pb = PLAN_BADGE[c.plan]     || PLAN_BADGE.Starter
                return (
                  <motion.div key={c.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.02 }}
                    style={{ display:'grid', gridTemplateColumns:'80px 1fr 90px 80px 70px 90px', gap:12, alignItems:'center', padding:'12px 20px', borderBottom:i<paginated.length-1?`1px solid ${DS.bg}`:'none', cursor:'default' }}
                    onMouseEnter={e=>e.currentTarget.style.background=DS.rowHover}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <span style={{ fontSize:11, color:DS.textSubtle, fontFamily:'monospace' }}>{c.id}</span>
                    <div>
                      <p style={{ fontSize:13, fontWeight:500, color:DS.textPrimary, margin:0 }}>{c.name}</p>
                      <p style={{ fontSize:11, color:DS.textMuted, marginTop:1 }}>{c.city} · {c.doctors} dr{c.doctors>1?'s':''}</p>
                    </div>
                    <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600, background:pb.bg, color:pb.color, border:`1px solid ${pb.border}` }}>{c.plan}</span>
                    <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600, background:sb.bg, color:sb.color, border:`1px solid ${sb.border}` }}>{sb.label}</span>
                    <span style={{ fontSize:12, color:DS.textMuted }}>{c.appointments}</span>
                    <span style={{ fontSize:11, color:DS.textSubtle }}>{c.joinDate}</span>
                  </motion.div>
                )
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:`1px solid ${DS.cardBorder}` }}>
                  <span style={{ fontSize:12, color:DS.textMuted }}>Page {page} of {totalPages} · {filtered.length} total</span>
                  <div className="flex gap-3">
                    <Button size="sm" variant="secondary" disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>← Prev</Button>
                    <Button size="sm" variant="secondary" disabled={page===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next →</Button>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Click-outside to close dropdowns */}
      {(profileOpen||notifOpen) && (
        <div style={{ position:'fixed', inset:0, zIndex:30 }} onClick={()=>{ setProfileOpen(false); setNotifOpen(false) }}/>
      )}

      {showModal && <AddClinicModal onClose={()=>setShowModal(false)}/>}
    </div>
  )
}