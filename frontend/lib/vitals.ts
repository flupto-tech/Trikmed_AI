// Vitals types, flags, and storage conversion helpers.

export interface Vitals {
  temp?:   string | number   // °F
  sbp?:    string | number   // systolic mmHg
  dbp?:    string | number   // diastolic mmHg
  pulse?:  string | number   // bpm
  spo2?:   string | number   // %
  weight?: string | number   // kg
  notes?:  string
}

export interface VitalsFlags {
  highBP:  boolean   // sbp > 140 or dbp > 90
  lowSpo2: boolean   // spo2 < 94
}

export function flagVitals(v: Vitals): VitalsFlags {
  const sbp  = Number(v.sbp  ?? 0)
  const dbp  = Number(v.dbp  ?? 0)
  const spo2 = Number(v.spo2 ?? 0)
  return {
    highBP:  (sbp > 0 && sbp > 140) || (dbp > 0 && dbp > 90),
    lowSpo2: spo2 > 0 && spo2 < 94,
  }
}

/** Convert form vitals object → appointment storage format (bp as "120/80" string) */
export function vitalsToStorage(v: Vitals): Record<string, any> {
  const out: Record<string, any> = {}
  if (v.sbp && v.dbp)  out.bp     = `${v.sbp}/${v.dbp}`
  if (v.temp)          out.temp   = String(v.temp)
  if (v.pulse)         out.pulse  = Number(v.pulse)
  if (v.spo2)          out.spo2   = String(v.spo2)
  if (v.weight)        out.weight = Number(v.weight)
  return out
}

export function hasAnyVital(v: Vitals): boolean {
  return !!(v.temp || v.sbp || v.dbp || v.pulse || v.spo2 || v.weight || v.notes?.trim())
}
