'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Phone, ChevronDown, X, CheckCircle } from 'lucide-react'
import { portalStaff, ROLE_LABELS, ROLE_COLORS } from '../../data/portalData'
import { getSession } from '../../utils/auth'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { Button, IconButton } from '../../components/ui/Button'
import BackButton from '../../components/ui/BackButton'
// TODO: Ashutosh uncomment ↓
// import { portalApi } from '../../services/portalApi'

const DS = { bg:'#F7F9FF', cardBg:'#ffffff', cardBorder:'#DDE4F0', textPrimary:'#0F2D5E', textMuted:'#6B7A9A', textSubtle:'#9DBDE8', accent:'#1A5CB5', accentMid:'#1A5CB5', rowHover:'#F7F9FF', inputBorder:'#DDE4F0' }

const TABS = ['All','mr','sales','installer','city']

const PERF_COLOR = (p) => p >= 85 ? DS.accent : p >= 70 ? '#b45309' : '#dc2626'

function AddMemberModal({ onClose }) {
  const [form, setForm] = useState({ name:'', phone:'', role:'mr', city:'Jaipur', zone:'North Zone', manager:'' })
  const [submitted, setSubmitted] = useState(false)

  const set = (k,v) => setForm(f=>({ ...f, [k]:v }))

  const inputStyle = {
    width:'100%', height:40, borderRadius:8, padding:'0 12px',
    border:`1px solid ${DS.inputBorder}`, fontSize:13,
    color:DS.textPrimary, outline:'none', background:'#fff',
  }
  const labelStyle = { fontSize:12, fontWeight:600, color:DS.textMuted, display:'block', marginBottom:5 }

  if (submitted) return (
    <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
        style={{ background:'#fff', borderRadius:16, padding:40, textAlign:'center', maxWidth:380, width:'100%' }}>
        <CheckCircle size={48} style={{ color:DS.accent, margin:'0 auto 16px' }}/>
        <p style={{ fontSize:17, fontWeight:700, color:DS.textPrimary, marginBottom:6 }}>Member Added!</p>
        <p style={{ fontSize:13, color:DS.textMuted, marginBottom:20 }}>{form.name} has been added as {ROLE_LABELS[form.role]}.</p>
        <Button onClick={onClose}>Done</Button>
      </motion.div>
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} onClick={e=>e.stopPropagation()}
        style={{ background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:480, boxShadow:'0 16px 48px rgba(0,0,0,0.16)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <p style={{ fontSize:16, fontWeight:700, color:DS.textPrimary, margin:0 }}>Add Team Member</p>
          <IconButton icon={X} ariaLabel="Close" onClick={onClose} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input style={inputStyle} placeholder="e.g. Rahul Verma" value={form.name} onChange={e=>set('name',e.target.value)}
              onFocus={e=>e.target.style.borderColor=DS.accentMid} onBlur={e=>e.target.style.borderColor=DS.inputBorder}/>
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} placeholder="+91 98765 43210" value={form.phone} onChange={e=>set('phone',e.target.value)}
              onFocus={e=>e.target.style.borderColor=DS.accentMid} onBlur={e=>e.target.style.borderColor=DS.inputBorder}/>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div>
            <label style={labelStyle}>Role</label>
            <select style={{ ...inputStyle, cursor:'pointer' }} value={form.role} onChange={e=>set('role',e.target.value)}>
              {['mr','sales','installer','city'].map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>City</label>
            <select style={{ ...inputStyle, cursor:'pointer' }} value={form.city} onChange={e=>set('city',e.target.value)}>
              {['Jaipur','Delhi','Mumbai','Ahmedabad','Pune','Hyderabad','Chennai','Kolkata','Bengaluru','Lucknow'].map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Zone</label>
          <select style={{ ...inputStyle, cursor:'pointer' }} value={form.zone} onChange={e=>set('zone',e.target.value)}>
            {['North Zone','South Zone','West Zone','East Zone'].map(z=><option key={z} value={z}>{z}</option>)}
          </select>
        </div>

        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button fullWidth onClick={() => { if (form.name && form.phone) setSubmitted(true) }}
            disabled={!form.name || !form.phone}>
            Add Member
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function TeamManagement() {
  const session = getSession()
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError,   setPageError]   = useState(null)

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    try {
      // TODO: Ashutosh uncomment ↓
      // const res = await portalApi.getTeam()
      // setTeamList(res)
    } catch (e) {
      setPageError(e?.message || e?.detail || 'Failed to load team')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const [tab, setTab]         = useState('All')
  const [search, setSearch]   = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const isScopedRole = ['city','sales','mr','installer'].includes(session?.role)

  let members = portalStaff
  if (isScopedRole && session?.city) members = members.filter(m=>m.city===session?.city)
  if (tab !== 'All') members = members.filter(m=>m.role===tab)
  if (search) {
    const q = search.toLowerCase()
    members = members.filter(m=>m.name.toLowerCase().includes(q)||m.city.toLowerCase().includes(q)||(m.zone||'').toLowerCase().includes(q))
  }

  const canAdd = ['super','zone','city'].includes(session?.role)

  if (pageLoading) return <LoadingSpinner message="Loading team…" />
  if (pageError)   return <ErrorBanner message={pageError} onRetry={loadData} />

  return (
    <div style={{ padding:24 }}>
      <BackButton />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:DS.textPrimary, margin:0 }}>Team Management</h1>
          <p style={{ fontSize:13, color:DS.textMuted, marginTop:4 }}>
            {isScopedRole ? `${session?.city} · ` : ''}{portalStaff.length} members across all roles
          </p>
        </div>
        {canAdd && (
          <button onClick={()=>setShowAdd(true)}
            style={{ display:'flex', alignItems:'center', gap:6, height:38, padding:'0 16px', borderRadius:8, border:'none', background:DS.accent, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.background='#0F2D5E'} onMouseLeave={e=>e.currentTarget.style.background=DS.accent}>
            <Plus size={15}/> Add Member
          </button>
        )}
      </div>

      {/* Tabs + Search */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', gap:4, background:'#fff', border:`1px solid ${DS.cardBorder}`, borderRadius:8, padding:3 }}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              style={{ padding:'5px 14px', borderRadius:6, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', textTransform:'capitalize',
                background:tab===t?DS.accent:'transparent', color:tab===t?'#fff':DS.textMuted, transition:'all 0.15s' }}>
              {t==='All'?'All':ROLE_LABELS[t]||t}
            </button>
          ))}
        </div>
        <div style={{ position:'relative', marginLeft:'auto' }}>
          <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:DS.textSubtle }}/>
          <input type="text" placeholder="Search members…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{ height:36, width:220, borderRadius:8, padding:'0 12px 0 30px', border:`1px solid ${DS.inputBorder}`, fontSize:13, color:DS.textPrimary, outline:'none' }}
            onFocus={e=>e.target.style.borderColor=DS.accentMid} onBlur={e=>e.target.style.borderColor=DS.inputBorder}/>
        </div>
      </div>

      {/* Table */}
      <div style={{ background:DS.cardBg, border:`1px solid ${DS.cardBorder}`, borderRadius:12, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 120px 80px 80px 80px 100px', gap:12, padding:'10px 20px', background:DS.bg }}>
          {['Member','Role','City / Zone','Clinics','Joined','Performance','Status'].map(h=>(
            <span key={h} style={{ fontSize:10, fontWeight:600, color:DS.textMuted, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</span>
          ))}
        </div>

        {members.length === 0 ? (
          <div style={{ padding:'40px 20px', textAlign:'center' }}>
            <p style={{ fontSize:14, color:DS.textMuted }}>No team members found.</p>
          </div>
        ) : members.map((m,i)=>{
          const rc = ROLE_COLORS[m.role]||{ bg:'#f3f4f6', color:'#374151' }
          return (
            <motion.div key={m.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.02 }}
              style={{ display:'grid', gridTemplateColumns:'1fr 90px 120px 80px 80px 80px 100px', gap:12, alignItems:'center', padding:'12px 20px', borderBottom:i<members.length-1?`1px solid ${DS.bg}`:'none' }}
              onMouseEnter={e=>e.currentTarget.style.background=DS.rowHover}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>

              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:`${rc.bg}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:rc.color }}>{m.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</span>
                </div>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:500, color:DS.textPrimary, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.name}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:3, marginTop:1 }}>
                    <Phone size={10} style={{ color:DS.textSubtle }}/>
                    <p style={{ fontSize:11, color:DS.textSubtle, margin:0 }}>{m.phone}</p>
                  </div>
                </div>
              </div>

              <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4, background:rc.bg, color:rc.color, textTransform:'capitalize', width:'fit-content' }}>{ROLE_LABELS[m.role]||m.role}</span>

              <div>
                <p style={{ fontSize:12, color:DS.textPrimary, margin:0 }}>{m.city}</p>
                <p style={{ fontSize:11, color:DS.textSubtle, margin:'1px 0 0' }}>{m.zone}</p>
              </div>

              <span style={{ fontSize:13, color:DS.textPrimary }}>{m.clinics ?? '—'}</span>
              <span style={{ fontSize:12, color:DS.textSubtle }}>Since {m.joinDate?.slice(0,7)||'—'}</span>

              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ flex:1, height:4, borderRadius:2, background:DS.cardBorder, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:2, background:PERF_COLOR(m.performance), width:`${m.performance}%` }}/>
                </div>
                <span style={{ fontSize:10, fontWeight:600, color:PERF_COLOR(m.performance), minWidth:24 }}>{m.performance}</span>
              </div>

              <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:4,
                  background:m.status==='active'?'#EFF6FF':'#f3f4f6', color:m.status==='active'?'#1A5CB5':'#6b7280',
                  border:`1px solid ${m.status==='active'?'#BFDBFE':'#e5e7eb'}` }}>
                  {m.status==='active'?'Active':'Inactive'}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      <AnimatePresence>
        {showAdd && <AddMemberModal onClose={()=>setShowAdd(false)}/>}
      </AnimatePresence>
    </div>
  )
}
