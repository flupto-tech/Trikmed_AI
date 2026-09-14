'use client'
import { useState, useEffect } from 'react'
import { Search, Wifi, WifiOff, QrCode, X, Download } from 'lucide-react'
import QRCode from 'qrcode'
import { motion } from 'framer-motion'
import { useNavigate } from '../../utils/navigation'
import { portalClinics } from '../../data/portalData'
import { getSession } from '../../utils/auth'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
// TODO: Ashutosh uncomment ↓
import { portalApi } from '../../services/portalApi'

const DS = { bg:'#F7F9FF', cardBg:'#ffffff', cardBorder:'#DDE4F0', textPrimary:'#0F2D5E', textMuted:'#6B7A9A', textSubtle:'#9DBDE8', accent:'#1A5CB5', accentMid:'#1A5CB5', rowHover:'#F7F9FF', inputBorder:'#DDE4F0' }

const STATUS_BADGE = {
  active:   { bg:'#EFF6FF', color:'#1A5CB5', border:'#BFDBFE' },
  approved: { bg:'#f0fdf4', color:'#15803d', border:'#bbf7d0' },
  pending_approval: { bg:'#fef3c7', color:'#92400e', border:'#fde68a' },
  trial:    { bg:'#fef3c7', color:'#92400e', border:'#fde68a' },
  inactive: { bg:'#f3f4f6', color:'#374151', border:'#e5e7eb' },
  churned:  { bg:'#fee2e2', color:'#991b1b', border:'#fecaca' },
}
const PLAN_BADGE = {
  Basic:  { bg:'#f3f4f6', color:'#374151', border:'#e5e7eb' },
  Growth: { bg:'#dbeafe', color:'#1d4ed8', border:'#bfdbfe' },
  Pro:    { bg:'#ede9fe', color:'#6d28d9', border:'#ddd6fe' },
}

const PLANS   = ['Basic','Growth','Pro']
const STATUSES = ['active','approved','pending_approval','trial','inactive','churned']

const toClinicRow = (c) => ({
  id: c.id,
  qrCode: c.qr_code || '',
  qrBookingUrl: c.qr_booking_url || '',
  name: c.name || c.clinic_name || c.clinicName || 'Unnamed Clinic',
  doctor: c.doctor || c.doctor_name || c.doctorName || '',
  city: c.city || '',
  zone: c.zone || '',
  plan: c.plan || c.plan_type || 'Basic',
  status: c.status || 'trial',
  mr: c.mr || c.assigned_mr || '',
  lastActive: c.lastActive || 'Today',
  whatsapp: c.whatsapp || (c.whatsapp_number ? 'connected' : 'disconnected'),
  joinDate: c.joinDate || c.submittedDate || c.created_at || 'Today',
})

