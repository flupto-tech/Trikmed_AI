'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, BellOff, Send, CheckCircle, MessageCircle, Zap, X } from 'lucide-react'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { Button } from '../../components/ui/Button'
// TODO: Ashutosh uncomment ↓
// import { remindersApi } from '../../services/remindersApi'

const reminderTemplates = [
  { id: 1, name: '24hr Appointment Reminder', type: 'Appointment', status: 'Active', sent: 284, delivered: 281, trigger: '24 hours before appointment' },
  { id: 2, name: '1hr Appointment Reminder',  type: 'Appointment', status: 'Active', sent: 212, delivered: 209, trigger: '1 hour before appointment' },
  { id: 3, name: 'Medicine Reminder (Morning)', type: 'Prescription', status: 'Active', sent: 1240, delivered: 1198, trigger: 'Daily at 8:00 AM' },
  { id: 4, name: 'Medicine Reminder (Evening)', type: 'Prescription', status: 'Active', sent: 1205, delivered: 1170, trigger: 'Daily at 8:00 PM' },
  { id: 5, name: 'Follow-up Reminder',         type: 'Follow-up',   status: 'Active', sent: 93, delivered: 91, trigger: '3 days before follow-up date' },
  { id: 6, name: 'No-show Recovery',           type: 'No-show',     status: 'Paused', sent: 28, delivered: 25, trigger: 'Immediately after no-show' },
]

const recentReminders = [
  { patient: 'Amit Sharma',    type: 'Appointment 24hr', status: 'Delivered', time: '10 min ago', phone: '+91 98765 43210' },
  { patient: 'Priya Gupta',    type: 'Medicine Evening', status: 'Delivered', time: '15 min ago', phone: '+91 97654 11111' },
  { patient: 'Suresh Verma',   type: 'Follow-up',        status: 'Delivered', time: '32 min ago', phone: '+91 96543 22222' },
  { patient: 'Meena Singh',    type: 'Appointment 1hr',  status: 'Delivered', time: '58 min ago', phone: '+91 95432 33333' },
  { patient: 'Rakesh Yadav',   type: 'Medicine Morning', status: 'Failed',    time: '1 hr ago',   phone: '+91 94321 44444' },
  { patient: 'Neha Patel',     type: 'Appointment 24hr', status: 'Delivered', time: '2 hrs ago',  phone: '+91 93210 55555' },
]

