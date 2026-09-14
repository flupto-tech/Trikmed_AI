'use client'
import api from './api'

export const missedCallsApi = {
  // GET /missed-calls
  // → [{ id, phone, time, auto_reply_sent, resolved }]
  getAll: () => api.get('/missed-calls'),

  // PATCH /missed-calls/:id/resolve
  resolve: (id) => api.patch(`/missed-calls/${id}/resolve`, {}),
}

export default missedCallsApi
