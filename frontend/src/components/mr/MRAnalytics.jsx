'use client'

import { BarChart2, TrendingUp, Star, Users } from 'lucide-react'

const TEAL = '#0E7C7B'

export default function MRAnalytics() {
  // TODO: fetch analytics data
  return (
    <div className="ds-card flex flex-col items-center py-20 gap-4">
      <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: '#f0fdfa' }}>
        <BarChart2 size={26} style={{ color: TEAL }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Analytics coming soon</p>
        <p className="text-xs text-slate-400 mt-1">
          Visit frequency, top companies, sample trends, and MR ratings.
        </p>
      </div>
    </div>
  )
}
