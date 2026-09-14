// Fee configuration for walk-in form and payment tracking.
// Reads/writes from trikmed.clinic.config.fees

const CONFIG_KEY = 'trikmed.clinic.config'

export interface FeeConfig {
  newPatientFee:     number
  followUpFee:       number
  followUpWindowDays: number
  acceptedModes:     string[]   // 'cash' | 'upi' | 'card'
  upiId:             string
  upiQrDataUrl:      string     // data URL of the QR image stored in settings
}

export const FEE_DEFAULTS: FeeConfig = {
  newPatientFee:      300,
  followUpFee:        150,
  followUpWindowDays: 7,
  acceptedModes:      ['cash', 'upi', 'card'],
  upiId:              '',
  upiQrDataUrl:       '',
}

export function getFeeConfig(): FeeConfig {
  if (typeof window === 'undefined') return { ...FEE_DEFAULTS }
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    const cfg = raw ? JSON.parse(raw) : {}
    return { ...FEE_DEFAULTS, ...(cfg.fees ?? {}) }
  } catch {
    return { ...FEE_DEFAULTS }
  }
}

export function saveFeeConfig(fees: Partial<FeeConfig>): void {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    const cfg = raw ? JSON.parse(raw) : {}
    const merged = { ...FEE_DEFAULTS, ...(cfg.fees ?? {}), ...fees }
    localStorage.setItem(CONFIG_KEY, JSON.stringify({
      ...cfg,
      fees: merged,
      updatedAt: new Date().toISOString(),
    }))
  } catch {}
}
