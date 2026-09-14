// ─── TrikMed Unified Storage Layer ───────────────────────────────────────────
// Single source of truth for all clinic data.
// All features (Appointments, QueueScreen, OPD Console, Patients, Rx History,
// Settings) read/write through these helpers.

// ── Key registry ──────────────────────────────────────────────────────────────
export const KEYS = {
  CLINIC_CONFIG:    'trikmed.clinic.config',
  STAFF:            'trikmed.staff',
  PATIENTS:         'trikmed.patients',
  APPOINTMENTS:     'trikmed.appointments',
  PRESCRIPTIONS:    'trikmed.prescriptions',
  REVIEWS:          'trikmed.reviews',
  SEED_VERSION:     'trikmed.seed.version',
  RX_HISTORY:       (id) => `trikmed.rxHistory.${id}`,
  CUSTOM_MEDICINES: (id) => `trikmed.customMedicines.${id}`,
  FAVOURITES:       (id) => `trikmed.favourites.${id}`,
}

const SEED_VERSION = 'v4'

// ── Safe JSON helpers ──────────────────────────────────────────────────────────
function safeGet(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* quota */ }
}
function todayStr() {
  return new Date().toISOString().split('T')[0]
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────────────────────────────────────
function buildSeedData() {
  const today = todayStr()
  const t = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const CLINIC_CONFIG = {
    clinic: {
      name: 'City Care Clinic',
      logoUrl: '',
      address: '14-B, MG Road, Vaishali Nagar',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302021',
      phone: '9876543210',
      email: 'info@citycareclinic.in',
      website: 'booking.trikmed.com/city-care-clinic',
      gstin: '',
      registrationNumber: 'RJ-MCA-2019-0042',
    },
    doctors: [
      {
        id: 'dr001',
        name: 'Dr. Rajesh Sharma',
        qualifications: 'MBBS, MD (General Medicine)',
        registrationNumber: 'RJ-12345',
        specialty: 'General Medicine',
        phone: '9876543211',
        email: 'dr.rajesh@citycareclinic.in',
        signatureUrl: '',
        isPrimary: true,
      },
      {
        id: 'dr002',
        name: 'Dr. Priya Mehta',
        qualifications: 'MBBS, DCH',
        registrationNumber: 'RJ-23456',
        specialty: 'Pediatrics',
        phone: '9876543219',
        email: 'dr.priya@citycareclinic.in',
        signatureUrl: '',
        isPrimary: false,
      },
    ],
    rxSettings: {
      defaultFollowUp: '1 week',
      defaultLanguage: 'bilingual',
      whatsappEnabled: true,
      paperSize: 'A5',
      showLetterhead: true,
      showQR: true,
    },
    timings: {
      days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false },
      morningFrom: '09:00', morningTo: '13:00',
      eveningFrom: '17:00', eveningTo: '20:00',
      lunchFrom: '13:00',   lunchTo: '17:00',
      maxPatientsPerSlot: 4,
    },
    notifications: {
      whatsappReminder: true,
      reminderTiming: '2hr',
      missedCallAutoReply: true,
      followUpReminder: true,
    },
    updatedAt: new Date().toISOString(),
  }

  const STAFF = [
    { id: 'st001', name: 'Vikash Panwar', role: 'owner',        email: 'owner@trikmed.com',  phone: '9800000001', permissions: {}, lastLogin: new Date().toISOString() },
    { id: 'st002', name: 'Dr. Rajesh Sharma',     role: 'doctor',       email: 'demo@trikmed.com',   phone: '9800000002', permissions: {}, lastLogin: new Date().toISOString() },
    { id: 'st003', name: 'Dr. Priya Mehta',       role: 'doctor',       email: 'drpriya@trikmed.com',phone: '9800000006', permissions: {}, lastLogin: null },
    { id: 'st004', name: 'Sunita Receptionist',   role: 'receptionist', email: 'recep@trikmed.com',  phone: '9800000003', permissions: {}, lastLogin: new Date().toISOString() },
    { id: 'st005', name: 'Raju Helper',           role: 'staff',        email: 'staff@trikmed.com',  phone: '9800000004', permissions: {}, lastLogin: null },
  ]

  const PATIENTS = [
    {
      id: 'p001',
      name: 'Ramesh Verma',
      age: 54,
      gender: 'Male',
      phone: '9876543210',
      email: 'ramesh.verma@gmail.com',
      abhaNumber: 'ABHA-2021-RV-54',
      bloodGroup: 'B+',
      allergies: ['Penicillin', 'Sulfa drugs'],
      chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
      address: '12, Shanti Nagar, Varanasi, UP',
      doctorNote: 'Compliant patient. Family history of CAD. Annual HbA1c due in June.',
      visitCount: 8,
      createdAt: '2024-09-15T10:30:00.000Z',
    },
    {
      id: 'p002',
      name: 'Sunita Devi',
      age: 38,
      gender: 'Female',
      phone: '9823456701',
      email: 'sunita.devi@gmail.com',
      abhaNumber: 'ABHA-2022-SD-38',
      bloodGroup: 'A+',
      allergies: [],
      chronicConditions: ['Hypothyroidism'],
      address: '45-B, Lal Bahadur Colony, Lucknow, UP',
      doctorNote: 'On Thyronorm 75mcg since 2022. TSH within range last check.',
      visitCount: 4,
      createdAt: '2024-11-02T09:00:00.000Z',
    },
    {
      id: 'p003',
      name: 'Aarav Singh',
      age: 7,
      gender: 'Male',
      phone: '9711234567',
      email: '',
      abhaNumber: '',
      bloodGroup: 'O+',
      allergies: ['Amoxicillin (rash)'],
      chronicConditions: [],
      address: '78, Ram Niwas Marg, Kanpur, UP',
      doctorNote: 'Recurrent tonsillitis. ENT referral done Feb 2025.',
      visitCount: 3,
      createdAt: '2025-01-05T11:15:00.000Z',
    },
    {
      id: 'p004',
      name: 'Meena Patel',
      age: 62,
      gender: 'Female',
      phone: '9988776655',
      email: 'meena.patel@gmail.com',
      abhaNumber: 'ABHA-2020-MP-62',
      bloodGroup: 'AB+',
      allergies: [],
      chronicConditions: ['Osteoarthritis', 'Hypertension'],
      address: '202, Vrindavan Society, Surat, Gujarat',
      doctorNote: 'Knee replacement planned Q4 2025. Conservative management.',
      visitCount: 12,
      createdAt: '2024-08-20T14:00:00.000Z',
    },
    {
      id: 'p005',
      name: 'Deepak Joshi',
      age: 29,
      gender: 'Male',
      phone: '9654321098',
      email: 'deepak.joshi@gmail.com',
      abhaNumber: '',
      bloodGroup: 'B-',
      allergies: [],
      chronicConditions: [],
      address: '15, Civil Lines, Prayagraj, UP',
      doctorNote: '',
      visitCount: 2,
      createdAt: '2025-02-14T16:30:00.000Z',
    },
  ]

  // Today's appointments — 3 active + 1 already done
  const APPOINTMENTS = [
    // ── TODAY ──
    {
      id: 'apt001',
      patientId: 'p005',
      patientName: 'Deepak Joshi',
      patientPhone: '9654321098',
      doctorId: 'dr001',
      date: today,
      time: '09:00',
      token: 1,
      type: 'Walk-in',
      reason: 'Follow-up',
      status: 'done',          // already seen this morning
      vitals: { bp: '122/80', pulse: 82, temp: '100.2', weight: 68, spo2: '98' },
      vitalsEnteredAt: '08:55',
      paymentAmount: 300,
      notes: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'apt002',
      patientId: 'p001',
      patientName: 'Ramesh Verma',
      patientPhone: '9876543210',
      doctorId: 'dr001',
      date: today,
      time: '09:30',
      token: 2,
      type: 'WhatsApp',
      reason: 'BP & Sugar review',
      status: 'in_cabin',      // currently with doctor
      vitals: { bp: '142/88', pulse: 78, temp: '98.4', weight: 80, spo2: '97' },
      vitalsEnteredAt: t,
      paymentAmount: 500,
      notes: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'apt003',
      patientId: 'p002',
      patientName: 'Sunita Devi',
      patientPhone: '9823456701',
      doctorId: 'dr001',
      date: today,
      time: '10:00',
      token: 3,
      type: 'QR Code',
      reason: 'Thyroid review',
      status: 'vitals_done',   // vitals filled, waiting to be called
      vitals: { bp: '118/76', pulse: 72, temp: '98.6', weight: 63, spo2: '99' },
      vitalsEnteredAt: t,
      paymentAmount: 300,
      notes: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'apt004',
      patientId: 'p003',
      patientName: 'Aarav Singh',
      patientPhone: '9711234567',
      doctorId: 'dr001',
      date: today,
      time: '10:30',
      token: 4,
      type: 'Phone',
      reason: 'Throat infection',
      status: 'confirmed',     // waiting, no vitals yet
      vitals: null,
      vitalsEnteredAt: null,
      paymentAmount: null,
      notes: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'apt005',
      patientId: 'p004',
      patientName: 'Meena Patel',
      patientPhone: '9988776655',
      doctorId: 'dr001',
      date: today,
      time: '11:00',
      token: 5,
      type: 'Online',
      reason: 'Knee pain review',
      status: 'confirmed',
      vitals: null,
      vitalsEnteredAt: null,
      paymentAmount: null,
      notes: '',
      createdAt: new Date().toISOString(),
    },
    // ── YESTERDAY (for history) ──
    {
      id: 'apt006',
      patientId: 'p001',
      patientName: 'Ramesh Verma',
      patientPhone: '9876543210',
      doctorId: 'dr001',
      date: (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0] })(),
      time: '10:00',
      token: 3,
      type: 'Walk-in',
      reason: 'BP check',
      status: 'done',
      vitals: { bp: '140/86', pulse: 76, temp: '98.4', weight: 80, spo2: '97' },
      vitalsEnteredAt: '09:55',
      paymentAmount: 300,
      notes: '',
      createdAt: new Date().toISOString(),
    },
  ]

  const PRESCRIPTIONS = [
    {
      id: 'rx001',
      rxNumber: 'RX-' + today.replace(/-/g,'') + '-001',
      patientId: 'p005',
      patientName: 'Deepak Joshi',
      patientAge: 29,
      patientGender: 'Male',
      patientPhone: '9654321098',
      doctorId: 'dr001',
      appointmentId: 'apt001',
      date: new Date().toISOString(),
      vitals: { bp: '122/80', pulse: 82, temp: '100.2', weight: 68, spo2: '98' },
      symptoms: ['Fever 2 days', 'Body ache', 'Headache'],
      diagnosis: ['Viral Fever'],
      medicines: [
        { id: 'm001', brandName: 'Crocin 650', genericName: 'Paracetamol', strength: '650mg', dosage: '1-1-1', timing: 'After food', duration: '3 days', notes: '' },
        { id: 'm002', brandName: 'Combiflam', genericName: 'Ibuprofen+Paracetamol', strength: '400mg', dosage: '1-0-1', timing: 'After food', duration: '3 days', notes: 'Only if temp > 101°F' },
      ],
      tests: [],
      instructions: { en: 'Rest. Plenty of fluids. Monitor temperature.', hi: 'आराम करें। खूब पानी पिएं।' },
      followUp: '3 days',
      status: 'finalized',
      createdAt: new Date().toISOString(),
      finalizedAt: new Date().toISOString(),
    },
    {
      id: 'rx002',
      rxNumber: 'RX-20250315-001',
      patientId: 'p003',
      patientName: 'Aarav Singh',
      patientAge: 7,
      patientGender: 'Male',
      patientPhone: '9711234567',
      doctorId: 'dr001',
      appointmentId: null,
      date: '2025-03-15T11:00:00.000Z',
      vitals: { bp: '', pulse: 92, temp: '101.2', weight: 22, spo2: '98' },
      symptoms: ['Sore throat', 'Fever 3 days', 'Running nose'],
      diagnosis: ['Viral URTI', 'Tonsillitis'],
      medicines: [
        { id: 'm003', brandName: 'Crocin 250', genericName: 'Paracetamol', strength: '250mg', dosage: '1-1-1', timing: 'After food', duration: '3 days', notes: 'Child dose' },
        { id: 'm004', brandName: 'Xyzal', genericName: 'Levocetirizine', strength: '5mg', dosage: '0-0-½', timing: 'After food', duration: '5 days', notes: 'Half tablet — child' },
      ],
      tests: [],
      instructions: { en: 'Steam inhalation twice daily. Plenty of fluids.', hi: 'दिन में दो बार भाप लें।' },
      followUp: '5 days',
      status: 'finalized',
      createdAt: '2025-03-15T11:00:00.000Z',
      finalizedAt: '2025-03-15T11:05:00.000Z',
    },
    {
      id: 'rx003',
      rxNumber: 'RX-20250310-001',
      patientId: 'p001',
      patientName: 'Ramesh Verma',
      patientAge: 54,
      patientGender: 'Male',
      patientPhone: '9876543210',
      doctorId: 'dr001',
      appointmentId: null,
      date: '2025-03-10T10:30:00.000Z',
      vitals: { bp: '140/86', pulse: 76, temp: '98.4', weight: 80, spo2: '97' },
      symptoms: ['Mild headache', 'Dizziness', 'Fatigue'],
      diagnosis: ['Hypertension - uncontrolled', 'Type 2 Diabetes Mellitus'],
      medicines: [
        { id: 'm072', brandName: 'Telma 40', genericName: 'Telmisartan', strength: '40mg', dosage: '1-0-0', timing: 'After breakfast', duration: '30 days', notes: '' },
        { id: 'm060', brandName: 'Glycomet 500', genericName: 'Metformin', strength: '500mg', dosage: '1-0-1', timing: 'After food', duration: '30 days', notes: '' },
      ],
      tests: ['HbA1c', 'Fasting Lipid Profile'],
      instructions: { en: 'Low salt diet. Walk 30 min daily. Avoid stress.', hi: 'कम नमक खाएं। रोज 30 मिनट टहलें।' },
      followUp: '1 month',
      status: 'finalized',
      createdAt: '2025-03-10T10:30:00.000Z',
      finalizedAt: '2025-03-10T10:45:00.000Z',
    },
  ]

  return { CLINIC_CONFIG, STAFF, PATIENTS, APPOINTMENTS, PRESCRIPTIONS }
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
export function initDemoDataIfNeeded() {
  if (typeof window === 'undefined') return
  if (safeGet(KEYS.SEED_VERSION) === SEED_VERSION) return // already seeded

  const { CLINIC_CONFIG, STAFF, PATIENTS, APPOINTMENTS, PRESCRIPTIONS } = buildSeedData()

  safeSet(KEYS.CLINIC_CONFIG, CLINIC_CONFIG)
  safeSet(KEYS.STAFF, STAFF)
  safeSet(KEYS.PATIENTS, PATIENTS)
  safeSet(KEYS.APPOINTMENTS, APPOINTMENTS)
  safeSet(KEYS.PRESCRIPTIONS, PRESCRIPTIONS)
  safeSet(KEYS.SEED_VERSION, SEED_VERSION)
}

