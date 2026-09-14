'use client'
import { storage } from '../utils/storage'
/* global process */
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const getToken = () => storage.get('trikmed_token') || ''

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
})

const parseBody = async (res) => {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

const handle = async (res) => {
  const data = await parseBody(res)
  if (!res.ok) {
    throw data || { message: `Request failed with status ${res.status}` }
  }
  return data
}

const request = async (path, options = {}) => {
  try {
    return await fetch(`${BASE}${path}`, options).then(handle)
  } catch (error) {
    if (error instanceof TypeError) {
      throw { message: 'Network request failed. Please check your connection and try again.' }
    }
    throw error
  }
}

export const api = {
  get:    (path)       => request(path, { headers: headers() }),
  post:   (path, body) => request(path, { method: 'POST',   headers: headers(), body: JSON.stringify(body) }),
  patch:  (path, body) => request(path, { method: 'PATCH',  headers: headers(), body: JSON.stringify(body) }),
  put:    (path, body) => request(path, { method: 'PUT',    headers: headers(), body: JSON.stringify(body) }),
  delete: (path)       => request(path, { method: 'DELETE', headers: headers() }),
  upload: (path, formData) => {
    const token = getToken()
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {}
    return fetch(`${BASE}${path}`, { method: 'POST', headers: authHeaders, body: formData }).then(handle)
  },
}

export default api
