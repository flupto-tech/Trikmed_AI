'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Clock, AlertTriangle, MapPin, List, CheckSquare, X, FileWarning } from 'lucide-react'
import { useStore, actions } from '../../store/portalStore'
import { getSession } from '../../utils/auth'
import Toast from '../../components/Toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { Button, IconButton } from '../../components/ui/Button'
import BackButton from '../../components/ui/BackButton'
// TODO: Ashutosh uncomment ↓
// import { portalApi } from '../../services/portalApi'

const DS = { bg:'#F7F9FF', cardBg:'#ffffff', cardBorder:'#DDE4F0', textPrimary:'#0F2D5E', textMuted:'#6B7A9A', textSubtle:'#9DBDE8', accent:'#1A5CB5', accentMid:'#1A5CB5', rowHover:'#F7F9FF', inputBorder:'#DDE4F0' }
function Card({ children, style={} }) { return <div style={{ background:DS.cardBg, border:`1px solid ${DS.cardBorder}`, borderRadius:12, ...style }}>{children}</div> }

const STEP_LABELS = {
  whatsapp: 'WhatsApp number verified & connected',
  qr:       'QR Code printed and placed at reception',
  training: 'Staff trained on TrikMed dashboard',
  test:     'Test appointment booked successfully',
  staff:    'Doctor onboarded to dashboard',
}

const ISTATUS = {
  today:     { bg:'#dbeafe', color:'#1d4ed8', label:'Today'    },
  upcoming:  { bg:'#fef3c7', color:'#92400e', label:'Upcoming' },
  completed: { bg:'#EFF6FF', color:'#1A5CB5', label:'Done'     },
}

