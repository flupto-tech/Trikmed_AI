'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Plus, X, CheckCircle, Filter } from 'lucide-react'
import { Button, IconButton, FilterChip } from '../../components/ui/Button'
import { getSession } from '../../utils/auth'
import { portalCan } from '../../config/roles'
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
  return <div style={{ background: DS.cardBg, border: `1px solid ${DS.cardBorder}`, borderRadius: 12, ...style }}>{children}</div>
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_EMPLOYEES = [
  { id:'E1', name:'Vikas Panwar',   role:'super_admin',  display_role:'Founder & CEO',    zone:'All',        city:'Jaipur',     phone:'+91 98765 00001', joining:'Jan 2024', status:'active',   base_salary:0,     commission:0    },
  { id:'E2', name:'Rahul Sharma',   role:'zone_manager', display_role:'Zone Manager',      zone:'North Zone', city:'All',        phone:'+91 98765 00002', joining:'Mar 2024', status:'active',   base_salary:45000, commission:0    },
  { id:'E3', name:'Kavita Reddy',   role:'zone_manager', display_role:'Zone Manager',      zone:'South Zone', city:'All',        phone:'+91 98765 00003', joining:'Mar 2024', status:'active',   base_salary:45000, commission:0    },
  { id:'E4', name:'Amit Verma',     role:'city_manager', display_role:'City Manager',      zone:'North Zone', city:'Jaipur',     phone:'+91 98765 00004', joining:'Apr 2024', status:'active',   base_salary:35000, commission:0    },
  { id:'E5', name:'Neha Gupta',     role:'city_manager', display_role:'City Manager',      zone:'North Zone', city:'Delhi',      phone:'+91 98765 00005', joining:'Apr 2024', status:'active',   base_salary:35000, commission:0    },
  { id:'E6', name:'Arjun Nair',     role:'city_manager', display_role:'City Manager',      zone:'South Zone', city:'Bangalore',  phone:'+91 98765 00006', joining:'May 2024', status:'active',   base_salary:35000, commission:0    },
  { id:'E7', name:'Pooja Sharma',   role:'sales_mr',     display_role:'Sales Executive',   zone:'North Zone', city:'Jaipur',     phone:'+91 98765 00007', joining:'Dec 2024', status:'active',   base_salary:20000, commission:4500 },
  { id:'E8', name:'Sunil Gupta',    role:'sales_mr',     display_role:'Sales Executive',   zone:'North Zone', city:'Jaipur',     phone:'+91 98765 00008', joining:'Jan 2025', status:'active',   base_salary:20000, commission:2800 },
  { id:'E9', name:'Rohit Sharma',   role:'sales_mr',     display_role:'Sales Executive',   zone:'North Zone', city:'Delhi',      phone:'+91 98765 00009', joining:'Oct 2024', status:'active',   base_salary:20000, commission:3200 },
  { id:'E10',name:'Anil Kapoor',    role:'sales_mr',     display_role:'Sales Executive',   zone:'North Zone', city:'Delhi',      phone:'+91 98765 00010', joining:'Nov 2024', status:'active',   base_salary:20000, commission:1500 },
  { id:'E11',name:'Meena Iyer',     role:'sales_mr',     display_role:'Sales Executive',   zone:'South Zone', city:'Bangalore',  phone:'+91 98765 00011', joining:'Nov 2024', status:'active',   base_salary:20000, commission:3800 },
  { id:'E12',name:'Deepak Kumar',   role:'sales_mr',     display_role:'Sales Executive',   zone:'North Zone', city:'Jaipur',     phone:'+91 98765 00012', joining:'Feb 2025', status:'inactive', base_salary:20000, commission:800  },
  { id:'E13',name:'Anita Yadav',    role:'hr_manager',   display_role:'HR Manager',        zone:'All',        city:'Jaipur',     phone:'+91 98765 00013', joining:'Jun 2024', status:'active',   base_salary:38000, commission:0    },
]

