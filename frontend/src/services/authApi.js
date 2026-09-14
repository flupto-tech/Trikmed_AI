'use client'
import api from './api'

export const authApi = {
  // POST /auth/login → { token: string, user: { id, name, role, clinic_id?, zone? } }
  clinicLogin:    (email, password)     => api.post('/auth/login',          { email, password, role: 'clinic' }),
  adminLogin:     (email, password)     => api.post('/auth/login',          { email, password, role: 'admin' }),

  // test
  // test: (email, password) => api.post('/test', { email, password }),

  // POST /auth/logout
  logout:         ()                    => api.post('/auth/logout',          {}),

  // GET /auth/me → { id, name, role, clinic_id?, zone? }
  getMe:          ()                    => api.get('/auth/me'),

  // POST /auth/forgot-password
  forgotPassword: (email)               => api.post('/auth/forgot-password', { email }),

  // POST /auth/reset-password
  resetPassword:  (token, new_password) => api.post('/auth/reset-password',  { token, new_password }),

  // POST /auth/signup
  signup:         (data)                => api.post('/auth/signup',           data),
}

export default authApi
