'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building, Clock, MessageCircle, Bell, User, Save, CheckCircle, Plus, Trash2, Moon, Sun, Palette } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { clinicInfo } from '../../data/mockData'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { Button } from '../../components/ui/Button'
import { can } from '../../utils/auth'
// TODO: Ashutosh uncomment ↓
// import { clinicApi } from '../../services/clinicApi'
// import { getClinicId } from '../../utils/auth'

const TABS = [
  { id: 'clinic',      label: 'Clinic Profile', icon: Building },
  { id: 'doctors',     label: 'Doctors',        icon: User },
  { id: 'hours',       label: 'Working Hours',  icon: Clock },
  { id: 'whatsapp',    label: 'WhatsApp',       icon: MessageCircle },
  { id: 'notifs',      label: 'Notifications',  icon: Bell },
  { id: 'appearance',  label: 'Appearance',     icon: Palette },
]

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function SaveButton({ onClick }) {
  const [saved, setSaved] = useState(false)
  const handleClick = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onClick?.()
  }
  return (
    <Button icon={saved ? CheckCircle : Save} onClick={handleClick}>
      {saved ? 'Saved!' : 'Save Changes'}
    </Button>
  )
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-[12px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{label}</label>
      {children}
      {hint && <p className="text-[12px] mt-1.5" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{hint}</p>}
    </div>
  )
}

function InputField({ label, defaultValue, type = 'text', hint, placeholder }) {
  return (
    <Field label={label} hint={hint}>
      <input type={type} defaultValue={defaultValue} placeholder={placeholder} className="ds-input dark:bg-gray-800 dark:text-white dark:border-gray-600" />
    </Field>
  )
}

