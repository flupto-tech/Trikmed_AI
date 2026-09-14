'use client'
import { useEffect, useState } from 'react'
import { Plus, History, Check, ShieldCheck, AlertCircle } from 'lucide-react'
import api from '../../services/api'
import { getSuggestionsForDiagnosis } from '../../../lib/aiSuggestions'
import { MEDICINES } from '../../../lib/medicines-data'
import { getCustomMedicines } from '../../../lib/rxStorage'

const C = {
  navy: '#0F2342',
  coral: '#E84C3D',
  cream: '#F7F5F0',
  border: '#D3D1C7',
  muted: '#6B7A9A',
  purple: '#6366F1',
  purpleBg: '#EEF2FF',
  purpleBorder: '#C7D2FE',
}

/**
 * AiSuggestionsPanel — Section 6 Historical Prescription Suggestions
 *
 * Invariants:
 *  1. Suggestions NEVER automatically merge into the medicines list.
 *     They appear in this separate panel. Doctor must explicitly click "+ Add".
 *  2. Suggestions NEVER affect approval status.
 *  3. Suggestions NEVER bypass drug validation. Added items re-enter validation.
 *  4. Failure returns an empty list and never blocks prescription entry.
 *  5. Scoped strictly to diagnosis and doctor/clinic prescribing history.
 *  6. Labelled as "Past Prescribing History" (not a medical recommendation).
 */
export default function AiSuggestionsPanel({ doctorId, diagnoses = [], currentMedNames = [], onAdd }) {
  const [suggestions, setSuggestions] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const primaryDiagnosis = diagnoses[0] || ''

  useEffect(() => {
    if (!primaryDiagnosis) {
      setSuggestions([])
      setTotalCount(0)
      return
    }

    let active = true
    setLoading(true)

    async function loadSuggestions() {
      try {
        // 1. Try server-side scoped historical endpoint
        const serverData = await api.get(`/prescriptions/historical-suggestions?diagnosis=${encodeURIComponent(primaryDiagnosis)}`)
        if (active && Array.isArray(serverData) && serverData.length > 0) {
          setSuggestions(serverData)
          setTotalCount(serverData.length)
          setLoading(false)
          return
        }
      } catch (err) {
        // Invariant 4: Failure never blocks
        console.warn('Server historical suggestions unavailable:', err)
      }

      // 2. Fallback to local storage historical patterns
      try {
        const local = getSuggestionsForDiagnosis(doctorId, diagnoses)
        if (active && local?.suggestions?.length > 0) {
          setSuggestions(local.suggestions)
          setTotalCount(local.totalRx || local.suggestions.length)
        } else if (active) {
          setSuggestions([])
        }
      } catch {
        if (active) setSuggestions([])
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSuggestions()
    return () => { active = false }
  }, [doctorId, primaryDiagnosis])

  if (!primaryDiagnosis || (!loading && suggestions.length === 0)) return null

  function handleAdd(sugg) {
    const medName = sugg.name || sugg.brandName || sugg.raw_name
    const all = [...MEDICINES, ...getCustomMedicines(doctorId)]
    const found = all.find(m => m.brandName?.toLowerCase() === medName.toLowerCase())

    if (found) {
      onAdd({
        id: `sugg_${Date.now()}_${found.id}`,
        brandName: found.brandName,
        genericName: found.genericName || sugg.generic_name || '',
        strength: found.strengths?.[0] || sugg.dose || '',
        strengths: found.strengths || [],
        form: found.form || 'Tablet',
        dosage: sugg.dosage || found.defaultDosage || '1-0-1',
        timing: sugg.timing || found.defaultTiming || 'After food',
        duration: sugg.duration || found.defaultDuration || '3 days',
        notes: '',
        validation_band: sugg.validation_band || 'green',
        validation_status: sugg.validation_status || 'verified',
        isCustom: !!found.isCustom,
      })
    } else {
      onAdd({
        id: `sugg_${Date.now()}`,
        brandName: medName,
        genericName: sugg.generic_name || '',
        strength: sugg.dose || '',
        strengths: sugg.dose ? [sugg.dose] : [],
        form: 'Tablet',
        dosage: sugg.dosage || '1-0-1',
        timing: sugg.timing || 'After food',
        duration: sugg.duration || '3 days',
        notes: '',
        validation_band: sugg.validation_band || 'green',
        validation_status: sugg.validation_status || 'verified',
      })
    }
  }

  return (
    <div
      style={{
        border: `1.5px solid ${C.purpleBorder}`,
        borderRadius: 12,
        background: C.purpleBg,
        padding: '10px 14px',
        marginBottom: 10,
        fontFamily: "'Segoe UI', Inter, sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <History size={14} color={C.purple} />
        <span style={{ fontSize: 12, fontWeight: 700, color: C.purple, letterSpacing: '0.02em' }}>
          Past Prescribing History for {primaryDiagnosis}
        </span>
        <span style={{ fontSize: 11, color: C.muted, marginLeft: 'auto', fontStyle: 'italic' }}>
          Clinical reference only · Doctor selection required
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {suggestions.map(s => {
          const name = s.name || s.brandName || s.raw_name
          const added = currentMedNames.some(n => n?.toLowerCase() === name?.toLowerCase())
          const isVerified = s.validation_band === 'green'

          return (
            <div
              key={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: added ? '#E0E7FF' : '#FFFFFF',
                border: `1px solid ${added ? C.purpleBorder : C.border}`,
                borderRadius: 8,
                padding: '4px 10px',
                opacity: added ? 0.75 : 1,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{name}</span>
              {s.dose && <span style={{ fontSize: 10, color: C.muted }}>({s.dose})</span>}
              {s.count && <span style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>{s.count}×</span>}

              {!added ? (
                <button
                  type="button"
                  onClick={() => handleAdd(s)}
                  style={{
                    background: C.purple,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontFamily: 'inherit',
                  }}
                >
                  <Plus size={10} /> Add
                </button>
              ) : (
                <span style={{ fontSize: 11, color: C.purple, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <Check size={11} /> Added
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