function ReportIssueModal({ install, onClose }) {
  const [issue, setIssue] = useState('')
  const [done, setDone] = useState(false)
  if (done) return (
    <div style={{ position:'fixed', inset:0, zIndex:60, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <motion.div initial={{ scale:0.85, opacity:0 }} animate={{ scale:1, opacity:1 }}
        style={{ background:'#fff', borderRadius:16, padding:36, textAlign:'center', maxWidth:360, width:'100%' }}>
        <CheckCircle size={44} style={{ color:'#b45309', margin:'0 auto 14px' }}/>
        <p style={{ fontSize:16, fontWeight:700, color:DS.textPrimary, margin:'0 0 6px' }}>Issue Reported!</p>
        <p style={{ fontSize:13, color:DS.textMuted, marginBottom:20 }}>City Manager will follow up shortly.</p>
        <Button onClick={onClose}>Done</Button>
      </motion.div>
    </div>
  )
  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} onClick={e=>e.stopPropagation()}
        style={{ background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:440 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <p style={{ fontSize:16, fontWeight:700, color:DS.textPrimary, margin:0 }}>Report Issue</p>
          <IconButton icon={X} ariaLabel="Close" onClick={onClose} />
        </div>
        <div style={{ padding:'10px 14px', background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8, marginBottom:14 }}>
          <p style={{ fontSize:13, fontWeight:600, color:'#c2410c', margin:0 }}>{install.clinic}</p>
          <p style={{ fontSize:12, color:'#ea580c', margin:'2px 0 0' }}>{install.address}</p>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:12, fontWeight:600, color:DS.textMuted, display:'block', marginBottom:5 }}>Describe the Issue *</label>
          <textarea value={issue} onChange={e=>setIssue(e.target.value)} rows={4}
            placeholder="What's the problem? WhatsApp not connecting? Device issue? Doctor unavailable?"
            style={{ width:'100%', borderRadius:8, padding:'10px 12px', border:`1px solid ${DS.inputBorder}`, fontSize:13, color:DS.textPrimary, outline:'none', background:'#fff', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' }}
            onFocus={e=>e.target.style.borderColor=DS.accentMid} onBlur={e=>e.target.style.borderColor=DS.inputBorder}/>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="danger" fullWidth
            onClick={() => { if (issue) { actions.reportIssue(install.id, install.clinic, issue); setDone(true) } }}
            disabled={!issue}>
            Submit Report
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

function ChecklistModal({ install, onClose }) {
  const [steps, setSteps] = useState({ ...install.steps })
  const allDone = Object.values(steps).every(Boolean)
  const doneCount = Object.values(steps).filter(Boolean).length
  const total = Object.keys(steps).length

  const handleComplete = () => {
    actions.completeInstall(install.id)
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} onClick={e=>e.stopPropagation()}
        style={{ background:'#fff', border:`1px solid ${DS.cardBorder}`, borderRadius:16, padding:28, width:'100%', maxWidth:460, boxShadow:'0 16px 48px rgba(0,0,0,0.16)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
          <p style={{ fontSize:16, fontWeight:700, color:DS.textPrimary, margin:0 }}>{install.clinic}</p>
          <IconButton icon={X} ariaLabel="Close" onClick={onClose} />
        </div>
        <p style={{ fontSize:12, color:DS.textMuted, margin:'0 0 6px' }}>{install.address}</p>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
          <div style={{ flex:1, height:5, borderRadius:3, background:DS.cardBorder, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:3, background:allDone?DS.accent:'#f59e0b', width:`${(doneCount/total)*100}%`, transition:'width 0.3s' }}/>
          </div>
          <span style={{ fontSize:12, fontWeight:600, color:allDone?DS.accent:'#b45309', minWidth:40 }}>{doneCount}/{total}</span>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {Object.entries(STEP_LABELS).filter(([k])=>steps[k]!==undefined).map(([key, label]) => (
            <label key={key} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:8, background:steps[key]?'#EFF6FF':'#fafafa', border:`1px solid ${steps[key]?'#BFDBFE':DS.cardBorder}`, cursor:'pointer', transition:'all 0.15s' }}>
              <input type="checkbox" checked={steps[key]} onChange={e=>{
                const newSteps = { ...steps, [key]:e.target.checked }
                setSteps(newSteps)
                actions.updateInstallSteps(install.id, newSteps)
              }} style={{ width:16, height:16, accentColor:DS.accent }}/>
              <span style={{ fontSize:13, fontWeight:steps[key]?600:400, color:steps[key]?DS.accent:DS.textPrimary, flex:1 }}>{label}</span>
              {steps[key] && <CheckCircle size={15} style={{ color:DS.accent, flexShrink:0 }}/>}
            </label>
          ))}
        </div>

        <div style={{ display:'flex', gap:8, marginTop:18 }}>
          <Button variant="secondary" fullWidth onClick={onClose}>Close</Button>
          <Button fullWidth onClick={handleComplete} disabled={!allDone}>
            {allDone ? '✓ Mark Complete & Notify CM' : `Complete all ${total} steps first`}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

function InstallCard({ inst, onChecklist, onReport }) {
  const is = ISTATUS[inst.status]
  const stepsDone  = Object.values(inst.steps).filter(Boolean).length
  const totalSteps = Object.keys(inst.steps).length
  return (
    <div style={{ background:DS.cardBg, border:`1px solid ${DS.cardBorder}`, borderRadius:10, padding:'14px 16px', marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:13, fontWeight:600, color:DS.textPrimary, margin:0 }}>{inst.clinic}</p>
          <p style={{ fontSize:12, color:DS.textMuted, margin:'2px 0' }}>{inst.doctor}</p>
        </div>
        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4, background:is.bg, color:is.color, flexShrink:0, marginLeft:8 }}>{is.label}</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:4 }}>
        <MapPin size={10} style={{ color:DS.textSubtle }}/>
        <span style={{ fontSize:11, color:DS.textSubtle }}>{inst.address}</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:8 }}>
        <Clock size={10} style={{ color:DS.textMuted }}/>
        <span style={{ fontSize:11, color:DS.textMuted }}>{inst.date} · {inst.time} · MR: {inst.mr}</span>
      </div>
      {inst.status !== 'completed' ? (
        <div style={{ display:'flex', gap:6, justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:11, color:DS.textSubtle }}>{stepsDone}/{totalSteps} steps done</span>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={()=>onReport(inst)}
              style={{ fontSize:11, padding:'4px 9px', borderRadius:6, background:'transparent', color:'#dc2626', border:'1px solid #fecaca', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
              <FileWarning size={10}/> Issue
            </button>
            <button onClick={()=>onChecklist(inst)}
              style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6, background:DS.accent, color:'#fff', border:'none', cursor:'pointer' }}>
              Checklist →
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <CheckCircle size={13} style={{ color:'#1A5CB5' }}/>
          <span style={{ fontSize:12, fontWeight:600, color:'#1A5CB5' }}>Installation Complete</span>
        </div>
      )}
    </div>
  )
}

