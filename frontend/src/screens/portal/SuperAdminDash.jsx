'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, CheckCircle, IndianRupee, TrendingUp, Users, Activity, Zap, MapPin, Target, BarChart2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { superAdminStats, zones, portalStaff, ROLE_LABELS, ROLE_COLORS, PORTAL_HIERARCHY } from '../../data/portalData'
import DrillDownView from '../../components/portal/DrillDownView'
import { monthlyGrowth as chartData } from '../../data/mockData'
import { getSession } from '../../utils/auth'
import { portalCan } from '../../config/roles'
import { useNavigate } from '../../utils/navigation'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { Button, FilterChip, FilterChipGroup } from '../../components/ui/Button'
import BackButton from '../../components/ui/BackButton'
// TODO: Ashutosh uncomment ↓
// import { portalApi } from '../../services/portalApi'

const DS = { bg:'#F7F9FF', cardBg:'#ffffff', cardBorder:'#DDE4F0', textPrimary:'#0F2D5E', textMuted:'#6B7A9A', textSubtle:'#9DBDE8', accent:'#1A5CB5', accentMid:'#1A5CB5', rowHover:'#F7F9FF' }
function Card({ children, style={} }) { return <div style={{ background:DS.cardBg, border:`1px solid ${DS.cardBorder}`, borderRadius:12, ...style }}>{children}</div> }
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:`1px solid ${DS.cardBorder}`, borderRadius:8, padding:'8px 12px', fontSize:12 }}>
      <p style={{ color:DS.textMuted, marginBottom:4 }}>{label}</p>
      {payload.map(p=><p key={p.name} style={{ color:p.color, fontWeight:600, margin:0 }}>{p.value} {p.name}</p>)}
    </div>
  )
}

// ── Financial KPIs (super_admin only) ────────────────────────────────────────
const REVENUE_MTD    = 134000
const MRR            = 134000
const ACTIVE_CLINICS = 68
const TOTAL_CLINICS  = 80
const AVG_PER_CLINIC = Math.round(MRR / ACTIVE_CLINICS)

const financeCards = [
  { icon:IndianRupee, label:'Total Revenue · April 2026', value:'₹1,34,000',      sub:'+18% vs last month',        color:'#fff',    bg:'#0F2D5E', textColor:'#fff', subColor:'rgba(255,255,255,0.7)' },
  { icon:Building2,   label:'Total Active Clinics',        value:`${ACTIVE_CLINICS} / ${TOTAL_CLINICS}`, sub:'+5 this week',  color:'#1A5CB5', bg:'#EFF6FF', textColor:'#0F2D5E', subColor:'#6B7A9A' },
  { icon:TrendingUp,  label:'Monthly Recurring Revenue',   value:'₹1,34,000 MRR',  sub:'Annualized: ₹16,08,000',    color:'#b45309', bg:'#fef3c7', textColor:'#0F2D5E', subColor:'#6B7A9A' },
  { icon:BarChart2,   label:'Avg Revenue Per Clinic',       value:`₹${AVG_PER_CLINIC.toLocaleString()}/clinic`, sub:'+5% vs last month', color:'#065F46', bg:'#D1FAE5', textColor:'#0F2D5E', subColor:'#6B7A9A' },
]

const opsCards = [
  { icon:MapPin,      label:'Total Zones',               value:superAdminStats.totalZones,  sub:'North & South',          color:'#1A5CB5', bg:'#EFF6FF' },
  { icon:Building2,   label:'Total Cities',              value:superAdminStats.totalCities, sub:'Active territories',      color:'#1d4ed8', bg:'#dbeafe' },
  { icon:Users,       label:'Sales Executives',          value:portalStaff.filter(s=>s.role==='mr'||s.role==='sales').length, sub:'All zones', color:'#b45309', bg:'#fef3c7' },
  { icon:CheckCircle, label:'Deals Closed This Month',   value:14,                          sub:'+3 vs last month',        color:'#065F46', bg:'#D1FAE5' },
]

const staffByRole = Object.entries(
  portalStaff.reduce((acc, s) => { acc[s.role] = (acc[s.role]||0)+1; return acc }, {})
)

