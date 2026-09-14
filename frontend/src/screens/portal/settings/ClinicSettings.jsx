'use client'
import { useState, useEffect } from 'react'
import {
  Building2, Users, UserCog, FileText, Clock, Bell,
  Plus, Trash2, Upload, Check, Star, Lock, ChevronRight,
  X, AlertTriangle, Heart, Layers, IndianRupee, Palette, Moon, Sun,
} from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'
import { Button, IconButton } from '../../../components/ui/Button'
import { getClinicRole, getSession } from '../../../utils/auth'
import { getClinicConfig, saveClinicConfig, getFavourites, toggleFavourite } from '../../../../lib/rxStorage'
import BackButton from '../../../components/ui/BackButton'
import { FEE_DEFAULTS } from '../../../../lib/fees'
import { formatPhone, isValidPhone, phoneError, phoneInputValue } from '../../../utils/phone'

const C = {
  navy:'#0F2342', coral:'#E84C3D', cream:'#F7F5F0', surface:'#FAFAF7',
  border:'#D3D1C7', muted:'#6B7A9A', blue:'#1A5CB5', green:'#16A34A',
  amber:'#D97706',
}

const SPECIALTIES = ['General Medicine','Pediatrics','Gynaecology','Cardiology','Orthopaedics','ENT','Dermatology','Dental','Ayurveda','Other']
const EMPTY_DOC   = { id:'', name:'', qualifications:'', registrationNumber:'', specialty:'General Medicine', phone:'', email:'', signatureUrl:'', isPrimary:false }
const DAYS        = ['mon','tue','wed','thu','fri','sat','sun']
const DAY_LABELS  = { mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', sun:'Sun' }

const SECTION_ACCESS = {
  'clinic-info':   ['owner','doctor_owner'],
  'doctors':       ['owner','doctor_owner'],
  'staff':         ['owner','doctor_owner'],
  'prescription':  ['owner','doctor','doctor_owner'],
  'timings':       ['owner','receptionist','doctor_owner'],
  'notifications': ['owner','doctor','doctor_owner'],
  'cabin':         ['owner','doctor_owner'],
  'fees':          ['owner','doctor_owner'],
  'appearance':    ['owner','doctor_owner','doctor','receptionist','staff'],
}

const SECTIONS = [
  { id:'clinic-info',   label:'Clinic Info',          icon:Building2    },
  { id:'doctors',       label:'Doctors',              icon:Users        },
  { id:'staff',         label:'Staff & Permissions',  icon:UserCog      },
  { id:'prescription',  label:'Prescription Defaults',icon:FileText     },
  { id:'timings',       label:'Clinic Timings',       icon:Clock        },
  { id:'notifications', label:'Notifications',        icon:Bell         },
  { id:'cabin',         label:'Cabin Settings',       icon:Layers       },
  { id:'fees',          label:'Fees & Payment',       icon:IndianRupee  },
  { id:'appearance',    label:'Appearance',           icon:Palette      },
]

const PERMISSION_ROWS = [
  { key:'canCreatePrescription',  label:'OPD Console / Rx Write' },
  { key:'canViewReportsPending',  label:'Reports Pending'        },
  { key:'canViewPatients',        label:'View Patients'          },
  { key:'canViewRevenue',         label:'View Revenue'           },
  { key:'canViewWhatsApp',        label:'View WhatsApp Chats'    },
  { key:'canViewMrManager',       label:'MR Manager'             },
  { key:'canManageStaff',         label:'Manage Staff'           },
  { key:'canEditSettings',        label:'Edit Settings'          },
  { key:'canExportData',          label:'Export Data'            },
]
const ROLE_DEFAULTS = {
  owner:        { canCreatePrescription:true,  canViewReportsPending:true,  canViewPatients:true,  canViewRevenue:true,  canViewWhatsApp:true,  canViewMrManager:true,  canManageStaff:true,  canEditSettings:true,  canExportData:true  },
  doctor_owner: { canCreatePrescription:true,  canViewReportsPending:true,  canViewPatients:true,  canViewRevenue:true,  canViewWhatsApp:true,  canViewMrManager:true,  canManageStaff:true,  canEditSettings:true,  canExportData:true  },
  doctor:       { canCreatePrescription:true,  canViewReportsPending:true,  canViewPatients:true,  canViewRevenue:true,  canViewWhatsApp:true,  canViewMrManager:true,  canManageStaff:false, canEditSettings:false, canExportData:false },
  receptionist: { canCreatePrescription:false, canViewReportsPending:true,  canViewPatients:true,  canViewRevenue:false, canViewWhatsApp:true,  canViewMrManager:true,  canManageStaff:false, canEditSettings:false, canExportData:false },
  staff:        { canCreatePrescription:false, canViewReportsPending:false, canViewPatients:false, canViewRevenue:false, canViewWhatsApp:false, canViewMrManager:false, canManageStaff:false, canEditSettings:false, canExportData:false },
}

// Permissions used when creating a custom role
const CUSTOM_ROLE_PERMISSIONS = [
  { key:'page_appointments',          label:'View Appointments'      },
  { key:'page_queue',                 label:'View Queue Screen'       },
  { key:'page_patients',              label:'View Patients'           },
  { key:'page_whatsapp',              label:'View WhatsApp Chats'     },
  { key:'page_mr_manager',            label:'MR Manager'              },
  { key:'page_prescriptions',         label:'View Rx History'         },
  { key:'view_revenue',               label:'View Revenue'            },
  { key:'action_add_appointment',     label:'Add Appointments'        },
  { key:'action_cancel_appointment',  label:'Cancel Appointments'     },
  { key:'action_add_walkin',          label:'Add Walk-ins'            },
  { key:'action_complete_visit',      label:'Mark Visit Complete'     },
  { key:'action_create_prescription', label:'Create Prescriptions'    },
  { key:'page_mr_manager',           label:'MR Manager'              },
]

const ROLE_COLORS = ['#0F2D5E','#1A5CB5','#7C3AED','#16A34A','#D97706','#E5402B','#0F766E','#4B5563']

// ── Reusable primitives ────────────────────────────────────────────────────────
function Field({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:C.muted, marginBottom:5, textTransform:'uppercase', letterSpacing:'.04em' }}>
        {label}{required && <span style={{ color:C.coral }}> *</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize:11, color:C.muted, marginTop:4 }}>{hint}</p>}
    </div>
  )
}

function Inp({ value, onChange, placeholder, type='text', disabled=false }) {
  const [f, setF] = useState(false)
  return (
    <input type={type} inputMode={type === 'tel' ? 'numeric' : undefined} value={type === 'tel' ? formatPhone(value) : value || ''} onChange={e=>onChange(type === 'tel' ? phoneInputValue(e.target.value) : e.target.value)} placeholder={placeholder} disabled={disabled}
      style={{ width:'100%', border:`1.5px solid ${f?C.navy:C.border}`, borderRadius:8, padding:'9px 13px', fontSize:14, color:C.navy,
               background:disabled?C.surface:'#fff', outline:'none', fontFamily:'inherit', boxSizing:'border-box', transition:'border .15s',
               cursor:disabled?'not-allowed':'text', opacity:disabled?.7:1 }}
      onFocus={()=>setF(true)} onBlur={()=>setF(false)}/>
  )
}

function Toggle({ label, hint, checked, onChange, disabled=false }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, padding:'11px 0', borderBottom:`1px solid ${C.border}` }}>
      <div>
        <div style={{ fontSize:14, fontWeight:600, color:disabled?C.muted:C.navy }}>{label}</div>
        {hint && <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{hint}</div>}
      </div>
      <button onClick={()=>!disabled&&onChange(!checked)} disabled={disabled}
        style={{ width:44, height:24, borderRadius:12, background:checked?C.navy:C.border, border:'none',
                 cursor:disabled?'not-allowed':'pointer', position:'relative', flexShrink:0, transition:'background .2s', opacity:disabled?.5:1 }}>
        <div style={{ position:'absolute', top:2, left:checked?22:2, width:20, height:20, borderRadius:10, background:'#fff', transition:'left .2s' }}/>
      </button>
    </div>
  )
}