const TYPE_COLOR = {
  'Appointment': { bg: '#EFF6FF', color: '#1A5CB5', border: '#BFDBFE' },
  'Prescription': { bg: '#EFF6FF', color: '#0891b2', border: '#BFDBFE' },
  'Follow-up':   { bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' },
  'No-show':     { bg: '#fff1f2', color: '#e11d48', border: '#fecdd3' },
}

export default function Reminders() {
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError,   setPageError]   = useState(null)

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    try {
      // TODO: Ashutosh uncomment ↓
      // const res = await remindersApi.getAll()
      // setTemplates(res)
    } catch (e) {
      setPageError(e?.message || e?.detail || 'Failed to load reminders')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const [templates, setTemplates] = useState(reminderTemplates)
  const [showBroadcast, setShowBroadcast] = useState(false)

  const toggleTemplate = (id) => {
    setTemplates(prev => prev.map(t => t.id === id
      ? { ...t, status: t.status === 'Active' ? 'Paused' : 'Active' } : t))
  }

  const activeCount = templates.filter(t => t.status === 'Active').length

  if (pageLoading) return <LoadingSpinner message="Loading reminders…" />
  if (pageError)   return <ErrorBanner message={pageError} onRetry={loadData} />

  return (
    <div className="ds-page space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="ds-section-title">Reminders</h1>
          <p className="ds-section-subtitle">Automated WhatsApp reminders running 24/7</p>
        </div>
        <Button leftIcon={<Send size={16} strokeWidth={1.8} aria-hidden="true" />} onClick={() => setShowBroadcast(true)}>Broadcast Message</Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Bell,          label: 'Active Templates',  value: activeCount, color: '#1A5CB5', bg: '#EFF6FF' },
          { icon: Send,          label: 'Sent Today',        value: 47,          color: '#1A5CB5', bg: '#EFF6FF' },
          { icon: CheckCircle,   label: 'Delivered Today',   value: 45,          color: '#1A5CB5', bg: '#EFF6FF' },
          { icon: MessageCircle, label: 'Total This Month',  value: '1,240',     color: '#0891b2', bg: '#EFF6FF' },
        ].map(s => (
          <div key={s.label} className="ds-stat-card" style={{ padding: '20px 24px' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: s.bg }}>
              <s.icon size={17} style={{ color: s.color }} />
            </div>
            <p className="text-[28px] font-bold leading-none" style={{ color: s.color, letterSpacing: '-0.5px' }}>{s.value}</p>
            <p className="text-[13px] font-medium mt-2" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Templates list */}
      <div className="ds-table">
        <div className="ds-table-header" style={{ justifyContent: 'space-between' }}>
          <span className="text-[14px] font-semibold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>Reminder Templates</span>
          <span className="text-[13px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{activeCount} active</span>
        </div>
        {templates.map((t, i) => {
          const tc = TYPE_COLOR[t.type] || TYPE_COLOR['Appointment']
          const deliveryRate = Math.round((t.delivered / t.sent) * 100)
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="ds-table-row"
              style={{ gap: '16px' }}
            >
              {/* Status dot */}
              <div className="w-2.5 h-2.5 rounded-xl flex-shrink-0"
                style={{ background: t.status === 'Active' ? '#1A5CB5' : '#d1d5db' }} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <p className="text-[15px] font-semibold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>{t.name}</p>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                    {t.type}
                  </span>
                </div>
                <p className="text-[13px] mt-1" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{t.trigger}</p>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-6 text-[13px] flex-shrink-0">
                <div className="text-right">
                  <p className="font-semibold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>{t.sent.toLocaleString()}</p>
                  <p style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Sent</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold" style={{ color: '#1A5CB5' }}>{deliveryRate}%</p>
                  <p style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Delivered</p>
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => toggleTemplate(t.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all flex-shrink-0"
                style={t.status === 'Active'
                  ? { background: 'var(--tm-surface2,#EFF6FF)', color: '#1A5CB5', border: '1px solid #BFDBFE' }
                  : { background: 'var(--tm-surface2,#F7F9FF)', color: 'var(--tm-text-muted,#6B7A9A)', border: '1px solid #DDE4F0' }}
              >
                {t.status === 'Active'
                  ? <><Bell size={13} /> Active</>
                  : <><BellOff size={13} /> Paused</>}
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Recent log */}
      <div className="ds-table">
        <div className="ds-table-header">
          <span className="text-[14px] font-semibold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>Recent Reminder Log</span>
        </div>
        {/* Log header row */}
        <div className="px-6 py-2 ds-reminder-log-header" style={{ background: 'var(--tm-surface2,#F7F9FF)', borderBottom: '1px solid #DDE4F0' }}>
          <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 80px' }}>
            {['Patient', 'Type', 'Time', 'Status'].map(h => (
              <span key={h} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{h}</span>
            ))}
          </div>
        </div>
        {recentReminders.map((r, i) => (
          <div key={i} className="ds-table-row ds-reminder-log-row">
            <div className="grid w-full gap-4 items-center" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 80px' }}>
              <div>
                <p className="text-[14px] font-semibold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>{r.patient}</p>
                <p className="text-[12px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{r.phone}</p>
              </div>
              <p className="text-[13px]" style={{ color: 'var(--tm-text,#2D3748)' }}>{r.type}</p>
              <p className="text-[13px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{r.time}</p>
              <span style={{
                fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', display: 'inline-block',
                ...(r.status === 'Delivered'
                  ? { background: 'var(--tm-surface2,#EFF6FF)', color: '#1A5CB5', border: '1px solid #BFDBFE' }
                  : { background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3' })
              }}>
                {r.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Broadcast modal */}
      {showBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowBroadcast(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md"
            style={{ background: 'var(--tm-surface,#fff)', borderRadius: '12px', padding: '32px', boxShadow: '0 8px 40px rgba(0,0,0,0.14)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[20px] font-bold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>Broadcast Message</h2>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Send WhatsApp to all patients at once</p>
              </div>
              <button onClick={() => setShowBroadcast(false)}
                className="w-8 h-8 flex items-center justify-center"
                style={{ background: 'var(--tm-surface2,#F7F9FF)', color: 'var(--tm-text-muted,#6B7A9A)', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                <X size={15} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Send To</label>
                <select className="ds-select w-full">
                  <option>All Active Patients</option>
                  <option>Patients with upcoming appointments</option>
                  <option>Patients who haven't visited in 30+ days</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Message</label>
                <textarea
                  rows={5}
                  className="ds-input"
                  style={{ resize: 'none' }}
                  defaultValue={`🏥 Dear Patient,\n\nThis is City Care Clinic. We have new appointment slots available this week.\n\nReply to book your slot 👇`}
                />
              </div>
              <div className="flex items-center gap-2.5 p-3"
                style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
                <Zap size={13} style={{ color: '#d97706' }} />
                <p className="text-[13px] font-medium" style={{ color: '#d97706' }}>This will send to approximately 47 patients</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowBroadcast(false)} fullWidth>Cancel</Button>
              <button onClick={() => setShowBroadcast(false)}
                className="flex-1 justify-center flex items-center gap-2 py-2.5 text-white font-semibold text-[14px] transition-colors"
                style={{ background: '#25D366', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
                <Send size={14} /> Send Now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
