'use client'
import { useState, useEffect, useRef } from 'react'
import { Zap } from 'lucide-react'
import TrikMedLogo from '../components/TrikMedLogo'
import { clinicInfo as mockClinic, doctorInfo as mockDoctor } from '../data/mockData'
import { fmtToken, normalizeQueueRows } from '../utils/queueData'
import { dashboardApi } from '../services/dashboardApi'
import { getCabinSettings, getActiveSlot } from '../../lib/cabinSettings'

// ── Constants ──────────────────────────────────────────────────────────────────
const SLOT_LETTERS = ['A', 'B', 'C']
const POLL_MS      = 2000
// Specialties that force single-slot mode + token-only display for privacy
const PRIVACY_SPECS = ['gynae', 'gynecology', 'obstetrics', 'psychiatry', 'psychology', 'mental health']

// ── Data helpers ───────────────────────────────────────────────────────────────
function readClinicConfig() {
  try {
    const c = JSON.parse(localStorage.getItem('trikmed.clinic.config') || '{}')
    return {
      name:   c.clinicName   || c.name   || mockClinic?.name                || 'TrikMed Clinic',
      doctor: c.doctorName   || c.doctor || mockDoctor?.name                || '',
      spec:   c.specialization || c.specialty || mockDoctor?.specialization || '',
    }
  } catch {
    return { name: mockClinic?.name || 'TrikMed Clinic', doctor: mockDoctor?.name || '', spec: mockDoctor?.specialization || '' }
  }
}

function buildQueueState(rows = []) {
  const cabin      = getCabinSettings()
  const activeSlot = getActiveSlot()
  const all = normalizeQueueRows(rows).sort((a, b) => Number(a.tokenNum || 0) - Number(b.tokenNum || 0))

  const inCabin = all.filter(a => a.queueStatus === 'in_cabin')
  const waiting = all.filter(a => ['booked', 'paid', 'vitals_done'].includes(a.queueStatus))

  // Map each slot letter → patient (or null)
  const slotPatients = SLOT_LETTERS.slice(0, cabin.slots).map(letter => {
    if (cabin.slots === 1) return inCabin[0] || null          // single mode: ignore slot field
    return inCabin.find(a => a.slot === letter) || null        // multi-slot: match by letter
  })

  // Fallback: in_cabin patients with no letter assigned → first empty slot
  if (cabin.slots > 1) {
    const occupied  = slotPatients.filter(Boolean).map(p => p.id)
    const unslotted = inCabin.filter(p => !occupied.includes(p.id))
    unslotted.forEach(p => {
      const idx = slotPatients.findIndex(s => s === null)
      if (idx >= 0) slotPatients[idx] = p
    })
  }

  return { cabin, activeSlot, slotPatients, waiting }
}

// 'with-doctor' | 'in-cabin' | 'empty'
function resolveSlotStatus(appt, letter, activeSlot, totalSlots) {
  if (!appt || appt.queueStatus !== 'in_cabin') return 'empty'
  if (totalSlots === 1)   return 'with-doctor'    // single cabin — in_cabin means with doctor
  if (!activeSlot)        return 'with-doctor'    // no active slot signal — assume active
  return appt.slot === activeSlot ? 'with-doctor' : 'in-cabin'
}

const firstName = name => ((name || '').split(' ')[0]).toUpperCase()

// ── Hooks ──────────────────────────────────────────────────────────────────────
function useLiveClock() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(i)
  }, [])
  return t
}

function useLiveQueue() {
  const [state, setState] = useState(() => ({
    ...buildQueueState(),
    clinic: readClinicConfig(),
    error: null,
  }))

  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      try {
        const rows = await dashboardApi.getQueue()
        if (!cancelled) setState({ ...buildQueueState(rows), clinic: readClinicConfig(), error: null })
      } catch (e) {
        if (!cancelled) {
          setState(prev => ({ ...prev, clinic: readClinicConfig(), error: e?.detail || e?.message || 'Unable to load queue' }))
        }
      }
    }

    refresh()
    const timer = setInterval(refresh, POLL_MS)                         // 2s poll
    const onStorage = e => {                                            // instant cross-tab
      if (['trikmed.clinic.config', 'trikmed.active_slot', 'trikmed_token'].includes(e.key)) {
        refresh()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener('storage', onStorage) }
  }, [])

  return state
}

