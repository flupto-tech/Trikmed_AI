'use client'
import api from './api'

export const prescriptionsApi = {
  // GET /prescriptions?patient_id=&date=
  getAll: (params = {}) => api.get('/prescriptions?' + new URLSearchParams(params)),

  // POST /prescriptions
  // body: { patient_id, appointment_id, medicines: [{name, dose, frequency, days}],
  //         diagnosis, notes, send_whatsapp: bool }
  create: (data) => api.post('/prescriptions', data),

  // POST /prescriptions/:id/send-whatsapp
  sendWhatsapp: (id) => api.post(`/prescriptions/${id}/send-whatsapp`, {}),
}

export default prescriptionsApi
