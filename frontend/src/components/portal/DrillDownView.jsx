'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ArrowLeft, Phone, TrendingUp } from 'lucide-react'
import MRDash from '../../screens/portal/MRDash'
// TODO: Ashutosh uncomment ↓
// import { portalApi } from '../../services/portalApi'

const DS = {
  bg: '#F7F9FF', cardBg: '#ffffff', cardBorder: '#DDE4F0',
  primary: '#0F2D5E', accent: '#E5402B', secondary: '#1A5CB5',
  textPrimary: '#0F2D5E', textMuted: '#6B7A9A', textSubtle: '#9DBDE8',
}

function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: DS.cardBg, border: `1px solid ${DS.cardBorder}`, borderRadius: 12,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        ...style,
      }}
      onMouseEnter={onClick ? e => { e.currentTarget.style.borderColor = DS.secondary; e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,92,181,0.10)' } : undefined}
      onMouseLeave={onClick ? e => { e.currentTarget.style.borderColor = DS.cardBorder; e.currentTarget.style.boxShadow = 'none' } : undefined}
    >
      {children}
    </div>
  )
}

function ProgressBar({ value, max }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div>
      <div style={{ height: 6, borderRadius: 100, background: DS.cardBorder, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', background: pct >= 80 ? '#22c55e' : pct >= 50 ? DS.secondary : DS.accent, borderRadius: 100 }}
        />
      </div>
    </div>
  )
}

function PerfBadge({ score }) {
  const cfg =
    score >= 80 ? { bg: '#D1FAE5', color: '#065F46', label: '⭐ Top Performer' } :
    score >= 60 ? { bg: '#DBEAFE', color: '#1E40AF', label: '✓ On Track' } :
                  { bg: '#FEE2E2', color: '#991B1B', label: '⚠ Needs Attention' }
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb({ startLevel, level, zone, city, mr, onNavigate }) {
  const crumbs = []
  if (startLevel === 0) crumbs.push({ label: 'All Zones', targetLevel: 0 })
  if (level >= 1 && zone) crumbs.push({ label: zone.name, targetLevel: 1 })
  if (level >= 2 && city) crumbs.push({ label: city.name, targetLevel: 2 })
  if (level >= 3 && mr)   crumbs.push({ label: mr.name,   targetLevel: 3 })

  if (crumbs.length <= 1) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
      <button onClick={() => onNavigate(level - 1)}
        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: DS.textMuted, fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 6 }}
        onMouseEnter={e => e.currentTarget.style.background = DS.bg}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
        <ArrowLeft size={13}/> Back
      </button>
      <span style={{ color: DS.cardBorder }}>·</span>
      {crumbs.map((c, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {i > 0 && <ChevronRight size={12} style={{ color: DS.textSubtle }}/>}
          {i === crumbs.length - 1 ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: DS.primary }}>{c.label}</span>
          ) : (
            <button onClick={() => onNavigate(c.targetLevel)}
              style={{ fontSize: 12, fontWeight: 600, color: DS.secondary, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>
              {c.label}
            </button>
          )}
        </span>
      ))}
    </div>
  )
}

