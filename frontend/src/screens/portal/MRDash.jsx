'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Plus, CheckCircle, Phone, X, ChevronDown, FileText } from 'lucide-react'
import { getSession } from '../../utils/auth'
import { useNavigate } from '../../utils/navigation'
import { Button, IconButton } from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
import BackButton from '../../components/ui/BackButton'
// TODO: Ashutosh uncomment ↓
// import { portalApi } from '../../services/portalApi'

const DS = {
  bg: '#F7F9FF', cardBg: '#ffffff', cardBorder: '#DDE4F0',
  primary: '#0F2D5E', accent: '#E5402B', secondary: '#1A5CB5',
  textPrimary: '#0F2D5E', textMuted: '#6B7A9A', textSubtle: '#9DBDE8',
  rowHover: '#F7F9FF', inputBorder: '#DDE4F0',
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: DS.cardBg, border: `1px solid ${DS.cardBorder}`, borderRadius: 12, ...style }}>
      {children}
    </div>
  )
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  'Pitched':        { bg: '#FEF3C7', color: '#92400E' },
  'Interested':     { bg: '#DBEAFE', color: '#1E40AF' },
  'Demo Done':      { bg: '#EDE9FE', color: '#5B21B6' },
  'Ready':          { bg: '#D1FAE5', color: '#065F46' },
  'Closed':         { bg: '#0F2D5E', color: '#ffffff' },
  'Not Interested': { bg: '#FEE2E2', color: '#991B1B' },
}
const STATUS_OPTIONS = ['Pitched', 'Interested', 'Demo Done', 'Ready', 'Closed', 'Not Interested']
const FILTER_TABS    = ['All', 'Pitched', 'Interested', 'Demo Done', 'Ready', 'Closed']

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_PIPELINE = [
  { id:1,  clinic:'Sharma Clinic',   doctor:'Dr. R. Sharma',  city:'Jaipur',  status:'Closed',         last_contact:'Today',        phone:'9876543210' },
  { id:2,  clinic:'City Care',       doctor:'Dr. A. Singh',   city:'Jaipur',  status:'Ready',          last_contact:'Yesterday',    phone:'9876543211' },
  { id:3,  clinic:'Gupta Medical',   doctor:'Dr. P. Gupta',   city:'Ajmer',   status:'Demo Done',      last_contact:'2 days ago',   phone:'9876543212' },
  { id:4,  clinic:'Mehta Clinic',    doctor:'Dr. S. Mehta',   city:'Kota',    status:'Interested',     last_contact:'3 days ago',   phone:'9876543213' },
  { id:5,  clinic:'Verma Hospital',  doctor:'Dr. V. Verma',   city:'Jaipur',  status:'Pitched',        last_contact:'4 days ago',   phone:'9876543214' },
  { id:6,  clinic:'Joshi Clinic',    doctor:'Dr. K. Joshi',   city:'Udaipur', status:'Pitched',        last_contact:'5 days ago',   phone:'9876543215' },
  { id:7,  clinic:'Patel Nursing',   doctor:'Dr. M. Patel',   city:'Jaipur',  status:'Interested',     last_contact:'1 week ago',   phone:'9876543216' },
  { id:8,  clinic:'Agarwal Clinic',  doctor:'Dr. R. Agarwal', city:'Sikar',   status:'Not Interested', last_contact:'1 week ago',   phone:'9876543217' },
  { id:9,  clinic:'Singh Medical',   doctor:'Dr. H. Singh',   city:'Jaipur',  status:'Demo Done',      last_contact:'2 weeks ago',  phone:'9876543218' },
  { id:10, clinic:'Yadav Clinic',    doctor:'Dr. S. Yadav',   city:'Alwar',   status:'Pitched',        last_contact:'2 weeks ago',  phone:'9876543219' },
]

const MOCK_SCHEDULE = [
  { id:1, time:'10:00 AM', clinic:'City Care',      doctor:'Dr. Singh', purpose:'Follow-up'   },
  { id:2, time:'12:00 PM', clinic:'Mehta Clinic',   doctor:'Dr. Mehta', purpose:'Demo'        },
  { id:3, time:'3:00 PM',  clinic:'Verma Hospital', doctor:'Dr. Verma', purpose:'First pitch' },
  { id:4, time:'5:00 PM',  clinic:'Joshi Clinic',   doctor:'Dr. Joshi', purpose:'Close deal'  },
]