// ─────────────────────────────────────────────────────────────────────────────
// CLINIC CONFIG
// ─────────────────────────────────────────────────────────────────────────────
export function getClinicConfig() {
  return safeGet(KEYS.CLINIC_CONFIG) || null
}
export function saveClinicConfig(config) {
  safeSet(KEYS.CLINIC_CONFIG, { ...config, updatedAt: new Date().toISOString() })
}

/** Convenience: get a flat view of the primary doctor for OPD header */
export function getPrimaryDoctor() {
  const cfg = getClinicConfig()
  return cfg?.doctors?.find(d => d.isPrimary) || cfg?.doctors?.[0] || null
}

/** Convenience: get rxSettings for OPD Console defaults */
export function getRxSettings() {
  return getClinicConfig()?.rxSettings || { whatsappEnabled: true, defaultLanguage: 'bilingual', defaultFollowUp: '1 week' }
}

// ─────────────────────────────────────────────────────────────────────────────
// STAFF
// ─────────────────────────────────────────────────────────────────────────────
export function getAllStaff() {
  return safeGet(KEYS.STAFF) || []
}
export function getStaffMember(id) {
  return getAllStaff().find(s => s.id === id) || null
}
export function upsertStaff(member) {
  const all = getAllStaff()
  const idx = all.findIndex(s => s.id === member.id)
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...member, updatedAt: new Date().toISOString() }
  } else {
    all.push({ ...member, id: member.id || `st_${Date.now()}`, createdAt: new Date().toISOString() })
  }
  safeSet(KEYS.STAFF, all)
}
export function saveStaff(staffArray) {
  safeSet(KEYS.STAFF, staffArray)
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENTS
// ─────────────────────────────────────────────────────────────────────────────
export function getAllPatients() {
  return safeGet(KEYS.PATIENTS) || []
}
export function getPatient(id) {
  return getAllPatients().find(p => p.id === id) || null
}
export function searchPatients(query) {
  if (!query) return []
  const q = query.toLowerCase()
  return getAllPatients()
    .filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.abhaNumber?.toLowerCase().includes(q) ||
      p.chronicConditions?.some(c => c.toLowerCase().includes(q))
    )
    .slice(0, 10)
}
export function savePatient(patient) {
  const all = getAllPatients()
  const idx = all.findIndex(p => p.id === patient.id)
  const now = new Date().toISOString()
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...patient, updatedAt: now }
  } else {
    all.unshift({ ...patient, id: patient.id || `p_${Date.now()}`, createdAt: now, visitCount: 0 })
  }
  safeSet(KEYS.PATIENTS, all)
  return all[idx >= 0 ? idx : 0]
}
export function incrementVisitCount(patientId) {
  const all = getAllPatients()
  const idx = all.findIndex(p => p.id === patientId)
  if (idx >= 0) {
    all[idx].visitCount = (all[idx].visitCount || 0) + 1
    all[idx].lastVisit = new Date().toISOString()
    safeSet(KEYS.PATIENTS, all)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENTS
// ─────────────────────────────────────────────────────────────────────────────
export function getAllAppointments() {
  return safeGet(KEYS.APPOINTMENTS) || []
}

export function getAppointmentsForDate(date, doctorId = null) {
  return getAllAppointments()
    .filter(a => a.date === date && (!doctorId || a.doctorId === doctorId))
    .sort((a, b) => a.token - b.token)
}

export function getTodayAppointments(doctorId = null) {
  return getAppointmentsForDate(todayStr(), doctorId)
}

export function saveAppointment(appt) {
  const all = getAllAppointments()
  const idx = all.findIndex(a => a.id === appt.id)
  const now = new Date().toISOString()
  let saved
  if (idx >= 0) {
    saved = { ...all[idx], ...appt, updatedAt: now }
    all[idx] = saved
  } else {
    saved = { ...appt, id: appt.id || `apt_${Date.now()}`, createdAt: now }
    all.push(saved)
  }
  safeSet(KEYS.APPOINTMENTS, all)
  return saved
}

export function updateAppointmentStatus(id, status, extra = {}) {
  const all = getAllAppointments()
  const idx = all.findIndex(a => a.id === id)
  if (idx >= 0) {
    all[idx] = { ...all[idx], status, ...extra, updatedAt: new Date().toISOString() }
    safeSet(KEYS.APPOINTMENTS, all)
    return all[idx]
  }
  return null
}

/** Add or update vitals on an appointment — also advances status to vitals_done */
export function recordVitals(appointmentId, vitals) {
  const t = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  return updateAppointmentStatus(appointmentId, 'vitals_done', { vitals, vitalsEnteredAt: t })
}

/** Auto-generate the next token for a given date */
export function generateToken(date) {
  const appts = getAppointmentsForDate(date)
  return appts.length > 0 ? Math.max(...appts.map(a => a.token || 0)) + 1 : 1
}

// ─────────────────────────────────────────────────────────────────────────────
// QUEUE  (derived from today's appointments)
// ─────────────────────────────────────────────────────────────────────────────
// Status priority for determining "next":
// vitals_done > paid > confirmed

/**
 * Returns queue state in the format NewRx.jsx expects:
 * { current, staffVitals, staffVitalsTime, next, waitingCount }
 */
export function getQueueEntry(doctorId = 'dr001') {
  const active = getTodayAppointments(doctorId)
    .filter(a => !['done', 'no_show', 'cancelled'].includes(a.status))

  const current = active.find(a => a.status === 'in_cabin') || null

  // Next = first non-in_cabin, prefer vitals_done over paid over confirmed
  const waiting = active.filter(a => a.status !== 'in_cabin')
  const next = waiting.find(a => a.status === 'vitals_done')
             || waiting.find(a => a.status === 'paid')
             || waiting.find(a => a.status === 'confirmed')
             || null

  const waitingCount = waiting.filter(a => a !== next).length

  return {
    current: current
      ? {
          patientId:    current.patientId,
          token:        current.token || current.tokenNum,
          appointmentId: current.id,
          patientName:  current.patientName  || current.patient?.name || 'Patient',
          patientPhone: current.patientPhone || current.patient?.phone || '',
          age:          current.age || current.patient?.age || null,
        }
      : null,
    staffVitals: current?.vitals || null,
    staffVitalsTime: current?.vitalsEnteredAt || null,
    next: next
      ? { patientId: next.patientId, name: next.patientName, token: next.token,
          hasVitals: !!(next.vitals?.bp), appointmentId: next.id }
      : null,
    waitingCount,
  }
}

/**
 * Advance queue: mark current in_cabin as done,
 * mark next (vitals_done → in_cabin) appointment.
 * Returns new getQueueEntry().
 */
export function advanceQueue(doctorId = 'dr001') {
  const active = getTodayAppointments(doctorId)
    .filter(a => !['done', 'no_show', 'cancelled'].includes(a.status))

  // Mark current as done
  const current = active.find(a => a.status === 'in_cabin')
  if (current) {
    updateAppointmentStatus(current.id, 'done')
  }

  // Promote next → in_cabin
  const remaining = getTodayAppointments(doctorId)
    .filter(a => !['done', 'no_show', 'cancelled', 'in_cabin'].includes(a.status))

  const next = remaining.find(a => a.status === 'vitals_done')
             || remaining.find(a => a.status === 'paid')
             || remaining.find(a => a.status === 'confirmed')

  if (next) {
    updateAppointmentStatus(next.id, 'in_cabin')
  }

  return getQueueEntry(doctorId)
}

/** Mark appointment done when doctor finishes consultation */
export function completeAppointment(appointmentId) {
  return updateAppointmentStatus(appointmentId, 'done')
}

/**
 * Returns slot state for parallel consult mode.
 * Slots A / B / C — each shows which patient is currently in_cabin for that slot.
 * Only relevant when cabinSettings.mode !== 'single'.
 */
export function getSlotsState(doctorId = 'dr001') {
  const today = getTodayAppointments(doctorId)
  const inCabin = today.filter(a => a.status === 'in_cabin')
  return ['A', 'B', 'C'].map(slot => {
    const appt = inCabin.find(a => a.slot === slot) || null
    return {
      slot,
      appointmentId: appt?.id || null,
      patientId:     appt?.patientId || null,
      patientName:   appt?.patientName || null,
      startedAt:     appt?.updatedAt || null,
      vitals:        appt?.vitals || null,
    }
  })
}

/**
 * Returns the next waiting patient for a given doctor.
 * Priority: vitals_done > paid > confirmed
 */
export function getNextWaiting(doctorId = 'dr001') {
  const active = getTodayAppointments(doctorId)
    .filter(a => !['done', 'no_show', 'cancelled', 'in_cabin'].includes(a.status))
  return active.find(a => a.status === 'vitals_done')
      || active.find(a => a.status === 'paid')
      || active.find(a => a.status === 'confirmed')
      || null
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESCRIPTIONS
// ─────────────────────────────────────────────────────────────────────────────
export function getAllPrescriptions() {
  return safeGet(KEYS.PRESCRIPTIONS) || []
}
export function getPrescription(id) {
  return getAllPrescriptions().find(rx => rx.id === id) || null
}
export function getPatientPrescriptions(patientId) {
  return getAllPrescriptions()
    .filter(rx => rx.patientId === patientId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}
export function savePrescription(rx) {
  const all = getAllPrescriptions()
  const idx = all.findIndex(r => r.id === rx.id)
  const now = new Date().toISOString()
  let saved
  if (idx >= 0) {
    saved = { ...all[idx], ...rx, updatedAt: now }
    all[idx] = saved
  } else {
    saved = {
      ...rx,
      id: rx.id || `rx_${Date.now()}`,
      rxNumber: rx.rxNumber || generateRxNumber(),
      createdAt: now,
    }
    all.unshift(saved)
  }
  safeSet(KEYS.PRESCRIPTIONS, all)
  return saved
}
export function generateRxNumber() {
  const dateStr = todayStr().replace(/-/g, '')
  const todayRxs = getAllPrescriptions().filter(rx => rx.rxNumber?.includes(dateStr))
  const seq = String(todayRxs.length + 1).padStart(3, '0')
  return `RX-${dateStr}-${seq}`
}
export function finalizePrescription(rxId) {
  const all = getAllPrescriptions()
  const idx = all.findIndex(r => r.id === rxId)
  if (idx >= 0) {
    all[idx].status = 'finalized'
    all[idx].rxNumber = all[idx].rxNumber || generateRxNumber()
    all[idx].finalizedAt = new Date().toISOString()
    safeSet(KEYS.PRESCRIPTIONS, all)
    const rx = all[idx]
    // Auto-resolve any pending reviews for this patient (new Rx written)
    if (rx.patientId) autoResolveReviewsForPatient(rx.patientId)
    // Create a review entry if this Rx had tests + follow-up
    createReviewIfNeeded(rx)
    return rx
  }
  return null
}


// ─────────────────────────────────────────────────────────────────────────────
// RX HISTORY (AI learning feed)
// ─────────────────────────────────────────────────────────────────────────────
export function appendRxHistory(doctorId, entry) {
  const history = safeGet(KEYS.RX_HISTORY(doctorId)) || []
  history.unshift({ ...entry, timestamp: new Date().toISOString() })
  safeSet(KEYS.RX_HISTORY(doctorId), history.slice(0, 200))
}
export function getRxHistory(doctorId) {
  return safeGet(KEYS.RX_HISTORY(doctorId)) || []
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM MEDICINES
// ─────────────────────────────────────────────────────────────────────────────
export function getCustomMedicines(doctorId) {
  return safeGet(KEYS.CUSTOM_MEDICINES(doctorId)) || []
}
export function saveCustomMedicine(doctorId, medicine) {
  const all = getCustomMedicines(doctorId)
  const newMed = { ...medicine, id: `custom_${Date.now()}`, isCustom: true, createdAt: new Date().toISOString() }
  all.unshift(newMed)
  safeSet(KEYS.CUSTOM_MEDICINES(doctorId), all)
  return newMed
}

// ─────────────────────────────────────────────────────────────────────────────
// FAVOURITES
// ─────────────────────────────────────────────────────────────────────────────
export function getFavourites(doctorId) {
  return safeGet(KEYS.FAVOURITES(doctorId)) || []
}
export function toggleFavourite(doctorId, medicine) {
  const favs = getFavourites(doctorId)
  const idx = favs.findIndex(f => f.id === medicine.id)
  if (idx >= 0) {
    favs.splice(idx, 1)
  } else {
    favs.unshift({ ...medicine, savedAt: new Date().toISOString() })
  }
  safeSet(KEYS.FAVOURITES(doctorId), favs)
  return idx < 0 // true = added
}
export function isFavourite(doctorId, medicineId) {
  return getFavourites(doctorId).some(f => f.id === medicineId)
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATS (computed from real data)
// ─────────────────────────────────────────────────────────────────────────────
export function getDashboardStats() {
  const today = todayStr()
  const allAppts = getAllAppointments()
  const todayAppts = allAppts.filter(a => a.date === today)

  const checkedIn    = todayAppts.filter(a => ['in_cabin','vitals_done','paid','done'].includes(a.status)).length
  const completed    = todayAppts.filter(a => a.status === 'done').length
  const noShows      = todayAppts.filter(a => a.status === 'no_show').length
  const waiting      = todayAppts.filter(a => ['confirmed','paid','vitals_done'].includes(a.status)).length
  const inCabin      = todayAppts.filter(a => a.status === 'in_cabin').length
  const revenue      = todayAppts
    .filter(a => a.paymentAmount)
    .reduce((sum, a) => sum + (a.paymentAmount || 0), 0)
  const allPatients  = getAllPatients()
  const newPatients  = allPatients.filter(p => p.createdAt?.startsWith(today)).length
  const prescriptions = getAllPrescriptions()
  const todayRx      = prescriptions.filter(rx => rx.date?.startsWith(today)).length

  return {
    appointmentsToday: todayAppts.length,
    checkedIn,
    completed,
    noShows,
    waiting,
    inCabin,
    revenue,
    newPatients,
    todayRx,
    totalPatients: allPatients.length,
    noShowRate: todayAppts.length > 0 ? Math.round((noShows / todayAppts.length) * 100) : 0,
  }
}

// ── Review Queue ───────────────────────────────────────────────────────────────
// A "review" is created when a prescription has tests ordered + a follow-up date.
// It stays pending until the doctor writes a new Rx for that patient and resolves it.

export function getAllReviews() {
  return safeGet(KEYS.REVIEWS) || []
}

export function getPendingReviews() {
  return getAllReviews().filter(r => r.status === 'pending')
}

/**
 * Called after finalizePrescription when tests.length > 0 && followUpDate is set.
 * Idempotent — won't create a duplicate if one already exists for same prescriptionId.
 */
export function createReviewIfNeeded(rx) {
  if (!rx || !rx.tests?.length || !rx.followUpDate) return null
  const all = getAllReviews()
  if (all.find(r => r.prescriptionId === rx.id)) return null
  const review = {
    id:             `rev_${Date.now()}`,
    prescriptionId: rx.id,
    patientId:      rx.patientId,
    patientName:    rx.patientName || '',
    testsOrdered:   rx.tests,
    orderedDate:    rx.date || new Date().toISOString(),
    followUpDate:   rx.followUpDate,
    doctorId:       rx.doctorId || 'dr001',
    status:         'pending',
    createdAt:      new Date().toISOString(),
  }
  safeSet(KEYS.REVIEWS, [...all, review])
  return review
}

/** Mark a review as done (called when a new finalized Rx exists for the same patient). */
export function resolveReview(reviewId) {
  const all = getAllReviews()
  const idx = all.findIndex(r => r.id === reviewId)
  if (idx >= 0) {
    all[idx] = { ...all[idx], status: 'done', resolvedAt: new Date().toISOString() }
    safeSet(KEYS.REVIEWS, all)
    return all[idx]
  }
  return null
}

/** Auto-resolve any pending reviews for a patient when they get a new finalized Rx. */
export function autoResolveReviewsForPatient(patientId) {
  const all = getAllReviews()
  let changed = false
  const updated = all.map(r => {
    if (r.patientId === patientId && r.status === 'pending') {
      changed = true
      return { ...r, status: 'done', resolvedAt: new Date().toISOString() }
    }
    return r
  })
  if (changed) safeSet(KEYS.REVIEWS, updated)
}

/**
 * Mark the current in-cabin patient as 'awaiting_reports'
 * and promote the next waiting patient to 'in_cabin'.
 * Used by the "Mark for Review" flow in the OPD Console.
 */
export function markAsAwaitingReports(appointmentId, doctorId = 'dr001') {
  updateAppointmentStatus(appointmentId, 'awaiting_reports')
  const SKIP = new Set(['done', 'no_show', 'cancelled', 'in_cabin', 'awaiting_reports'])
  const rem = getTodayAppointments(doctorId).filter(a => !SKIP.has(a.status))
  const next = rem.find(a => a.status === 'vitals_done')
             || rem.find(a => a.status === 'paid')
             || rem.find(a => a.status === 'confirmed')
  if (next) updateAppointmentStatus(next.id, 'in_cabin')
  return getQueueEntry(doctorId)
}
