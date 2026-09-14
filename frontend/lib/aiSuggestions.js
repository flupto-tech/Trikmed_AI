// TrikMed AI Suggestion Engine
// Learns doctor's prescribing patterns from localStorage history
// "Dr. ke behaviour se sikhe" — no external API, pure local ML

import { getRxHistory } from './rxStorage'

/**
 * Normalize diagnosis to a simple key for grouping
 * e.g. "Viral Fever (Grade 2)" → "viral fever"
 */
function normalizeKey(diagnosis) {
  return diagnosis.toLowerCase()
    .replace(/[-–].*$/, '')      // strip everything after dash
    .replace(/\(.*\)/, '')       // strip parentheticals
    .replace(/type \d+\s*/i, '') // strip "type 2" etc from end context
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Given a list of diagnoses the doctor just selected,
 * return top-5 suggested medicines based on past Rx history.
 *
 * Returns: { diagnosisLabel, suggestions: [{name, count, percent}], totalRx }
 * Returns null if < 3 historical Rx for that diagnosis.
 */
export function getSuggestionsForDiagnosis(doctorId, diagnoses = []) {
  if (!doctorId || diagnoses.length === 0) return null

  const history = getRxHistory(doctorId)
  if (!history || history.length === 0) return null

  // Try each diagnosis, use the one with most history
  let bestResult = null
  let bestCount = 0

  for (const diag of diagnoses) {
    const key = normalizeKey(diag)
    const matchingRx = history.filter(entry => {
      if (!entry.diagnosisKey) return false
      return normalizeKey(entry.diagnosisKey).includes(key) ||
             key.includes(normalizeKey(entry.diagnosisKey))
    })

    if (matchingRx.length > bestCount) {
      bestCount = matchingRx.length
      if (matchingRx.length >= 3) {
        // Count medicine frequency
        const freq = {}
        matchingRx.forEach(rx => {
          ;(rx.medicines || []).forEach(med => {
            const name = typeof med === 'string' ? med : (med.brandName || med.name || '')
            if (name) freq[name] = (freq[name] || 0) + 1
          })
        })

        const total = matchingRx.length
        const sorted = Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({
            name,
            count,
            percent: Math.round((count / total) * 100),
          }))

        bestResult = {
          diagnosisLabel: diag,
          suggestions: sorted,
          totalRx: total,
        }
      }
    }
  }

  return bestResult
}

/**
 * Record a completed Rx to the learning history.
 * Called by savePrescription() automatically.
 */
export function recordRxForLearning(doctorId, diagnoses, medicines) {
  if (!doctorId || !diagnoses?.length || !medicines?.length) return

  // Import appendRxHistory lazily to avoid circular deps
  import('./rxStorage').then(({ appendRxHistory }) => {
    diagnoses.forEach(diag => {
      appendRxHistory(doctorId, {
        diagnosisKey: normalizeKey(diag),
        medicines: medicines.map(m => m.brandName || m.name || m),
      })
    })
  })
}

/**
 * How many Rx does the doctor have for this diagnosis?
 * Used to show "Learning… X more needed" message.
 */
export function getDiagnosisRxCount(doctorId, diagnosis) {
  const history = getRxHistory(doctorId)
  const key = normalizeKey(diagnosis)
  return history.filter(e => {
    if (!e.diagnosisKey) return false
    return normalizeKey(e.diagnosisKey).includes(key) || key.includes(normalizeKey(e.diagnosisKey))
  }).length
}