// ─── Level 0: Zones Grid ──────────────────────────────────────────────────────
function ZonesView({ zones, onSelectZone }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <p style={{ fontSize: 11, color: DS.textMuted, marginBottom: 16 }}>Click a zone to drill into cities and MR performance</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
        {zones.map((zone, i) => {
          const pct = Math.round((zone.revenue_mtd / zone.target_mtd) * 100)
          return (
            <motion.div key={zone.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card onClick={() => onSelectZone(zone)} style={{ padding: 20 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 17, fontWeight: 800, color: DS.primary, margin: 0 }}>{zone.name}</p>
                    <p style={{ fontSize: 12, color: DS.textMuted, marginTop: 3 }}>Zone Manager: {zone.manager}</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: '#D1FAE5', color: '#065F46' }}>
                    {zone.growth}
                  </span>
                </div>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Cities',          value: zone.cities_count                      },
                    { label: 'Active Clinics',  value: `${zone.clinics_active}/${zone.clinics_total}` },
                    { label: 'Revenue MTD',     value: `₹${(zone.revenue_mtd/1000).toFixed(0)}K` },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', padding: '10px 8px', background: DS.bg, borderRadius: 8 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: DS.primary, margin: 0 }}>{s.value}</p>
                      <p style={{ fontSize: 10, color: DS.textMuted, marginTop: 2 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                {/* Progress */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: DS.textMuted }}>₹{zone.revenue_mtd.toLocaleString()} / ₹{zone.target_mtd.toLocaleString()} target</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: pct >= 80 ? '#22c55e' : DS.secondary }}>{pct}%</span>
                  </div>
                  <ProgressBar value={zone.revenue_mtd} max={zone.target_mtd}/>
                </div>
                {/* CTA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: DS.secondary }}>View Cities</span>
                  <ChevronRight size={14} style={{ color: DS.secondary }}/>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Level 1: Cities Grid ─────────────────────────────────────────────────────
function CitiesView({ zone, onSelectCity }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <p style={{ fontSize: 11, color: DS.textMuted, marginBottom: 16 }}>
        {zone.cities_count} cities · {zone.clinics_active} active clinics — click a city to see MRs
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
        {zone.cities.map((city, i) => {
          const pct = Math.round((city.revenue_mtd / city.target_mtd) * 100)
          const mrCount = city.mrs.length
          return (
            <motion.div key={city.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card onClick={() => onSelectCity(city)} style={{ padding: 18 }}>
                {/* Header */}
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: DS.primary, margin: 0 }}>{city.name}</p>
                  <p style={{ fontSize: 12, color: DS.textMuted, marginTop: 3 }}>City Manager: {city.city_manager}</p>
                </div>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  <div style={{ padding: '10px 10px', background: DS.bg, borderRadius: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: DS.primary, margin: 0 }}>{city.clinics_active}/{city.clinics_total}</p>
                    <p style={{ fontSize: 10, color: DS.textMuted, marginTop: 2 }}>Active Clinics</p>
                  </div>
                  <div style={{ padding: '10px 10px', background: DS.bg, borderRadius: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: DS.primary, margin: 0 }}>₹{(city.revenue_mtd/1000).toFixed(0)}K</p>
                    <p style={{ fontSize: 10, color: DS.textMuted, marginTop: 2 }}>Revenue MTD</p>
                  </div>
                </div>
                {/* Progress */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: DS.textMuted }}>vs ₹{(city.target_mtd/1000).toFixed(0)}K target</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: pct >= 80 ? '#22c55e' : DS.secondary }}>{pct}%</span>
                  </div>
                  <ProgressBar value={city.revenue_mtd} max={city.target_mtd}/>
                </div>
                {/* MR badge + CTA */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#FFE9E6', color: '#C0311C' }}>
                    {mrCount} Sales Executive{mrCount !== 1 ? 's' : ''}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: DS.secondary, display: 'flex', alignItems: 'center', gap: 3 }}>
                    View MRs <ChevronRight size={13}/>
                  </span>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Level 2: MR List ─────────────────────────────────────────────────────────
