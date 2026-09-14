'use client'
import api from './api'

export const remindersApi = {
  // GET /reminders
  // → [{ id, type, title, timing, is_active, sent_today }]
  getAll: () => api.get('/reminders'),

  // PATCH /reminders/:id  body: { is_active: bool }
  toggle: (id, is_active) => api.patch(`/reminders/${id}`, { is_active }),
}

export default remindersApi