export default function SuperAdminDash() {
  const navigate = useNavigate()
  const session  = getSession()
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError,   setPageError]   = useState(null)

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    try {
      // TODO: Ashutosh uncomment ↓
      // const res = await portalApi.getRoleDashboard('super')
      // setDashData(res)
    } catch (e) {
      setPageError(e?.message || e?.detail || 'Failed to load dashboard')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id:'overview',  label:'Overview'      },
    { id:'drilldown', label:'🔍 Drill Down'  },
    { id:'staff',     label:'All Staff'     },
    { id:'zones',     label:'Zones Detail'  },
  ]

  if (pageLoading) return <LoadingSpinner message="Loading super admin dashboard…" />
  if (pageError)   return <ErrorBanner message={pageError} onRetry={loadData} />

  return (
    <div style={{ padding:24 }}>
      <BackButton />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:DS.textPrimary, margin:0 }}>Platform Overview</h1>
          <p style={{ fontSize:13, color:DS.textMuted, marginTop:4 }}>Vikram Mehta · Super Admin · All Zones</p>
        </div>
        <Button icon={null} onClick={() => navigate('/portal/add-clinic')}>+ Add Clinic</Button>
      </div>

      {/* Tab Bar */}
      <FilterChipGroup value={activeTab} onChange={setActiveTab} className="mb-5">
        {tabs.map(t => (
          <FilterChip key={t.id} value={t.id}>{t.label}</FilterChip>
        ))}
      </FilterChipGroup>

      {/* ── Overview Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          {/* Financial KPIs — super_admin only */}
          {portalCan(session, 'see_company_revenue') && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:16, marginBottom:16 }}>
              {financeCards.map((s,i) => (
                <motion.div key={s.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
                  <div style={{ background:s.bg, border:`1px solid ${s.bg==='#0F2D5E'?'#0F2D5E':DS.cardBorder}`, borderRadius:12, padding:'18px 20px' }}>
                    <div style={{ width:36, height:36, borderRadius:8, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                      <s.icon size={17} style={{ color:s.color }}/>
                    </div>
                    <p style={{ fontSize:22, fontWeight:700, color:s.textColor, margin:0 }}>{s.value}</p>
                    <p style={{ fontSize:12, color:s.textColor, opacity:0.7, marginTop:2 }}>{s.label}</p>
                    <p style={{ fontSize:11, color:s.subColor, marginTop:4 }}>{s.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Ops KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:16, marginBottom:24 }}>
            {opsCards.map((s,i) => (
              <motion.div key={s.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
                <Card style={{ padding:'18px 20px' }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                    <s.icon size={17} style={{ color:s.color }}/>
                  </div>
                  <p style={{ fontSize:22, fontWeight:700, color:DS.textPrimary, margin:0 }}>{s.value}</p>
                  <p style={{ fontSize:12, color:DS.textMuted, marginTop:2 }}>{s.label}</p>
                  <p style={{ fontSize:11, color:DS.textSubtle, marginTop:4 }}>{s.sub}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:24 }}>
            {/* Growth chart */}
            <Card style={{ padding:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div>
                  <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary, margin:0 }}>Platform Growth</p>
                  <p style={{ fontSize:12, color:DS.textMuted, margin:'2px 0 0' }}>Clinics & appointments over time</p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, background:'#EFF6FF', border:'1px solid #BFDBFE' }}>
                  <TrendingUp size={12} style={{ color:'#1A5CB5' }}/>
                  <span style={{ fontSize:11, fontWeight:600, color:'#1A5CB5' }}>+{superAdminStats.growth}% MoM</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={DS.cardBorder}/>
                  <XAxis dataKey="month" tick={{ fill:DS.textSubtle, fontSize:11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:DS.textSubtle, fontSize:11 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Line type="monotone" dataKey="clinics" stroke={DS.accent} strokeWidth={2.5} dot={{ fill:DS.accent, r:3 }} name="clinics"/>
                  <Line type="monotone" dataKey="appointments" stroke="#1A5CB5" strokeWidth={2} dot={{ fill:'#1A5CB5', r:3 }} name="appts"/>
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* System health + staff */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <Card style={{ padding:20 }}>
                <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary, margin:'0 0 12px', display:'flex', alignItems:'center', gap:6 }}>
                  <Activity size={14} style={{ color:DS.accent }}/> System Health
                </p>
                {[
                  { label:'WhatsApp API', status:superAdminStats.whatsappApiStatus },
                  { label:'AI Engine',    status:superAdminStats.aiStatus },
                  { label:'Database',     status:superAdminStats.dbStatus },
                  { label:'Platform',     status:'healthy' },
                ].map(s => (
                  <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:`1px solid ${DS.bg}` }}>
                    <span style={{ fontSize:12, color:DS.textMuted }}>{s.label}</span>
                    <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, color:'#1A5CB5' }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', background:'#1A5CB5', display:'inline-block' }}/>
                      Healthy
                    </span>
                  </div>
                ))}
              </Card>

              <Card style={{ padding:20 }}>
                <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary, margin:'0 0 12px', display:'flex', alignItems:'center', gap:6 }}>
                  <Users size={14} style={{ color:DS.accent }}/> Staff Breakdown
                </p>
                {staffByRole.map(([role, count]) => {
                  const rc = ROLE_COLORS[role] || ROLE_COLORS.mr
                  return (
                    <div key={role} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0' }}>
                      <span style={{ fontSize:12, padding:'1px 6px', borderRadius:4, background:rc.bg, color:rc.color, fontWeight:600 }}>{ROLE_LABELS[role]||role}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:DS.textPrimary }}>{count}</span>
                    </div>
                  )
                })}
                <div style={{ borderTop:`1px solid ${DS.cardBorder}`, marginTop:8, paddingTop:8, display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, fontWeight:600, color:DS.textPrimary }}>Total Staff</span>
                  <span style={{ fontSize:13, fontWeight:700, color:DS.accent }}>{portalStaff.length}</span>
                </div>
              </Card>
            </div>
          </div>

          {/* Zone table */}
          <Card style={{ overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom:`1px solid ${DS.cardBorder}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary, margin:0 }}>Zone Performance</p>
              <Button size="sm" variant="ghost" onClick={() => navigate('/portal/zones')}>View All →</Button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 80px 90px 90px 90px', gap:12, padding:'10px 20px', background:DS.bg }}>
              {['Zone','Manager','Cities','Clinics', portalCan(session,'see_zone_revenue')?'MRR':'—','Achievement'].map(h=>(
                <span key={h} style={{ fontSize:10, fontWeight:600, color:DS.textMuted, textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</span>
              ))}
            </div>
            {zones.map((z,i) => {
              const pct = Math.round((z.mrr/z.target)*100)
              return (
                <div key={z.id} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 80px 90px 90px 90px', gap:12, alignItems:'center', padding:'12px 20px', borderBottom:i<zones.length-1?`1px solid ${DS.bg}`:'none', cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.background=DS.rowHover}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <span style={{ fontSize:13, fontWeight:600, color:DS.textPrimary }}>{z.name}</span>
                  <span style={{ fontSize:13, color:DS.textMuted }}>{z.manager}</span>
                  <span style={{ fontSize:13, color:DS.textPrimary }}>{z.cities}</span>
                  <span style={{ fontSize:13, color:DS.textPrimary }}>{z.clinics}</span>
                  <span style={{ fontSize:13, fontWeight:500, color:DS.textPrimary }}>
                    {portalCan(session,'see_zone_revenue') ? `₹${(z.mrr/1000).toFixed(0)}K` : '——'}
                  </span>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ flex:1, height:4, borderRadius:2, background:DS.cardBorder, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:2, background:pct>=80?DS.accent:'#f59e0b', width:`${Math.min(100,pct)}%` }}/>
                    </div>
                    <span style={{ fontSize:11, fontWeight:600, color:pct>=80?DS.accent:'#b45309', minWidth:28 }}>{pct}%</span>
                  </div>
                </div>
              )
            })}
          </Card>
        </>
      )}

      {/* ── Drill Down Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'drilldown' && (
        <Card style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: DS.textPrimary, margin: 0 }}>Zone → City → MR Drill Down</p>
            <p style={{ fontSize: 13, color: DS.textMuted, marginTop: 4 }}>Click any zone to see its cities, then click a city to view MR performance</p>
          </div>
          <DrillDownView startLevel={0} data={PORTAL_HIERARCHY}/>
        </Card>
      )}

      {/* ── All Staff Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'staff' && (
        <Card style={{ overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:`1px solid ${DS.cardBorder}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary, margin:0 }}>All Staff ({portalStaff.length})</p>
            <Button size="sm" variant="ghost" onClick={() => navigate('/portal/team')}>Full Team View →</Button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px 70px 70px 80px', gap:12, padding:'10px 20px', background:DS.bg }}>
            {['Name','Role','City/Zone','Clinics','Perf','Status'].map(h=>(
              <span key={h} style={{ fontSize:10, fontWeight:600, color:DS.textMuted, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</span>
            ))}
          </div>
          {portalStaff.map((s,i)=>{
            const rc = ROLE_COLORS[s.role]||ROLE_COLORS.mr
            return (
              <div key={s.id} style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px 70px 70px 80px', gap:12, alignItems:'center', padding:'11px 20px', borderBottom:i<portalStaff.length-1?`1px solid ${DS.bg}`:'none' }}
                onMouseEnter={e=>e.currentTarget.style.background=DS.rowHover}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:rc.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:rc.color }}>{s.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</span>
                  </div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:500, color:DS.textPrimary, margin:0 }}>{s.name}</p>
                    <p style={{ fontSize:11, color:DS.textSubtle, margin:0 }}>{s.phone}</p>
                  </div>
                </div>
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4, background:rc.bg, color:rc.color }}>{ROLE_LABELS[s.role]||s.role}</span>
                <span style={{ fontSize:12, color:DS.textMuted }}>{s.city||s.zone||'All'}</span>
                <span style={{ fontSize:13, color:DS.textPrimary }}>{s.clinics}</span>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <div style={{ flex:1, height:3, borderRadius:2, background:DS.cardBorder, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:2, background:s.performance>=85?DS.accent:'#f59e0b', width:`${s.performance}%` }}/>
                  </div>
                  <span style={{ fontSize:10, fontWeight:600, color:s.performance>=85?DS.accent:'#b45309' }}>{s.performance}</span>
                </div>
                <span style={{ fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:4, background:'#EFF6FF', color:'#1A5CB5' }}>Active</span>
              </div>
            )
          })}
        </Card>
      )}

      {/* ── Zones Detail Tab ────────────────────────────────────────────────── */}
      {activeTab === 'zones' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {zones.map(z=>{
            const staff = portalStaff.filter(s=>s.zone===z.name)
            const pct   = Math.round((z.mrr/z.target)*100)
            return (
              <Card key={z.id} style={{ overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', background:DS.bg, borderBottom:`1px solid ${DS.cardBorder}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <p style={{ fontSize:14, fontWeight:700, color:DS.textPrimary, margin:0 }}>{z.name}</p>
                    <p style={{ fontSize:12, color:DS.textMuted, margin:'2px 0 0' }}>Manager: {z.manager}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:16, fontWeight:700, color:DS.accent, margin:0 }}>₹{(z.mrr/1000).toFixed(0)}K</p>
                    <p style={{ fontSize:11, color:DS.textSubtle, margin:'1px 0 0' }}>MRR · {pct}% target</p>
                  </div>
                </div>
                <div style={{ padding:16 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
                    {[['Clinics', z.clinics, '#1A5CB5'], ['Cities', z.cities, '#1d4ed8'], ['Growth', `+${z.growth}%`, '#b45309']].map(([label,val,color])=>(
                      <div key={label} style={{ textAlign:'center', padding:'10px 8px', background:DS.bg, borderRadius:8 }}>
                        <p style={{ fontSize:18, fontWeight:700, color, margin:0 }}>{val}</p>
                        <p style={{ fontSize:11, color:DS.textMuted, margin:'2px 0 0' }}>{label}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize:12, fontWeight:600, color:DS.textMuted, margin:'0 0 8px' }}>Zone Staff ({staff.length})</p>
                  {staff.slice(0,5).map(s=>{
                    const rc = ROLE_COLORS[s.role]||ROLE_COLORS.mr
                    return (
                      <div key={s.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:`1px solid ${DS.bg}` }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:24, height:24, borderRadius:'50%', background:rc.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <span style={{ fontSize:9, fontWeight:700, color:rc.color }}>{s.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</span>
                          </div>
                          <span style={{ fontSize:12, color:DS.textPrimary }}>{s.name}</span>
                        </div>
                        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                          <span style={{ fontSize:10, padding:'1px 5px', borderRadius:3, background:rc.bg, color:rc.color, fontWeight:600 }}>{ROLE_LABELS[s.role]||s.role}</span>
                          <span style={{ fontSize:11, color:DS.textSubtle }}>{s.city||'All'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