function MRsView({ city, onSelectMR }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <p style={{ fontSize: 11, color: DS.textMuted, marginBottom: 16 }}>
        City Manager: {city.city_manager} · {city.mrs.length} Sales Executive{city.mrs.length !== 1 ? 's' : ''}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {city.mrs.map((mr, i) => {
          const dealPct = Math.min(100, Math.round((mr.deals_this_month / mr.target_this_month) * 100))
          const avatarBg = mr.performance_score >= 80 ? '#0F2D5E' : mr.performance_score >= 60 ? '#1A5CB5' : '#6B7A9A'
          return (
            <motion.div key={mr.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card onClick={() => onSelectMR(mr)} style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {/* Avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{initials(mr.name)}</span>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: DS.primary }}>{mr.name}</span>
                      <PerfBadge score={mr.performance_score}/>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: DS.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Phone size={10}/> {mr.phone}
                      </span>
                      <span style={{ fontSize: 11, color: DS.textSubtle }}>Joined: {mr.joining_date}</span>
                      <span style={{ fontSize: 11, color: DS.textSubtle }}>Last active: {mr.last_activity}</span>
                    </div>
                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
                      {[
                        { label: 'Pitched',  value: mr.clinics_pitched  },
                        { label: 'Active',   value: mr.clinics_active   },
                        { label: 'Closed',   value: mr.deals_this_month },
                        { label: 'Target',   value: `${mr.deals_this_month}/${mr.target_this_month}` },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center', padding: '6px 10px', background: DS.bg, borderRadius: 6, minWidth: 56 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: DS.primary, margin: 0 }}>{s.value}</p>
                          <p style={{ fontSize: 10, color: DS.textMuted, marginTop: 1 }}>{s.label}</p>
                        </div>
                      ))}
                      <div style={{ padding: '6px 10px', background: '#D1FAE5', borderRadius: 6, minWidth: 70 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#065F46', margin: 0 }}>₹{(mr.revenue_generated/1000).toFixed(0)}K</p>
                        <p style={{ fontSize: 10, color: '#065F46', marginTop: 1 }}>Revenue</p>
                      </div>
                    </div>
                    {/* Deal progress */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: DS.textMuted }}>Deal target progress</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: dealPct >= 100 ? '#22c55e' : DS.secondary }}>{dealPct}%</span>
                      </div>
                      <ProgressBar value={mr.deals_this_month} max={mr.target_this_month}/>
                    </div>
                  </div>
                  {/* CTA */}
                  <button
                    onClick={e => { e.stopPropagation(); onSelectMR(mr) }}
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 8, border: 'none', background: DS.primary, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', alignSelf: 'center' }}>
                    View Performance <ChevronRight size={12}/>
                  </button>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Level 3: MR Performance (readOnly MRDash) ────────────────────────────────
function MRPerformanceView({ mr }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <MRDash mrData={mr} readOnly={true}/>
    </motion.div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function DrillDownView({ startLevel = 0, data, defaultZone = null, defaultCity = null }) {
  const [level,        setLevel]        = useState(startLevel)
  const [selectedZone, setSelectedZone] = useState(null)
  const [selectedCity, setSelectedCity] = useState(null)
  const [selectedMR,   setSelectedMR]   = useState(null)

  // Pre-select zone/city based on props
  useEffect(() => {
    if (startLevel >= 1) {
      const zone = defaultZone
        ? data.zones.find(z => z.id === defaultZone || z.name === defaultZone)
        : data.zones[0]
      setSelectedZone(zone || null)
    }
    if (startLevel >= 2 && selectedZone) {
      const city = defaultCity
        ? selectedZone.cities.find(c => c.id === defaultCity || c.name === defaultCity)
        : selectedZone.cities[0]
      setSelectedCity(city || null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startLevel])

  const handleSelectZone = (zone) => {
    // TODO: Ashutosh uncomment ↓
    // portalApi.getZoneCities(zone.id).then(cities => zone.cities = cities)
    setSelectedZone(zone)
    setLevel(1)
  }

  const handleSelectCity = (city) => {
    // TODO: Ashutosh uncomment ↓
    // portalApi.getCityMRs(city.id).then(mrs => city.mrs = mrs)
    setSelectedCity(city)
    setLevel(2)
  }

  const handleSelectMR = (mr) => {
    // TODO: Ashutosh uncomment ↓
    // portalApi.getMRPerformance(mr.id).then(setSelectedMR)
    setSelectedMR(mr)
    setLevel(3)
  }

  const handleNavigate = (targetLevel) => {
    if (targetLevel < startLevel) return // can't go above start
    setLevel(targetLevel)
    if (targetLevel < 3) setSelectedMR(null)
    if (targetLevel < 2) setSelectedCity(null)
    if (targetLevel < 1) setSelectedZone(null)
  }

  return (
    <div>
      <Breadcrumb
        startLevel={startLevel}
        level={level}
        zone={selectedZone}
        city={selectedCity}
        mr={selectedMR}
        onNavigate={handleNavigate}
      />
      <AnimatePresence mode="wait">
        {level === 0 && (
          <motion.div key="zones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <ZonesView zones={data.zones} onSelectZone={handleSelectZone}/>
          </motion.div>
        )}
        {level === 1 && selectedZone && (
          <motion.div key="cities" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <CitiesView zone={selectedZone} onSelectCity={handleSelectCity}/>
          </motion.div>
        )}
        {level === 2 && selectedCity && (
          <motion.div key="mrs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <MRsView city={selectedCity} onSelectMR={handleSelectMR}/>
          </motion.div>
        )}
        {level === 3 && selectedMR && (
          <motion.div key="mr-perf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <MRPerformanceView mr={selectedMR} cityName={selectedCity?.name} onBack={() => handleNavigate(2)}/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