const MOCK_ATTENDANCE = [
  { id:'A1', employee:'Pooja Sharma',  role:'Sales Executive', date:'Apr 18', first_activity:'9:12 AM', last_activity:'6:45 PM', clinics_visited:5, deals_updated:2, status:'active' },
  { id:'A2', employee:'Sunil Gupta',   role:'Sales Executive', date:'Apr 18', first_activity:'9:30 AM', last_activity:'5:30 PM', clinics_visited:4, deals_updated:1, status:'active' },
  { id:'A3', employee:'Rohit Sharma',  role:'Sales Executive', date:'Apr 18', first_activity:'—',       last_activity:'—',       clinics_visited:0, deals_updated:0, status:'inactive' },
  { id:'A4', employee:'Meena Iyer',    role:'Sales Executive', date:'Apr 18', first_activity:'8:55 AM', last_activity:'7:00 PM', clinics_visited:6, deals_updated:3, status:'active' },
  { id:'A5', employee:'Anil Kapoor',   role:'Sales Executive', date:'Apr 18', first_activity:'10:10 AM',last_activity:'4:50 PM', clinics_visited:3, deals_updated:1, status:'active' },
  { id:'A6', employee:'Deepak Kumar',  role:'Sales Executive', date:'Apr 18', first_activity:'—',       last_activity:'—',       clinics_visited:0, deals_updated:0, status:'inactive' },
]

const MOCK_PAYROLL = [
  { id:'P1', employee:'Rahul Sharma',  role:'Zone Manager',   base:45000, commission:0,    total:45000, status:'paid'    },
  { id:'P2', employee:'Kavita Reddy',  role:'Zone Manager',   base:45000, commission:0,    total:45000, status:'paid'    },
  { id:'P3', employee:'Amit Verma',    role:'City Manager',   base:35000, commission:0,    total:35000, status:'paid'    },
  { id:'P4', employee:'Neha Gupta',    role:'City Manager',   base:35000, commission:0,    total:35000, status:'pending' },
  { id:'P5', employee:'Arjun Nair',    role:'City Manager',   base:35000, commission:0,    total:35000, status:'pending' },
  { id:'P6', employee:'Pooja Sharma',  role:'Sales Executive',base:20000, commission:4500, total:24500, status:'pending' },
  { id:'P7', employee:'Sunil Gupta',   role:'Sales Executive',base:20000, commission:2800, total:22800, status:'pending' },
  { id:'P8', employee:'Rohit Sharma',  role:'Sales Executive',base:20000, commission:3200, total:23200, status:'pending' },
  { id:'P9', employee:'Anil Kapoor',   role:'Sales Executive',base:20000, commission:1500, total:21500, status:'pending' },
  { id:'P10',employee:'Meena Iyer',    role:'Sales Executive',base:20000, commission:3800, total:23800, status:'pending' },
  { id:'P11',employee:'Anita Yadav',   role:'HR Manager',     base:38000, commission:0,    total:38000, status:'paid'    },
]

const MOCK_PERFORMANCE = [
  { id:'PR1',employee:'Pooja Sharma',  role:'Sales Executive', this_month:95, last_month:88, deal_target:5, deals_done:5, trend:'up'   },
  { id:'PR2',employee:'Meena Iyer',    role:'Sales Executive', this_month:88, last_month:85, deal_target:4, deals_done:4, trend:'up'   },
  { id:'PR3',employee:'Rohit Sharma',  role:'Sales Executive', this_month:85, last_month:82, deal_target:5, deals_done:4, trend:'up'   },
  { id:'PR4',employee:'Sunil Gupta',   role:'Sales Executive', this_month:78, last_month:81, deal_target:5, deals_done:3, trend:'down' },
  { id:'PR5',employee:'Anil Kapoor',   role:'Sales Executive', this_month:71, last_month:74, deal_target:4, deals_done:2, trend:'down' },
  { id:'PR6',employee:'Anita Yadav',   role:'HR Manager',      this_month:90, last_month:88, deal_target:0, deals_done:0, trend:'up'   },
  { id:'PR7',employee:'Deepak Kumar',  role:'Sales Executive', this_month:45, last_month:62, deal_target:4, deals_done:1, trend:'down' },
]

