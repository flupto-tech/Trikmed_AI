// Reports-pending review workflow — "Mark for Review" flow.
// Separate from trikmed.reviews (the old prescription follow-up system).
// Tracks patients who leave mid-consultation to get tests done externally.

export const REVIEWS_PENDING_KEY = 'trikmed.reviewsPending'

export interface ReportFile {
  filename: string
  dataUrl: string
  uploadedAt: string
  uploadedBy: string
}

export type ReportsStatus = 'awaiting' | 'uploaded' | 'manual'

export interface ReviewEntry {
  id: string
  patientId: string
  patientName: string
  patientPhone: string
  originalConsultationId: string
  diagnosis: string[]
  testsRecommended: string
  consultationDate: string
  markedForReviewAt: string
  reportsUploaded: ReportFile[]
  reportsStatus: ReportsStatus
  completedAt: string | null
  finalConsultationId: string | null
  vitals?: Record<string, unknown>
  notes?: string
  doctorId?: string
}

export type NewReviewEntry = Omit<
  ReviewEntry,
  'id' | 'markedForReviewAt' | 'reportsUploaded' | 'reportsStatus' | 'completedAt' | 'finalConsultationId'
>

function load(): ReviewEntry[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(REVIEWS_PENDING_KEY) || '[]') } catch { return [] }
}

function persist(entries: ReviewEntry[]) {
  try { localStorage.setItem(REVIEWS_PENDING_KEY, JSON.stringify(entries)) } catch {}
}

export function getReviewsPending(): ReviewEntry[] {
  return load()
}

export function getPendingCount(): number {
  return load().filter(r => !r.completedAt).length
}

export function getReviewById(id: string): ReviewEntry | null {
  return load().find(r => r.id === id) || null
}

export function addReviewEntry(entry: NewReviewEntry): ReviewEntry {
  const record: ReviewEntry = {
    ...entry,
    id:                    `rp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    markedForReviewAt:     new Date().toISOString(),
    reportsUploaded:       [],
    reportsStatus:         'awaiting',
    completedAt:           null,
    finalConsultationId:   null,
  }
  persist([record, ...load()])
  return record
}

export function updateReviewEntry(id: string, updates: Partial<ReviewEntry>): ReviewEntry | null {
  const all = load()
  const idx = all.findIndex(r => r.id === id)
  if (idx < 0) return null
  all[idx] = { ...all[idx], ...updates }
  persist(all)
  return all[idx]
}

export function finalizeReview(id: string, finalConsultationId: string): ReviewEntry | null {
  return updateReviewEntry(id, {
    completedAt:          new Date().toISOString(),
    finalConsultationId,
  })
}

export function daysAgo(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000)
}
