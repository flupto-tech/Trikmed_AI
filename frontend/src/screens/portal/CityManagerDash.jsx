'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Building2, ClipboardList, Plus, CheckCircle, Clock, AlertTriangle, Phone, X, Target } from 'lucide-react'
import { portalStaff, portalClinics, ROLE_LABELS, ROLE_COLORS, PORTAL_HIERARCHY } from '../../data/portalData'
import DrillDownView from '../../components/portal/DrillDownView'
import { useStore, actions } from '../../store/portalStore'
import { Button, IconButton } from '../../components/ui/Button'
import { getSession } from '../../utils/auth'
import { useNavigate } from '../../utils/navigation'
import Toast from '../../components/Toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
import BackButton from '../../components/ui/BackButton'
// TODO: Ashutosh uncomment ↓
// import { portalApi } from '../../services/portalApi'

const DS = { bg:'#F7F9FF', cardBg:'#ffffff', cardBorder:'#DDE4F0', textPrimary:'#0F2D5E', textMuted:'#6B7A9A', textSubtle:'#9DBDE8', accent:'#1A5CB5', accentMid:'#1A5CB5', rowHover:'#F7F9FF', inputBorder:'#DDE4F0' }
function Card({ children, style={} }) { return <div style={{ background:DS.cardBg, border:`1px solid ${DS.cardBorder}`, borderRadius:12, ...style }}>{children}</div> }

const OB_STATUS = {
  pending_approval: { bg:'#fef3c7', color:'#92400e', label:'Pending Approval' },
  approved:         { bg:'#dbeafe', color:'#1d4ed8', label:'Approved'          },
  install_scheduled:{ bg:'#EFF6FF', color:'#1A5CB5', label:'Scheduled'         },
  rejected:         { bg:'#fee2e2', color:'#991b1b', label:'Rejected'          },
}

