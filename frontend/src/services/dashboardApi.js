'use client'
import api from './api'

export const dashboardApi = {
  // GET /dashboard/stats
  // → { today_total, in_queue, completed, no_shows, revenue_today, no_show_rate,
  //     new_patients, weekly_appointments:[{day,count}], weekly_noshows:[{day,count}],
  //     ai_replies_today, reminders_sent_today, qr_bookings_today }
  getStats: () => api.get('/dashboard/stats'),

  // GET /patients
  // → [{ id, clinic_id, name, phone, age, gender, address, emergency, created_at }]
  getPatients: () => api.get('/patients'),

  // GET /appointments?date=&status=&source=&search=
  // → [{ id, token, time, patient_name, phone, reason, source, status, payment, slot_duration_mins }]
  getAppointments: (params = {}) => api.get('/appointments?' + new URLSearchParams(params)),

  // POST /appointments
  // body: { patient_name, phone, reason, source, slot_time, payment_amount }
  createAppointment: (data) => api.post('/appointments', data),

  // PATCH /appointments/:id  body: { status } | any field
  updateAppointment: (id, data) => api.patch(`/appointments/${id}`, data),

  // GET /queue/today
  // → { current: {token,name,reason}, next: {token,name}, waiting, done, booked,
  //     session_active, week_dates: [{date,day,count}] }
  getQueue: () => api.get('/queue/today'),

  // POST /queue/:appointment_id/complete
  completeVisit: (id) => api.post(`/queue/${id}/complete`, {}),

  // POST /queue/walkin  body: { patient_name, phone, reason, payment_amount }
  addWalkin: (data) => api.post('/queue/walkin', data),

  // POST /queue/session/start | /queue/session/end
  startSession: () => api.post('/queue/session/start', {}),
  endSession:   () => api.post('/queue/session/end',   {}),

  // GET /analytics/revenue-reports
  getRevenueReports: () => api.get('/analytics/revenue-reports'),
}

export default dashboardApi
