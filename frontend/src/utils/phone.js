'use client'

export function phoneDigits(value = '') {
  const digits = String(value).replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits.slice(0, 10)
}

export function isValidPhone(value = '') {
  return /^[6-9]\d{9}$/.test(phoneDigits(value))
}

export function phoneInputValue(value = '') {
  return phoneDigits(value)
}

export function formatPhone(value = '') {
  const digits = phoneDigits(value)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)} ${digits.slice(5)}`
}

export function phoneError(label = 'Phone number') {
  return `${label} must be a valid 10-digit mobile number.`
}
