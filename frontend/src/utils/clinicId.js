'use client'

const CITY_CODES = {
  Jaipur:    'JP',
  Jodhpur:   'JD',
  Delhi:     'DL',
  Mumbai:    'MB',
  Bangalore: 'BL',
  Bengaluru: 'BL',
  Kolkata:   'KT',
  Udaipur:   'UD',
  Ajmer:     'AJ',
}

const COUNTER_KEY = 'trikmed_clinic_counter'

function getNextCounter() {
  const stored = parseInt(typeof window !== 'undefined' ? localStorage.getItem(COUNTER_KEY) || '0' : '0', 10)
  const next = stored + 1
  if (typeof window !== 'undefined') localStorage.setItem(COUNTER_KEY, String(next))
  return next
}

export function generateClinicId(cityName) {
  const cityCode = CITY_CODES[cityName] || 'XX'
  const year = new Date().getFullYear()
  const count = getNextCounter()
  const padded = String(count).padStart(4, '0')
  return `TM-${cityCode}-${year}-${padded}`
}

export function parseCityFromId(clinicId) {
  const match = clinicId?.match(/^TM-([A-Z]+)-\d{4}-\d+$/)
  if (!match) return null
  const code = match[1]
  return Object.entries(CITY_CODES).find(([, v]) => v === code)?.[0] || null
}