function AddMemberModal({ city, onClose }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('mr')
  const [done, setDone] = useState(false)
  const inp = { width:'100%', height:40, borderRadius:8, padding:'0 12px', border:`1px solid ${DS.inputBorder}`, fontSize:13, color:DS.textPrimary, outline:'none', background:'#fff', boxSizing:'border-box' }
  if (done) return (
    <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <motion.div initial={{ scale:0.85, opacity:0 }} animate={{ scale:1, opacity:1 }}
        style={{ background:'#fff', borderRadius:16, padding:36, textAlign:'center', maxWidth:360, width:'100%' }}>
        <CheckCircle size={44} style={{ color:DS.accent, margin:'0 auto 14px' }}/>
        <p style={{ fontSize:16, fontWeight:700, color:DS.textPrimary, margin:'0 0 6px' }}>Member Added!</p>
        <p style={{ fontSize:13, color:DS.textMuted, marginBottom:20 }}>{name} has been added as {ROLE_LABELS[role]} in {city}.</p>
        <Button onClick={onClose}>Done</Button>
      </motion.div>
    </div>
  )
  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} onClick={e=>e.stopPropagation()}
        style={{ background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:440 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <p style={{ fontSize:16, fontWeight:700, color:DS.textPrimary, margin:0 }}>Add Team Member</p>
          <IconButton icon={X} ariaLabel="Close" onClick={onClose} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div><label style={{ fontSize:12, fontWeight:600, color:DS.textMuted, display:'block', marginBottom:5 }}>Full Name *</label>
            <input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Rahul Gupta" onFocus={e=>e.target.style.borderColor=DS.accentMid} onBlur={e=>e.target.style.borderColor=DS.inputBorder}/></div>
          <div><label style={{ fontSize:12, fontWeight:600, color:DS.textMuted, display:'block', marginBottom:5 }}>Phone *</label>
            <input style={inp} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98765 43210" onFocus={e=>e.target.style.borderColor=DS.accentMid} onBlur={e=>e.target.style.borderColor=DS.inputBorder}/></div>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:12, fontWeight:600, color:DS.textMuted, display:'block', marginBottom:5 }}>Role *</label>
          <select style={{ ...inp, cursor:'pointer' }} value={role} onChange={e=>setRole(e.target.value)}>
            {['mr','sales','installer'].map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button fullWidth onClick={() => { if (name && phone) setDone(true) }} disabled={!name || !phone}>
            Add Member
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function CityManagerDash() {
  const session  = getSession()
  const navigate = useNavigate()
  const store    = useStore()
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError,   setPageError]   = useState(null)

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    try {
      // TODO: Ashutosh uncomment ↓
      // const res = await portalApi.getRoleDashboard('city')
      // setDashData(res)
    } catch (e) {
      setPageError(e?.message || e?.detail || 'Failed to load dashboard')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const city     = session?.city || 'Jaipur'
  const cityStaff  = portalStaff.filter(s => s.city === city && s.role !== 'city')
  const myClinics  = portalClinics.filter(c => c.city === city)
  const myOnboardings = store.onboardings.filter(o => o.city === city)
  const pending    = myOnboardings.filter(o => o.status === 'pending_approval')
  const mrList     = cityStaff.filter(s => s.role === 'mr')
  const [showAdd, setShowAdd] = useState(false)

  const activeCount  = myClinics.filter(c=>c.status==='active').length
  const totalCount   = myClinics.length
  // Target achievement — use mock 75% if no zone data
  const achievement  = 75
  const avgScore     = mrList.length ? Math.round(mrList.reduce((a, s) => a + s.performance, 0) / mrList.length) : 0
  const topPerformers = mrList.filter(s => s.performance >= 85).length
  const dealsMonth   = 8

  const stats = [
    {
      icon: Building2,
      label: 'Active Clinics in City',
      value: `${activeCount} / ${totalCount}`,
      sub: `${myClinics.filter(c=>c.status==='trial').length} on trial`,
      color: '#1A5CB5', bg: '#EFF6FF',
    },
    {
      icon: Target,
      label: 'Target Achievement',
      value: `${achievement}%`,
      sub: 'of monthly target',
      color: '#b45309', bg: '#fef3c7',
      progress: achievement,
    },
    {
      icon: Users,
      label: 'MR Performance Avg',
      value: `${avgScore}%`,
      sub: `${topPerformers} top performer${topPerformers !== 1 ? 's' : ''}`,
      color: '#065F46', bg: '#D1FAE5',
    },
    {
      icon: CheckCircle,
      label: 'Deals This Month',
      value: dealsMonth,
      sub: `${pending.length} approvals pending`,
      color: '#1d4ed8', bg: '#dbeafe',
    },
  ]

  if (pageLoading) return <LoadingSpinner message="Loading city dashboard…" />
  if (pageError)   return <ErrorBanner message={pageError} onRetry={loadData} />

  return (
    <div style={{ padding:24 }}>
      <BackButton />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:DS.textPrimary, margin:0 }}>{city} Dashboard</h1>
          <p style={{ fontSize:13, color:DS.textMuted, marginTop:4 }}>City Manager · {session?.name}</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>setShowAdd(true)}
            style={{ display:'flex', alignItems:'center', gap:6, height:38, padding:'0 14px', borderRadius:8, border:`1px solid ${DS.cardBorder}`, background:'#fff', color:DS.textPrimary, fontSize:13, fontWeight:600, cursor:'pointer' }}>
            <Users size={14}/> Add Member
          </button>
          <button onClick={()=>navigate('/portal/add-clinic')}
            style={{ display:'flex', alignItems:'center', gap:6, height:38, padding:'0 16px', borderRadius:8, border:'none', background:DS.accent, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.background='#0F2D5E'} onMouseLeave={e=>e.currentTarget.style.background=DS.accent}>
            <Plus size={15}/> Add Clinic
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:16, marginBottom:24 }}>
        {stats.map((s,i)=>(
          <motion.div key={s.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
            <Card style={{ padding:'18px 20px' }}>
              <div style={{ width:36, height:36, borderRadius:8, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                <s.icon size={17} style={{ color:s.color }}/>
              </div>
              <p style={{ fontSize:22, fontWeight:700, color:DS.textPrimary, margin:0 }}>{s.value}</p>
              <p style={{ fontSize:12, color:DS.textMuted, marginTop:2 }}>{s.label}</p>
              {s.progress != null && (
                <div style={{ height:4, borderRadius:2, background:DS.cardBorder, overflow:'hidden', margin:'8px 0 4px' }}>
                  <motion.div initial={{ width:0 }} animate={{ width:`${Math.min(100,s.progress)}%` }} transition={{ duration:0.7, ease:'easeOut' }}
                    style={{ height:'100%', borderRadius:2, background:s.color }}/>
                </div>
              )}
              <p style={{ fontSize:11, color:DS.textSubtle, marginTop:4 }}>{s.sub}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pending Approvals Alert */}
      {pending.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:10, background:'#fef3c7', border:'1px solid #fde68a', marginBottom:20, cursor:'pointer' }}
          onClick={()=>navigate('/portal/onboarding')}>
          <AlertTriangle size={16} style={{ color:'#b45309', flexShrink:0 }}/>
          <span style={{ fontSize:13, fontWeight:600, color:'#92400e' }}>
            {pending.length} clinic{pending.length>1?'s':''} waiting for your approval →
          </span>
        </div>
      )}

      {/* Team Cards */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary, margin:0 }}>My Team ({cityStaff.length})</p>
          <button onClick={()=>navigate('/portal/team')} style={{ fontSize:12, color:DS.accent, background:'none', border:'none', cursor:'pointer', fontWeight:500 }}>View All →</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
          {cityStaff.map(m=>{
            const rc = ROLE_COLORS[m.role]||ROLE_COLORS.mr
            return (
              <Card key={m.id} style={{ padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:rc.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:rc.color }}>{m.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</span>
                  </div>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:DS.textPrimary, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.name}</p>
                    <span style={{ fontSize:10, fontWeight:700, padding:'1px 5px', borderRadius:3, background:rc.bg, color:rc.color }}>{ROLE_LABELS[m.role]}</span>
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:12, color:DS.textMuted }}>{m.clinics} clinics</span>
                  <span style={{ fontSize:12, fontWeight:600, color:m.performance>=85?DS.accent:'#b45309' }}>{m.performance}%</span>
                </div>
                <div style={{ height:3, borderRadius:2, background:DS.cardBorder, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:m.performance>=85?DS.accent:'#f59e0b', width:`${m.performance}%`, borderRadius:2 }}/>
                </div>
                <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:4 }}>
                  <Phone size={11} style={{ color:DS.textSubtle }}/>
                  <span style={{ fontSize:11, color:DS.textSubtle }}>{m.phone}</span>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* ── MR Drill Down ───────────────────────────────────────────────────── */}
      <Card style={{ padding:24, marginBottom:20 }}>
        <div style={{ marginBottom:20 }}>
          <p style={{ fontSize:15, fontWeight:700, color:DS.textPrimary, margin:0 }}>My Sales Executives</p>
          <p style={{ fontSize:13, color:DS.textMuted, marginTop:4 }}>Click any MR to view their full performance dashboard</p>
        </div>
        <DrillDownView
          startLevel={2}
          data={PORTAL_HIERARCHY}
          defaultZone="North Zone"
          defaultCity={city}
        />
      </Card>

      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:16 }}>
        {/* Onboarding Queue */}
        <Card style={{ overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:`1px solid ${DS.cardBorder}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary, margin:0 }}>Onboarding Queue</p>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {pending.length > 0 && (
                <span style={{ fontSize:11, padding:'3px 8px', borderRadius:4, background:'#fef3c7', color:'#92400e', fontWeight:700, border:'1px solid #fde68a' }}>
                  {pending.length} need approval
                </span>
              )}
              <button onClick={()=>navigate('/portal/onboarding')} style={{ fontSize:12, color:DS.accent, background:'none', border:'none', cursor:'pointer', fontWeight:500 }}>View All →</button>
            </div>
          </div>
          {myOnboardings.slice(0,6).map((o,i)=>{
            const os = OB_STATUS[o.status] || OB_STATUS.pending_approval
            return (
              <div key={o.id} style={{ padding:'12px 20px', borderBottom:i<Math.min(myOnboardings.length,6)-1?`1px solid ${DS.bg}`:'none' }}
                onMouseEnter={e=>e.currentTarget.style.background=DS.rowHover}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:DS.textPrimary, margin:0 }}>{o.clinic}</p>
                    <p style={{ fontSize:12, color:DS.textMuted, margin:'2px 0' }}>{o.doctor} · {o.submittedBy}</p>
                    <p style={{ fontSize:11, color:DS.textSubtle, margin:0 }}>Install: {o.installDate}</p>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, marginLeft:12 }}>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4, background:os.bg, color:os.color }}>{os.label}</span>
                    {o.status === 'pending_approval' && (
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={()=>actions.approveOnboarding(o.id)}
                          style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:4, background:DS.accent, color:'#fff', border:'none', cursor:'pointer' }}>Approve</button>
                        <button onClick={()=>actions.rejectOnboarding(o.id)}
                          style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:4, background:'transparent', color:'#dc2626', border:'1px solid #fecaca', cursor:'pointer' }}>Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {myOnboardings.length === 0 && (
            <p style={{ padding:'24px 20px', textAlign:'center', fontSize:13, color:DS.textSubtle }}>No onboarding requests.</p>
          )}
        </Card>

        {/* MR Visit Schedule */}
        <Card style={{ overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:`1px solid ${DS.cardBorder}` }}>
            <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary, margin:0 }}>MR Visit Schedule</p>
          </div>
          {mrList.map((mr,mi)=>{
            const mrClinics = myClinics.filter(c=>c.mr===mr.name).slice(0,3)
            return (
              <div key={mr.id} style={{ padding:'10px 16px', borderBottom:mi<mrList.length-1?`1px solid ${DS.bg}`:'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', background:ROLE_COLORS.mr.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:9, fontWeight:700, color:ROLE_COLORS.mr.color }}>{mr.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</span>
                  </div>
                  <p style={{ fontSize:13, fontWeight:600, color:DS.textPrimary, margin:0 }}>{mr.name}</p>
                  <span style={{ fontSize:11, color:DS.textSubtle, marginLeft:'auto' }}>{mr.clinics} clinics</span>
                </div>
                {mrClinics.map(c=>(
                  <div key={c.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 8px', background:DS.bg, borderRadius:6, marginBottom:3 }}>
                    <span style={{ fontSize:12, color:DS.textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{c.name}</span>
                    <span style={{ fontSize:11, fontWeight:600, color:c.lastActive==='Today'?DS.accent:'#b45309', marginLeft:8, flexShrink:0 }}>{c.lastActive}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </Card>
      </div>

      <AnimatePresence>
        {showAdd && <AddMemberModal city={city} onClose={()=>setShowAdd(false)}/>}
      </AnimatePresence>
      <Toast toast={store.toast}/>
    </div>
  )
}
