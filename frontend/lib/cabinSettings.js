'use client'

/**
 * Cabin / parallel-consult settings helper.
 * Single source of truth for every page that needs slot config.
 */

export function getCabinSettings() {
  if (typeof window === 'undefined') return { mode: 'single', slots: 1 }
  try {
    const config = JSON.parse(localStorage.getItem('trikmed.clinic.config') || '{}')
    const cs = config.cabinSettings || {}
    const mode = cs.mode || 'single'
    const slots = cs.slots || (mode === 'high-volume' ? 3 : mode === 'parallel' ? 2 : 1)
    return { mode, slots }
  } catch {
    return { mode: 'single', slots: 1 }
  }
}

/** Which slot the doctor is currently editing in OPD Console */
export function getActiveSlot() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('trikmed.active_slot') || null
}

/** Persist which slot the doctor is editing (called by NewRx on switch) */
export function persistActiveSlot(slot) {
  if (typeof window === 'undefined') return
  if (slot) localStorage.setItem('trikmed.active_slot', slot)
  else localStorage.removeItem('trikmed.active_slot')
}

/**
 * Given the list of currently in-cabin appointments and the max slots count,
 * return the label ('A'|'B'|'C') of the next free slot, or null if all full.
 */
export function assignSlot(inCabinAppts, maxSlots) {
  const occupied = inCabinAppts.map(a => a.slot).filter(Boolean)
  const allSlots = ['A', 'B', 'C'].slice(0, maxSlots)
  return allSlots.find(s => !occupied.includes(s)) || null
}
