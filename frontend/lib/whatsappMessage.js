/**
 * Build the WhatsApp prescription message.
 * Used by NewRx (send after draft save) and RxView (resend from Rx page).
 *
 * Rules:
 * - No underscore characters anywhere — WhatsApp treats _text_ as italic and
 *   stray underscores (e.g. in rx_id URLs) corrupt the entire message.
 * - Doctor name: read as-is from storage; never prepend "Dr." because the
 *   name is already stored with the prefix.
 * - Medicine lines are built field-by-field from the medicine object only.
 * - Diagnosis fallback is "Not specified", never "—".
 */
export function buildWhatsAppMessage(rx, clinic) {
  // ── Clinic & doctor ─────────────────────────────────────────────────────────
  const clinicName = clinic?.name || 'Our Clinic'

  const doc = (
    clinic?.doctors?.find(d => d.id === rx.doctorId) ||
    clinic?.doctors?.find(d => d.isPrimary) ||
    clinic?.doctors?.[0] ||
    {}
  )

  // doc.name is already stored as "Dr. Rajesh Sharma" — never add Dr. prefix again
  const docName = doc.name || ''
  const docSpec = doc.specialty || ''

  // ── Patient & Rx meta ────────────────────────────────────────────────────────
  const patientName = rx.patientName || 'Patient'

  const rxDate = rx.date
    ? new Date(rx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''

  const rxNumber = rx.rxNumber || ''

  // Use rxNumber as the URL slug (RX-20260419-001 has no underscores).
  // Fall back to a sanitised id if rxNumber is absent.
  const rxSlug = rxNumber || (rx.id || '').replace(/_/g, '-')

  // ── Diagnosis ────────────────────────────────────────────────────────────────
  const diagnosis = rx.diagnosis?.length ? rx.diagnosis.join(', ') : 'Not specified'

  // ── Medicines (one numbered line each) ───────────────────────────────────────
  const medicineLines = (rx.medicines || []).map((m, i) => {
    const name     = m.brandName || ''
    const strength = m.strength  || ''
    const dosage   = m.dosage    || ''
    const timing   = m.timing    || ''
    const duration = m.duration  || ''

    const nameStr    = strength ? name + ' ' + strength : name
    const dosageStr  = [dosage, timing].filter(Boolean).join(', ')
    const durationStr = duration ? 'x ' + duration : ''

    const parts = [nameStr, dosageStr, durationStr].filter(Boolean)
    return (i + 1) + '. ' + parts.join(' - ')
  })

  // ── Instructions (one bullet per sentence) ────────────────────────────────────
  const instrRaw = (rx.instructions?.en || '').trim()
  const instrLines = instrRaw
    ? instrRaw
        .split(/[.;]\s+/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => '- ' + s)
    : []

  // ── Follow-up ────────────────────────────────────────────────────────────────
  let followUpText = ''
  if (rx.followUp === 'SOS') {
    followUpText = 'SOS (as needed)'
  } else if (rx.followUpDate) {
    followUpText = new Date(rx.followUpDate).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  // ── Assemble lines ───────────────────────────────────────────────────────────
  // IMPORTANT: no underscore characters anywhere — they break WhatsApp markdown.
  const lines = []

  lines.push('🏥 *' + clinicName + '*')
  if (docName) {
    lines.push('👨‍⚕️ ' + [docName, docSpec].filter(Boolean).join(' | '))
  }
  lines.push('')
  lines.push('📋 *Prescription for ' + patientName + '*')

  const metaParts = []
  if (rxDate)   metaParts.push('📅 Date: ' + rxDate)
  if (rxNumber) metaParts.push('Rx: ' + rxNumber)
  if (metaParts.length) lines.push(metaParts.join(' | '))

  lines.push('')
  lines.push('*Diagnosis:* ' + diagnosis)
  lines.push('')
  lines.push('💊 *Medicines:*')
  medicineLines.forEach(l => lines.push(l))

  if (rx.tests?.length) {
    lines.push('')
    lines.push('🧪 *Tests:* ' + rx.tests.join(', '))
  }

  if (instrLines.length) {
    lines.push('')
    lines.push('📝 *Instructions:*')
    instrLines.forEach(l => lines.push(l))
  }

  if (followUpText) {
    lines.push('')
    lines.push('📅 *Follow-up:* ' + followUpText)
  }

  lines.push('')
  lines.push('🔗 View Rx: https://trikmed.com/v/' + rxSlug)
  lines.push('Powered by TrikMed')   // no underscores — avoids WhatsApp italic corruption

  return lines.join('\n')
}