export default function ClinicsList() {
  const session  = getSession()
  const navigate = useNavigate()
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError,   setPageError]   = useState(null)
  const [clinicsList, setClinicsList] = useState(() => portalClinics.map(toClinicRow))

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    try {
      // TODO: Ashutosh uncomment ↓
      const res = await portalApi.getClinics()
      setClinicsList(res.map(toClinicRow))
    } catch (e) {
      setPageError(e?.message || e?.detail || 'Failed to load clinics')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const [qrModal, setQrModal] = useState(null) // { id, name, dataUrl }

  const [search, setSearch]   = useState('')
  const [city, setCity]       = useState('all')
  const [zone, setZone]       = useState('all')
  const [plan, setPlan]       = useState('all')
  const [status, setStatus]   = useState('all')
  const [page, setPage]       = useState(1)
  const PER = 12
  const cities = [...new Set(clinicsList.map(c=>c.city).filter(Boolean))].sort()
  const zones = [...new Set(clinicsList.map(c=>c.zone).filter(Boolean))].sort()

  // Role-based filter: city/sales/mr/installer only see their city
  const isScopedRole = ['city','sales','mr','installer'].includes(session?.role)

  let clinics = clinicsList
  if (isScopedRole && session?.city) clinics = clinics.filter(c=>c.city===session?.city)
  if (city !== 'all')   clinics = clinics.filter(c=>c.city===city)
  if (zone !== 'all')   clinics = clinics.filter(c=>c.zone===zone)
  if (plan !== 'all')   clinics = clinics.filter(c=>c.plan===plan)
  if (status !== 'all') clinics = clinics.filter(c=>c.status===status)
  if (search) {
    const q = search.toLowerCase()
    clinics = clinics.filter(c=>c.name.toLowerCase().includes(q)||c.doctor.toLowerCase().includes(q)||c.city.toLowerCase().includes(q))
  }

  const total = clinics.length
  const pages = Math.ceil(total/PER)
  const rows  = clinics.slice((page-1)*PER, page*PER)

  const selectStyle = { height:36, borderRadius:8, padding:'0 10px', border:`1px solid ${DS.inputBorder}`, background:'#fff', fontSize:13, color:DS.textPrimary, outline:'none', cursor:'pointer' }

  function openQr(e, clinic) {
    e.stopPropagation()
    if (!clinic.qrBookingUrl) return
    QRCode.toDataURL(clinic.qrBookingUrl, { width: 220, margin: 2, color: { dark: '#0F2342', light: '#ffffff' } })
      .then(dataUrl => setQrModal({ id: clinic.id, qrCode: clinic.qrCode, name: clinic.name, dataUrl }))
      .catch(() => {})
  }

  function downloadQr() {
    if (!qrModal?.dataUrl) return
    const a = document.createElement('a')
    a.href = qrModal.dataUrl
    a.download = `qr-${qrModal.qrCode || qrModal.id}.png`
    a.click()
  }

  if (pageLoading) return <LoadingSpinner message="Loading clinics…" />
  if (pageError)   return <ErrorBanner message={pageError} onRetry={loadData} />

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:700, color:DS.textPrimary, margin:0 }}>Clinics</h1>
        <p style={{ fontSize:13, color:DS.textMuted, marginTop:4 }}>
          {isScopedRole ? `${session?.city} · ` : ''}{total} clinics
        </p>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:20 }}>
        <div style={{ position:'relative', flex:'1 1 200px', minWidth:180 }}>
          <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:DS.textSubtle }}/>
          <input type="text" placeholder="Search clinic, doctor…" value={search} onChange={e=>{ setSearch(e.target.value); setPage(1) }}
            style={{ width:'100%', height:36, borderRadius:8, padding:'0 12px 0 32px', border:`1px solid ${DS.inputBorder}`, fontSize:13, color:DS.textPrimary, outline:'none' }}
            onFocus={e=>e.target.style.borderColor=DS.accentMid} onBlur={e=>e.target.style.borderColor=DS.inputBorder}/>
        </div>
        {!isScopedRole && (
          <>
            <select value={zone} onChange={e=>{ setZone(e.target.value); setPage(1) }} style={selectStyle}>
              <option value="all">All Zones</option>
              {zones.map(z=><option key={z} value={z}>{z}</option>)}
            </select>
            <select value={city} onChange={e=>{ setCity(e.target.value); setPage(1) }} style={selectStyle}>
              <option value="all">All Cities</option>
              {cities.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </>
        )}
        <select value={plan} onChange={e=>{ setPlan(e.target.value); setPage(1) }} style={selectStyle}>
          <option value="all">All Plans</option>
          {PLANS.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <select value={status} onChange={e=>{ setStatus(e.target.value); setPage(1) }} style={selectStyle}>
          <option value="all">All Status</option>
          {STATUSES.map(s=><option key={s} value={s} style={{ textTransform:'capitalize' }}>{s}</option>)}
        </select>
        <span style={{ fontSize:12, color:DS.textMuted, display:'flex', alignItems:'center' }}>{total} results</span>
      </div>

      {/* Table */}
      <div style={{ background:DS.cardBg, border:`1px solid ${DS.cardBorder}`, borderRadius:12, overflow:'hidden' }}>
        {/* Header */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 80px 80px 80px 90px 80px 80px 100px 44px', gap:10, padding:'10px 20px', background:DS.bg }}>
          {['Clinic','Doctor','City','Plan','Status','MR','Last Active','WA','Clinic ID','QR'].map(h=>(
            <span key={h} style={{ fontSize:10, fontWeight:600, color:DS.textMuted, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</span>
          ))}
        </div>
        {rows.length === 0 ? (
          <div style={{ padding:'40px 20px', textAlign:'center' }}>
            <p style={{ fontSize:14, color:DS.textMuted }}>No clinics found matching your filters.</p>
          </div>
        ) : rows.map((c,i)=>{
          const sb = STATUS_BADGE[c.status] || STATUS_BADGE.active
          const pb = PLAN_BADGE[c.plan] || PLAN_BADGE.Basic
          return (
            <motion.div key={c.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.02 }}
              style={{ display:'grid', gridTemplateColumns:'1fr 1fr 80px 80px 80px 90px 80px 80px 100px 44px', gap:10, alignItems:'center', padding:'12px 20px', borderBottom:i<rows.length-1?`1px solid ${DS.bg}`:'none', cursor:'pointer' }}
              onClick={()=>navigate(`/portal/clinics/${c.id}`)}
              onMouseEnter={e=>e.currentTarget.style.background=DS.rowHover}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div>
                <p style={{ fontSize:13, fontWeight:500, color:DS.textPrimary, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</p>
                <p style={{ fontSize:11, color:DS.textSubtle, margin:'1px 0 0' }}>Joined {c.joinDate}</p>
              </div>
              <span style={{ fontSize:12, color:DS.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.doctor}</span>
              <span style={{ fontSize:12, color:DS.textMuted }}>{c.city}</span>
              <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:4, background:pb.bg, color:pb.color, border:`1px solid ${pb.border}` }}>{c.plan}</span>
              <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:4, background:sb.bg, color:sb.color, border:`1px solid ${sb.border}`, textTransform:'capitalize' }}>{c.status}</span>
              <span style={{ fontSize:11, color:DS.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.mr}</span>
              <span style={{ fontSize:11, color:c.lastActive==='Today'?DS.accent:c.lastActive.includes('days')?'#b45309':DS.textMuted, fontWeight:c.lastActive==='Today'?600:400 }}>{c.lastActive}</span>
              <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                {c.whatsapp==='connected'
                  ? <><Wifi size={12} style={{ color:'#1A5CB5' }}/><span style={{ fontSize:10, color:'#1A5CB5', fontWeight:600 }}>On</span></>
                  : <><WifiOff size={12} style={{ color:'#dc2626' }}/><span style={{ fontSize:10, color:'#dc2626', fontWeight:600 }}>Off</span></>
                }
              </span>
              <span style={{ fontSize:11, fontWeight:600, color:'#6B7A9A', fontFamily:'monospace', letterSpacing:'0.02em' }}>{c.id}</span>
              <button onClick={e=>openQr(e,c)} title="View QR Code"
                style={{ width:28, height:28, borderRadius:6, border:'1px solid #DDE4F0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#6B7A9A' }}
                onMouseEnter={e=>{ e.currentTarget.style.background='#F7F9FF'; e.currentTarget.style.color='#0F2342' }}
                onMouseLeave={e=>{ e.currentTarget.style.background='#fff'; e.currentTarget.style.color='#6B7A9A' }}>
                <QrCode size={13}/>
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div onClick={()=>setQrModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:16, padding:28, textAlign:'center', maxWidth:300, width:'90%' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ textAlign:'left' }}>
                <p style={{ fontSize:14, fontWeight:700, color:'#0F2342', margin:0 }}>{qrModal.name}</p>
                <p style={{ fontSize:11, color:'#6B7A9A', margin:'2px 0 0', fontFamily:'monospace' }}>{qrModal.id}</p>
              </div>
              <button onClick={()=>setQrModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6B7A9A', padding:4, display:'flex', alignItems:'center' }}>
                <X size={16}/>
              </button>
            </div>
            <img src={qrModal.dataUrl} alt="QR" style={{ width:180, height:180, borderRadius:8, border:'1px solid #DDE4F0' }}/>
            <p style={{ fontSize:11, color:'#6B7A9A', margin:'10px 0 14px' }}>Patients scan to book appointment</p>
            <button onClick={downloadQr} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#0F2342', color:'#fff', border:'none', borderRadius:10, padding:'8px 18px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              <Download size={12}/> Download PNG
            </button>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:16 }}>
          <span style={{ fontSize:12, color:DS.textMuted }}>Page {page} of {pages} · {total} total</span>
          <div style={{ display:'flex', gap:8 }}>
            {[['← Prev',()=>setPage(p=>Math.max(1,p-1)),page===1],['Next →',()=>setPage(p=>Math.min(pages,p+1)),page===pages]].map(([l,fn,dis])=>(
              <button key={l} onClick={fn} disabled={dis}
                style={{ height:32, padding:'0 14px', borderRadius:8, border:`1px solid ${DS.cardBorder}`, background:'#fff', fontSize:12, color:dis?DS.textSubtle:DS.textPrimary, cursor:dis?'not-allowed':'pointer', opacity:dis?0.5:1, fontWeight:500 }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
