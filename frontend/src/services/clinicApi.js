'use client'
import api from './api'

export const clinicApi = {
  // POST /clinics  (full onboarding payload — see FULL PAYLOAD below)
  create: (data) => api.post('/clinics', data),

  // GET /clinics/:id
  getOne: (id) => api.get(`/clinics/${id}`),

  // PATCH /clinics/:id
  update: (id, data) => api.patch(`/clinics/${id}`, data),

  // GET /clinics/:id/qr → { qr_image_url, wa_link }
  getQR: (id) => api.get(`/clinics/${id}/qr`),

  // GET /clinics/:id/reviews
  getReviews: (id) => api.get(`/clinics/${id}/reviews`),

  // GET /clinic/settings  (current clinic from JWT token)
  getSettings: () => api.get('/clinic/settings'),

  // PATCH /clinic/settings
  updateSettings: (data) => api.patch('/clinic/settings', data),
}

// FULL PAYLOAD for POST /clinics:
// clinic_name, contact_phone, address_line1, address_line2,
// city, district, state, pincode, zone, clinic_email, clinic_type,
// doctor_name, doctor_phone, doctor_email, specialization,
// qualification, mci_registration_no, experience_years, gender,
// morning_start, morning_end, evening_start, evening_end,
// slot_duration_mins, consultation_fee, languages, bio,
// whatsapp_number, whatsapp_display_name, assigned_mr_id,
// trial_start_date, onboarding_notes, plan_type, status

export default clinicApi