function useCursorHide() {
  useEffect(() => {
    let timer
    const show = () => {
      document.body.style.cursor = 'default'
      clearTimeout(timer)
      timer = setTimeout(() => { document.body.style.cursor = 'none' }, 3000)
    }
    window.addEventListener('mousemove', show)
    show()
    return () => {
      window.removeEventListener('mousemove', show)
      clearTimeout(timer)
      document.body.style.cursor = 'default'
    }
  }, [])
}

function useWakeLock() {
  useEffect(() => {
    let lock = null
    const acquire = async () => {
      if ('wakeLock' in navigator) {
        try { lock = await navigator.wakeLock.request('screen') } catch {}
      }
    }
    acquire()
    const onVisible = () => { if (document.visibilityState === 'visible') acquire() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { lock?.release?.(); document.removeEventListener('visibilitychange', onVisible) }
  }, [])
}

// ── Card visual config per status ──────────────────────────────────────────────
const CARD_THEME = {
  'with-doctor': {
    bg:            'rgba(5, 46, 22, 0.97)',
    border:        'rgba(74, 222, 128, 0.55)',
    glow:          '0 0 56px rgba(74, 222, 128, 0.18)',
    dot:           '#4ade80',
    dotAnim:       true,
    tokenColor:    '#86efac',
    nameColor:     '#ffffff',
    metaColor:     'rgba(134, 239, 172, 0.65)',
    divider:       'rgba(74, 222, 128, 0.2)',
    statusHindi:   'DOCTOR KE SAATH',
    statusEnglish: 'WITH DOCTOR',
    statusColor:   '#4ade80',
    subColor:      'rgba(134, 239, 172, 0.65)',
    badge:         '● ACTIVE',
    badgeColor:    '#4ade80',
  },
  'in-cabin': {
    bg:            'rgba(55, 32, 0, 0.97)',
    border:        'rgba(251, 191, 36, 0.55)',
    glow:          '0 0 56px rgba(251, 191, 36, 0.12)',
    dot:           '#fbbf24',
    dotAnim:       false,
    tokenColor:    '#fcd34d',
    nameColor:     '#ffffff',
    metaColor:     'rgba(252, 211, 77, 0.65)',
    divider:       'rgba(251, 191, 36, 0.2)',
    statusHindi:   'CABIN MEIN — KRIPYA INTEZAAR KAREIN',
    statusEnglish: 'IN CABIN — PLEASE WAIT',
    statusColor:   '#fbbf24',
    subColor:      'rgba(252, 211, 77, 0.65)',
    badge:         '● IN CABIN',
    badgeColor:    '#fbbf24',
  },
  'empty': {
    bg:     'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.1)',
    glow:   'none',
    dot:    'rgba(255,255,255,0.18)',
  },
}

// ── SlotCard ───────────────────────────────────────────────────────────────────
function SlotCard({ letter, appt, status, nextWaiting, isPrivacyMode, slotCount }) {
  const T = CARD_THEME[status]
  const isOccupied = status !== 'empty'

  // Pulse animation on status change
  const [pulse, setPulse]     = useState(false)
  const prevStatusRef         = useRef(status)
  const prevApptIdRef         = useRef(appt?.id)
  useEffect(() => {
    if (prevStatusRef.current !== status || prevApptIdRef.current !== appt?.id) {
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 700)
      prevStatusRef.current  = status
      prevApptIdRef.current  = appt?.id
      return () => clearTimeout(t)
    }
  }, [status, appt?.id])

  return (
    <div style={{
      flex: slotCount === 1 ? '0 0 60%' : '1 1 0',
      maxWidth: slotCount === 1 ? '60%' : 'none',
      margin: slotCount === 1 ? '0 auto' : 0,
      borderRadius: 24,
      background: T.bg,
      border: `1.5px solid ${T.border}`,
      boxShadow: `${T.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
      display: 'flex',
      flexDirection: 'column',
      padding: '28px 32px',
      overflow: 'hidden',
      transition: 'background 0.7s ease, border-color 0.7s ease, box-shadow 0.7s ease',
      animation: pulse ? 'card-pulse 0.7s ease-out' : 'none',
    }}>

      {/* ── Slot label row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexShrink: 0 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', background: T.dot, flexShrink: 0,
          animation: (isOccupied && T.dotAnim) ? 'dot-pulse 1.8s ease-in-out infinite' : 'none',
        }} />
        <span style={{
          fontSize: 'clamp(13px, 1.4vw, 19px)', fontWeight: 800, letterSpacing: '3px',
          color: isOccupied ? T.statusColor : 'rgba(255,255,255,0.22)',
          textTransform: 'uppercase',
        }}>
          SLOT {letter}
        </span>
        {isOccupied && (
          <span style={{
            marginLeft: 'auto', fontSize: 'clamp(9px, 1vw, 12px)', fontWeight: 700,
            letterSpacing: '1px', color: T.badgeColor, textTransform: 'uppercase', opacity: 0.85,
          }}>
            {T.badge}
          </span>
        )}
      </div>

      {/* ── OCCUPIED: show patient + status ── */}
      {isOccupied && appt ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          {/* Token number — very large, TV-readable */}
          <div style={{
            fontSize: 'clamp(60px, 7.5vw, 120px)', fontWeight: 900,
            fontFamily: 'monospace', color: T.tokenColor, lineHeight: 1, letterSpacing: '-3px',
          }}>
            {fmtToken(appt.tokenNum)}
          </div>

          {/* Patient name — full name (patient is being called anyway) */}
          {!isPrivacyMode && (
            <div style={{
              fontSize: 'clamp(28px, 3.2vw, 54px)', fontWeight: 800,
              color: T.nameColor, marginTop: 10, letterSpacing: '-0.5px', lineHeight: 1.1,
            }}>
              {appt.patientName || '—'}
            </div>
          )}

          {/* Token + time meta */}
          <div style={{ fontSize: 'clamp(13px, 1.5vw, 19px)', color: T.metaColor, marginTop: 8, fontWeight: 500 }}>
            Token #{appt.tokenNum}
            {appt.time ? ` · ${appt.time}` : ''}
          </div>

          <div style={{ height: 1, background: T.divider, margin: '20px 0', flexShrink: 0 }} />

          {/* Status — Hindi then English */}
          <div style={{ marginTop: 'auto' }}>
            <div style={{
              fontSize: 'clamp(13px, 1.6vw, 22px)', fontWeight: 800,
              color: T.statusColor, letterSpacing: '0.5px',
            }}>
              {T.statusHindi}
            </div>
            <div style={{ fontSize: 'clamp(11px, 1.3vw, 16px)', color: T.subColor, marginTop: 6, fontWeight: 500 }}>
              {T.statusEnglish}
            </div>
          </div>
        </div>

      /* ── EMPTY: show next patient from waiting queue ── */
      ) : nextWaiting ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{
            fontSize: 'clamp(10px, 1.1vw, 13px)', fontWeight: 700, letterSpacing: '3px',
            color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', marginBottom: 14,
          }}>
            AGLA NUMBER · NEXT
          </div>

          <div style={{
            fontSize: 'clamp(44px, 5.5vw, 88px)', fontWeight: 900,
            fontFamily: 'monospace', color: 'rgba(255,255,255,0.17)',
            lineHeight: 1, letterSpacing: '-2px',
          }}>
            {fmtToken(nextWaiting.tokenNum)}
          </div>

          {!isPrivacyMode && (
            <div style={{
              fontSize: 'clamp(22px, 2.6vw, 38px)', fontWeight: 700,
              color: 'rgba(255,255,255,0.24)', marginTop: 10,
            }}>
              {firstName(nextWaiting.patientName)}
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <div style={{ fontSize: 'clamp(12px, 1.4vw, 17px)', fontWeight: 600, color: 'rgba(255,255,255,0.2)' }}>
              Cabin khali hai
            </div>
            <div style={{ fontSize: 'clamp(10px, 1.1vw, 13px)', color: 'rgba(255,255,255,0.14)', marginTop: 4 }}>
              Cabin is available
            </div>
          </div>
        </div>

      /* ── EMPTY: nobody waiting ── */
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 0 }}>
          <div style={{
            fontSize: 'clamp(48px, 6vw, 96px)', fontWeight: 900,
            fontFamily: 'monospace', color: 'rgba(255,255,255,0.07)',
            lineHeight: 1, marginBottom: 14,
          }}>
            —
          </div>
          <div style={{ fontSize: 'clamp(13px, 1.4vw, 18px)', fontWeight: 600, color: 'rgba(255,255,255,0.18)', textAlign: 'center' }}>
            KOI PATIENT NAHI
          </div>
          <div style={{ fontSize: 'clamp(11px, 1.1vw, 13px)', color: 'rgba(255,255,255,0.11)', marginTop: 4, textAlign: 'center' }}>
            No patients
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main display ───────────────────────────────────────────────────────────────
export default function LobbyDisplay() {
  const time = useLiveClock()
  const { cabin, activeSlot, slotPatients, waiting, clinic, error } = useLiveQueue()
  useCursorHide()
  useWakeLock()

  // Privacy override: certain specialties → single slot, no patient names
  const isPrivacyMode  = PRIVACY_SPECS.some(s => (clinic.spec || '').toLowerCase().includes(s))
  const effectiveSlots = isPrivacyMode ? 1 : cabin.slots
  const slotLetters    = SLOT_LETTERS.slice(0, effectiveSlots)

  // In privacy mode collapse all in-cabin patients to first slot
  const effectiveSlotPatients = isPrivacyMode
    ? [slotPatients.find(Boolean) || null]
    : slotPatients

  // Waiting strip — first 5, first name only
  const stripPatients = waiting.slice(0, 5)

  const clockStr = time.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  })

  const modeBadge = effectiveSlots === 1 ? 'SINGLE CABIN'
    : effectiveSlots === 2              ? 'PARALLEL · 2 SLOTS'
    :                                     'HIGH VOLUME · 3 SLOTS'

  const marqueeText =
    `Swagat hai ${clinic.name} mein  ·  ${clinic.doctor}${clinic.spec ? ' — ' + clinic.spec : ''}` +
    `  ·  Apna token number taiyar rakhein  ·  ` +
    `Welcome to ${clinic.name}  ·  ${clinic.doctor}${clinic.spec ? ' — ' + clinic.spec : ''}` +
    `  ·  Please keep your token number ready  ·  `

  return (
    <div style={{
      background: '#0f172a',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#fff',
      userSelect: 'none',
    }}>
      <style>{`
        @keyframes dot-pulse {
          0%, 100% { opacity: 1;   transform: scale(1);    }
          50%       { opacity: 0.4; transform: scale(0.82); }
        }
        @keyframes card-pulse {
          0%   { opacity: 0.55; }
          100% { opacity: 1;    }
        }
        @keyframes live-blink {
          0%, 100% { opacity: 1;    }
          50%       { opacity: 0.3; }
        }
        @keyframes ticker {
          0%   { transform: translateX(0);    }
          100% { transform: translateX(-50%); }
        }
        *, *::before, *::after { box-sizing: border-box; }
      `}</style>

      {/* ── TOP BAR ──────────────────────────────────────────────────── */}
      <div style={{
        height: 68,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.025)',
        flexShrink: 0,
        gap: 20,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <TrikMedLogo size="lg" dark />
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.8px', alignSelf: 'flex-end', marginBottom: 2 }}>
            LOBBY DISPLAY
          </div>
        </div>

        {/* Clinic name — centred */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(15px, 2vw, 22px)', fontWeight: 700, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.3px' }}>
            {clinic.name}
          </div>
          {(clinic.doctor || clinic.spec) && (
            <div style={{ fontSize: 'clamp(10px, 1.1vw, 13px)', color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
              {[clinic.doctor, clinic.spec].filter(Boolean).join(' · ')}
            </div>
          )}
          {error && (
            <div style={{ fontSize: 11, color: '#fca5a5', marginTop: 2 }}>
              {error}
            </div>
          )}
        </div>
        {/* Right: mode badge + LIVE + clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{
            padding: '4px 11px', borderRadius: 8,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', color: 'rgba(255,255,255,0.38)' }}>
              {modeBadge}
            </span>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(59,130,246,0.14)', border: '1px solid rgba(96,165,250,0.28)',
            borderRadius: 12, padding: '4px 11px 4px 8px',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: '#ef4444',
              animation: 'live-blink 1.5s ease-in-out infinite', display: 'inline-block', flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', color: '#93c5fd' }}>LIVE</span>
          </div>

          <div style={{
            fontVariantNumeric: 'tabular-nums',
            fontSize: 'clamp(22px, 2.6vw, 34px)',
            fontWeight: 700, color: 'rgba(255,255,255,0.92)',
            letterSpacing: '2px', fontFamily: 'monospace',
          }}>
            {clockStr}
          </div>
        </div>
      </div>

      {/* ── SLOT CARDS ───────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'stretch',
        gap: 14,
        padding: '14px 18px',
        overflow: 'hidden',
        justifyContent: effectiveSlots === 1 ? 'center' : 'stretch',
      }}>
        {slotLetters.map((letter, i) => {
          const appt = effectiveSlotPatients[i] || null
          const st   = resolveSlotStatus(appt, letter, activeSlot, effectiveSlots)
          return (
            <SlotCard
              key={letter}
              letter={letter}
              appt={appt}
              status={st}
              nextWaiting={waiting[0] || null}
              isPrivacyMode={isPrivacyMode}
              slotCount={effectiveSlots}
            />
          )
        })}
      </div>

      {/* ── WAITING STRIP ────────────────────────────────────────────── */}
      {waiting.length > 0 && (
        <div style={{
          height: 58,
          background: 'rgba(0,0,0,0.32)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          gap: 10,
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {/* Label */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            paddingRight: 12, borderRight: '1px solid rgba(255,255,255,0.1)',
            flexShrink: 0,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2px', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' }}>
              WAITING · {waiting.length}
            </span>
          </div>

          {/* Chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'hidden', flex: 1 }}>
            {stripPatients.map((p, i) => (
              <div key={p.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: i === 0 ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${i === 0 ? 'rgba(251,191,36,0.28)' : 'rgba(255,255,255,0.09)'}`,
                borderRadius: 10, padding: '4px 13px', flexShrink: 0,
              }}>
                <span style={{
                  fontSize: 15, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.3px',
                  color: i === 0 ? '#fbbf24' : 'rgba(255,255,255,0.42)',
                }}>
                  {fmtToken(p.tokenNum)}
                </span>
                {!isPrivacyMode && (
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: i === 0 ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.35)',
                  }}>
                    {firstName(p.patientName)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {waiting.length > 5 && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', flexShrink: 0, paddingLeft: 4 }}>
              +{waiting.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* ── BOTTOM MARQUEE ───────────────────────────────────────────── */}
      <div style={{
        height: 46,
        background: 'rgba(0,0,0,0.45)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          height: '100%', display: 'flex', alignItems: 'center',
          padding: '0 16px', background: '#1A5CB5', flexShrink: 0, gap: 7,
        }}>
          <Zap size={12} color="#9DBDE8" fill="#9DBDE8" />
          <span style={{ fontSize: 10, fontWeight: 800, color: '#9DBDE8', letterSpacing: '1.5px' }}>NOTICE</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', animation: 'ticker 52s linear infinite', willChange: 'transform' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.48)', whiteSpace: 'nowrap', paddingRight: 80 }}>
              {marqueeText}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.48)', whiteSpace: 'nowrap', paddingRight: 80 }}>
              {marqueeText}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
