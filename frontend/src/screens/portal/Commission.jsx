'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { IndianRupee, TrendingUp, Award, CheckCircle } from 'lucide-react'
import { useStore } from '../../store/portalStore'
import { getSession } from '../../utils/auth'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
// TODO: Ashutosh uncomment ↓
// import { portalApi } from '../../services/portalApi'

const DS = { bg:'#F7F9FF', cardBg:'#ffffff', cardBorder:'#DDE4F0', textPrimary:'#0F2D5E', textMuted:'#6B7A9A', textSubtle:'#9DBDE8', accent:'#1A5CB5', rowHover:'#F7F9FF' }
function Card({ children, style={} }) { return <div style={{ background:DS.cardBg, border:`1px solid ${DS.cardBorder}`, borderRadius:12, ...style }}>{children}</div> }

const COMMISSION_PER_CONVERSION = 500

const monthlyData = [
  { month:'Nov 2025', conversions:2, paid:true  },
  { month:'Dec 2025', conversions:3, paid:true  },
  { month:'Jan 2026', conversions:2, paid:true  },
  { month:'Feb 2026', conversions:3, paid:true  },
  { month:'Mar 2026', conversions:2, paid:false },
  { month:'Apr 2026', conversions:0, paid:false, current:true },
]

export default function Commission() {
  const session = getSession()
  const store   = useStore()
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError,   setPageError]   = useState(null)

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    try {
      // TODO: Ashutosh uncomment ↓
      // const res = await portalApi.getCommission()
      // setCommissionData(res)
    } catch (e) {
      setPageError(e?.message || e?.detail || 'Failed to load commission data')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // Count conversions from current store leads
  const myLeads = store.leads.filter(l => l.salesperson === session.name)
  const currentConversions = myLeads.filter(l => l.stage === 'converted').length

  const totalConversions = monthlyData.reduce((a,m) => a + m.conversions, 0) + currentConversions
  const totalEarned = totalConversions * COMMISSION_PER_CONVERSION
  const paidAmount  = monthlyData.filter(m=>m.paid).reduce((a,m)=>a+m.conversions,0) * COMMISSION_PER_CONVERSION
  const pendingAmount = totalEarned - paidAmount

  const stats = [
    { icon:Award,        label:'Total Conversions', value:totalConversions,                     color:'#1A5CB5', bg:'#EFF6FF' },
    { icon:IndianRupee,  label:'Total Earned',       value:`₹${totalEarned.toLocaleString()}`,   color:'#1d4ed8', bg:'#dbeafe' },
    { icon:CheckCircle,  label:'Paid Out',            value:`₹${paidAmount.toLocaleString()}`,    color:'#1A5CB5', bg:'#EFF6FF' },
    { icon:TrendingUp,   label:'Pending Payout',      value:`₹${pendingAmount.toLocaleString()}`, color:'#b45309', bg:'#fef3c7' },
  ]

  const allMonths = [
    ...monthlyData,
    { month:'Apr 2026 (current)', conversions:currentConversions, paid:false, current:true },
  ]

  if (pageLoading) return <LoadingSpinner message="Loading commission data…" />
  if (pageError)   return <ErrorBanner message={pageError} onRetry={loadData} />

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:700, color:DS.textPrimary, margin:0 }}>My Commission</h1>
        <p style={{ fontSize:13, color:DS.textMuted, marginTop:4 }}>{session.name} · ₹{COMMISSION_PER_CONVERSION} per conversion</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16, marginBottom:24 }}>
        {stats.map((s,i)=>(
          <motion.div key={s.label} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
            <Card style={{ padding:'18px 20px' }}>
              <div style={{ width:36, height:36, borderRadius:8, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                <s.icon size={17} style={{ color:s.color }}/>
              </div>
              <p style={{ fontSize:22, fontWeight:700, color:DS.textPrimary, margin:0 }}>{s.value}</p>
              <p style={{ fontSize:12, color:DS.textMuted, marginTop:2 }}>{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Monthly Breakdown */}
      <Card style={{ marginBottom:24, overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:`1px solid ${DS.cardBorder}` }}>
          <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary, margin:0 }}>Monthly Breakdown</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 120px 120px 100px', gap:12, padding:'10px 20px', background:DS.bg }}>
          {['Month','Conversions','Amount','Status'].map(h=>(
            <span key={h} style={{ fontSize:10, fontWeight:600, color:DS.textMuted, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</span>
          ))}
        </div>
        {allMonths.map((m,i)=>(
          <div key={m.month} style={{ display:'grid', gridTemplateColumns:'1fr 120px 120px 100px', gap:12, alignItems:'center', padding:'12px 20px', borderBottom:i<allMonths.length-1?`1px solid ${DS.bg}`:'none', background:m.current?'#F7F9FF':'transparent' }}>
            <span style={{ fontSize:13, fontWeight:m.current?600:400, color:DS.textPrimary }}>{m.month}</span>
            <span style={{ fontSize:13, fontWeight:600, color:m.conversions>0?DS.accent:DS.textSubtle }}>{m.conversions}</span>
            <span style={{ fontSize:13, fontWeight:500, color:DS.textPrimary }}>₹{(m.conversions*COMMISSION_PER_CONVERSION).toLocaleString()}</span>
            <span style={{
              fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:4, display:'inline-block',
              background: m.current ? '#dbeafe' : m.paid ? '#EFF6FF' : '#fef3c7',
              color:       m.current ? '#1e40af' : m.paid ? '#1A5CB5' : '#92400e',
            }}>
              {m.current ? 'In Progress' : m.paid ? 'Paid' : 'Pending'}
            </span>
          </div>
        ))}
      </Card>

      {/* Converted Leads */}
      <Card style={{ overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:`1px solid ${DS.cardBorder}` }}>
          <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary, margin:0 }}>Converted Leads ({myLeads.filter(l=>l.stage==='converted').length})</p>
        </div>
        {myLeads.filter(l=>l.stage==='converted').length === 0 ? (
          <div style={{ padding:32, textAlign:'center' }}>
            <p style={{ color:DS.textSubtle, fontSize:13 }}>No conversions yet this session.</p>
          </div>
        ) : (
          myLeads.filter(l=>l.stage==='converted').map((l,i,arr)=>(
            <div key={l.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 20px', borderBottom:i<arr.length-1?`1px solid ${DS.bg}`:'none' }}
              onMouseEnter={e=>e.currentTarget.style.background=DS.rowHover}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:DS.textPrimary, margin:0 }}>{l.clinicName}</p>
                <p style={{ fontSize:11, color:DS.textMuted, margin:'2px 0 0' }}>{l.doctorName} · {l.city}</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:13, fontWeight:700, color:DS.accent, margin:0 }}>₹{COMMISSION_PER_CONVERSION}</p>
                <p style={{ fontSize:10, color:DS.textSubtle, margin:'1px 0 0' }}>Commission</p>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