function SectionCard({ id, title, icon:Icon, children, onSave, saving, role, lockedTo }) {
  const canEdit = !lockedTo || lockedTo.includes(role)
  return (
    <div id={id} style={{ background:'var(--tm-surface,#fff)', border:`1px solid var(--tm-border,${C.border})`, borderRadius:12, marginBottom:24, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'14px 20px', borderBottom:`1px solid var(--tm-border,${C.border})`, background:'var(--tm-surface2,#FAFAF7)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:`${C.navy}12`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon size={15} color={C.navy}/>
          </div>
          <span style={{ fontSize:15, fontWeight:700, color:C.navy }}>{title}</span>
        </div>
        {!canEdit && (
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:C.muted }}>
            <Lock size={11}/> Only Owner can edit
          </div>
        )}
      </div>
      <div style={{ padding:20 }}>
        {children}
      </div>
      {canEdit && onSave && (
        <div style={{ padding:'12px 20px', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'flex-end' }}>
          <button onClick={onSave} disabled={saving}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 22px', background:saving?C.muted:C.navy, color:'#fff',
                     border:'none', borderRadius:12, fontSize:13, fontWeight:700, cursor:saving?'not-allowed':'pointer' }}>
            {saving ? 'Saving…' : <><Check size={13}/>Save</>}
          </button>
        </div>
      )}
    </div>
  )
}

function Toast({ msg, type }) {
  return (
    <div style={{ position:'fixed', bottom:32, left:'50%', transform:'translateX(-50%)',
                  background:type==='error'?C.coral:C.navy, color:'#fff', padding:'10px 20px',
                  borderRadius:10, fontSize:13, fontWeight:600, zIndex:200,
                  boxShadow:'0 4px 20px rgba(0,0,0,.2)', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:8 }}>
      {type==='error' ? <AlertTriangle size={14}/> : <Check size={14}/>}
      {msg}
    </div>
  )
}