const ROLE_BADGE = {
  super_admin:  { bg:'#0F2D5E', color:'#fff'    },
  zone_manager: { bg:'#DBEAFE', color:'#1E40AF' },
  city_manager: { bg:'#EDE9FE', color:'#5B21B6' },
  sales_mr:     { bg:'#D1FAE5', color:'#065F46' },
  hr_manager:   { bg:'#FEF3C7', color:'#92400E' },
}

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const inp = {
  height: 40, borderRadius: 8, padding: '0 12px',
  border: `1px solid ${DS.inputBorder}`, fontSize: 13,
  color: DS.textPrimary, outline: 'none', background: '#fff',
  boxSizing: 'border-box', width: '100%',
}
const lbl = { fontSize: 12, fontWeight: 600, color: DS.textMuted, display: 'block', marginBottom: 5 }

// ── Add Employee Slide Panel ──────────────────────────────────────────────────
function AddEmployeePanel({ onClose, canSeeSalary }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', role: 'sales_mr',
    zone: 'North Zone', city: 'Jaipur', joining: '', base_salary: '',
  })
  const [done, setDone] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const needsZone = ['zone_manager','city_manager','sales_mr'].includes(form.role)
  const needsCity = ['city_manager','sales_mr'].includes(form.role)
  const isValid = form.name && form.phone && form.email && form.role

  if (done) return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.25 }}
      style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: 460, zIndex: 60, background: '#fff', boxShadow: '-8px 0 40px rgba(0,0,0,0.14)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 36 }}>
      <CheckCircle size={48} style={{ color: '#22c55e', marginBottom: 16 }}/>
      <p style={{ fontSize: 17, fontWeight: 700, color: DS.textPrimary, margin: '0 0 8px' }}>Employee Added!</p>
      <p style={{ fontSize: 13, color: DS.textMuted, marginBottom: 24, textAlign: 'center' }}>{form.name} has been added as {form.role.replace('_', ' ')}.</p>
      <Button onClick={onClose}>Done</Button>
    </motion.div>
  )

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.25 }}
      style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: 460, zIndex: 60, background: '#fff', boxShadow: '-8px 0 40px rgba(0,0,0,0.14)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${DS.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: DS.textPrimary, margin: 0 }}>Add Employee</p>
          <p style={{ fontSize: 12, color: DS.textMuted, marginTop: 2 }}>New portal team member</p>
        </div>
        <IconButton icon={X} ariaLabel="Close" onClick={onClose} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Full Name *</label>
            <input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Rahul Gupta"
              onFocus={e => e.target.style.borderColor = DS.secondary} onBlur={e => e.target.style.borderColor = DS.inputBorder}/>
          </div>
          <div>
            <label style={lbl}>Phone *</label>
            <input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210"
              onFocus={e => e.target.style.borderColor = DS.secondary} onBlur={e => e.target.style.borderColor = DS.inputBorder}/>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Email *</label>
          <input style={inp} value={form.email} onChange={e => set('email', e.target.value)} placeholder="rahul@trikmed.com"
            onFocus={e => e.target.style.borderColor = DS.secondary} onBlur={e => e.target.style.borderColor = DS.inputBorder}/>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Role *</label>
          <select style={{ ...inp, cursor: 'pointer' }} value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="zone_manager">Zone Manager</option>
            <option value="city_manager">City Manager</option>
            <option value="sales_mr">Sales Executive</option>
            <option value="hr_manager">HR Manager</option>
          </select>
        </div>
        {needsZone && (
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Zone *</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={form.zone} onChange={e => set('zone', e.target.value)}>
              {['North Zone','South Zone'].map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        )}
        {needsCity && (
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>City *</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={form.city} onChange={e => set('city', e.target.value)}>
              {['Jaipur','Delhi','Bangalore','Ajmer','Kota','Udaipur'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Joining Date *</label>
          <input type="date" style={inp} value={form.joining} onChange={e => set('joining', e.target.value)}
            onFocus={e => e.target.style.borderColor = DS.secondary} onBlur={e => e.target.style.borderColor = DS.inputBorder}/>
        </div>
        {canSeeSalary && (
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Base Salary (₹/month)</label>
            <input type="number" style={inp} value={form.base_salary} onChange={e => set('base_salary', e.target.value)} placeholder="e.g. 25000"
              onFocus={e => e.target.style.borderColor = DS.secondary} onBlur={e => e.target.style.borderColor = DS.inputBorder}/>
          </div>
        )}
      </div>
      <div style={{ padding: '16px 24px', borderTop: `1px solid ${DS.cardBorder}`, flexShrink: 0, display: 'flex', gap: 10 }}>
        <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
        <Button fullWidth onClick={() => { if (isValid) setDone(true) }} disabled={!isValid}>
          Add Employee
        </Button>
      </div>
    </motion.div>
  )
}

// ── Tab 1: Team Directory ─────────────────────────────────────────────────────
function TeamDirectoryTab({ canManage, canSeeSalary }) {
  const [search, setSearch]       = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterZone, setFilterZone] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAdd, setShowAdd]     = useState(false)

  // TODO: Ashutosh uncomment ↓
  // const [employees, setEmployees] = useState([])
  // useEffect(() => { portalApi.getTeamDirectory().then(setEmployees) }, [])
  const employees = MOCK_EMPLOYEES

  const filtered = employees.filter(e => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.phone.includes(search)) return false
    if (filterRole !== 'all' && e.role !== filterRole) return false
    if (filterZone !== 'all' && e.zone !== filterZone && e.zone !== 'All') return false
    if (filterStatus !== 'all' && e.status !== filterStatus) return false
    return true
  })

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: DS.textSubtle }}/>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            style={{ ...inp, paddingLeft: 32 }}
            onFocus={e => e.target.style.borderColor = DS.secondary}
            onBlur={e => e.target.style.borderColor = DS.inputBorder}/>
        </div>
        <select style={{ height: 40, borderRadius: 8, padding: '0 12px', border: `1px solid ${DS.inputBorder}`, fontSize: 13, color: DS.textMuted, background: '#fff', cursor: 'pointer' }}
          value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="super_admin">Founder</option>
          <option value="zone_manager">Zone Manager</option>
          <option value="city_manager">City Manager</option>
          <option value="sales_mr">Sales Executive</option>
          <option value="hr_manager">HR Manager</option>
        </select>
        <select style={{ height: 40, borderRadius: 8, padding: '0 12px', border: `1px solid ${DS.inputBorder}`, fontSize: 13, color: DS.textMuted, background: '#fff', cursor: 'pointer' }}
          value={filterZone} onChange={e => setFilterZone(e.target.value)}>
          <option value="all">All Zones</option>
          <option value="North Zone">North Zone</option>
          <option value="South Zone">South Zone</option>
        </select>
        <select style={{ height: 40, borderRadius: 8, padding: '0 12px', border: `1px solid ${DS.inputBorder}`, fontSize: 13, color: DS.textMuted, background: '#fff', cursor: 'pointer' }}
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {canManage && (
          <Button icon={Plus} onClick={() => setShowAdd(true)}>Add Employee</Button>
        )}
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 90px 110px 80px', gap: 12, padding: '10px 20px', background: DS.bg, borderRadius: '8px 8px 0 0', border: `1px solid ${DS.cardBorder}` }}>
        {['Employee','Role','Zone / City','Phone','Joining Date','Status'].map(h => (
          <span key={h} style={{ fontSize: 10, fontWeight: 700, color: DS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div style={{ border: `1px solid ${DS.cardBorder}`, borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
        {filtered.map((emp, i) => {
          const badge = ROLE_BADGE[emp.role] || { bg: DS.bg, color: DS.textMuted }
          return (
            <div key={emp.id}
              style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 90px 110px 80px', gap: 12, alignItems: 'center', padding: '12px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${DS.bg}` : 'none', background: emp.status === 'inactive' ? '#fafafa' : '#fff', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = DS.rowHover}
              onMouseLeave={e => e.currentTarget.style.background = emp.status === 'inactive' ? '#fafafa' : '#fff'}>
              {/* Name + avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: badge.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: emp.status === 'inactive' ? 0.5 : 1 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: badge.color }}>{initials(emp.name)}</span>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: DS.textPrimary, margin: 0, opacity: emp.status === 'inactive' ? 0.5 : 1 }}>{emp.name}</p>
                  <p style={{ fontSize: 11, color: DS.textSubtle, margin: 0 }}>{emp.display_role}</p>
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: badge.bg, color: badge.color, width: 'fit-content' }}>
                {emp.display_role}
              </span>
              <span style={{ fontSize: 12, color: DS.textMuted }}>
                {emp.city !== 'All' ? emp.city : emp.zone !== 'All' ? emp.zone.replace(' Zone','') : 'All'}
              </span>
              <span style={{ fontSize: 12, color: DS.textMuted }}>{emp.phone.replace('+91 ','')}</span>
              <span style={{ fontSize: 12, color: DS.textMuted }}>{emp.joining}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: emp.status === 'active' ? '#D1FAE5' : '#FEE2E2', color: emp.status === 'active' ? '#065F46' : '#991B1B' }}>
                {emp.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: DS.textSubtle }}>No employees match your filters.</p>
        )}
      </div>

      {/* Slide panel backdrop + panel */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}/>
            <AddEmployeePanel key="panel" onClose={() => setShowAdd(false)} canSeeSalary={canSeeSalary}/>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Tab 2: Attendance & Activity ──────────────────────────────────────────────
function AttendanceTab() {
  const [filterEmp, setFilterEmp] = useState('all')
  // TODO: Ashutosh uncomment ↓
  // const [attendance, setAttendance] = useState([])
  // useEffect(() => { portalApi.getAttendance({ date: today }).then(setAttendance) }, [])
  const attendance = MOCK_ATTENDANCE
  const filtered = filterEmp === 'all' ? attendance : attendance.filter(a => a.employee === filterEmp)

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select style={{ height: 40, borderRadius: 8, padding: '0 12px', border: `1px solid ${DS.inputBorder}`, fontSize: 13, color: DS.textMuted, background: '#fff', cursor: 'pointer' }}
          value={filterEmp} onChange={e => setFilterEmp(e.target.value)}>
          <option value="all">All Employees</option>
          {MOCK_ATTENDANCE.map(a => <option key={a.id} value={a.employee}>{a.employee}</option>)}
        </select>
        <div style={{ padding: '0 14px', borderRadius: 8, border: `1px solid ${DS.cardBorder}`, background: '#fff', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: DS.textMuted }}>Today — Apr 18, 2026</span>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Active Today',   value: attendance.filter(a => a.status === 'active').length,   color: '#065F46', bg: '#D1FAE5' },
          { label: 'No Activity',    value: attendance.filter(a => a.status === 'inactive').length, color: '#991B1B', bg: '#FEE2E2' },
          { label: 'Clinics Visited',value: attendance.reduce((s, a) => s + a.clinics_visited, 0),  color: DS.secondary, bg: '#EFF6FF' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '14px 18px' }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: DS.textMuted, marginTop: 3 }}>{s.label}</p>
          </Card>
        ))}
      </div>

      <div style={{ border: `1px solid ${DS.cardBorder}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 100px 100px 100px 90px 80px 80px', gap: 10, padding: '10px 20px', background: DS.bg }}>
          {['Employee','Date','First Activity','Last Activity','Clinics Visited','Deals Updated','Status'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: DS.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
          ))}
        </div>
        {filtered.map((a, i) => (
          <div key={a.id}
            style={{ display: 'grid', gridTemplateColumns: '1.2fr 100px 100px 100px 90px 80px 80px', gap: 10, alignItems: 'center', padding: '12px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${DS.bg}` : 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = DS.rowHover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: DS.textPrimary, margin: 0 }}>{a.employee}</p>
              <p style={{ fontSize: 11, color: DS.textSubtle, margin: 0 }}>{a.role}</p>
            </div>
            <span style={{ fontSize: 12, color: DS.textMuted }}>{a.date}</span>
            <span style={{ fontSize: 12, color: a.first_activity !== '—' ? DS.textPrimary : DS.textSubtle }}>{a.first_activity}</span>
            <span style={{ fontSize: 12, color: a.last_activity !== '—' ? DS.textPrimary : DS.textSubtle }}>{a.last_activity}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: a.clinics_visited > 0 ? DS.secondary : DS.textSubtle }}>{a.clinics_visited}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: a.deals_updated > 0 ? '#065F46' : DS.textSubtle }}>{a.deals_updated}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.status === 'active' ? '#22c55e' : '#ef4444', flexShrink: 0 }}/>
              <span style={{ fontSize: 11, fontWeight: 600, color: a.status === 'active' ? '#065F46' : '#991B1B' }}>
                {a.status === 'active' ? 'Active' : 'No Activity'}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab 3: Payroll Summary ────────────────────────────────────────────────────
function PayrollTab() {
  const [payroll, setPayroll] = useState(MOCK_PAYROLL)
  // TODO: Ashutosh uncomment ↓
  // useEffect(() => { portalApi.getPayroll('2026-04').then(setPayroll) }, [])

  const markPaid = (id) => {
    setPayroll(p => p.map(r => r.id === id ? { ...r, status: 'paid' } : r))
    // TODO: Ashutosh uncomment ↓
    // portalApi.markPayrollPaid(id)
  }

  const totalBase       = payroll.reduce((s, r) => s + r.base, 0)
  const totalCommission = payroll.reduce((s, r) => s + r.commission, 0)
  const totalPayout     = payroll.reduce((s, r) => s + r.total, 0)
  const pendingCount    = payroll.filter(r => r.status === 'pending').length

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Base Salaries',  value: `₹${totalBase.toLocaleString()}`,       color: DS.secondary, bg: '#EFF6FF' },
          { label: 'Commission Payouts',   value: `₹${totalCommission.toLocaleString()}`, color: '#b45309',    bg: '#fef3c7' },
          { label: 'Total Payroll Apr',    value: `₹${totalPayout.toLocaleString()}`,      color: '#065F46',    bg: '#D1FAE5' },
          { label: 'Pending Payments',     value: pendingCount,                             color: '#991B1B',    bg: '#FEE2E2' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: DS.textMuted, marginTop: 4 }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Payroll table */}
      <div style={{ border: `1px solid ${DS.cardBorder}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 100px 110px 110px 90px', gap: 12, padding: '10px 20px', background: DS.bg }}>
          {['Employee','Role','Base Salary','Commission','Total Payout','Status'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: DS.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
          ))}
        </div>
        {payroll.map((row, i) => (
          <div key={row.id}
            style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 100px 110px 110px 90px', gap: 12, alignItems: 'center', padding: '12px 20px', borderBottom: i < payroll.length - 1 ? `1px solid ${DS.bg}` : 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = DS.rowHover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ fontSize: 13, fontWeight: 600, color: DS.textPrimary }}>{row.employee}</span>
            <span style={{ fontSize: 12, color: DS.textMuted }}>{row.role}</span>
            <span style={{ fontSize: 13, color: DS.textPrimary }}>₹{row.base.toLocaleString()}</span>
            <span style={{ fontSize: 13, fontWeight: row.commission > 0 ? 600 : 400, color: row.commission > 0 ? '#065F46' : DS.textSubtle }}>
              {row.commission > 0 ? `₹${row.commission.toLocaleString()}` : '—'}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: DS.textPrimary }}>₹{row.total.toLocaleString()}</span>
            {row.status === 'paid' ? (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#D1FAE5', color: '#065F46' }}>Paid</span>
            ) : (
              <Button size="sm" onClick={() => markPaid(row.id)}>Mark Paid</Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab 4: Performance Review ─────────────────────────────────────────────────
function PerformanceTab() {
  // TODO: Ashutosh uncomment ↓
  // const [perf, setPerf] = useState([])
  // useEffect(() => { portalApi.getPerformanceReview('2026-04').then(setPerf) }, [])
  const perf = MOCK_PERFORMANCE.sort((a, b) => b.this_month - a.this_month)

  return (
    <div>
      {/* Top 3 banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 20 }}>
        {perf.slice(0, 3).map((p, i) => (
          <Card key={p.id} style={{ padding: '16px 20px', borderLeft: `3px solid ${i===0?'#f59e0b':i===1?'#9ca3af':'#b45309'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{i===0?'🏆':i===1?'🥈':'🥉'}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: DS.textPrimary }}>{p.employee}</span>
            </div>
            <p style={{ fontSize: 24, fontWeight: 800, color: DS.secondary, margin: '0 0 4px' }}>{p.this_month}%</p>
            <p style={{ fontSize: 12, color: DS.textMuted, margin: 0 }}>{p.role}</p>
          </Card>
        ))}
      </div>

      {/* Full table */}
      <div style={{ border: `1px solid ${DS.cardBorder}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 100px 100px 60px 90px 80px 90px', gap: 10, padding: '10px 20px', background: DS.bg }}>
          {['Employee','Role','This Month','Last Month','Trend','Deal Target','Deals Done','Rating'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: DS.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
          ))}
        </div>
        {perf.map((p, i) => {
          const rating = p.this_month >= 80 ? { label: '⭐ Top', color: '#065F46', bg: '#D1FAE5' }
                       : p.this_month >= 60 ? { label: '✓ Good', color: '#1E40AF', bg: '#DBEAFE' }
                       :                      { label: '⚠ Low',  color: '#991B1B', bg: '#FEE2E2' }
          return (
            <div key={p.id}
              style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 100px 100px 60px 90px 80px 90px', gap: 10, alignItems: 'center', padding: '12px 20px', borderBottom: i < perf.length - 1 ? `1px solid ${DS.bg}` : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = DS.rowHover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {i < 3 && <span>{['🏆','🥈','🥉'][i]}</span>}
                <span style={{ fontSize: 13, fontWeight: 600, color: DS.textPrimary }}>{p.employee}</span>
              </div>
              <span style={{ fontSize: 12, color: DS.textMuted }}>{p.role}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: DS.secondary }}>{p.this_month}%</span>
              <span style={{ fontSize: 12, color: DS.textMuted }}>{p.last_month}%</span>
              <span style={{ fontSize: 14 }}>{p.trend === 'up' ? '↑' : '↓'}</span>
              <span style={{ fontSize: 12, color: DS.textMuted }}>{p.deal_target > 0 ? p.deal_target : '—'}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: p.deals_done > 0 ? DS.textPrimary : DS.textSubtle }}>{p.deals_done > 0 ? p.deals_done : '—'}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: rating.bg, color: rating.color }}>{rating.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main HR Module ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'directory',   label: '👥 Team Directory'       },
  { id: 'attendance',  label: '📋 Attendance & Activity' },
  { id: 'payroll',     label: '💰 Payroll Summary'       },
  { id: 'performance', label: '📊 Performance Review'    },
]

export default function HRModule() {
  const session  = getSession()
  const [activeTab, setActiveTab] = useState('directory')

  const canManage   = portalCan(session, 'manage_team')
  const canSeeSalary = portalCan(session, 'see_hr_salaries')

  // Payroll tab only for super_admin and hr_manager
  const visibleTabs = TABS.filter(t => {
    if (t.id === 'payroll') return canSeeSalary
    return true
  })

  return (
    <div style={{ padding: 24 }}>
      <BackButton />
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: DS.textPrimary, margin: 0 }}>HR Module</h1>
        <p style={{ fontSize: 13, color: DS.textMuted, marginTop: 4 }}>People management · {MOCK_EMPLOYEES.filter(e => e.status === 'active').length} active employees</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, background: '#fff', border: `1px solid ${DS.cardBorder}`, borderRadius: 8, padding: 3, marginBottom: 24, width: 'fit-content', flexWrap: 'wrap' }}>
        {visibleTabs.map(t => (
          <FilterChip key={t.id} value={t.id} isActive={activeTab === t.id} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </FilterChip>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {activeTab === 'directory'   && <TeamDirectoryTab canManage={canManage} canSeeSalary={canSeeSalary}/>}
          {activeTab === 'attendance'  && <AttendanceTab/>}
          {activeTab === 'payroll'     && canSeeSalary && <PayrollTab/>}
          {activeTab === 'performance' && <PerformanceTab/>}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
