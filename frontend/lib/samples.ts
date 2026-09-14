// Sample Inventory — localStorage layer
// Replace getVisits / addVisit with API calls when backend is ready.

export const SAMPLES_KEY       = 'trikmed_samples'
export const BRAND_HISTORY_KEY = 'trikmed_brand_history'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DrugEntry {
  brandName:   string
  quantity:    number
  batchNumber?: string
  expiryDate?:  string  // YYYY-MM-DD
}

export interface SampleVisit {
  id:          string
  mrId:        string
  mrName:      string
  visitDate:   string   // YYYY-MM-DD
  visitNotes:  string
  drugs:       DrugEntry[]
  createdAt:   string   // ISO 8601
}

export type NewVisit = Omit<SampleVisit, 'id' | 'createdAt'>

// ── Migration — converts old single-drug entries to the Visit shape ────────────
function migrate(items: any[]): SampleVisit[] {
  return items.map((item): SampleVisit => {
    if (Array.isArray(item.drugs)) return item as SampleVisit
    return {
      id:         item.id,
      mrId:       String(item.mrId ?? ''),
      mrName:     item.mrName ?? '',
      visitDate:  item.date ?? item.visitDate ?? '',
      visitNotes: item.notes ?? item.visitNotes ?? '',
      drugs:      [{ brandName: item.drug ?? '', quantity: Number(item.quantity ?? 1) }],
      createdAt:  item.createdAt,
    }
  })
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export function getVisits(): SampleVisit[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SAMPLES_KEY)
    return raw ? migrate(JSON.parse(raw)) : []
  } catch {
    return []
  }
}

export function addVisit(v: NewVisit): SampleVisit {
  const record: SampleVisit = {
    ...v,
    id:        crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  localStorage.setItem(SAMPLES_KEY, JSON.stringify([record, ...getVisits()]))
  return record
}

// ── Brand autocomplete history ─────────────────────────────────────────────────

export function getBrandHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(BRAND_HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveBrandHistory(newBrands: string[]): void {
  if (typeof window === 'undefined') return
  const existing = getBrandHistory()
  const merged   = Array.from(new Set([...newBrands, ...existing]))
  localStorage.setItem(BRAND_HISTORY_KEY, JSON.stringify(merged.slice(0, 200)))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function cutoffDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}
