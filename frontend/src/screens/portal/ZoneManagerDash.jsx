'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, TrendingUp, Users, Target, MapPin, AlertTriangle, CheckCircle } from 'lucide-react'
import { zones, cities, portalStaff, ROLE_LABELS, ROLE_COLORS, PORTAL_HIERARCHY } from '../../data/portalData'
import DrillDownView from '../../components/portal/DrillDownView'
import { getSession } from '../../utils/auth'
import { useNavigate } from '../../utils/navigation'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
// TODO: Ashutosh uncomment ↓
// import { portalApi } from '../../services/portalApi'

const DS = { bg:'#F7F9FF', cardBg:'#ffffff', cardBorder:'#DDE4F0', textPrimary:'#0F2D5E', textMuted:'#6B7A9A', textSubtle:'#9DBDE8', accent:'#1A5CB5', rowHover:'#F7F9FF' }
function Card({ children, style={} }) { return <div style={{ background:DS.cardBg, border:`1px solid ${DS.cardBorder}`, borderRadius:12, ...style }}>{children}</div> }

export default function ZoneManagerDash() {
  const session = getSession()
  const navigate = useNavigate()
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError,   setPageError]   = useState(null)

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    try {
      // TODO: Ashutosh uncomment ↓
      // const res = await portalApi.getRoleDashboard('zone')
      // setDashData(res)
    } catch (e) {
      setPageError(e?.message || e?.detail || 'Failed to load dashboard')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const zone    = zones.find(z => z.name === session?.zone) || zones[0]
  const myCities = cities.filter(c => c.zone === zone.id)
  const myStaff  = portalStaff.filter(s => s.zone === zone.name && s.role !== 'zone')
  const pendingTotal = myCities.reduce((a, c) => a + c.pending, 0)
  const achievement  = Math.round((zone.mrr / zone.target) * 100)

  const totalActive  = myCities.reduce((a, c) => a + c.active, 0)
  const totalAll     = myCities.reduce((a, c) => a + c.active + c.trial + c.churned, 0)
  const dealsMonth   = 14
  const dealsLast    = 11
  const topPerformers = myStaff.filter(s => s.performance >= 85).length
  const salesExecs   = myStaff.filter(s => s.role === 'mr' || s.role === 'sales').length

  const stats = [
    {
      icon: Building2,
      label: 'Active Clinics in Zone',
      value: `${totalActive} / ${totalAll}`,
      sub: `${Math.round((totalActive/Math.max(totalAll,1))*100)}% activation rate`,
      color: '#1A5CB5', bg: '#EFF6FF',
    },
    {
      icon: Target,
      label: 'Target Achievement',
      value: `${achievement}%`,
      sub: `+${zone.growth}% growth MoM`,
      color: '#b45309', bg: '#fef3c7',
      progress: achievement,
    },
    {
      icon: CheckCircle,
      label: 'Deals This Month',
      value: dealsMonth,
      sub: `vs ${dealsLast} last month (+${Math.round(((dealsMonth-dealsLast)/dealsLast)*100)}%)`,
      color: '#065F46', bg: '#D1FAE5',
    },
    {
      icon: Users,
      label: 'Sales Executives',
      value: salesExecs,
      sub: `${topPerformers} top performers this month`,
      color: '#1A5CB5', bg: '#EFF6FF',
    },
  ]

  if (pageLoading) return <LoadingSpinner message="Loading zone dashboard…" />
  if (pageError)   return <ErrorBanner message={pageError} onRetry={loadData} />

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:700, color:DS.textPrimary, margin:0 }}>{zone.name} Dashboard</h1>
        <p style={{ fontSize:13, color:DS.textMuted, marginTop:4 }}>Zone Manager · {session?.name}</p>
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

      {/* Alert */}
      {pendingTotal > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:10, background:'#fef3c7', border:'1px solid #fde68a', marginBottom:20 }}>
          <AlertTriangle size={16} style={{ color:'#b45309', flexShrink:0 }}/>
          <span style={{ fontSize:13, fontWeight:500, color:'#92400e' }}>
            {pendingTotal} pending installations across {myCities.length} cities. Follow up with city managers.
          </span>
        </div>
      )}

      {/* Cities table */}
      <Card style={{ marginBottom:24, overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:`1px solid ${DS.cardBorder}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary, margin:0 }}>Cities Performance</p>
          <span style={{ fontSize:12, color:DS.textSubtle }}>{myCities.length} cities</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 60px 60px 70px 80px 80px', gap:10, padding:'10px 20px', background:DS.bg }}>
          {['City','Manager','Active','Trial','Churned','Target %','Pending'].map(h=>(
            <span key={h} style={{ fontSize:10, fontWeight:600, color:DS.textMuted, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</span>
          ))}
        </div>
        {myCities.map((c,i)=>{
          const pct = Math.round((c.mrr/c.target)*100)
          return (
            <div key={c.id} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 60px 60px 70px 80px 80px', gap:10, alignItems:'center', padding:'11px 20px', borderBottom:i<myCities.length-1?`1px solid ${DS.bg}`:'none', cursor:'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.background=DS.rowHover}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div>
                <span style={{ fontSize:13, fontWeight:600, color:DS.textPrimary }}>{c.name}</span>
              </div>
              <span style={{ fontSize:12, color:DS.textMuted }}>{c.manager}</span>
              <span style={{ fontSize:13, fontWeight:500, color:'#1A5CB5' }}>{c.active}</span>
              <span style={{ fontSize:13, fontWeight:500, color:'#92400e' }}>{c.trial}</span>
              <span style={{ fontSize:13, color:'#6b7280' }}>{c.churned}</span>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ flex:1, height:4, borderRadius:2, background:DS.cardBorder, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:2, background:pct>=80?DS.accent:'#f59e0b', width:`${Math.min(100,pct)}%` }}/>
                </div>
                <span style={{ fontSize:10, fontWeight:600, color:pct>=80?DS.accent:'#b45309' }}>{pct}%</span>
              </div>
              <span style={{ fontSize:12, color:c.pending>0?'#b45309':DS.textSubtle, fontWeight:c.pending>0?600:400 }}>
                {c.pending>0 ? `${c.pending} pending` : '—'}
              </span>
            </div>
          )
        })}
      </Card>

      {/* City Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16, marginBottom:24 }}>
        {myCities.map(c=>{
          const cityStaff = myStaff.filter(s=>s.city===c.name)
          const pct = Math.round((c.mrr/c.target)*100)
          return (
            <Card key={c.id} style={{ padding:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <p style={{ fontSize:15, fontWeight:700, color:DS.textPrimary, margin:0 }}>{c.name}</p>
                  <p style={{ fontSize:12, color:DS.textMuted, margin:'2px 0 0' }}>CM: {c.manager}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontSize:14, fontWeight:700, color:DS.accent, margin:0 }}>₹{(c.mrr/1000).toFixed(0)}K</p>
                  <p style={{ fontSize:11, color:DS.textSubtle, margin:0 }}>{pct}% of target</p>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                {[['Active', c.active, '#1A5CB5'], ['Trial', c.trial, '#f59e0b'], ['Pending', c.pending, '#6366f1']].map(([l,v,col])=>(
                  <div key={l} style={{ textAlign:'center', padding:'8px 4px', background:DS.bg, borderRadius:6 }}>
                    <p style={{ fontSize:16, fontWeight:700, color:col, margin:0 }}>{v}</p>
                    <p style={{ fontSize:10, color:DS.textMuted, margin:'1px 0 0' }}>{l}</p>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize:11, fontWeight:600, color:DS.textMuted, margin:'0 0 6px' }}>TEAM ({cityStaff.length})</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {cityStaff.map(s=>{
                    const rc = ROLE_COLORS[s.role]||ROLE_COLORS.mr
                    return (
                      <span key={s.id} style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:rc.bg, color:rc.color, fontWeight:600 }}>
                        {s.name.split(' ')[0]} · {ROLE_LABELS[s.role]}
                      </span>
                    )
                  })}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* ── Drill Down ──────────────────────────────────────────────────────── */}
      <Card style={{ padding:24, marginBottom:24 }}>
        <div style={{ marginBottom:20 }}>
          <p style={{ fontSize:15, fontWeight:700, color:DS.textPrimary, margin:0 }}>City → MR Drill Down</p>
          <p style={{ fontSize:13, color:DS.textMuted, marginTop:4 }}>Click a city to view MR performance in detail</p>
        </div>
        <DrillDownView
          startLevel={1}
          data={PORTAL_HIERARCHY}
          defaultZone={zone?.name}
        />
      </Card>

      {/* Staff Table */}
      <Card style={{ overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:`1px solid ${DS.cardBorder}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary, margin:0 }}>Zone Staff ({myStaff.length})</p>
          <button onClick={()=>navigate('/portal/team')} style={{ fontSize:12, color:DS.accent, background:'none', border:'none', cursor:'pointer', fontWeight:500 }}>View All →</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 90px 70px 90px', gap:12, padding:'10px 20px', background:DS.bg }}>
          {['Name','Role','City','Clinics','Performance'].map(h=>(
            <span key={h} style={{ fontSize:10, fontWeight:600, color:DS.textMuted, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</span>
          ))}
        </div>
        {myStaff.map((s,i)=>{
          const rc = ROLE_COLORS[s.role]||ROLE_COLORS.mr
          return (
            <div key={s.id} style={{ display:'grid', gridTemplateColumns:'1fr 100px 90px 70px 90px', gap:12, alignItems:'center', padding:'10px 20px', borderBottom:i<myStaff.length-1?`1px solid ${DS.bg}`:'none' }}
              onMouseEnter={e=>e.currentTarget.style.background=DS.rowHover}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:rc.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:9, fontWeight:700, color:rc.color }}>{s.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</span>
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:500, color:DS.textPrimary, margin:0 }}>{s.name}</p>
                  <p style={{ fontSize:11, color:DS.textSubtle, margin:0 }}>{s.phone}</p>
                </div>
              </div>
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4, background:rc.bg, color:rc.color }}>{ROLE_LABELS[s.role]||s.role}</span>
              <span style={{ fontSize:12, color:DS.textMuted }}>{s.city||'—'}</span>
              <span style={{ fontSize:13, color:DS.textPrimary }}>{s.clinics}</span>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ flex:1, height:4, borderRadius:2, background:DS.cardBorder, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:2, background:s.performance>=85?DS.accent:'#f59e0b', width:`${s.performance}%` }}/>
                </div>
                <span style={{ fontSize:11, fontWeight:600, color:s.performance>=85?DS.accent:'#b45309', minWidth:24 }}>{s.performance}</span>
              </div>
            </div>
          )
        })}
      </Card>
    </div>
  )
}
