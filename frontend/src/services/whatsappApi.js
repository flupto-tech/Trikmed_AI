'use client'
import api from './api'

export const whatsappApi = {
  // GET /whatsapp/conversations
  // → [{ phone, name, last_message, time, unread, ai_handled }]
  getConversations: () => api.get('/whatsapp/conversations'),

  // GET /whatsapp/conversations/:phone
  // → [{ role: 'ai'|'user', message, time }]
  getMessages: (phone) => api.get(`/whatsapp/conversations/${encodeURIComponent(phone)}`),

  // GET /whatsapp/stats
  // → { replies_today, reminders_sent, qr_bookings }
  getStats: () => api.get('/whatsapp/stats'),
}

export default whatsappApi