function Toggle({ label, desc, defaultChecked = true }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <div className="flex items-center justify-between py-4" style={{ borderBottom: '1px solid #DDE4F0' }}>
      <div className="flex-1 pr-6">
        <p className="text-[14px] font-semibold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>{label}</p>
        {desc && <p className="text-[13px] mt-0.5" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{desc}</p>}
      </div>
      <button
        onClick={() => setOn(!on)}
        className="w-12 h-6 rounded-xl transition-all duration-200 flex items-center px-0.5 flex-shrink-0"
        style={{ background: on ? '#E5402B' : '#e5e7eb' }}
      >
        <div className="w-5 h-5 rounded-xl bg-white transition-transform duration-200 shadow-sm"
          style={{ transform: on ? 'translateX(24px)' : 'translateX(0)' }} />
      </button>
    </div>
  )
}

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError,   setPageError]   = useState(null)

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    try {
      // TODO: Ashutosh uncomment ↓
      // const clinic_id = getClinicId()
      // const res = await clinicApi.getSettings(clinic_id)
      // setSettingsData(res)
    } catch (e) {
      setPageError(e?.message || e?.detail || 'Failed to load settings')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const [activeTab, setActiveTab] = useState('clinic')
  const [doctors, setDoctors] = useState([
    { id: 1, name: 'Dr. Rajesh Sharma', specialization: 'General Physician', active: true },
    { id: 2, name: 'Dr. Sunita Joshi',  specialization: 'Pediatrician',      active: true },
  ])
  const [hours, setHours] = useState(
    days.map((d, i) => ({ day: d, open: '09:00', close: '21:00', active: i < 6 }))
  )

  const addDoctor    = () => setDoctors(prev => [...prev, { id: Date.now(), name: '', specialization: '', active: true }])
  const removeDoctor = (id) => setDoctors(prev => prev.filter(d => d.id !== id))
  const toggleHour   = (i) => setHours(prev => prev.map((h, j) => j === i ? { ...h, active: !h.active } : h))

  if (pageLoading) return <LoadingSpinner message="Loading settings…" />
  if (pageError)   return <ErrorBanner message={pageError} onRetry={loadData} />

  const canEdit = can('page_settings')

  return (
    <div className="ds-page space-y-6 dark:bg-gray-900">
      {/* Header */}
      <div>
        <h1 className="ds-section-title">Settings</h1>
        <p className="ds-section-subtitle">Manage your clinic profile and preferences</p>
      </div>

      {!canEdit && (
        <div className="ds-card flex items-center gap-4" style={{ background: 'var(--tm-surface2,#F7F9FF)', border: '1.5px solid #DDE4F0' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#FFE9E6' }}>
            <Building size={18} style={{ color: '#E5402B' }} />
          </div>
          <div>
            <p className="text-[15px] font-semibold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>View Only</p>
            <p className="text-[13px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Only the clinic owner can edit settings.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6" style={{ opacity: canEdit ? 1 : 0.6, pointerEvents: canEdit ? 'auto' : 'none' }}>
        {/* Tab sidebar */}
        <div className="lg:w-52 flex-shrink-0">
          <div style={{ background: 'var(--tm-surface,#fff)', border: '1px solid #DDE4F0', boxShadow: '0 1px 4px rgba(15,45,94,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-3 w-full px-4 py-3.5 text-[14px] text-left transition-all"
                style={{
                  background: activeTab === tab.id ? '#FFE9E6' : 'transparent',
                  color: activeTab === tab.id ? 'var(--tm-text,#0F2D5E)' : 'var(--tm-text-muted,#6B7A9A)',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  borderBottom: i < TABS.length - 1 ? '1px solid #DDE4F0' : 'none',
                  borderLeft: activeTab === tab.id ? '3px solid #E5402B' : '3px solid transparent',
                }}
              >
                <tab.icon size={16} style={{ color: activeTab === tab.id ? '#E5402B' : 'var(--tm-text-muted,#6B7A9A)' }} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{ background: 'var(--tm-surface,#fff)', border: '1px solid #DDE4F0', boxShadow: '0 1px 4px rgba(15,45,94,0.06)', borderRadius: '12px', padding: '32px' }}
          >
            {/* CLINIC PROFILE */}
            {activeTab === 'clinic' && (
              <div className="space-y-5">
                <h2 className="text-[18px] font-bold pb-4" style={{ color: 'var(--tm-text,#0F2D5E)', borderBottom: '1px solid #DDE4F0' }}>Clinic Profile</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  <InputField label="Clinic Name" defaultValue={clinicInfo.name} />
                  <InputField label="City" defaultValue={clinicInfo.city} />
                </div>
                <InputField label="Full Address" defaultValue={clinicInfo.address} />
                <div className="grid sm:grid-cols-2 gap-5">
                  <InputField label="Phone Number" defaultValue={clinicInfo.phone} />
                  <InputField label="Email Address" defaultValue={clinicInfo.email} type="email" />
                </div>
                <InputField
                  label="Public Booking URL"
                  defaultValue={clinicInfo.website}
                  hint="This is your public booking page. Share it on social media."
                />
                <div className="flex justify-end pt-2">
                  <SaveButton />
                </div>
              </div>
            )}

            {/* DOCTORS */}
            {activeTab === 'doctors' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid #DDE4F0' }}>
                  <h2 className="text-[18px] font-bold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>Manage Doctors</h2>
                  <Button variant="secondary" size="sm" icon={Plus} onClick={addDoctor}>Add Doctor</Button>
                </div>
                <div className="space-y-3">
                  {doctors.map(d => (
                    <div key={d.id} className="flex items-center gap-4 p-4"
                      style={{ background: 'var(--tm-surface2,#F7F9FF)', border: '1px solid #DDE4F0', borderRadius: '8px' }}>
                      <div className="w-11 h-11 flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0"
                        style={{ borderRadius: '8px', background: '#1A5CB5' }}>
                        {(d.name.split(' ').find(w => !w.startsWith('Dr.'))?.[0] || 'D')}
                      </div>
                      <div className="flex-1 min-w-0 grid sm:grid-cols-2 gap-3">
                        <input
                          defaultValue={d.name}
                          placeholder="Doctor name"
                          className="ds-input dark:bg-gray-800 dark:text-white dark:border-gray-600"
                          style={{ background: 'var(--tm-surface,#fff)' }}
                        />
                        <input
                          defaultValue={d.specialization}
                          placeholder="Specialization"
                          className="ds-input dark:bg-gray-800 dark:text-white dark:border-gray-600"
                          style={{ background: 'var(--tm-surface,#fff)' }}
                        />
                      </div>
                      <button onClick={() => removeDoctor(d.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{ background: '#fff1f2', color: '#e11d48' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#ffe4e6'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff1f2'}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <SaveButton />
                </div>
              </div>
            )}

            {/* WORKING HOURS */}
            {activeTab === 'hours' && (
              <div className="space-y-5">
                <h2 className="text-[18px] font-bold pb-4" style={{ color: 'var(--tm-text,#0F2D5E)', borderBottom: '1px solid #DDE4F0' }}>Working Hours</h2>
                <div className="space-y-1">
                  {hours.map((h, i) => (
                    <div key={h.day} className="flex items-center gap-4 py-3.5" style={{ borderBottom: '1px solid #DDE4F0' }}>
                      <button
                        onClick={() => toggleHour(i)}
                        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-all"
                        style={{
                          background: h.active ? '#E5402B' : '#fff',
                          borderColor: h.active ? '#E5402B' : '#DDE4F0'
                        }}
                      >
                        {h.active && <CheckCircle size={12} className="text-white" />}
                      </button>
                      <span className="text-[14px] font-semibold w-28 flex-shrink-0"
                        style={{ color: h.active ? 'var(--tm-text,#0F2D5E)' : 'var(--tm-text-muted,#6B7A9A)' }}>{h.day}</span>
                      {h.active ? (
                        <div className="flex items-center gap-3">
                          <input type="time" defaultValue={h.open} className="ds-input dark:bg-gray-800 dark:text-white dark:border-gray-600" style={{ width: '130px' }} />
                          <span className="text-[13px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>to</span>
                          <input type="time" defaultValue={h.close} className="ds-input dark:bg-gray-800 dark:text-white dark:border-gray-600" style={{ width: '130px' }} />
                        </div>
                      ) : (
                        <span className="text-[13px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Closed</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <SaveButton />
                </div>
              </div>
            )}

            {/* WHATSAPP */}
            {activeTab === 'whatsapp' && (
              <div className="space-y-5">
                <h2 className="text-[18px] font-bold pb-4" style={{ color: 'var(--tm-text,#0F2D5E)', borderBottom: '1px solid #DDE4F0' }}>WhatsApp Configuration</h2>

                {/* Connected number */}
                <div className="flex items-center gap-4 p-4"
                  style={{ background: 'var(--tm-surface2,#EFF6FF)', border: '1px solid #BFDBFE', borderRadius: '8px' }}>
                  <div className="w-11 h-11 flex items-center justify-center flex-shrink-0"
                    style={{ borderRadius: '8px', background: 'var(--tm-surface2,#EFF6FF)' }}>
                    <MessageCircle size={18} style={{ color: '#1A5CB5' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-bold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>+91 98765 43210</p>
                    <p className="text-[13px] font-semibold mt-0.5" style={{ color: '#1A5CB5' }}>● Connected & Active</p>
                  </div>
                  <Button variant="secondary" size="sm">Change</Button>
                </div>

                <InputField label="AI Bot Name" defaultValue="City Care Clinic AI" hint="This name appears in WhatsApp messages to patients" />
                <Field label="Welcome Message">
                  <textarea
                    rows={5}
                    defaultValue={"👋 Welcome to City Care Clinic!\n\nI'm your AI receptionist. How can I help you today?\n\n1️⃣ Book an appointment\n2️⃣ Check existing booking\n3️⃣ Talk to the doctor"}
                    className="ds-input dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    style={{ resize: 'none' }}
                  />
                </Field>
                <div className="flex justify-end">
                  <SaveButton />
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'notifs' && (
              <div>
                <h2 className="text-[18px] font-bold mb-5" style={{ color: 'var(--tm-text,#0F2D5E)' }}>Notification Preferences</h2>
                <Toggle label="Appointment confirmation" desc="Notify when a new appointment is booked" defaultChecked />
                <Toggle label="Appointment reminders" desc="Send reminders 24hr and 1hr before each appointment" defaultChecked />
                <Toggle label="Missed call alerts" desc="Alert immediately on every missed call" defaultChecked />
                <Toggle label="No-show notifications" desc="Notify when a patient doesn't show up" defaultChecked />
                <Toggle label="Daily summary" desc="Daily clinic summary via WhatsApp at 9 PM" defaultChecked />
                <Toggle label="New patient alerts" desc="Notify when a new patient registers" />
                <Toggle label="Medicine reminder failures" desc="Alert when a reminder message fails to deliver" />
                <div className="flex justify-end mt-5">
                  <SaveButton />
                </div>
              </div>
            )}

            {/* APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="space-y-5">
                <h2 className="text-[18px] font-bold pb-4" style={{ color: 'var(--tm-text,#0F2D5E)', borderBottom: '1px solid #DDE4F0' }}>Appearance</h2>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 flex items-center justify-between border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <Moon className="text-blue-400 w-5 h-5" />
                    ) : (
                      <Sun className="text-yellow-500 w-5 h-5" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">Display Theme</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {theme === 'dark' ? 'Dark mode — aankhon ko aram milega' : 'Light mode active'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    style={{width:'48px',height:'26px',borderRadius:'13px',backgroundColor:theme==='dark'?'#2563eb':'#d1d5db',position:'relative',border:'none',cursor:'pointer',transition:'background-color 0.3s'}}
                  >
                    <span style={{position:'absolute',top:'3px',left:theme==='dark'?'25px':'3px',width:'20px',height:'20px',borderRadius:'50%',backgroundColor:'white',transition:'left 0.3s',boxShadow:'0 1px 3px rgba(0,0,0,0.3)'}} />
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  )
}
