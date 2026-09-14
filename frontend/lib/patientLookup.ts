// Phone-first patient lookup and last-visit retrieval.
// Reads directly from localStorage to avoid cross-language import issues.

const PATIENTS_KEY     = 'trikmed.patients'
const APPOINTMENTS_KEY = 'trikmed.appointments'

export interface MatchedPatient {
  id:        string
  name:      string
  age?:      number
  gender?:   string
  phone:     string
  address?:  string
  visitCount: number
  [key: string]: any
}

export interface LastVisit {
  date:    string   // YYYY-MM-DD
  reason:  string
  daysAgo: number
}

export function lookupByPhone(rawPhone: string): MatchedPatient | null {
  if (typeof window === 'undefined' || !rawPhone) return null
  const target = rawPhone.replace(/\D/g, '').slice(-10)
  if (target.length < 10) return null
  try {
    const raw = localStorage.getItem(PATIENTS_KEY)
    const patients: any[] = raw ? JSON.parse(raw) : []
    return patients.find(p => p.phone?.replace(/\D/g, '').slice(-10) === target) ?? null
  } catch {
    return null
  }
}

export function getLastVisit(patientId: string): LastVisit | null {
  if (typeof window === 'undefined' || !patientId) return null
  try {
    const raw = localStorage.getItem(APPOINTMENTS_KEY)
    const appts: any[] = raw ? JSON.parse(raw) : []
    const done = appts
      .filter(a => a.patientId === patientId && ['done', 'completed'].includes(a.status))
      .sort((a, b) => b.date.localeCompare(a.date))
    if (!done.length) return null
    const last = done[0]
    const daysAgo = Math.floor(
      (Date.now() - new Date(last.date + 'T00:00:00').getTime()) / 86_400_000
    )
    return { date: last.date, reason: last.reason ?? '', daysAgo }
  } catch {
    return null
  }
}