const MOCK_FOLLOWUPS = [
  { id:1, clinic:'Gupta Medical',  doctor:'Dr. P. Gupta',   due:'2 days ago', urgency:'overdue'  },
  { id:2, clinic:'Patel Nursing',  doctor:'Dr. M. Patel',   due:'Today',      urgency:'today'    },
  { id:3, clinic:'Singh Medical',  doctor:'Dr. H. Singh',   due:'Today',      urgency:'today'    },
  { id:4, clinic:'Yadav Clinic',   doctor:'Dr. S. Yadav',   due:'Tomorrow',   urgency:'upcoming' },
  { id:5, clinic:'Agarwal Clinic', doctor:'Dr. R. Agarwal', due:'Apr 22',     urgency:'upcoming' },
]

const MOCK_CHART = [
  { day:'Mon', pitched:3, closed:0 },
  { day:'Tue', pitched:5, closed:1 },
  { day:'Wed', pitched:2, closed:0 },
  { day:'Thu', pitched:4, closed:1 },
  { day:'Fri', pitched:6, closed:1 },
  { day:'Sat', pitched:2, closed:0 },
]

const MOCK_COMMISSION = {
  this_month: 4500,
  pending:    3000,
  total:      32000,
  history: [
    { clinic:'Sharma Clinic', date:'Apr 10', plan:'Growth ₹1999', commission: 500  },
    { clinic:'City Care',     date:'Apr 5',  plan:'Starter ₹999', commission: 300  },
    { clinic:'ABC Clinic',    date:'Mar 28', plan:'Pro ₹3999',    commission: 1000 },
  ],
}

const CITY_OPTIONS = ['Jaipur','Ajmer','Kota','Udaipur','Sikar','Alwar','Jodhpur','Bikaner']
const SPEC_OPTIONS = ['General Physician','Pediatrician','Gynecologist','Orthopedic','Dermatologist','ENT','Ophthalmologist','Neurologist','Cardiologist']

