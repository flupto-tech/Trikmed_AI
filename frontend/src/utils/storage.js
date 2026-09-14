'use client'
const isBrowser = typeof window !== 'undefined'

export const storage = {
  get: (key) => {
    if (!isBrowser) return null
    try { return localStorage.getItem(key) } catch { return null }
  },
  set: (key, value) => {
    if (!isBrowser) return
    try { localStorage.setItem(key, String(value)) } catch {}
  },
  remove: (key) => {
    if (!isBrowser) return
    try { localStorage.removeItem(key) } catch {}
  },
  getJson: (key) => {
    const val = storage.get(key)
    if (!val) return null
    try { return JSON.parse(val) } catch { return null }
  },
  setJson: (key, value) => {
    storage.set(key, JSON.stringify(value))
  },
}

export default storage
