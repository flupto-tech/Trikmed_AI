'use client'
import api from './api'

export const portalApi = {
  // ── OVERVIEW ──────────────────────────────────────────────────────────────────
  // GET /portal/overview
  // → { total_clinics, active, revenue, patients, by_zone: [], recent_onboardings: [] }
  getOverview: () => api.get('/portal/overview'),

  // ── CLINICS ───────────────────────────────────────────────────────────────────
  // GET /portal/clinics?zone=&status=&search=
  getClinics: (params = {}) => api.get('/portal/clinics?' + new URLSearchParams(params)),

  // GET /portal/clinics/:id
  getClinic: (id) => api.get(`/portal/clinics/${id}`),

  // POST /portal/clinics
  addClinic: (data) => api.post('/portal/clinics', data),

  // ── ONBOARDING ────────────────────────────────────────────────────────────────
  // GET /portal/onboardings?status=
  getOnboardings: (params = {}) => api.get('/portal/onboardings?' + new URLSearchParams(params)),

  // PATCH /portal/onboardings/:id  body: { status, notes }
  updateOnboarding: (id, data) => api.patch(`/portal/onboardings/${id}`, data),

  // ── TEAM ──────────────────────────────────────────────────────────────────────
  // GET /portal/team → [{ id, name, role, zone, phone, clinics_count }]
  getTeam: () => api.get('/portal/team'),

  // POST /portal/team  body: { name, role, phone, email, zone }
  addMember: (data) => api.post('/portal/team', data),

  // PATCH /portal/team/:id
  updateMember: (id, data) => api.patch(`/portal/team/${id}`, data),

  // ── MRS ───────────────────────────────────────────────────────────────────────
  // GET /portal/mrs → [{ id, name, phone, zone, clinics_count }]
  getMRs: () => api.get('/portal/mrs'),

  // ── CITIES ────────────────────────────────────────────────────────────────────
  // GET /portal/cities
  getCities: () => api.get('/portal/cities'),

  // ── COMMISSION ────────────────────────────────────────────────────────────────
  // GET /portal/commission?mr_id=&month=
  getCommission: (params = {}) => api.get('/portal/commission?' + new URLSearchParams(params)),

  // ── ROLE-SPECIFIC DASHBOARD ───────────────────────────────────────────────────
  // GET /portal/dashboard  (role detected from JWT token)
  // SuperAdmin    → all zones summary
  // ZoneManager   → their zone clinics
  // SalesPerson   → their assigned clinics
  // MR            → their MR dashboard
  // CityManager   → their city data
  // Installer     → their installations queue
  getRoleDashboard: () => api.get('/portal/dashboard'),

  // ── MR / SALES PERSON APIs ────────────────────────────────────────────────────
  // GET /portal/mr/dashboard
  // returns: { name, zone, city, monthly_target, monthly_achieved,
  //   today_pitched, today_followups, deals_this_month, active_pipeline_count,
  //   weekly_chart: [{ day, pitched, closed }],
  //   schedule_today: [{ id, time, clinic, doctor, purpose }],
  //   pending_followups: [{ id, clinic, doctor, due, urgency }],
  //   commission: { this_month, pending, total, history: [] },
  //   pipeline: PipelineClinic[] }
  getMRDashboard: () => api.get('/portal/mr/dashboard'),

  // GET /portal/mr/pipeline
  // returns: PipelineClinic[]
  // PipelineClinic: { id, clinic, doctor, city, status, last_contact, phone }
  getPipeline: () => api.get('/portal/mr/pipeline'),

  // POST /portal/mr/pipeline
  // body: { clinic, doctor, phone, city, specialization, status, notes }
  // returns: PipelineClinic (with id assigned)
  addToPipeline: (data) => api.post('/portal/mr/pipeline', data),

  // PATCH /portal/mr/pipeline/:id
  // body: { status }   — update pipeline stage
  // returns: PipelineClinic
  updatePipelineStatus: (id, status) => api.patch(`/portal/mr/pipeline/${id}`, { status }),

  // POST /portal/mr/pipeline/:id/notes
  // body: { note }
  // returns: { success }
  addPipelineNote: (id, note) => api.post(`/portal/mr/pipeline/${id}/notes`, { note }),

  // POST /portal/mr/schedule/:id/visited
  // Mark a scheduled visit as visited
  // returns: { success }
  markVisited: (id) => api.post(`/portal/mr/schedule/${id}/visited`),

  // ── DRILL-DOWN HIERARCHY APIs ─────────────────────────────────────────────────
  // GET /portal/hierarchy
  // returns: { zones: [ { id, name, manager, cities_count, clinics_active,
  //   clinics_total, revenue_mtd, target_mtd, growth, cities: [...] } ] }
  // TODO: Ashutosh — wire to DB; replace PORTAL_HIERARCHY mock in portalData.js
  getHierarchy: () => api.get('/portal/hierarchy'),

  // GET /portal/hierarchy/zones
  // returns: Zone[] (same shape as hierarchy.zones but without nested cities/mrs)
  getZones: () => api.get('/portal/hierarchy/zones'),

  // GET /portal/hierarchy/zones/:zoneId/cities
  // returns: City[] — cities within the zone, each with { id, name, zone_id,
  //   city_manager, clinics_active, clinics_total, revenue_mtd, target_mtd, mrs: [] }
  getZoneCities: (zoneId) => api.get(`/portal/hierarchy/zones/${zoneId}/cities`),

  // GET /portal/hierarchy/cities/:cityId/mrs
  // returns: MRSummary[] — MRs in a city
  // MRSummary: { id, name, phone, city, zone, clinics_pitched, clinics_active,
  //   clinics_ready, deals_this_month, target_this_month, revenue_generated,
  //   commission_earned, last_activity, joining_date, performance_score }
  getCityMRs: (cityId) => api.get(`/portal/hierarchy/cities/${cityId}/mrs`),

  // GET /portal/hierarchy/mrs/:mrId/performance
  // returns: MRSummary (same shape) + pipeline: PipelineClinic[]
  getMRPerformance: (mrId) => api.get(`/portal/hierarchy/mrs/${mrId}/performance`),

  // ── HR MODULE APIs ────────────────────────────────────────────────────────────
  // GET /portal/hr/team
  // returns: Employee[] — all portal employees (role-gated by JWT)
  getTeamDirectory: () => api.get('/portal/hr/team'),

  // POST /portal/hr/team
  // body: { name, phone, email, role, zone?, city?, joining_date, base_salary? }
  // returns: Employee (with id)
  addEmployee: (data) => api.post('/portal/hr/team', data),

  // PATCH /portal/hr/team/:id
  // body: any Employee fields to update
  updateEmployee: (id, data) => api.patch(`/portal/hr/team/${id}`, data),

  // PATCH /portal/hr/team/:id/deactivate
  // Soft-delete / deactivate employee (revokes portal access)
  deactivateEmployee: (id) => api.patch(`/portal/hr/team/${id}/deactivate`, {}),

  // GET /portal/hr/attendance?date=YYYY-MM-DD&employee_id=
  // returns: AttendanceEntry[]
  // AttendanceEntry: { employee, role, date, first_activity, last_activity, clinics_visited, deals_updated, status }
  getAttendance: (params = {}) => api.get('/portal/hr/attendance?' + new URLSearchParams(params)),

  // GET /portal/hr/payroll?month=YYYY-MM
  // returns: PayrollEntry[] (super_admin + hr_manager JWT only — backend enforced)
  // PayrollEntry: { id, employee, role, base, commission, total, status: 'paid'|'pending' }
  getPayroll: (month) => api.get(`/portal/hr/payroll?month=${month}`),

  // PATCH /portal/hr/payroll/:id/paid
  // Mark a payroll entry as paid
  markPayrollPaid: (id) => api.patch(`/portal/hr/payroll/${id}/paid`, {}),

  // GET /portal/hr/performance?month=YYYY-MM
  // returns: PerformanceEntry[]
  // PerformanceEntry: { employee, role, this_month, last_month, deal_target, deals_done, trend }
  getPerformanceReview: (month) => api.get(`/portal/hr/performance?month=${month}`),

  // ── REVENUE — super_admin JWT only ───────────────────────────────────────────
  // Backend MUST verify JWT role === 'super_admin' before returning data
  // If role !== 'super_admin' → return 403 Forbidden
  // GET /portal/revenue?month=&year=
  getCompanyRevenue: (params = {}) => api.get('/portal/revenue?' + new URLSearchParams(params)),

  // ── ZONE / CITY PERFORMANCE (no revenue, all manager roles) ──────────────────
  // GET /portal/zones/:id/performance
  // returns: { achievement_pct, deals_this_month, deals_last_month, active_clinics, total_clinics, growth_pct }
  getZonePerformance: (zoneId) => api.get(`/portal/zones/${zoneId}/performance`),

  // GET /portal/cities/:id/performance
  // returns: same shape scoped to city
  getCityPerformance: (cityId) => api.get(`/portal/cities/${cityId}/performance`),

  // ── DEMO REQUESTS ────────────────────────────────────────────────────────────
  // GET /portal/demo-requests → [{ id, clinic, doctor, specialty, phone, city, status, created_at }]
  getDemoRequests: () => api.get('/portal/demo-requests'),
}

export default portalApi