export default function InstallerDash() {
  const session  = getSession()
  const store    = useStore()
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError,   setPageError]   = useState(null)

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    try {
      // TODO: Ashutosh uncomment ↓
      // const res = await portalApi.getRoleDashboard('installer')
      // setDashData(res)
    } catch (e) {
      setPageError(e?.message || e?.detail || 'Failed to load dashboard')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const [checklist, setChecklist] = useState(null)
  const [reportInst, setReportInst] = useState(null)

  const installs  = store.installations
  const today     = installs.filter(i=>i.status==='today')
  const upcoming  = installs.filter(i=>i.status==='upcoming')
  const done      = installs.filter(i=>i.status==='completed')

  const stats = [
    { icon:List,        label:'Pending',               value:today.length+upcoming.length, sub:`${today.length} today · ${upcoming.length} upcoming`, color:'#b45309', bg:'#fef3c7' },
    { icon:Clock,       label:"Today's Schedule",       value:today.length,                 sub:'Installations due today',                             color:'#1d4ed8', bg:'#dbeafe' },
    { icon:CheckCircle, label:'Completed',              value:done.length,                  sub:'This period',                                         color:'#1A5CB5', bg:'#EFF6FF' },
    { icon:CheckSquare, label:'Issues Reported',        value:store.issues.length,           sub:'Logged this month',                                   color:'#1A5CB5', bg:'#EFF6FF' },
  ]

  if (pageLoading) return <LoadingSpinner message="Loading installer dashboard…" />
  if (pageError)   return <ErrorBanner message={pageError} onRetry={loadData} />

  return (
    <div style={{ padding:24 }}>
      <BackButton />
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:700, color:DS.textPrimary, margin:0 }}>Installer Dashboard</h1>
        <p style={{ fontSize:13, color:DS.textMuted, marginTop:4 }}>Installer · {session?.name} · {session?.city}</p>
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
              <p style={{ fontSize:11, color:DS.textSubtle, marginTop:4 }}>{s.sub}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card style={{ padding:20 }}>
          <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary, margin:'0 0 14px' }}>Today's Schedule</p>
          {today.length===0 ? (
            <p style={{ fontSize:13, color:DS.textSubtle, textAlign:'center', padding:'20px 0' }}>No installations today</p>
          ) : today.map(i=><InstallCard key={i.id} inst={i} onChecklist={setChecklist} onReport={setReportInst}/>)}
        </Card>
        <Card style={{ padding:20 }}>
          <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary, margin:'0 0 14px' }}>Upcoming Queue</p>
          {upcoming.length===0 ? (
            <p style={{ fontSize:13, color:DS.textSubtle, textAlign:'center', padding:'20px 0' }}>No upcoming installs</p>
          ) : upcoming.map(i=><InstallCard key={i.id} inst={i} onChecklist={setChecklist} onReport={setReportInst}/>)}
        </Card>
      </div>

      {done.length>0 && (
        <Card style={{ padding:20, marginBottom:16 }}>
          <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary, margin:'0 0 14px' }}>Completed ({done.length})</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {done.map(i=><InstallCard key={i.id} inst={i} onChecklist={setChecklist} onReport={setReportInst}/>)}
          </div>
        </Card>
      )}

      {store.issues.length>0 && (
        <Card style={{ overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:`1px solid ${DS.cardBorder}` }}>
            <p style={{ fontSize:14, fontWeight:600, color:DS.textPrimary, margin:0 }}>Reported Issues ({store.issues.length})</p>
          </div>
          {store.issues.map((issue,i)=>(
            <div key={issue.id} style={{ padding:'12px 20px', borderBottom:i<store.issues.length-1?`1px solid ${DS.bg}`:'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:DS.textPrimary, margin:0 }}>{issue.clinicName}</p>
                  <p style={{ fontSize:12, color:DS.textMuted, margin:'3px 0' }}>{issue.issueText}</p>
                  <p style={{ fontSize:11, color:DS.textSubtle, margin:0 }}>{issue.reportedAt}</p>
                </div>
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4, background:'#fef3c7', color:'#92400e' }}>Open</span>
              </div>
            </div>
          ))}
        </Card>
      )}

      <AnimatePresence>
        {checklist && <ChecklistModal install={checklist} onClose={()=>setChecklist(null)}/>}
        {reportInst && <ReportIssueModal install={reportInst} onClose={()=>setReportInst(null)}/>}
      </AnimatePresence>
      <Toast toast={store.toast}/>
    </div>
  )
}
