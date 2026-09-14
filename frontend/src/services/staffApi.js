'use client'
import { api } from './api'

export const staffApi = {
  // GET /staff
  // Returns: [{ id, name, phone, email, clinic_role, is_active, last_login,
  //             created_at, custom_permissions: { page_dashboard: bool, ... } }]
  getAll: () => api.get('/staff'),

  // POST /staff
  // body: { name, phone, email, clinic_role, pin? }
  // returns: { id, name, clinic_role, login_id, temp_password }
  invite: (data) => api.post('/staff', data),

  // PATCH /staff/:id  body: { clinic_role?, is_active? }
  update: (id, data) => api.patch(`/staff/${id}`, data),

  // DELETE /staff/:id
  remove: (id) => api.delete(`/staff/${id}`),

  // PATCH /staff/:id/permissions
  // body: { custom_permissions: { page_dashboard: bool, view_revenue: bool, ... } }
  // Ashutosh: save this JSON blob in staff table column "custom_permissions" (JSONB)
  // On login, include custom_permissions in JWT/user response
  // Frontend merges: role_defaults + custom_permissions (custom overrides role defaults)
  // Empty {} means use role defaults entirely
  updatePermissions: (id, custom_permissions) =>
    api.patch(`/staff/${id}/permissions`, { custom_permissions }),

  // GET /staff/activity?staff_id=&date=
  // → [{ staff_id, staff_name, staff_role, action, time }]
  getActivity: (params = {}) =>
    api.get('/staff/activity?' + new URLSearchParams(params).toString()),

  // POST /auth/staff-login
  // body: { clinic_id, phone, pin }
  // returns: { token, user: { id, name, clinic_role, clinic_id, custom_permissions } }
  login: (data) => api.post('/auth/staff-login', data),
}

// STAFF PAYLOAD Ashutosh must accept:
// { name, phone, email, clinic_role: owner|doctor|receptionist|staff,
//   pin: 4-digit (optional), is_active: bool }
// RESPONSE must include: clinic_role + custom_permissions in user object on login
// JWT token payload must include: { id, name, clinic_role, clinic_id, custom_permissions }
