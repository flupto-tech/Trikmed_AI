'use client'
import api from './api'

export const patientsApi = {
  // GET /patients?search=&page=&limit=
  // → [{ id, name, phone, age, gender, last_visit, total_visits, abha_id? }]
  getAll: (params = {}) => api.get('/patients?' + new URLSearchParams(params)),

  // GET /patients/:id
  getOne: (id) => api.get(`/patients/${id}`),

  // GET /patients/:id/appointments
  getAppointments: (id) => api.get(`/patients/${id}/appointments`),

  // GET /patients/:id/prescriptions
  getPrescriptions: (id) => api.get(`/patients/${id}/prescriptions`),
}

export default patientsApi
