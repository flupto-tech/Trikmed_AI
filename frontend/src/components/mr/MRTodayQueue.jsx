'use client'

import { motion } from 'framer-motion'
import { Clock, CheckCircle, Play, XCircle, User, Building2, Phone } from 'lucide-react'

const NAVY = '#0F2D5E'
const BLUE = '#1A5CB5'

const STATUS_MAP = {
  scheduled:   { label: 'Scheduled',   bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
  in_progress: { label: 'In Progress', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  completed:   { label: 'Done',        bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
  cancelled:   { label: 'Cancelled',   bg: '#fff1f2', color: '#e11d48', border: '#fecdd3' },
  no_show:     { label: 'No-show',     bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h, 10)
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
}

function AppointmentRow({ appt, index }) {
  const st = STATUS_MAP[appt.status] || STATUS_MAP.scheduled
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="ds-table-row flex items-center gap-4"
    >
      {/* Time */}
      <div className="w-16 shrink-0 text-center">
        <p className="text-sm font-semibold text-slate-800">{formatTime(appt.scheduled_time)}</p>
        <p className="text-xs text-slate-400">{appt.duration_minutes}m</p>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-slate-200 shrink-0" />

      {/* MR info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-white text-sm font-bold"
          style={{ background: NAVY }}>
          {appt.mr_name?.[0] ?? '?'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{appt.mr_name}</p>
          <p className="text-xs text-slate-500 truncate">{appt.company_name}</p>
        </div>
      </div>

      {/* Purpose */}
      {appt.purpose && (
        <div className="hidden md:block flex-1 min-w-0">
          <p className="text-xs text-slate-500 truncate">{appt.purpose}</p>
        </div>
      )}

      {/* Status badge */}
      <div className="shrink-0">
        <span
          className="ds-badge text-xs"
          style={{ background: st.bg, color: st.color, borderColor: st.border }}
        >
          {st.label}
        </span>
      </div>
    </motion.div>
  )
}

export default function MRTodayQueue() {
  // TODO: replace with real fetch — GET /api/v1/mr-appointments/today
  const appts = MOCK_TODAY

  const waiting    = appts.filter(a => a.status === 'scheduled').length
  const inProgress = appts.filter(a => a.status === 'in_progress').length
  const done       = appts.filter(a => a.status === 'completed').length

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Waiting',     value: waiting,    icon: Clock,       color: '#0369a1', bg: '#f0f9ff' },
          { label: 'In Progress', value: inProgress, icon: Play,        color: '#15803d', bg: '#f0fdf4' },
          { label: 'Done Today',  value: done,       icon: CheckCircle, color: NAVY,      bg: '#EEF2FA' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="ds-card !p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
              <Icon size={16} style={{ color }} strokeWidth={2} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800 leading-none">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Appointments table */}
      {appts.length === 0 ? (
        <div className="ds-card flex flex-col items-center py-14 gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
            <User size={20} className="text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">No MR appointments today</p>
        </div>
      ) : (
        <div className="ds-table">
          <div className="ds-table-header hidden md:flex text-xs font-semibold text-slate-500 uppercase tracking-wide gap-4">
            <div className="w-16 shrink-0">Time</div>
            <div className="w-px" />
            <div className="flex-1">Representative</div>
            <div className="flex-1">Purpose</div>
            <div className="w-28 shrink-0">Status</div>
          </div>
          {appts.map((a, i) => <AppointmentRow key={a.id} appt={a} index={i} />)}
        </div>
      )}
    </div>
  )
}

// ── Placeholder data ──────────────────────────────────────────────────────────
const MOCK_TODAY = [
  { id: 1, scheduled_time: '10:00', duration_minutes: 15, mr_name: 'Arjun Mehta',   company_name: 'Sun Pharma',    purpose: 'New product launch',  status: 'completed' },
  { id: 2, scheduled_time: '11:00', duration_minutes: 10, mr_name: 'Priya Sharma',  company_name: 'Cipla Ltd',     purpose: 'Follow-up samples',   status: 'in_progress' },
  { id: 3, scheduled_time: '12:00', duration_minutes: 10, mr_name: 'Sneha Patil',   company_name: 'Mankind Pharma', purpose: null,                  status: 'scheduled' },
  { id: 4, scheduled_time: '14:30', duration_minutes: 15, mr_name: 'Karan Verma',   company_name: 'Abbott India',  purpose: 'Quarterly review',    status: 'scheduled' },
]