// ── Confirm dialog ──────────────────────────────────────────────────────────────
function ConfirmDialog({ msg, onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,35,66,.45)', zIndex:150, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:12, padding:24, maxWidth:360, width:'90%', boxShadow:'0 8px 32px rgba(0,0,0,.15)' }}>
        <div style={{ fontSize:15, fontWeight:700, color:C.navy, marginBottom:8 }}>Are you sure?</div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>{msg}</div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Remove</Button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ClinicSettings() {
  // doctor_owner gets identical access to owner — normalize early so all checks below work
  const rawRole = getSession()?.clinic_role || getClinicRole()
  const role    = rawRole === 'doctor_owner' ? 'owner' : rawRole
  const session = getSession()
  const { theme, toggleTheme } = useTheme()

  const doctorId = 'dr001' // demo

  const [toast,   setToast]   = useState(null)
  const [saving,  setSaving]  = useState({})
  const [confirm, setConfirm] = useState(null) // { msg, onConfirm }

  // ── Section state ──────────────────────────────────────────────────────────
  const [clinicData, setClinicData] = useState({
    name:'', address:'', city:'', state:'', pincode:'',
    phone:'', email:'', website:'', gstin:'', registrationNumber:'', logoUrl:'',
  })
  const [doctors, setDoctors] = useState([{ ...EMPTY_DOC, id:`dr_${Date.now()}`, isPrimary:true }])
  const [rolePerms, setRolePerms] = useState(ROLE_DEFAULTS)

  // ── Custom roles & staff directory ────────────────────────────────────────
  const [customRoles,   setCustomRoles]   = useState([])
  const [staffMembers,  setStaffMembers]  = useState([])
  const [roleModal,     setRoleModal]     = useState(null) // null | { mode:'create'|'edit', data:{} }
  const [staffModal,    setStaffModal]    = useState(null) // null | { mode:'create'|'edit', data:{} }
  const [deleteConfirm, setDeleteConfirm] = useState(null) // null | { type:'role'|'staff', id }
  const [rxSettings, setRxSettings] = useState({
    defaultFollowUp:'1 week', defaultLanguage:'bilingual',
    whatsappEnabled:true, paperSize:'A5', showLetterhead:true, showQR:true,
  })
  const [favourites, setFavourites] = useState([])
  const [timings, setTimings] = useState({
    days:{ mon:true, tue:true, wed:true, thu:true, fri:true, sat:true, sun:false },
    morningFrom:'09:00', morningTo:'13:00',
    eveningFrom:'17:00', eveningTo:'20:00',
    lunchFrom:'13:00',   lunchTo:'17:00',
    maxPatientsPerSlot:4,
  })
  const [notifications, setNotifications] = useState({
    whatsappReminder:true, reminderTiming:'2hr',
    missedCallAutoReply:true, followUpReminder:true,
  })
  const [cabinSettings, setCabinSettings] = useState({
    mode: 'single',   // 'single' | 'parallel' | 'high-volume'
    slots: 1,         // derived from mode: 1 | 2 | 3
  })
  const [fees, setFees] = useState({ ...FEE_DEFAULTS })

  function modeSlotsMap(mode) {
    return mode === 'high-volume' ? 3 : mode === 'parallel' ? 2 : 1
  }

  // ── Load saved config ──────────────────────────────────────────────────────
  useEffect(() => {
    const s = getClinicConfig()
    if (s) {
      if (s.clinic)        setClinicData(prev=>({ ...prev, ...s.clinic }))
      if (s.doctors?.length) setDoctors(s.doctors)
      if (s.rolePerms)     setRolePerms(s.rolePerms)
      if (s.rxSettings)    setRxSettings(prev=>({ ...prev, ...s.rxSettings }))
      if (s.timings)       setTimings(prev=>({ ...prev, ...s.timings, days:{ ...prev.days, ...(s.timings?.days||{}) } }))
      if (s.notifications) setNotifications(prev=>({ ...prev, ...s.notifications }))
      if (s.cabinSettings) {
        const cs = s.cabinSettings
        // backfill slots if missing (old saves had enabled instead of slots)
        const slots = cs.slots || modeSlotsMap(cs.mode || 'single')
        setCabinSettings({ mode: cs.mode || 'single', slots })
      }
      if (s.fees) setFees(prev => ({ ...prev, ...s.fees }))
    }
    setFavourites(getFavourites(doctorId))
    // Load custom roles and staff directory
    try {
      const cr = JSON.parse(localStorage.getItem('trikmed.customRoles') || '[]')
      const sm = JSON.parse(localStorage.getItem('trikmed.staff') || '[]')
      setCustomRoles(cr)
      setStaffMembers(sm)
    } catch {}
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────────────
  function showToast(msg, type='success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function setSectionSaving(key, val) {
    setSaving(p => ({ ...p, [key]:val }))
  }

  function patchConfig(key, data) {
    const current = getClinicConfig() || {}
    saveClinicConfig({ ...current, [key]:data })
  }

  function saveSection(key, data, label) {
    setSectionSaving(key, true)
    setTimeout(() => {
      patchConfig(key, data)
      setSectionSaving(key, false)
      showToast(`${label} saved`)
    }, 350)
  }

  // ── Doctors helpers ────────────────────────────────────────────────────────
  function addDoctor()       { setDoctors(d=>[...d,{...EMPTY_DOC,id:`dr_${Date.now()}`}]) }
  function upDoc(i,f,v)     { setDoctors(d=>d.map((x,j)=>j===i?{...x,[f]:v}:x)) }
  function setPrimary(i)    { setDoctors(d=>d.map((x,j)=>({...x,isPrimary:j===i}))) }
  function rmDoc(i) {
    if (doctors.length <= 1) { showToast('At least one doctor is required','error'); return }
    setConfirm({ msg:`Remove Dr. ${doctors[i].name||'this doctor'} from the list?`, onConfirm:() => {
      setDoctors(d => { const n=d.filter((_,j)=>j!==i); if(!n.find(x=>x.isPrimary)) n[0].isPrimary=true; return n })
      setConfirm(null)
    }})
  }
  function uploadSig(i,e) {
    const f=e.target.files?.[0]; if(!f)return
    const r=new FileReader(); r.onload=ev=>upDoc(i,'signatureUrl',ev.target.result); r.readAsDataURL(f)
  }
  function uploadLogo(e) {
    const f=e.target.files?.[0]; if(!f)return
    const r=new FileReader(); r.onload=ev=>setClinicData(c=>({...c,logoUrl:ev.target.result})); r.readAsDataURL(f)
  }

  // ── Staff perm helpers ─────────────────────────────────────────────────────
  function toggleRolePerm(roleKey, permKey) {
    if (roleKey === 'owner') return
    setRolePerms(p=>({ ...p, [roleKey]:{ ...p[roleKey], [permKey]:!p[roleKey][permKey] } }))
  }
  // ── Custom role helpers ────────────────────────────────────────────────────
  function saveCustomRole(data) {
    const updated = data.id
      ? customRoles.map(r => r.id === data.id ? data : r)
      : [...customRoles, { ...data, id: `cr_${Date.now()}` }]
    setCustomRoles(updated)
    localStorage.setItem('trikmed.customRoles', JSON.stringify(updated))
    setRoleModal(null)
    showToast(data.id ? 'Role updated' : 'Role created')
  }
  function deleteCustomRole(id) {
    const updated = customRoles.filter(r => r.id !== id)
    setCustomRoles(updated)
    localStorage.setItem('trikmed.customRoles', JSON.stringify(updated))
    // clear customRoleId from any staff using this role
    const updatedStaff = staffMembers.map(m => m.customRoleId === id ? { ...m, role:'staff', customRoleId:null } : m)
    setStaffMembers(updatedStaff)
    localStorage.setItem('trikmed.staff', JSON.stringify(updatedStaff))
    setDeleteConfirm(null)
    showToast('Role removed')
  }

  // ── Staff directory helpers ────────────────────────────────────────────────
  function saveStaffMember(data) {
    if (data.phone && !isValidPhone(data.phone)) {
      showToast(phoneError(), 'error')
      return
    }
    const cleanData = { ...data, phone: data.phone ? phoneInputValue(data.phone) : '' }
    const updated = data.id
      ? staffMembers.map(m => m.id === data.id ? cleanData : m)
      : [...staffMembers, { ...cleanData, id: `sm_${Date.now()}` }]
    setStaffMembers(updated)
    localStorage.setItem('trikmed.staff', JSON.stringify(updated))
    setStaffModal(null)
    showToast(data.id ? 'Staff member updated' : 'Staff member added')
  }
  function deleteStaffMember(id) {
    const updated = staffMembers.filter(m => m.id !== id)
    setStaffMembers(updated)
    localStorage.setItem('trikmed.staff', JSON.stringify(updated))
    setDeleteConfirm(null)
    showToast('Staff member removed')
  }
  function toggleStaffLogin(id) {
    const updated = staffMembers.map(m => m.id === id ? { ...m, showOnLogin: !m.showOnLogin } : m)
    setStaffMembers(updated)
    localStorage.setItem('trikmed.staff', JSON.stringify(updated))
  }

  // ── Favourites ─────────────────────────────────────────────────────────────
  function removeFav(med) {
    toggleFavourite(doctorId, med)
    setFavourites(getFavourites(doctorId))
    showToast(`${med.brandName} removed from favourites`)
  }

  // ── Sections visible for this role ────────────────────────────────────────
  // Staff: no access
  if (role === 'staff' || (role !== 'owner' && role !== 'doctor_owner' && role !== 'doctor' && role !== 'receptionist')) {
    return (
      <div style={{ minHeight:'100vh', background:C.cream, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <Lock size={40} color={C.border}/>
        <div style={{ fontSize:18, fontWeight:700, color:C.navy }}>Access Restricted</div>
        <div style={{ fontSize:14, color:C.muted }}>Only Owners, Doctors, and Receptionists can view Settings.</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--tm-bg,#F7F5F0)', fontFamily:"'Segoe UI',Inter,sans-serif" }}>
      <BackButton />

      {/* Page header */}
      <div style={{ background:C.navy, padding:'18px 24px' }}>
        <div style={{ fontSize:19, fontWeight:800, color:'#fff' }}>Clinic Settings</div>
        <div style={{ fontSize:13, color:'#B5D4F4', marginTop:3 }}>
          {(role === 'owner' || role === 'doctor_owner') ? 'Full access — manage all clinic settings' :
           role === 'doctor' ? 'Viewing Prescription Defaults & Notifications' :
           'Viewing Clinic Timings'}
        </div>
      </div>

      <div style={{ display:'flex', gap:0, maxWidth:1080, margin:'0 auto', padding:'24px 16px', alignItems:'flex-start' }}>

        {/* ── Left mini-nav ── */}
        <div style={{ width:192, flexShrink:0, position:'sticky', top:24, marginRight:24 }}>
          <div style={{ background:'var(--tm-surface,#fff)', border:`1px solid var(--tm-border,${C.border})`, borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'10px 14px', borderBottom:`1px solid var(--tm-border,${C.border})`, fontSize:11, fontWeight:700, color:'var(--tm-text-muted,#6B7A9A)', textTransform:'uppercase', letterSpacing:'.06em' }}>
              Sections
            </div>
            {SECTIONS.map(s => {
              const accessible = SECTION_ACCESS[s.id]?.includes(role)
              return (
                <button key={s.id}
                  onClick={() => accessible && document.getElementById(s.id)?.scrollIntoView({ behavior:'smooth', block:'start' })}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'10px 14px',
                           border:'none', background:'transparent', cursor:accessible?'pointer':'default',
                           borderBottom:`1px solid ${C.border}`, textAlign:'left', opacity:accessible?1:.45 }}>
                  <s.icon size={13} color={accessible?C.navy:C.muted}/>
                  <span style={{ fontSize:12, fontWeight:600, color:accessible?C.navy:C.muted, flex:1 }}>{s.label}</span>
                  {!accessible && <Lock size={10} color={C.border}/>}
                  {accessible && <ChevronRight size={10} color={C.muted}/>}
                </button>
              )
            })}
          </div>

          {/* Role badge */}
          <div style={{ marginTop:12, background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px' }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Logged in as</div>
            <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>{session?.name || '—'}</div>
            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4,
                           background: (role==='owner'||role==='doctor_owner')?'#0F2342': role==='doctor'?'#1A5CB5': role==='receptionist'?'#7C3AED':'#e5e7eb',
                           color: role==='staff'?'#374151':'#fff', marginTop:4, display:'inline-block', textTransform:'uppercase' }}>
              {role === 'doctor_owner' ? 'Doctor / Owner' : role}
            </span>
          </div>
        </div>

        {/* ── Right content ── */}
        <div style={{ flex:1, minWidth:0 }}>

          {/* ════ 1. CLINIC INFO ════ */}
          <SectionCard id="clinic-info" title="Clinic Info" icon={Building2}
            onSave={() => { if(!clinicData.name.trim()){showToast('Clinic name is required','error');return}; if(clinicData.phone && !isValidPhone(clinicData.phone)){showToast(phoneError(),'error');return}; saveSection('clinic',{...clinicData, phone: clinicData.phone ? phoneInputValue(clinicData.phone) : ''},'Clinic Info') }}
            saving={saving['clinic']} role={role} lockedTo={SECTION_ACCESS['clinic-info']}>

            {/* Logo */}
            <div style={{ display:'flex', gap:16, marginBottom:20, alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:C.muted, marginBottom:5, textTransform:'uppercase', letterSpacing:'.04em' }}>Logo</div>
                <label style={{ cursor:'pointer' }}>
                  <div style={{ width:72, height:72, border:`2px dashed ${C.border}`, borderRadius:10,
                                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                                background:C.surface, overflow:'hidden' }}>
                    {clinicData.logoUrl
                      ? <img src={clinicData.logoUrl} alt="Logo" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
                      : <><Upload size={18} color={C.muted}/><span style={{ fontSize:10, color:C.muted, marginTop:3 }}>Upload</span></>}
                  </div>
                  <input type="file" accept="image/*" onChange={uploadLogo} style={{ display:'none' }}/>
                </label>
              </div>
              {clinicData.name && (
                <div style={{ flex:1, background:C.navy, borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
                  {clinicData.logoUrl
                    ? <img src={clinicData.logoUrl} alt="Logo" style={{ width:36, height:36, borderRadius:6, objectFit:'contain', background:'#fff' }}/>
                    : <div style={{ width:36, height:36, background:C.coral, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ color:'#fff', fontWeight:800, fontSize:16 }}>{clinicData.name[0]?.toUpperCase()}</span>
                      </div>}
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{clinicData.name}</div>
                    <div style={{ fontSize:11, color:'#B5D4F4' }}>{clinicData.city}{clinicData.city&&clinicData.phone?' · ':''}{clinicData.phone}</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Clinic Name" required>
                  <Inp value={clinicData.name} onChange={v=>setClinicData(c=>({...c,name:v}))} placeholder="e.g. Sharma Clinic & Diagnostics"/>
                </Field>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Address">
                  <Inp value={clinicData.address} onChange={v=>setClinicData(c=>({...c,address:v}))} placeholder="Street, Area, Landmark"/>
                </Field>
              </div>
              <Field label="City"><Inp value={clinicData.city} onChange={v=>setClinicData(c=>({...c,city:v}))} placeholder="Varanasi"/></Field>
              <Field label="State"><Inp value={clinicData.state} onChange={v=>setClinicData(c=>({...c,state:v}))} placeholder="Uttar Pradesh"/></Field>
              <Field label="Pincode"><Inp value={clinicData.pincode} onChange={v=>setClinicData(c=>({...c,pincode:v}))} placeholder="221001"/></Field>
              <Field label="Phone"><Inp value={clinicData.phone} onChange={v=>setClinicData(c=>({...c,phone:v}))} placeholder="9876543210" type="tel"/></Field>
              <Field label="Email"><Inp value={clinicData.email} onChange={v=>setClinicData(c=>({...c,email:v}))} placeholder="clinic@example.com" type="email"/></Field>
              <Field label="Website"><Inp value={clinicData.website} onChange={v=>setClinicData(c=>({...c,website:v}))} placeholder="https://sharmaclinic.in"/></Field>
              <Field label="GSTIN" hint="15-digit GST Identification Number">
                <Inp value={clinicData.gstin} onChange={v=>setClinicData(c=>({...c,gstin:v}))} placeholder="27AABCU9603R1ZX"/>
              </Field>
              <Field label="Registration Number" hint="Medical council / clinic registration">
                <Inp value={clinicData.registrationNumber} onChange={v=>setClinicData(c=>({...c,registrationNumber:v}))} placeholder="UP-MCA-2019-1234"/>
              </Field>
            </div>
          </SectionCard>

          {/* ════ 2. DOCTORS ════ */}
          <SectionCard id="doctors" title="Doctors Management" icon={Users}
            onSave={() => { if(doctors.some(d=>!d.name.trim())){showToast('All doctors need a name','error');return}; if(doctors.some(d=>d.phone && !isValidPhone(d.phone))){showToast(phoneError('Doctor phone'),'error');return}; saveSection('doctors',doctors.map(d=>({...d, phone: d.phone ? phoneInputValue(d.phone) : ''})),'Doctors') }}
            saving={saving['doctors']} role={role} lockedTo={SECTION_ACCESS['doctors']}>

            {doctors.map((doc, i) => (
              <div key={doc.id} style={{ border:`1.5px solid ${doc.isPrimary?C.navy:C.border}`, borderRadius:10, marginBottom:14, overflow:'hidden' }}>
                {/* Doctor card header */}
                <div style={{ padding:'10px 14px', background:doc.isPrimary?`${C.navy}0A`:C.surface, borderBottom:`1px solid ${C.border}`,
                              display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', background:doc.isPrimary?C.navy:C.muted,
                                  display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14 }}>
                      {doc.name ? doc.name[0].toUpperCase() : '?'}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>{doc.name || `Doctor ${i+1}`}</div>
                      <div style={{ fontSize:11, color:C.muted }}>{doc.qualifications}{doc.specialty?` · ${doc.specialty}`:''}</div>
                    </div>
                    {doc.isPrimary && (
                      <span style={{ fontSize:10, fontWeight:700, background:C.navy, color:'#fff', padding:'2px 7px', borderRadius:4 }}>★ PRIMARY</span>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    {!doc.isPrimary && (
                      <button onClick={()=>setPrimary(i)}
                        style={{ fontSize:11, color:C.blue, background:'none', border:`1px solid ${C.blue}`, borderRadius:5, padding:'3px 9px', cursor:'pointer', fontWeight:600 }}>
                        Set Primary
                      </button>
                    )}
                    {doctors.length > 1 && (
                      <button onClick={()=>rmDoc(i)}
                        style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 6px', borderRadius:5,
                                 display:'flex', alignItems:'center', gap:3, color:C.coral, fontSize:11, fontWeight:600 }}>
                        <Trash2 size={12}/> Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Doctor form fields */}
                <div style={{ padding:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div style={{ gridColumn:'1/-1' }}>
                    <Field label="Full Name" required>
                      <Inp value={doc.name} onChange={v=>upDoc(i,'name',v)} placeholder="Dr. Priya Sharma"/>
                    </Field>
                  </div>
                  <Field label="Qualifications">
                    <Inp value={doc.qualifications} onChange={v=>upDoc(i,'qualifications',v)} placeholder="MBBS, MD (Internal Medicine)"/>
                  </Field>
                  <Field label="MCI Reg. No.">
                    <Inp value={doc.registrationNumber} onChange={v=>upDoc(i,'registrationNumber',v)} placeholder="UP-12345"/>
                  </Field>
                  <Field label="Specialty">
                    <select value={doc.specialty} onChange={e=>upDoc(i,'specialty',e.target.value)}
                      style={{ width:'100%', border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 13px', fontSize:14, color:C.navy, background:'#fff', outline:'none', fontFamily:'inherit' }}>
                      {SPECIALTIES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Phone">
                    <Inp value={doc.phone} onChange={v=>upDoc(i,'phone',v)} placeholder="9876543210" type="tel"/>
                  </Field>
                  <Field label="Email">
                    <Inp value={doc.email} onChange={v=>upDoc(i,'email',v)} placeholder="doctor@clinic.com" type="email"/>
                  </Field>
                  <Field label="Signature Image" hint="Upload doctor's signature for printed Rx">
                    <label style={{ cursor:'pointer', display:'block' }}>
                      <div style={{ border:`1px dashed ${C.border}`, borderRadius:7, padding:10,
                                   display:'flex', alignItems:'center', gap:10, background:C.surface }}>
                        {doc.signatureUrl
                          ? <img src={doc.signatureUrl} alt="sig" style={{ height:36, maxWidth:180, objectFit:'contain' }}/>
                          : <><Upload size={13} color={C.muted}/><span style={{ fontSize:12, color:C.muted }}>Click to upload signature</span></>}
                      </div>
                      <input type="file" accept="image/*" onChange={e=>uploadSig(i,e)} style={{ display:'none' }}/>
                    </label>
                  </Field>
                </div>
              </div>
            ))}

            <button onClick={addDoctor}
              style={{ width:'100%', border:`2px dashed ${C.border}`, borderRadius:10, padding:12, background:'none',
                       cursor:'pointer', color:C.navy, fontWeight:600, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <Plus size={14} color={C.coral}/> Add Another Doctor
            </button>
          </SectionCard>

          {/* ════ 3. STAFF & PERMISSIONS ════ */}
          <SectionCard id="staff" title="Staff & Permissions" icon={UserCog}
            onSave={() => saveSection('rolePerms', rolePerms, 'Permissions')}
            saving={saving['rolePerms']} role={role} lockedTo={SECTION_ACCESS['staff']}>

            {/* ── A: Role Defaults table ── */}
            <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:10 }}>Role Defaults</div>
            <div style={{ overflowX:'auto', marginBottom:24 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:C.surface }}>
                    <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:700, color:C.muted, borderBottom:`1px solid ${C.border}`, fontSize:11, textTransform:'uppercase' }}>Permission</th>
                    {['owner','doctor','receptionist','staff'].map(r=>(
                      <th key={r} style={{ padding:'8px 10px', textAlign:'center', fontWeight:700, color:C.muted, borderBottom:`1px solid ${C.border}`, fontSize:11, textTransform:'uppercase', whiteSpace:'nowrap' }}>{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_ROWS.map(({ key, label }) => (
                    <tr key={key} style={{ borderBottom:`1px solid ${C.border}` }}>
                      <td style={{ padding:'9px 10px', color:C.navy, fontWeight:500 }}>{label}</td>
                      {['owner','doctor','receptionist','staff'].map(r => {
                        const val = rolePerms[r]?.[key] ?? false
                        const locked = r === 'owner'
                        return (
                          <td key={r} style={{ padding:'9px 10px', textAlign:'center' }}>
                            <button onClick={()=>toggleRolePerm(r, key)} disabled={locked}
                              style={{ width:36, height:20, borderRadius:10, background:val?C.navy:C.border, border:'none',
                                       cursor:locked?'not-allowed':'pointer', position:'relative', display:'inline-block',
                                       transition:'background .2s', opacity:locked?.6:1 }}>
                              <div style={{ position:'absolute', top:2, left:val?18:2, width:16, height:16, borderRadius:8, background:'#fff', transition:'left .2s' }}/>
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── B: Custom Roles ── */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>Custom Roles</div>
              <button onClick={() => setRoleModal({ mode:'create', data:{ name:'', color:ROLE_COLORS[0], permissions:{} } })}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:C.navy, color:'#fff',
                         border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                <Plus size={12}/> Create Role
              </button>
            </div>
            {customRoles.length === 0 ? (
              <div style={{ fontSize:12, color:C.muted, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 14px', marginBottom:20 }}>
                No custom roles yet. Create one to assign specific permissions to custom staff types.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:20 }}>
                {customRoles.map(cr => (
                  <div key={cr.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'#fff', border:`1px solid ${C.border}`, borderRadius:8 }}>
                    <div style={{ width:14, height:14, borderRadius:'50%', background:cr.color, flexShrink:0 }}/>
                    <div style={{ flex:1, fontSize:13, fontWeight:600, color:C.navy }}>{cr.name}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{Object.values(cr.permissions).filter(Boolean).length} permissions</div>
                    <button onClick={() => setRoleModal({ mode:'edit', data:{ ...cr } })}
                      style={{ fontSize:11, color:C.blue, background:'none', border:`1px solid ${C.blue}`, borderRadius:5, padding:'3px 9px', cursor:'pointer', fontWeight:600 }}>
                      Edit
                    </button>
                    <button onClick={() => setDeleteConfirm({ type:'role', id:cr.id, name:cr.name })}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 4px', color:C.coral, display:'flex', alignItems:'center' }}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ── C: Staff Members Directory ── */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>Staff Members</div>
              <button onClick={() => setStaffModal({ mode:'create', data:{ name:'', phone:'', role:'staff', showOnLogin:false, customRoleId:null } })}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'#fff', color:C.navy,
                         border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                <Plus size={12}/> Add Staff Member
              </button>
            </div>
            {staffMembers.length === 0 ? (
              <div style={{ fontSize:12, color:C.muted, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 14px' }}>
                No staff members added yet. Add staff to let them appear on the login page.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {staffMembers.map(member => {
                  const customRole = member.role === 'custom' ? customRoles.find(r => r.id === member.customRoleId) : null
                  const badgeColor = member.role === 'doctor' ? C.blue : member.role === 'receptionist' ? '#7C3AED' : customRole?.color || C.muted
                  const badgeLabel = member.role === 'custom' ? (customRole?.name || 'Custom') : member.role
                  const initials   = member.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
                  return (
                    <div key={member.id} style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
                      <div style={{ padding:'10px 14px', background:C.surface, display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background:badgeColor, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13, flexShrink:0 }}>
                          {initials}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>{member.name}</div>
                          {member.phone && <div style={{ fontSize:11, color:C.muted }}>{member.phone}</div>}
                        </div>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4, textTransform:'uppercase',
                                       background:`${badgeColor}18`, color:badgeColor, whiteSpace:'nowrap' }}>
                          {badgeLabel}
                        </span>
                        {/* Show on Login toggle */}
                        <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                          <span style={{ fontSize:10, color:C.muted, whiteSpace:'nowrap' }}>Login</span>
                          <button onClick={() => toggleStaffLogin(member.id)}
                            style={{ width:34, height:18, borderRadius:9, background:member.showOnLogin?C.green:C.border, border:'none',
                                     cursor:'pointer', position:'relative', flexShrink:0, transition:'background .2s' }}>
                            <div style={{ position:'absolute', top:1, left:member.showOnLogin?17:1, width:16, height:16, borderRadius:8, background:'#fff', transition:'left .2s' }}/>
                          </button>
                        </div>
                        <button onClick={() => setStaffModal({ mode:'edit', data:{ ...member } })}
                          style={{ fontSize:11, color:C.blue, background:'none', border:`1px solid ${C.blue}`, borderRadius:5, padding:'3px 9px', cursor:'pointer', fontWeight:600, flexShrink:0 }}>
                          Edit
                        </button>
                        <button onClick={() => setDeleteConfirm({ type:'staff', id:member.id, name:member.name })}
                          style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 4px', color:C.coral, display:'flex', alignItems:'center', flexShrink:0 }}>
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>

          {/* ════ 4. PRESCRIPTION DEFAULTS ════ */}
          <SectionCard id="prescription" title="Prescription Defaults" icon={FileText}
            onSave={() => saveSection('rxSettings', rxSettings, 'Prescription Defaults')}
            saving={saving['rxSettings']} role={role} lockedTo={SECTION_ACCESS['prescription']}>

            <Field label="Default Follow-up Duration">
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {['3 days','5 days','1 week','2 weeks','1 month','SOS only'].map(o=>(
                  <button key={o} onClick={()=>setRxSettings(s=>({...s,defaultFollowUp:o}))}
                    style={{ padding:'7px 13px', border:`2px solid ${rxSettings.defaultFollowUp===o?C.navy:C.border}`,
                             borderRadius:7, background:rxSettings.defaultFollowUp===o?`${C.navy}0D`:'#fff',
                             cursor:'pointer', fontSize:13, fontWeight:600, color:rxSettings.defaultFollowUp===o?C.navy:C.muted }}>
                    {o}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Default Instruction Language">
              <div style={{ display:'flex', gap:8 }}>
                {[['english','English'],['hindi','हिन्दी'],['bilingual','Both']].map(([v,l])=>(
                  <button key={v} onClick={()=>setRxSettings(s=>({...s,defaultLanguage:v}))}
                    style={{ flex:1, padding:'9px', border:`2px solid ${rxSettings.defaultLanguage===v?C.navy:C.border}`,
                             borderRadius:7, background:rxSettings.defaultLanguage===v?`${C.navy}0D`:'#fff',
                             cursor:'pointer', fontSize:13, fontWeight:600, color:rxSettings.defaultLanguage===v?C.navy:C.muted }}>
                    {l}
                  </button>
                ))}
              </div>
            </Field>

            <div style={{ marginBottom:16 }}>
              <Toggle label="Enable WhatsApp Sharing"
                hint="Shows 'WhatsApp & Save' button on Rx page. Turn OFF to disable."
                checked={rxSettings.whatsappEnabled}
                onChange={v=>setRxSettings(s=>({...s,whatsappEnabled:v}))}/>
            </div>

            <Field label="Paper Size">
              <div style={{ display:'flex', gap:10 }}>
                {[['A5','148×210 mm','Prescription pad size'],['A4','210×297 mm','Full letterhead size']].map(([sz,dim,hint])=>(
                  <button key={sz} onClick={()=>setRxSettings(s=>({...s,paperSize:sz}))}
                    style={{ flex:1, padding:'14px 10px', border:`2px solid ${rxSettings.paperSize===sz?C.navy:C.border}`,
                             borderRadius:10, background:rxSettings.paperSize===sz?`${C.navy}0D`:'#fff', cursor:'pointer', textAlign:'center' }}>
                    <div style={{ fontSize:20, marginBottom:4 }}>📄</div>
                    <div style={{ fontSize:15, fontWeight:800, color:C.navy }}>{sz}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{dim}</div>
                    <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{hint}</div>
                  </button>
                ))}
              </div>
            </Field>

            <Toggle label="Show Clinic Letterhead" hint="Print clinic name + logo + doctor details at top"
              checked={rxSettings.showLetterhead} onChange={v=>setRxSettings(s=>({...s,showLetterhead:v}))}/>
            <Toggle label="Show QR Verification Code" hint="QR links to trikmed.com/verify/[rxId] — patients can scan to verify authenticity"
              checked={rxSettings.showQR} onChange={v=>setRxSettings(s=>({...s,showQR:v}))}/>

            {/* Favourites */}
            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                <Heart size={13} color={C.coral}/> Saved Favourites ({favourites.length})
              </div>
              {favourites.length === 0 ? (
                <div style={{ fontSize:12, color:C.muted, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:'12px 16px' }}>
                  No favourites saved yet. Star a medicine while writing a prescription to save it here.
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {favourites.map(f=>(
                    <div key={f.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'#fff',
                                            border:`1px solid ${C.border}`, borderRadius:8 }}>
                      <Star size={12} color={C.amber} fill={C.amber}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:C.navy }}>{f.brandName}</span>
                        {f.genericName && <span style={{ fontSize:11, color:C.muted }}> · {f.genericName}</span>}
                        {f.strength && <span style={{ fontSize:11, color:C.muted }}> {f.strength}</span>}
                      </div>
                      <span style={{ fontSize:11, color:C.muted }}>{f.form}</span>
                      <button onClick={()=>removeFav(f)}
                        style={{ background:'none', border:'none', cursor:'pointer', padding:2, display:'flex', color:C.coral }}>
                        <X size={12}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          {/* ════ 5. CLINIC TIMINGS ════ */}
          <SectionCard id="timings" title="Clinic Timings" icon={Clock}
            onSave={() => saveSection('timings', timings, 'Clinic Timings')}
            saving={saving['timings']} role={role} lockedTo={SECTION_ACCESS['timings']}>

            <Field label="Days Open">
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {DAYS.map(d=>(
                  <button key={d} onClick={()=>setTimings(t=>({...t,days:{...t.days,[d]:!t.days[d]}}))}
                    style={{ padding:'7px 12px', border:`2px solid ${timings.days[d]?C.navy:C.border}`,
                             borderRadius:8, background:timings.days[d]?C.navy:'#fff', cursor:'pointer',
                             fontSize:13, fontWeight:700, color:timings.days[d]?'#fff':C.muted, transition:'all .15s' }}>
                    {DAY_LABELS[d]}
                  </button>
                ))}
              </div>
            </Field>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:4 }}>
              <Field label="Morning From">
                <Inp value={timings.morningFrom} onChange={v=>setTimings(t=>({...t,morningFrom:v}))} type="time"/>
              </Field>
              <Field label="Morning To">
                <Inp value={timings.morningTo} onChange={v=>setTimings(t=>({...t,morningTo:v}))} type="time"/>
              </Field>
              <Field label="Lunch Break From">
                <Inp value={timings.lunchFrom} onChange={v=>setTimings(t=>({...t,lunchFrom:v}))} type="time"/>
              </Field>
              <Field label="Lunch Break To">
                <Inp value={timings.lunchTo} onChange={v=>setTimings(t=>({...t,lunchTo:v}))} type="time"/>
              </Field>
              <Field label="Evening From">
                <Inp value={timings.eveningFrom} onChange={v=>setTimings(t=>({...t,eveningFrom:v}))} type="time"/>
              </Field>
              <Field label="Evening To">
                <Inp value={timings.eveningTo} onChange={v=>setTimings(t=>({...t,eveningTo:v}))} type="time"/>
              </Field>
            </div>

            <div style={{ marginTop:4 }}>
              <Field label="Max Patients Per Slot" hint="Limits how many patients can book per time slot">
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <button onClick={()=>setTimings(t=>({...t,maxPatientsPerSlot:Math.max(1,t.maxPatientsPerSlot-1)}))}
                    style={{ width:34, height:34, borderRadius:8, border:`1px solid ${C.border}`, background:'#fff', cursor:'pointer', fontSize:18, fontWeight:700, color:C.navy, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                  <span style={{ fontSize:22, fontWeight:800, color:C.navy, minWidth:32, textAlign:'center' }}>{timings.maxPatientsPerSlot}</span>
                  <button onClick={()=>setTimings(t=>({...t,maxPatientsPerSlot:Math.min(20,t.maxPatientsPerSlot+1)}))}
                    style={{ width:34, height:34, borderRadius:8, border:`1px solid ${C.border}`, background:'#fff', cursor:'pointer', fontSize:18, fontWeight:700, color:C.navy, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                  <span style={{ fontSize:12, color:C.muted }}>patients per slot</span>
                </div>
              </Field>
            </div>
          </SectionCard>

          {/* ════ 6. NOTIFICATIONS ════ */}
          <SectionCard id="notifications" title="Notifications" icon={Bell}
            onSave={() => saveSection('notifications', notifications, 'Notifications')}
            saving={saving['notifications']} role={role} lockedTo={SECTION_ACCESS['notifications']}>

            <Toggle label="WhatsApp Reminder"
              hint="Send WhatsApp reminders to patients before their appointment"
              checked={notifications.whatsappReminder}
              onChange={v=>setNotifications(n=>({...n,whatsappReminder:v}))}/>

            <div style={{ padding:'12px 0', borderBottom:`1px solid ${C.border}`, opacity:notifications.whatsappReminder?1:.5 }}>
              <div style={{ fontSize:14, fontWeight:600, color:C.navy, marginBottom:8 }}>Reminder Timing</div>
              <div style={{ display:'flex', gap:6 }}>
                {[['1hr','1 hour before'],['2hr','2 hours before'],['1day','1 day before']].map(([v,l])=>(
                  <button key={v} onClick={()=>notifications.whatsappReminder&&setNotifications(n=>({...n,reminderTiming:v}))}
                    style={{ padding:'7px 13px', border:`2px solid ${notifications.reminderTiming===v?C.navy:C.border}`,
                             borderRadius:7, background:notifications.reminderTiming===v?`${C.navy}0D`:'#fff',
                             cursor:notifications.whatsappReminder?'pointer':'not-allowed', fontSize:13, fontWeight:600,
                             color:notifications.reminderTiming===v?C.navy:C.muted }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <Toggle label="Missed Call Auto-Reply"
              hint="Automatically send WhatsApp message when a patient's call is missed"
              checked={notifications.missedCallAutoReply}
              onChange={v=>setNotifications(n=>({...n,missedCallAutoReply:v}))}/>

            <Toggle label="Follow-up Reminder"
              hint="Remind patients 1 day before their follow-up appointment date"
              checked={notifications.followUpReminder}
              onChange={v=>setNotifications(n=>({...n,followUpReminder:v}))}/>
          </SectionCard>

          {/* ════ 7. CABIN SETTINGS ════ */}
          <SectionCard id="cabin" title="Cabin Settings" icon={Layers}
            onSave={() => saveSection('cabinSettings', cabinSettings, 'Cabin Settings')}
            saving={saving['cabinSettings']} role={role} lockedTo={SECTION_ACCESS['cabin']}>

            {/* Warning for sensitive specialties */}
            <div style={{ display:'flex', gap:8, padding:'10px 12px', background:'#FFFBEB', border:`1px solid #FDE68A`, borderRadius:8, marginBottom:16 }}>
              <AlertTriangle size={14} color='#D97706' style={{ flexShrink:0, marginTop:1 }}/>
              <div style={{ fontSize:12, color:'#92400E', lineHeight:1.5 }}>
                Not recommended for Gynaecology or Psychiatry — patient privacy is sensitive in these specialties.
                Parallel mode is best for General Medicine, Pediatrics, and OPD settings with high footfall.
              </div>
            </div>

            {/* Mode selector — mode also sets slots count */}
            <div style={{ marginTop:4 }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:'.04em' }}>
                Cabin Mode
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  { value:'single',      slots:1, label:'Single (1 patient at a time)', desc:'One patient at a time — default' },
                  { value:'parallel',    slots:2, label:'Parallel (2 patients)',       desc:'Slot A and Slot B — doctor alternates between two patients' },
                  { value:'high-volume', slots:3, label:'High Volume (3 patients)',    desc:'Slot A, B, and C — for very busy OPDs' },
                ].map(opt => (
                  <button key={opt.value}
                    onClick={() => setCabinSettings({ mode: opt.value, slots: opt.slots })}
                    style={{
                      display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px',
                      border:`2px solid ${cabinSettings.mode===opt.value ? C.navy : C.border}`,
                      borderRadius:9, background:cabinSettings.mode===opt.value ? `${C.navy}0A` : '#fff',
                      cursor:'pointer', textAlign:'left', fontFamily:'inherit',
                    }}>
                    <div style={{
                      width:16, height:16, borderRadius:'50%', border:`2px solid ${cabinSettings.mode===opt.value ? C.navy : C.border}`,
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2,
                    }}>
                      {cabinSettings.mode===opt.value && (
                        <div style={{ width:8, height:8, borderRadius:'50%', background:C.navy }}/>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:cabinSettings.mode===opt.value ? C.navy : C.navy }}>{opt.label}</div>
                      <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live preview of what will be saved */}
            {cabinSettings.mode !== 'single' && (
              <div style={{ marginTop:12, padding:'8px 12px', background:'#EFF6FF', border:`1px solid #BFDBFE`, borderRadius:8, fontSize:12, color:'#1E40AF' }}>
                Slot cards ({['A','B','C'].slice(0,cabinSettings.slots).join(', ')}) will appear in Appointments &amp; OPD Console
              </div>
            )}
          </SectionCard>

          {/* ── FEES & PAYMENT ── */}
          <SectionCard id="fees" title="Fees & Payment" icon={IndianRupee}
            onSave={() => saveSection('fees', fees, 'Fees & Payment')}
            saving={saving['fees']} role={role} lockedTo={SECTION_ACCESS['fees']}>

            {/* Fee amounts grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
              <Field label="New Patient Fee (₹)">
                <Inp type="number" value={fees.newPatientFee} onChange={v => setFees(f=>({...f, newPatientFee: Number(v)||0}))} placeholder="300" />
              </Field>
              <Field label="Follow-up Fee (₹)">
                <Inp type="number" value={fees.followUpFee} onChange={v => setFees(f=>({...f, followUpFee: Number(v)||0}))} placeholder="150" />
              </Field>
              <Field label="Follow-up Window (days)" hint="Days after last visit counted as follow-up">
                <Inp type="number" value={fees.followUpWindowDays} onChange={v => setFees(f=>({...f, followUpWindowDays: Number(v)||7}))} placeholder="7" />
              </Field>
            </div>

            {/* Payment modes */}
            <Field label="Accepted Payment Modes">
              <div style={{ display:'flex', gap:8 }}>
                {[['cash','💵 Cash'],['upi','📱 UPI'],['card','💳 Card']].map(([mode, label]) => {
                  const on = fees.acceptedModes?.includes(mode)
                  return (
                    <button key={mode} onClick={() => setFees(f => ({
                      ...f,
                      acceptedModes: on
                        ? (f.acceptedModes || []).filter(m => m !== mode)
                        : [...(f.acceptedModes || []), mode],
                    }))}
                      style={{ padding:'8px 16px', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', border:'1.5px solid', fontFamily:'inherit', transition:'all .15s',
                        background: on ? C.navy : '#fff', color: on ? '#fff' : '#374151', borderColor: on ? C.navy : C.border }}>
                      {label}
                    </button>
                  )
                })}
              </div>
            </Field>

            {/* UPI ID */}
            <Field label="UPI ID" hint="Shown on the walk-in form when UPI is selected">
              <Inp value={fees.upiId || ''} onChange={v => setFees(f=>({...f, upiId: v}))} placeholder="clinic@upi or 9876543210@paytm" />
            </Field>

            {/* UPI QR upload */}
            <Field label="UPI QR Code" hint="Upload your clinic's UPI QR image — shown during UPI payment at reception">
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                {fees.upiQrDataUrl && (
                  <img src={fees.upiQrDataUrl} alt="UPI QR" style={{ width:80, height:80, objectFit:'contain', border:`1px solid ${C.border}`, borderRadius:8 }} />
                )}
                <div>
                  <label style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px', background:'#F3F4F6', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}>
                    <Upload size={14} /> {fees.upiQrDataUrl ? 'Change QR image' : 'Upload QR image'}
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => {
                      const f = e.target.files?.[0]; if (!f) return
                      const r = new FileReader()
                      r.onload = ev => setFees(ff => ({...ff, upiQrDataUrl: ev.target.result}))
                      r.readAsDataURL(f)
                    }} />
                  </label>
                  {fees.upiQrDataUrl && (
                    <button onClick={() => setFees(f=>({...f, upiQrDataUrl:''}))}
                      style={{ display:'block', marginTop:6, fontSize:12, color:'#EF4444', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                      Remove QR
                    </button>
                  )}
                </div>
              </div>
            </Field>

          </SectionCard>

          {/* ── APPEARANCE ── */}
          <SectionCard id="appearance" title="Appearance" icon={Palette} role={role}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'#F7F9FF', borderRadius:10, border:`1px solid ${C.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                {theme === 'dark'
                  ? <Moon size={18} color="#60A5FA"/>
                  : <Sun  size={18} color="#F59E0B"/>
                }
                <div>
                  <p style={{ fontSize:14, fontWeight:600, color:C.navy, margin:0 }}>Display Theme</p>
                  <p style={{ fontSize:12, color:C.muted, margin:0 }}>
                    {theme === 'dark' ? 'Dark mode — aankhon ko aram milega' : 'Light mode active'}
                  </p>
                </div>
              </div>
              <button onClick={toggleTheme}
                style={{ width:44, height:24, borderRadius:12, background:theme==='dark'?C.navy:C.border, border:'none',
                         cursor:'pointer', position:'relative', flexShrink:0, transition:'background .2s' }}>
                <div style={{ position:'absolute', top:2, left:theme==='dark'?22:2, width:20, height:20, borderRadius:10, background:'#fff', transition:'left .2s' }}/>
              </button>
            </div>
          </SectionCard>

        </div>
      </div>

      {confirm && (
        <ConfirmDialog msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={()=>setConfirm(null)}/>
      )}
      {toast && <Toast msg={toast.msg} type={toast.type}/>}

      {/* ── Delete confirm (custom role or staff) ── */}
      {deleteConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,35,66,.45)', zIndex:150, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:12, padding:24, maxWidth:360, width:'90%', boxShadow:'0 8px 32px rgba(0,0,0,.15)' }}>
            <div style={{ fontSize:15, fontWeight:700, color:C.navy, marginBottom:8 }}>Remove {deleteConfirm.type === 'role' ? 'Role' : 'Staff Member'}?</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>
              {deleteConfirm.type === 'role'
                ? `Remove "${deleteConfirm.name}"? Any staff assigned this role will revert to Staff.`
                : `Remove "${deleteConfirm.name}" from the staff directory?`}
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding:'8px 16px', border:`1px solid ${C.border}`, borderRadius:8, background:'#fff', cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={() => deleteConfirm.type === 'role' ? deleteCustomRole(deleteConfirm.id) : deleteStaffMember(deleteConfirm.id)}
                style={{ padding:'8px 18px', background:C.coral, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:700 }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Role Modal ── */}
      {roleModal && (
        <RoleModal
          data={roleModal.data}
          mode={roleModal.mode}
          onSave={saveCustomRole}
          onClose={() => setRoleModal(null)}
        />
      )}

      {/* ── Create / Edit Staff Member Modal ── */}
      {staffModal && (
        <StaffMemberModal
          data={staffModal.data}
          mode={staffModal.mode}
          customRoles={customRoles}
          onSave={saveStaffMember}
          onClose={() => setStaffModal(null)}
        />
      )}
    </div>
  )
}

// ── Role Modal ─────────────────────────────────────────────────────────────────
function RoleModal({ data, mode, onSave, onClose }) {
  const [form, setForm] = useState({ ...data })
  function toggle(key) {
    setForm(f => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }))
  }
  function handleSave() {
    if (!form.name.trim()) return
    onSave(form)
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,35,66,.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:460, boxShadow:'0 8px 40px rgba(0,0,0,.2)', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ padding:'14px 20px', borderBottom:`1px solid #D3D1C7`, display:'flex', alignItems:'center', justifyContent:'space-between', background:'#FAFAF7' }}>
          <div style={{ fontSize:15, fontWeight:800, color:'#0F2342' }}>{mode === 'create' ? 'Create Custom Role' : 'Edit Role'}</div>
          <IconButton icon={X} ariaLabel="Close" onClick={onClose} />
        </div>
        <div style={{ padding:20 }}>
          {/* Name */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B7A9A', marginBottom:5, textTransform:'uppercase', letterSpacing:'.04em' }}>Role Name *</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Lab Technician"
              style={{ width:'100%', border:'1.5px solid #D3D1C7', borderRadius:8, padding:'9px 13px', fontSize:14, color:'#0F2342', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
          </div>
          {/* Color */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B7A9A', marginBottom:8, textTransform:'uppercase', letterSpacing:'.04em' }}>Badge Color</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {ROLE_COLORS.map(c => (
                <button key={c} onClick={() => setForm(f=>({...f,color:c}))}
                  style={{ width:28, height:28, borderRadius:'50%', background:c, border:`3px solid ${form.color===c?'#0F2342':'transparent'}`, cursor:'pointer', padding:0, outline:'none', transition:'border .15s' }}/>
              ))}
            </div>
          </div>
          {/* Permissions */}
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B7A9A', marginBottom:8, textTransform:'uppercase', letterSpacing:'.04em' }}>Permissions</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {CUSTOM_ROLE_PERMISSIONS.map(({ key, label }) => {
                const on = !!form.permissions[key]
                return (
                  <button key={key} onClick={() => toggle(key)}
                    style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 10px', border:`1.5px solid ${on?'#0F2342':'#D3D1C7'}`,
                             borderRadius:8, background:on?'#0F234210':'#fff', cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}>
                    <div style={{ width:16, height:16, borderRadius:4, background:on?'#0F2342':'#fff', border:`1.5px solid ${on?'#0F2342':'#D3D1C7'}`,
                                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {on && <Check size={10} color="#fff"/>}
                    </div>
                    <span style={{ fontSize:11, fontWeight:600, color:on?'#0F2342':'#6B7A9A', lineHeight:1.3 }}>{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding:'12px 20px', borderTop:`1px solid #D3D1C7`, display:'flex', justifyContent:'flex-end', gap:8, background:'#FAFAF7' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.name.trim()}>
            {mode === 'create' ? 'Create Role' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Staff Member Modal ─────────────────────────────────────────────────────────
function StaffMemberModal({ data, mode, customRoles, onSave, onClose }) {
  const [form, setForm] = useState({ ...data })
  const [error, setError] = useState('')
  function handleSave() {
    setError('')
    if (!form.name.trim()) return
    if (form.phone && !isValidPhone(form.phone)) {
      setError(phoneError())
      return
    }
    onSave({ ...form, phone: form.phone ? phoneInputValue(form.phone) : '' })
  }
  const standardRoles = [
    { value:'doctor', label:'Doctor' },
    { value:'receptionist', label:'Receptionist' },
    { value:'staff', label:'Staff' },
  ]
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,35,66,.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:400, boxShadow:'0 8px 40px rgba(0,0,0,.2)', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ padding:'14px 20px', borderBottom:`1px solid #D3D1C7`, display:'flex', alignItems:'center', justifyContent:'space-between', background:'#FAFAF7' }}>
          <div style={{ fontSize:15, fontWeight:800, color:'#0F2342' }}>{mode === 'create' ? 'Add Staff Member' : 'Edit Staff Member'}</div>
          <IconButton icon={X} ariaLabel="Close" onClick={onClose} />
        </div>
        <div style={{ padding:20 }}>
          {/* Name */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B7A9A', marginBottom:5, textTransform:'uppercase', letterSpacing:'.04em' }}>Full Name *</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Mohan Das"
              style={{ width:'100%', border:'1.5px solid #D3D1C7', borderRadius:8, padding:'9px 13px', fontSize:14, color:'#0F2342', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
          </div>
          {/* Phone */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B7A9A', marginBottom:5, textTransform:'uppercase', letterSpacing:'.04em' }}>Phone</label>
            <input value={formatPhone(form.phone||'')} onChange={e=>setForm(f=>({...f,phone:phoneInputValue(e.target.value)}))} placeholder="98765 43210" type="tel" inputMode="numeric"
              style={{ width:'100%', border:'1.5px solid #D3D1C7', borderRadius:8, padding:'9px 13px', fontSize:14, color:'#0F2342', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
          </div>
          {/* Role */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6B7A9A', marginBottom:5, textTransform:'uppercase', letterSpacing:'.04em' }}>Role</label>
            <select value={form.role === 'custom' ? `custom:${form.customRoleId}` : form.role}
              onChange={e => {
                const v = e.target.value
                if (v.startsWith('custom:')) setForm(f=>({...f,role:'custom',customRoleId:v.replace('custom:','')}))
                else setForm(f=>({...f,role:v,customRoleId:null}))
              }}
              style={{ width:'100%', border:'1.5px solid #D3D1C7', borderRadius:8, padding:'9px 13px', fontSize:14, color:'#0F2342', background:'#fff', outline:'none', fontFamily:'inherit' }}>
              {standardRoles.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
              {customRoles.length > 0 && (
                <optgroup label="Custom Roles">
                  {customRoles.map(cr=><option key={cr.id} value={`custom:${cr.id}`}>{cr.name}</option>)}
                </optgroup>
              )}
            </select>
          </div>
          {/* Show on Login */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderTop:'1px solid #D3D1C7' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#0F2342' }}>Show on Login Page</div>
              <div style={{ fontSize:11, color:'#6B7A9A', marginTop:2 }}>This person's card will appear on the login screen</div>
            </div>
            <button onClick={() => setForm(f=>({...f,showOnLogin:!f.showOnLogin}))}
              style={{ width:44, height:24, borderRadius:12, background:form.showOnLogin?'#0F2342':'#D3D1C7', border:'none',
                       cursor:'pointer', position:'relative', flexShrink:0, transition:'background .2s' }}>
              <div style={{ position:'absolute', top:2, left:form.showOnLogin?22:2, width:20, height:20, borderRadius:10, background:'#fff', transition:'left .2s' }}/>
            </button>
          </div>
        </div>
        {/* Footer */}
        {error && <div style={{ margin:'0 20px 12px', padding:'9px 11px', borderRadius:8, background:'#FEF2F2', border:'1px solid #FECACA', color:'#B91C1C', fontSize:12 }}>{error}</div>}
        <div style={{ padding:'12px 20px', borderTop:`1px solid #D3D1C7`, display:'flex', justifyContent:'flex-end', gap:8, background:'#FAFAF7' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.name.trim()}>
            {mode === 'create' ? 'Add Member' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
