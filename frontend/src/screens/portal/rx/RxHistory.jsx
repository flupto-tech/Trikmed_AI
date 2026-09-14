'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FileText, Eye, Printer } from 'lucide-react'
import { initDemoDataIfNeeded, getAllPrescriptions } from '../../../../lib/rxStorage'
import BackButton from '../../../components/ui/BackButton'

const C = { navy:'#0F2342', coral:'#E84C3D', cream:'#F7F5F0', surface:'#FAFAF7', border:'#D3D1C7', muted:'#6B7A9A', blue:'#1A5CB5', green:'#16A34A', amber:'#D97706' }

function initials(name='') { return name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?' }

const STATUS_STYLE = {
  finalized: { bg:'#F0FDF4', color:'#15803D', label:'Finalized' },
  draft:     { bg:'#FFFBEB', color:'#92400E', label:'Draft' },
}

export default function RxHistory({ doctorId='dr001' }) {
  const router = useRouter()
  const [rxList, setRxList] = useState([])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all') // all | finalized | draft

  useEffect(() => {
    initDemoDataIfNeeded()
    setRxList(getAllPrescriptions())
  }, [])

  const filtered = rxList
    .filter(rx => {
      if (filter !== 'all' && rx.status !== filter) return false
      if (!q) return true
      const s = q.toLowerCase()
      return (
        rx.patientName?.toLowerCase().includes(s) ||
        rx.rxNumber?.toLowerCase().includes(s) ||
        rx.diagnosis?.some(d=>d.toLowerCase().includes(s))
      )
    })
    .sort((a,b) => new Date(b.date) - new Date(a.date))

  return (
    <div style={{ background:C.cream, minHeight:'100vh', fontFamily:"'Segoe UI',Inter,sans-serif" }}>
      <BackButton />

      {/* Top bar */}
      <div style={{ background:C.navy, padding:'14px 20px', display:'flex', alignItems:'center', gap:12 }}>
        <FileText size={18} color='#B5D4F4'/>
        <span style={{ fontSize:17, fontWeight:700, color:'#fff' }}>Rx History</span>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:16 }}>

        {/* Search + Filter */}
        <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:200, display:'flex', alignItems:'center', gap:8, border:`1.5px solid ${C.border}`, borderRadius:8, padding:'0 12px', background:'#fff' }}>
            <Search size={14} color={C.muted}/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by patient, Rx#, diagnosis…"
              style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:13, color:C.navy, padding:'9px 0', fontFamily:'inherit' }}/>
          </div>
          <div style={{ display:'flex', gap:5 }}>
            {['all','finalized','draft'].map(s=>(
              <button key={s} onClick={()=>setFilter(s)}
                style={{ padding:'8px 14px', border:`1px solid ${filter===s?C.navy:C.border}`, borderRadius:8, background:filter===s?C.navy:'#fff', color:filter===s?'#fff':C.muted, fontSize:12, cursor:'pointer', fontWeight:filter===s?600:400, textTransform:'capitalize' }}>
                {s==='all'?'All':STATUS_STYLE[s]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
          {[
            { label:'Total Rx', value:rxList.length, color:C.navy },
            { label:'Finalized', value:rxList.filter(r=>r.status==='finalized').length, color:C.green },
            { label:'Drafts', value:rxList.filter(r=>r.status==='draft').length, color:C.amber },
          ].map(s=>(
            <div key={s.label} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 16px', textAlign:'center' }}>
              <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:40, textAlign:'center', color:C.muted }}>
            <FileText size={32} color={C.border} style={{ marginBottom:10 }}/>
            <div style={{ fontSize:14, fontWeight:600 }}>{q||filter!=='all' ? 'No matching prescriptions' : 'No prescriptions yet'}</div>
            {!q && filter==='all' && <div style={{ fontSize:12, marginTop:6 }}>Start a new consultation to create your first Rx.</div>}
          </div>
        ) : (
          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 130px 80px 90px 120px', padding:'8px 14px', background:C.cream, borderBottom:`1px solid ${C.border}` }}>
              {['Patient / Diagnosis','Rx #','Medicines','Status','Actions'].map(h=>(
                <span key={h} style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</span>
              ))}
            </div>
            {filtered.map((rx,i)=>{
              const ss = STATUS_STYLE[rx.status] || STATUS_STYLE.draft
              const d = new Date(rx.date)
              return (
                <div key={rx.id} style={{ display:'grid', gridTemplateColumns:'1fr 130px 80px 90px 120px', alignItems:'center', padding:'12px 14px', background:i%2===0?'#fff':C.surface, borderBottom:`1px solid ${C.border}` }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', background:C.navy, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ color:'#fff', fontSize:10, fontWeight:700 }}>{initials(rx.patientName)}</span>
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:C.navy }}>{rx.patientName||'—'}</div>
                        <div style={{ fontSize:11, color:C.muted }}>{rx.diagnosis?.slice(0,2).join(', ')||'No diagnosis'}{rx.diagnosis?.length>2?'…':''}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:4, paddingLeft:38 }}>
                      {d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})} {d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:C.blue, fontFamily:'monospace' }}>{rx.rxNumber||'—'}</div>
                  <div style={{ fontSize:12, color:C.muted }}>{rx.medicines?.length||0} med{rx.medicines?.length!==1?'s':''}</div>
                  <div>
                    <span style={{ fontSize:11, background:ss.bg, color:ss.color, padding:'3px 8px', borderRadius:10, fontWeight:600 }}>{ss.label}</span>
                  </div>
                  <div style={{ display:'flex', gap:5 }}>
                    <button onClick={()=>router.push(`/portal/rx/${rx.id}`)}
                      style={{ display:'flex', alignItems:'center', gap:3, padding:'5px 9px', background:C.navy, color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:600 }}>
                      <Eye size={10}/>View
                    </button>
                    <button onClick={()=>router.push(`/portal/rx/${rx.id}?print=1`)}
                      style={{ display:'flex', alignItems:'center', gap:3, padding:'5px 9px', background:'#fff', color:C.navy, border:`1px solid ${C.border}`, borderRadius:6, cursor:'pointer', fontSize:11 }}>
                      <Printer size={10}/>Print
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
