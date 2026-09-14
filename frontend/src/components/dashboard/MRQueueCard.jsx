'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, Clock, ArrowRight } from 'lucide-react'
import { Link } from '../../utils/navigation'

const REFRESH_INTERVAL_MS = 60_000

function formatTime(t) {
  // t is "HH:MM" or "HH:MM:SS" string from the API
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h, 10)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 || 12
  return `${display}:${m} ${suffix}`
}

export default function MRQueueCard() {
  const [data, setData]       = useState(null)   // null = not yet loaded
  const [ready, setReady]     = useState(false)   // true after first successful fetch
  const intervalRef           = useRef(null)

  async function fetchQueue() {
    try {
      const res = await fetch('/api/v1/dashboard/mr-queue-summary', {
        credentials: 'include',
      })
      if (!res.ok) {
        // Non-2xx: silently keep previous state (or stay hidden on first load)
        setReady(true)
        return
      }
      const json = await res.json()
      setData(json)
    } catch {
      // Network error — silently swallow, don't show card
    } finally {
      setReady(true)
    }
  }

  useEffect(() => {
    fetchQueue()
    intervalRef.current = setInterval(fetchQueue, REFRESH_INTERVAL_MS)
    return () => clearInterval(intervalRef.current)
  }, [])

  // ── Visibility rules ──────────────────────────────────────────────────────
  // Hide while first fetch is in flight
  if (!ready) return null
  // Hide if fetch errored or returned nothing meaningful
  if (!data) return null
  // Hide if nothing happening: no one waiting and no next arrival
  if (data.waiting_now === 0 && !data.next_arrival_time) return null

  const hasWaiting  = data.waiting_now > 0
  const hasUpcoming = !!data.next_arrival_time

  return (
    <div className="
      flex items-center gap-4
      rounded-xl border border-teal-200
      bg-gradient-to-r from-teal-50 to-white
      shadow-sm px-4 py-3.5
    ">
      {/* Bell icon */}
      <div className="shrink-0 w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
        <Bell size={18} className="text-teal-700" strokeWidth={2} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-800 leading-none">
            MR Queue
          </span>
          {hasWaiting && (
            <span className="
              inline-flex items-center px-2 py-0.5
              rounded text-xs font-semibold
              bg-teal-600 text-white leading-none
            ">
              {data.waiting_now} waiting
            </span>
          )}
        </div>

        {/* Next MR line */}
        {hasUpcoming && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 leading-none">
            <Clock size={11} className="text-slate-400 shrink-0" strokeWidth={2} />
            <span>
              Next:&nbsp;
              <span className="font-medium text-slate-600">
                {data.next_mr_name}
              </span>
              &nbsp;at&nbsp;
              <span className="font-medium text-slate-600">
                {formatTime(data.next_arrival_time)}
              </span>
            </span>
          </p>
        )}
      </div>

      {/* View link */}
      <Link
        to="/mr-manager/today"
        className="
          shrink-0 flex items-center gap-1
          text-xs font-medium text-teal-700
          hover:text-teal-900 transition-colors
        "
      >
        View
        <ArrowRight size={13} strokeWidth={2.5} />
      </Link>
    </div>
  )
}