// ─── Add Clinic Slide Panel ───────────────────────────────────────────────────
function AddClinicPanel({ onClose, onAdd }) {
  const [form, setForm] = useState({
    clinic:'', doctor:'', phone:'', city:'Jaipur',
    specialization:'General Physician', status:'Pitched', notes:'',
  })
  const [done, setDone] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const inp = {
    width:'100%', height:40, borderRadius:8, padding:'0 12px',
    border:`1px solid ${DS.inputBorder}`, fontSize:13, color:DS.textPrimary,
    outline:'none', background:'#fff', boxSizing:'border-box',
  }
  const lbl = { fontSize:12, fontWeight:600, color:DS.textMuted, display:'block', marginBottom:5 }

  const isValid = form.clinic && form.doctor && form.phone

  const handleSubmit = () => {
    if (!isValid) return
    onAdd({ ...form, id: Date.now(), last_contact: 'Just now' })
    setDone(true)
  }

  if (done) return (
    <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
      transition={{ type:'tween', duration:0.25 }}
      style={{ position:'fixed', right:0, top:0, bottom:0, width:'100%', maxWidth:460, zIndex:60, background:'#fff', boxShadow:'-8px 0 40px rgba(0,0,0,0.14)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:36 }}>
      <CheckCircle size={48} style={{ color:'#22c55e', marginBottom:16 }}/>
      <p style={{ fontSize:17, fontWeight:700, color:DS.textPrimary, margin:'0 0 8px' }}>Added to Pipeline!</p>
      <p style={{ fontSize:13, color:DS.textMuted, marginBottom:24, textAlign:'center' }}>{form.clinic} has been added to your pipeline.</p>
      <Button onClick={onClose}>Done</Button>
    </motion.div>
  )

  return (
    <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
      transition={{ type:'tween', duration:0.25 }}
      style={{ position:'fixed', right:0, top:0, bottom:0, width:'100%', maxWidth:460, zIndex:60, background:'#fff', boxShadow:'-8px 0 40px rgba(0,0,0,0.14)', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ padding:'20px 24px', borderBottom:`1px solid ${DS.cardBorder}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <p style={{ fontSize:16, fontWeight:700, color:DS.textPrimary, margin:0 }}>Add Clinic to Pipeline</p>
          <p style={{ fontSize:12, color:DS.textMuted, marginTop:2 }}>Quick entry — full onboarding when status reaches Ready</p>
        </div>
        <IconButton icon={X} ariaLabel="Close" onClick={onClose} />
      </div>
      {/* Form */}
      <div style={{ flex:1, overflowY:'auto', padding:24 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div>
            <label style={lbl}>Clinic Name *</label>
            <input style={inp} value={form.clinic} onChange={e=>set('clinic',e.target.value)} placeholder="e.g. Sharma Clinic"
              onFocus={e=>e.target.style.borderColor=DS.secondary} onBlur={e=>e.target.style.borderColor=DS.inputBorder}/>
          </div>
          <div>
            <label style={lbl}>Doctor Name *</label>
            <input style={inp} value={form.doctor} onChange={e=>set('doctor',e.target.value)} placeholder="Dr. R. Sharma"
              onFocus={e=>e.target.style.borderColor=DS.secondary} onBlur={e=>e.target.style.borderColor=DS.inputBorder}/>
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={lbl}>Doctor Phone *</label>
          <input style={inp} value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+91 98765 43210"
            onFocus={e=>e.target.style.borderColor=DS.secondary} onBlur={e=>e.target.style.borderColor=DS.inputBorder}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div>
            <label style={lbl}>City *</label>
            <select style={{ ...inp, cursor:'pointer' }} value={form.city} onChange={e=>set('city',e.target.value)}>
              {CITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Specialization *</label>
            <select style={{ ...inp, cursor:'pointer' }} value={form.specialization} onChange={e=>set('specialization',e.target.value)}>
              {SPEC_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={lbl}>Status *</label>
          <select style={{ ...inp, cursor:'pointer' }} value={form.status} onChange={e=>set('status',e.target.value)}>
            {['Pitched','Interested','Demo Done','Ready'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={lbl}>Notes</label>
          <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3}
            placeholder="Doctor's interest level, preferred timing, any special notes..."
            style={{ width:'100%', borderRadius:8, padding:'10px 12px', border:`1px solid ${DS.inputBorder}`, fontSize:13, color:DS.textPrimary, outline:'none', background:'#fff', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' }}
            onFocus={e=>e.target.style.borderColor=DS.secondary} onBlur={e=>e.target.style.borderColor=DS.inputBorder}/>
        </div>
        <div style={{ fontSize:12, color:DS.textMuted, padding:'10px 14px', background:DS.bg, borderRadius:8 }}>
          💡 When status reaches <strong>Ready</strong>, click "Start Full Onboarding" on the pipeline row to fill complete clinic details.
        </div>
      </div>
      {/* Footer */}
      <div style={{ padding:'16px 24px', borderTop:`1px solid ${DS.cardBorder}`, flexShrink:0, display:'flex', gap:10 }}>
        <button onClick={onClose}
          style={{ flex:1, height:42, borderRadius:8, border:`1px solid ${DS.cardBorder}`, background:'transparent', fontSize:13, color:DS.textMuted, cursor:'pointer', fontWeight:500 }}>
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={!isValid}
          style={{ flex:2, height:42, borderRadius:8, border:'none', background:isValid?DS.accent:'#e5e7eb', color:isValid?'#fff':'#9ca3af', fontSize:13, fontWeight:700, cursor:isValid?'pointer':'not-allowed' }}>
          Add to Pipeline
        </button>
      </div>
    </motion.div>
  )
}

// ─── Add Note Modal ───────────────────────────────────────────────────────────
function NoteModal({ clinic, onClose }) {
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  return (
    <div style={{ position:'fixed', inset:0, zIndex:70, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        onClick={e => e.stopPropagation()}
        style={{ background:'#fff', borderRadius:14, padding:24, width:'100%', maxWidth:420 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <p style={{ fontSize:15, fontWeight:700, color:DS.textPrimary, margin:0 }}>Add Note</p>
          <IconButton icon={X} ariaLabel="Close" onClick={onClose} />
        </div>
        <p style={{ fontSize:12, color:DS.textMuted, marginBottom:10 }}>{clinic.clinic} · {clinic.doctor}</p>
        {saved ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 14px', background:'#D1FAE5', borderRadius:8 }}>
            <CheckCircle size={16} style={{ color:'#065F46' }}/>
            <span style={{ fontSize:13, color:'#065F46', fontWeight:600 }}>Note saved!</span>
          </div>
        ) : (
          <>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
              placeholder="What happened? Any updates on this clinic..."
              style={{ width:'100%', borderRadius:8, padding:'10px 12px', border:`1px solid ${DS.inputBorder}`, fontSize:13, color:DS.textPrimary, outline:'none', resize:'none', boxSizing:'border-box', fontFamily:'inherit' }}
              onFocus={e=>e.target.style.borderColor=DS.secondary} onBlur={e=>e.target.style.borderColor=DS.inputBorder}/>
            <div style={{ display:'flex', gap:8, marginTop:14 }}>
              <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
              <Button fullWidth onClick={() => { if (note) setSaved(true) }} disabled={!note}>Save Note</Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function MRDash({ mrData = null, readOnly = false }) {
  const session  = getSession()
  const navigate = useNavigate()

  const [pageLoading,  setPageLoading]  = useState(false)
  const [pageError,    setPageError]    = useState(null)
  const [pipeline,     setPipeline]     = useState(MOCK_PIPELINE)
  const [activeFilter, setActiveFilter] = useState('All')
  const [visitedSet,   setVisitedSet]   = useState(new Set())
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [noteTarget,   setNoteTarget]   = useState(null)

  useEffect(() => {
    const load = async () => {
      setPageLoading(true)
      setPageError(null)
      try {
        // TODO: Ashutosh uncomment ↓
        // const data = await portalApi.getMRDashboard()
        // setPipeline(data.pipeline)
      } catch (e) {
        setPageError(e?.message || e?.detail || 'Failed to load dashboard')
      } finally {
        setPageLoading(false)
      }
    }
    load()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = () => setOpenDropdown(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  const updateStatus = (id, newStatus) => {
    setPipeline(p => p.map(c => c.id === id ? { ...c, status: newStatus } : c))
    setOpenDropdown(null)
  }

  const addClinicToPipeline = (newClinic) => {
    setPipeline(p => [newClinic, ...p])
  }

  const filteredPipeline = activeFilter === 'All'
    ? pipeline
    : pipeline.filter(c => c.status === activeFilter)

  const today = new Date().toLocaleDateString('en-IN', {
    weekday:'long', day:'numeric', month:'long', year:'numeric',
  })

  // When viewed by admin (readOnly), use mrData stats; otherwise use mock/live data
  const MONTHLY_TARGET   = mrData ? mrData.target_this_month * 15000 : 80000
  const MONTHLY_ACHIEVED = mrData ? mrData.revenue_generated          : 45000
  const pct = Math.round((MONTHLY_ACHIEVED / MONTHLY_TARGET) * 100)

  const perfCards = mrData ? [
    { emoji:'🏥', label:'Clinics Pitched',      value:mrData.clinics_pitched,    sub:'Total all time',          color:DS.primary   },
    { emoji:'📞', label:'Active Clinics',        value:mrData.clinics_active,     sub:'Currently active',        color:DS.secondary },
    { emoji:'✅', label:'Deals This Month',      value:mrData.deals_this_month,   sub:`Target: ${mrData.target_this_month}`, color:'#065F46' },
    { emoji:'🔄', label:'Ready to Onboard',      value:mrData.clinics_ready,      sub:'clinics in progress',     color:DS.primary   },
  ] : [
    { emoji:'🏥', label:'Clinics Pitched Today',  value:4,  sub:'3 yesterday',       color:DS.primary   },
    { emoji:'📞', label:'Follow-ups Done Today',   value:6,  sub:'2 pending today',    color:DS.secondary },
    { emoji:'✅', label:'Deals Closed This Month', value:3,  sub:'+1 this week',       color:'#065F46'    },
    { emoji:'🔄', label:'Active Pipeline',          value:pipeline.filter(c => c.status !== 'Closed' && c.status !== 'Not Interested').length, sub:'clinics in progress', color:DS.primary },
  ]

  if (pageLoading) return <LoadingSpinner message="Loading dashboard…" />
  if (pageError)   return <ErrorBanner message={pageError} onRetry={() => window.location.reload()} />

  return (
    <div style={{ padding:24, maxWidth:1400 }}>
      <BackButton />

      {/* ════ SECTION 1 — HEADER ═══════════════════════════════════════════════ */}
      <Card style={{ padding:'20px 24px', marginBottom:20 }}>
        <div style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-start', justifyContent:'space-between', gap:20 }}>
          {/* Left */}
          <div>
            <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:10, marginBottom:6 }}>
              <h1 style={{ fontSize:22, fontWeight:800, color:DS.textPrimary, margin:0 }}>
                {readOnly && mrData
                  ? `Performance Review — ${mrData.name}`
                  : `Good morning, ${session?.name || 'Suresh Kumar'} 👋`}
              </h1>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:4, background:readOnly ? DS.secondary : DS.accent, color:'#fff', letterSpacing:'0.03em' }}>
                {readOnly ? 'MR Review' : 'Sales Executive'}
              </span>
            </div>
            {readOnly && mrData ? (
              <p style={{ fontSize:13, color:DS.textMuted, margin:'0 0 2px' }}>📍 {mrData.zone} · {mrData.city} · Joined {mrData.joining_date}</p>
            ) : (
              <>
                <p style={{ fontSize:13, color:DS.textMuted, margin:'0 0 2px' }}>📍 North Zone · Jaipur</p>
                <p style={{ fontSize:12, color:DS.textSubtle, margin:0 }}>{today}</p>
              </>
            )}
          </div>
          {/* Right — target */}
          <div style={{ minWidth:260 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <span style={{ fontSize:13, fontWeight:600, color:DS.textPrimary }}>Monthly Target</span>
              <span style={{ fontSize:13, fontWeight:700, color:DS.textPrimary }}>
                ₹{MONTHLY_ACHIEVED.toLocaleString()} / ₹{MONTHLY_TARGET.toLocaleString()}
              </span>
            </div>
            <div style={{ height:8, borderRadius:100, background:DS.cardBorder, overflow:'hidden' }}>
              <motion.div
                initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:0.8, ease:'easeOut' }}
                style={{ height:'100%', background:DS.accent, borderRadius:100 }}/>
            </div>
            <p style={{ fontSize:12, color:DS.textMuted, marginTop:5 }}>{pct}% achieved this month</p>
          </div>
        </div>
      </Card>

      {/* ════ SECTION 2 — PERFORMANCE CARDS ═══════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:14, marginBottom:20 }}>
        {perfCards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i * 0.07 }}>
            <Card style={{ padding:'18px 20px' }}>
              <div style={{ fontSize:24, marginBottom:12 }}>{c.emoji}</div>
              <p style={{ fontSize:28, fontWeight:800, color:DS.textPrimary, margin:0 }}>{c.value}</p>
              <p style={{ fontSize:12, fontWeight:600, color:DS.textMuted, marginTop:4 }}>{c.label}</p>
              <p style={{ fontSize:11, color:DS.textSubtle, marginTop:3 }}>{c.sub}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ════ SECTION 3 — CLINIC PIPELINE TABLE ═══════════════════════════════ */}
      <Card style={{ marginBottom:20, overflow:'hidden' }}>
        {/* Table header row */}
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${DS.cardBorder}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <p style={{ fontSize:15, fontWeight:700, color:DS.textPrimary, margin:0 }}>
            My Clinic Pipeline
            <span style={{ marginLeft:8, fontSize:13, fontWeight:500, color:DS.textMuted }}>({pipeline.length} clinics)</span>
          </p>
          {!readOnly && (
            <button
              onClick={() => setShowAddPanel(true)}
              style={{ display:'flex', alignItems:'center', gap:6, height:36, padding:'0 16px', borderRadius:8, border:'none', background:DS.accent, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = DS.primary}
              onMouseLeave={e => e.currentTarget.style.background = DS.accent}>
              <Plus size={14}/> Add New Clinic
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div style={{ padding:'10px 20px', borderBottom:`1px solid ${DS.cardBorder}`, display:'flex', gap:6, flexWrap:'wrap' }}>
          {FILTER_TABS.map(tab => {
            const count = tab === 'All' ? pipeline.length : pipeline.filter(c => c.status === tab).length
            const active = activeFilter === tab
            return (
              <button key={tab} onClick={() => setActiveFilter(tab)}
                style={{ padding:'5px 12px', borderRadius:8, border:`1px solid ${active ? DS.primary : DS.cardBorder}`, background:active ? DS.primary : '#fff', color:active ? '#fff' : DS.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
                {tab} <span style={{ opacity:0.65, fontSize:11 }}>({count})</span>
              </button>
            )
          })}
        </div>

        {/* Column headers */}
        <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1.2fr 0.7fr 1fr 0.9fr 1.4fr', gap:12, padding:'10px 20px', background:DS.bg }}>
          {['CLINIC NAME','DOCTOR','CITY','STATUS','LAST CONTACT','ACTION'].map(h => (
            <span key={h} style={{ fontSize:10, fontWeight:700, color:DS.textMuted, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {filteredPipeline.map((row, i) => {
          const ss = STATUS_STYLES[row.status] || { bg:'#f3f4f6', color:'#374151' }
          const isReady = row.status === 'Ready'
          return (
            <div key={row.id}
              style={{ display:'grid', gridTemplateColumns:'1.5fr 1.2fr 0.7fr 1fr 0.9fr 1.4fr', gap:12, alignItems:'center', padding:'13px 20px', borderBottom: i < filteredPipeline.length - 1 ? `1px solid ${DS.bg}` : 'none', transition:'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = DS.rowHover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div>
                <span style={{ fontSize:13, fontWeight:600, color:DS.textPrimary, display:'block' }}>{row.clinic}</span>
                {isReady && (
                  <button onClick={() => navigate('/portal/add-clinic')}
                    style={{ marginTop:3, fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4, border:'none', background:'#D1FAE5', color:'#065F46', cursor:'pointer' }}>
                    Start Full Onboarding →
                  </button>
                )}
              </div>
              <span style={{ fontSize:12, color:DS.textMuted }}>{row.doctor}</span>
              <span style={{ fontSize:12, color:DS.textMuted }}>{row.city}</span>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:5, background:ss.bg, color:ss.color, width:'fit-content' }}>
                {row.status}
              </span>
              <span style={{ fontSize:12, color:DS.textSubtle }}>{row.last_contact}</span>

              {/* Actions */}
              <div style={{ display:'flex', alignItems:'center', gap:5 }} onClick={e => e.stopPropagation()}>
              {readOnly ? (
                <span style={{ fontSize:11, color:DS.textSubtle }}>—</span>
              ) : (<>
                {/* Status Dropdown */}
                <div style={{ position:'relative' }}>
                  <button
                    onClick={e => { e.stopPropagation(); setOpenDropdown(openDropdown === row.id ? null : row.id) }}
                    style={{ display:'flex', alignItems:'center', gap:3, height:28, padding:'0 8px', borderRadius:8, border:`1px solid ${DS.cardBorder}`, background:'#fff', fontSize:11, fontWeight:600, color:DS.textPrimary, cursor:'pointer' }}>
                    Status <ChevronDown size={10}/>
                  </button>
                  {openDropdown === row.id && (
                    <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, zIndex:30, background:'#fff', border:`1px solid ${DS.cardBorder}`, borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', minWidth:148, overflow:'hidden' }}>
                      {STATUS_OPTIONS.map(s => {
                        const bs = STATUS_STYLES[s]
                        return (
                          <button key={s} onClick={() => updateStatus(row.id, s)}
                            style={{ width:'100%', padding:'8px 12px', border:'none', background:'#fff', textAlign:'left', fontSize:12, color:DS.textPrimary, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
                            onMouseEnter={e => e.currentTarget.style.background = DS.bg}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                            <span style={{ width:8, height:8, borderRadius:'50%', background:bs.color === '#ffffff' ? DS.primary : bs.color, border:`1px solid ${bs.color === '#ffffff' ? DS.primary : 'transparent'}`, flexShrink:0 }}/>
                            {s}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
                <button onClick={() => setNoteTarget(row)}
                  style={{ height:28, padding:'0 8px', borderRadius:8, border:`1px solid ${DS.cardBorder}`, background:'#fff', fontSize:11, fontWeight:600, color:DS.textPrimary, cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
                  <FileText size={10}/> Note
                </button>
                <a href={`tel:${row.phone}`}
                  style={{ height:28, padding:'0 8px', borderRadius:8, border:`1px solid ${DS.cardBorder}`, background:'#fff', fontSize:11, fontWeight:600, color:DS.secondary, cursor:'pointer', display:'flex', alignItems:'center', gap:3, textDecoration:'none' }}>
                  <Phone size={10}/> Call
                </a>
              </>)}
              </div>
            </div>
          )
        })}

        {filteredPipeline.length === 0 && (
          <p style={{ padding:'32px 20px', textAlign:'center', fontSize:13, color:DS.textSubtle }}>
            No clinics in this stage. Click "+ Add New Clinic" to get started.
          </p>
        )}
      </Card>

      {/* ════ SECTION 4 — SCHEDULE & FOLLOW-UPS ═══════════════════════════════ */}
      {!readOnly && <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        {/* Today's Visit Plan */}
        <Card style={{ overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:`1px solid ${DS.cardBorder}` }}>
            <p style={{ fontSize:14, fontWeight:700, color:DS.textPrimary, margin:0 }}>Today's Visit Plan</p>
          </div>
          {MOCK_SCHEDULE.map((s, i) => {
            const visited = visitedSet.has(s.id)
            return (
              <div key={s.id}
                style={{ padding:'13px 20px', borderBottom: i < MOCK_SCHEDULE.length - 1 ? `1px solid ${DS.bg}` : 'none', background: visited ? '#F0FDF4' : 'transparent', transition:'background 0.2s' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:DS.textSubtle, minWidth:68, flexShrink:0 }}>{s.time}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:DS.textPrimary, textDecoration:visited ? 'line-through' : 'none', opacity:visited ? 0.5 : 1 }}>
                        {s.clinic}
                      </span>
                    </div>
                    <p style={{ fontSize:12, color:DS.textMuted, margin:'0 0 1px 76px' }}>{s.doctor}</p>
                    <p style={{ fontSize:11, color:DS.textSubtle, margin:'0 0 0 76px' }}>Purpose: {s.purpose}</p>
                  </div>
                  {visited ? (
                    <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                      <CheckCircle size={15} style={{ color:'#22c55e' }}/>
                      <span style={{ fontSize:11, fontWeight:700, color:'#16a34a' }}>Visited</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setVisitedSet(prev => new Set([...prev, s.id]))}
                      style={{ flexShrink:0, fontSize:11, fontWeight:600, padding:'5px 10px', borderRadius:8, border:`1px solid ${DS.cardBorder}`, background:'#fff', color:DS.textPrimary, cursor:'pointer', whiteSpace:'nowrap' }}
                      onMouseEnter={e => { e.currentTarget.style.background='#D1FAE5'; e.currentTarget.style.borderColor='#22c55e'; e.currentTarget.style.color='#16a34a' }}
                      onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor=DS.cardBorder; e.currentTarget.style.color=DS.textPrimary }}>
                      Mark Visited
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </Card>

        {/* Pending Follow-ups */}
        <Card style={{ overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:`1px solid ${DS.cardBorder}` }}>
            <p style={{ fontSize:14, fontWeight:700, color:DS.textPrimary, margin:0 }}>Pending Follow-ups</p>
          </div>
          {MOCK_FOLLOWUPS.map((f, i) => {
            const urgency =
              f.urgency === 'overdue' ? { bg:'#FEE2E2', color:'#991B1B', label:'Overdue',  btnBg:DS.accent   } :
              f.urgency === 'today'   ? { bg:'#FEF3C7', color:'#92400E', label:'Due Today', btnBg:'#F59E0B'   } :
                                       { bg:DS.bg,      color:DS.textMuted, label:f.due,   btnBg:DS.secondary }
            return (
              <div key={f.id}
                style={{ padding:'12px 20px', borderBottom: i < MOCK_FOLLOWUPS.length - 1 ? `1px solid ${DS.bg}` : 'none', background: f.urgency === 'overdue' ? '#FFF5F5' : f.urgency === 'today' ? '#FFFBEB' : 'transparent' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:DS.textPrimary, margin:'0 0 3px' }}>{f.clinic}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:11, color:DS.textMuted }}>{f.doctor}</span>
                      <span style={{ fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:4, background:urgency.bg, color:urgency.color }}>
                        {urgency.label}
                      </span>
                    </div>
                  </div>
                  <button
                    style={{ flexShrink:0, fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:8, border:'none', background:urgency.btnBg, color:'#fff', cursor:'pointer', whiteSpace:'nowrap' }}>
                    Follow up
                  </button>
                </div>
              </div>
            )
          })}
        </Card>
      </div>}

      {/* ════ SECTION 5 — WEEKLY PERFORMANCE CHART ════════════════════════════ */}
      <Card style={{ padding:'20px 24px', marginBottom:20 }}>
        <p style={{ fontSize:15, fontWeight:700, color:DS.textPrimary, margin:'0 0 20px' }}>Weekly Performance</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={MOCK_CHART} margin={{ top:0, right:0, left:-20, bottom:0 }} barSize={18} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={DS.cardBorder} vertical={false}/>
            <XAxis dataKey="day" tick={{ fontSize:12, fill:DS.textMuted }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:12, fill:DS.textMuted }} axisLine={false} tickLine={false}/>
            <Tooltip
              contentStyle={{ borderRadius:8, border:`1px solid ${DS.cardBorder}`, fontSize:12, color:DS.textPrimary }}
              cursor={{ fill:'rgba(0,0,0,0.03)' }}/>
            <Legend wrapperStyle={{ fontSize:12, paddingTop:10 }}/>
            <Bar dataKey="pitched" name="Clinics Pitched" fill={DS.primary}    radius={[4,4,0,0]}/>
            <Bar dataKey="closed"  name="Deals Closed"    fill={DS.accent}     radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:16 }}>
          {[
            { label:'Total pitches this week', value:'23' },
            { label:'Deals closed this week',  value:'3'  },
            { label:'Conversion rate',          value:'13%'},
          ].map(s => (
            <div key={s.label} style={{ padding:'14px 16px', background:DS.bg, borderRadius:8, border:`1px solid ${DS.cardBorder}` }}>
              <p style={{ fontSize:22, fontWeight:800, color:DS.textPrimary, margin:0 }}>{s.value}</p>
              <p style={{ fontSize:12, color:DS.textMuted, marginTop:4 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ════ SECTION 7 — COMMISSION TRACKER ══════════════════════════════════ */}
      {!readOnly && <Card style={{ overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:`1px solid ${DS.cardBorder}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <p style={{ fontSize:15, fontWeight:700, color:DS.textPrimary, margin:0 }}>My Earnings</p>
          <button onClick={() => navigate('/portal/commission')}
            style={{ fontSize:12, fontWeight:600, color:DS.secondary, background:'none', border:`1px solid ${DS.cardBorder}`, padding:'4px 12px', borderRadius:8, cursor:'pointer' }}>
            View Full Commission →
          </button>
        </div>
        {/* Summary */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)' }}>
          {[
            { label:'This Month',   value:`₹${MOCK_COMMISSION.this_month.toLocaleString()}`, color:DS.secondary },
            { label:'Pending',      value:`₹${MOCK_COMMISSION.pending.toLocaleString()}`,    color:'#92400E'    },
            { label:'Total Earned', value:`₹${MOCK_COMMISSION.total.toLocaleString()}`,      color:DS.primary   },
          ].map((s, i) => (
            <div key={s.label} style={{ padding:'18px 20px', borderBottom:`1px solid ${DS.cardBorder}`, borderRight: i < 2 ? `1px solid ${DS.cardBorder}` : 'none' }}>
              <p style={{ fontSize:22, fontWeight:800, color:s.color, margin:0 }}>{s.value}</p>
              <p style={{ fontSize:12, color:DS.textMuted, marginTop:4 }}>{s.label}</p>
            </div>
          ))}
        </div>
        {/* History column headers */}
        <div style={{ display:'grid', gridTemplateColumns:'1.5fr 0.8fr 1.2fr 0.8fr', gap:12, padding:'10px 20px', background:DS.bg }}>
          {['CLINIC','DATE','PLAN','COMMISSION'].map(h => (
            <span key={h} style={{ fontSize:10, fontWeight:700, color:DS.textMuted, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</span>
          ))}
        </div>
        {/* History rows */}
        {MOCK_COMMISSION.history.map((row, i) => (
          <div key={i}
            style={{ display:'grid', gridTemplateColumns:'1.5fr 0.8fr 1.2fr 0.8fr', gap:12, alignItems:'center', padding:'12px 20px', borderBottom: i < MOCK_COMMISSION.history.length - 1 ? `1px solid ${DS.bg}` : 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = DS.rowHover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ fontSize:13, fontWeight:600, color:DS.textPrimary }}>{row.clinic}</span>
            <span style={{ fontSize:12, color:DS.textMuted }}>{row.date}</span>
            <span style={{ fontSize:12, color:DS.textMuted }}>{row.plan}</span>
            <span style={{ fontSize:13, fontWeight:700, color:'#16a34a' }}>₹{row.commission.toLocaleString()}</span>
          </div>
        ))}
      </Card>}

      {/* ════ OVERLAYS ═════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAddPanel && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setShowAddPanel(false)}
              style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(2px)' }}/>
            <AddClinicPanel
              key="panel"
              onClose={() => setShowAddPanel(false)}
              onAdd={addClinicToPipeline}/>
          </>
        )}
        {noteTarget && (
          <NoteModal key="note" clinic={noteTarget} onClose={() => setNoteTarget(null)}/>
        )}
      </AnimatePresence>
    </div>
  )
}
