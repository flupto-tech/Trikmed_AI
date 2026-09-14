'use client'

import { motion } from 'framer-motion'
import { CalendarDays, Clock, User } from 'lucide-react'

const NAVY = '#0F2D5E'

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}
function formatTime(t) {
  const [h, m] = t.split(':')
  const hour = parseInt(h, 10)
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
}

export default function MRUpcoming() {
  // TODO: fetch GET /api/v1/mr-appointments/upcoming
  const appts = MOCK_UPCOMING

  if (appts.length === 0) {
    return (
      <div className="ds-card flex flex-col items-center py-16 gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
          <CalendarDays size={22} className="text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600">No upcoming MR appointments</p>
      </div>
    )
  }

  // Group by date
  const grouped = appts.reduce((acc, a) => {
    (acc[a.scheduled_date] ??= []).push(a)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([date, dayAppts], gi) => (
        <div key={date}>
          {/* Date header */}
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={13} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {formatDate(date)}
            </span>
          </div>

          <div className="ds-table">
            {dayAppts.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: (gi * 4 + i) * 0.03 }}
                className="ds-table-row flex items-center gap-4"
              >
                {/* Time */}
                <div className="shrink-0 flex items-center gap-1.5 w-20">
                  <Clock size={12} className="text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">{formatTime(a.scheduled_time)}</span>
                </div>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: NAVY }}>
                  {a.mr_name?.[0] ?? '?'}
                </div>

                {/* Name + company */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{a.mr_name}</p>
                  <p className="text-xs text-slate-500 truncate">{a.company_name}</p>
                </div>

                {/* Purpose */}
                {a.purpose && (
                  <p className="hidden md:block text-xs text-slate-500 truncate max-w-[160px]">{a.purpose}</p>
                )}

                {/* Duration */}
                <span className="shrink-0 text-xs text-slate-400">{a.duration_minutes}m</span>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const MOCK_UPCOMING = [
  { id: 10, scheduled_date: '2026-04-24', scheduled_time: '10:00', duration_minutes: 10, mr_name: 'Arjun Mehta',  company_name: 'Sun Pharma',    purpose: 'Quarterly samples' },
  { id: 11, scheduled_date: '2026-04-24', scheduled_time: '11:30', duration_minutes: 15, mr_name: 'Priya Sharma', company_name: 'Cipla Ltd',     purpose: null },
  { id: 12, scheduled_date: '2026-04-25', scheduled_time: '09:00', duration_minutes: 10, mr_name: 'Sneha Patil',  company_name: 'Mankind Pharma', purpose: 'New launch details' },
  { id: 13, scheduled_date: '2026-04-26', scheduled_time: '14:00', duration_minutes: 10, mr_name: 'Karan Verma',  company_name: 'Abbott India',  purpose: null },
]
