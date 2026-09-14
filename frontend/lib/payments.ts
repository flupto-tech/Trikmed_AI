// Payment record CRUD — localStorage layer.
// Replace with API calls when backend is ready.

export const PAYMENTS_KEY = 'trikmed.payments'

export type PaymentMode   = 'cash' | 'upi' | 'card' | 'skip'
export type PaymentStatus = 'paid' | 'pending' | 'free'
export type ConsultType   = 'new' | 'followup' | 'free' | 'custom'

export interface PaymentRecord {
  id:               string
  patientId:        string
  appointmentId:    string
  date:             string     // YYYY-MM-DD
  amount:           number
  mode:             PaymentMode
  status:           PaymentStatus
  consultationType: ConsultType
  receivedBy?:      string
  createdAt:        string
}

export type NewPayment = Omit<PaymentRecord, 'id' | 'createdAt'>

export function getPayments(): PaymentRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function savePayment(p: NewPayment): PaymentRecord {
  const record: PaymentRecord = {
    ...p,
    id:        crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  const existing = getPayments()
  try {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify([record, ...existing]))
  } catch {}
  return record
}

export function getPaymentsForPatient(patientId: string): PaymentRecord[] {
  return getPayments().filter(p => p.patientId === patientId)
}
