// src/components/ui/Calendar.jsx
'use client'
import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, FilterChip, FilterChipGroup } from './Button'

// Date helpers
function getMondayOfWeek(offset = 0) {
  const now = new Date()
  const dow = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getWeekDays(offset = 0) {
  const monday = getMondayOfWeek(offset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

function getMonthCalendar(offset = 0) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + offset
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const shift = (first.getDay() === 0 ? 6 : first.getDay() - 1)
  const start = new Date(first)
  start.setDate(start.getDate() - shift)
  const weeks = []
  const cur = new Date(start)
  for (let w = 0; w < 6; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      week.push({
        dateStr: cur.toISOString().split('T')[0],
        day: cur.getDate(),
        inMonth: cur.getMonth() === ((month % 12 + 12) % 12)
      })
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
    if (cur > last && w >= 3) break
  }
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  return {
    weeks,
    monthName: MONTH_NAMES[(month % 12 + 12) % 12],
    year: first.getFullYear()
  }
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calendar({
  // Required props
  selectedDate,
  onSelectDate,
  
  // Optional props with defaults
  viewMode: externalViewMode = 'week',
  onViewModeChange,
  countByDate = {},
  highlightToday = true,
  showWeekends = true,
  minHeight = 'auto',
  className = '',
  
  // Custom labels
  todayLabel = 'Today',
  weekLabel = 'Week',
  monthLabel = 'Month',
  
  // Custom styling
  primaryColor = '#0F2D5E',
  accentColor = '#E5402B',
}) {
  const [internalViewMode, setInternalViewMode] = useState(externalViewMode)
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  
  // Use controlled or internal state
  const currentViewMode = onViewModeChange ? externalViewMode : internalViewMode
  const setViewMode = (mode) => {
    if (onViewModeChange) {
      onViewModeChange(mode)
    } else {
      setInternalViewMode(mode)
    }
  }
  
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset])
  const monthCal = useMemo(() => getMonthCalendar(monthOffset), [monthOffset])
  const todayStr = new Date().toISOString().split('T')[0]
  
  const weekLabelText = useMemo(() => {
    const first = new Date(weekDays[0])
    const last = new Date(weekDays[6])
    if (first.getMonth() === last.getMonth()) {
      return `${first.toLocaleDateString('en-IN', { day: 'numeric' })} – ${last.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
    return `${first.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${last.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }, [weekDays])
  
  const goPrevious = () => {
    if (currentViewMode === 'week') {
      setWeekOffset(w => w - 1)
    } else {
      setMonthOffset(m => m - 1)
    }
  }
  
  const goNext = () => {
    if (currentViewMode === 'week') {
      setWeekOffset(w => w + 1)
    } else {
      setMonthOffset(m => m + 1)
    }
  }
  
  const jumpToday = () => {
    setWeekOffset(0)
    setMonthOffset(0)
    onSelectDate(todayStr)
  }
  
  const selectDay = (dateStr) => {
    onSelectDate(dateStr)
  }
  
  const calSelected = selectedDate
  
  return (
    <div className={`rounded-xl overflow-hidden ${className}`}
      style={{
        background: '#fff',
        border: '1px solid #DDE4F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        minHeight
      }}>
      
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid #F7F9FF' }}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={goPrevious}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ background: '#F7F9FF', color: '#2D3748' }}
            onMouseEnter={e => e.currentTarget.style.background = '#DDE4F0'}
            onMouseLeave={e => e.currentTarget.style.background = '#F7F9FF'}>
            <ChevronLeft size={14} />
          </button>
          
          <span className="text-[13px] font-semibold flex-1 text-center truncate"
            style={{ color: primaryColor }}>
            {currentViewMode === 'week' ? weekLabelText : `${monthCal.monthName} ${monthCal.year}`}
          </span>
          
          <button
            onClick={goNext}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ background: '#F7F9FF', color: '#2D3748' }}
            onMouseEnter={e => e.currentTarget.style.background = '#DDE4F0'}
            onMouseLeave={e => e.currentTarget.style.background = '#F7F9FF'}>
            <ChevronRight size={14} />
          </button>
          
          <Button size="sm" variant="secondary" onClick={jumpToday} className="flex-shrink-0">
            {todayLabel}
          </Button>
        </div>
        
        <FilterChipGroup value={currentViewMode} onChange={setViewMode} className="flex-shrink-0">
          <FilterChip value="week">{weekLabel}</FilterChip>
          <FilterChip value="month">{monthLabel}</FilterChip>
        </FilterChipGroup>
      </div>
      
      {/* Week View */}
      {currentViewMode === 'week' && (
        <div style={{ padding: '8px 12px 12px', background: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px' }}>
            {weekDays.map(dateStr => {
              const d = new Date(dateStr)
              const isToday = dateStr === todayStr
              const isSelected = dateStr === calSelected
              const count = countByDate[dateStr] || 0
              const dayOfWeek = d.getDay()
              
              // Skip weekends if showWeekends is false
              if (!showWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
                return <div key={dateStr} />
              }
              
              return (
                <button
                  key={dateStr}
                  onClick={() => selectDay(dateStr)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '10px 4px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    background: isSelected ? primaryColor : (isToday && highlightToday ? '#F7F9FF' : 'transparent'),
                    outline: isToday && highlightToday && !isSelected ? '1px solid #DDE4F0' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F7F9FF' }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = (isToday && highlightToday) ? '#F7F9FF' : 'transparent'
                  }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: isSelected ? 'rgba(255,255,255,0.65)' : '#6B7A9A'
                  }}>
                    {DAY_NAMES[dayOfWeek]}
                  </span>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: isSelected ? '#fff' : (isToday ? primaryColor : '#2D3748'),
                    lineHeight: 1
                  }}>
                    {d.getDate()}
                  </span>
                  {isToday && highlightToday && !isSelected && (
                    <span style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: primaryColor,
                      display: 'block'
                    }} />
                  )}
                  {count > 0 ? (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(255,255,255,0.2)' : accentColor,
                      color: '#fff'
                    }}>
                      {count}
                    </span>
                  ) : (
                    <span style={{ height: '18px' }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Month View */}
      {currentViewMode === 'month' && (
        <div className="p-3">
          <div className="grid grid-cols-7 mb-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-center py-1">
                <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#6B7A9A' }}>
                  {d}
                </span>
              </div>
            ))}
          </div>
          {monthCal.weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
              {week.map(({ dateStr, day, inMonth }) => {
                const isToday = dateStr === todayStr
                const isSelected = dateStr === calSelected
                const count = countByDate[dateStr] || 0
                const dateObj = new Date(dateStr)
                const dayOfWeek = dateObj.getDay()
                
                // Skip weekends if showWeekends is false
                if (!showWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
                  return <div key={dateStr} />
                }
                
                return (
                  <button
                    key={dateStr}
                    onClick={() => selectDay(dateStr)}
                    className="flex flex-col items-center justify-center rounded-xl py-1.5 transition-all"
                    style={{
                      minHeight: '52px',
                      background: isSelected ? primaryColor : (isToday && highlightToday ? '#F7F9FF' : 'transparent'),
                      opacity: inMonth ? 1 : 0.35,
                      border: isSelected ? `1px solid ${primaryColor}` : (isToday && highlightToday ? '1px solid #DDE4F0' : '1px solid transparent'),
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F7F9FF' }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = (isToday && highlightToday) ? '#F7F9FF' : 'transparent'
                    }}>
                    <span className="text-[14px] font-bold" style={{
                      color: isSelected ? '#fff' : (isToday ? primaryColor : '#2D3748')
                    }}>
                      {day}
                    </span>
                    {count > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 mt-0.5" style={isSelected ? {
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.25)',
                        color: '#fff'
                      } : {
                        borderRadius: '10px',
                        background: accentColor,
                        color: '#fff'
                      }}>
                        {count}
                      </span>
                    )}
                    {isToday && highlightToday && !isSelected && (
                      <span className="w-1 h-1 rounded-xl mt-0.5" style={{ background: primaryColor }} />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}