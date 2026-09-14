'use client'
// ─── Clinic role identifiers ─────────────────────────────────────────────────
export const CLINIC_ROLES = {
  OWNER:         'owner',
  DOCTOR_OWNER:  'doctor_owner',
  DOCTOR:        'doctor',
  RECEPTIONIST:  'receptionist',
  STAFF:         'staff',
}

export const ROLE_LABELS = {
  owner:        'Owner',
  doctor_owner: 'Doctor / Owner',
  doctor:       'Doctor',
  receptionist: 'Receptionist',
  staff:        'Staff',
}

// ─── Legacy nav / permission maps (kept for backward compat) ─────────────────
export const ROLE_NAV = {
  owner: [
    'dashboard','appointments','queue','patients',
    'whatsapp','prescriptions','reminders',
    'missed-calls','qr','settings','staff',
  ],
  doctor_owner: [
    'dashboard','appointments','queue','patients',
    'whatsapp','prescriptions','reminders',
    'missed-calls','qr','settings','staff',
  ],
  doctor: [
    'dashboard','appointments','queue','patients',
    'prescriptions','reminders','missed-calls','whatsapp',
  ],
  receptionist: [
    'dashboard','appointments','queue','patients',
    'missed-calls','whatsapp',
  ],
  staff: ['dashboard','appointments','queue'],
}

export const ROLE_PERMISSIONS = {
  doctor_owner: {
    canViewRevenue:        true,
    canViewAllActivity:    true,
    canManageStaff:        true,
    canAddStaff:           true,
    canRemoveStaff:        true,
    canEditSettings:       true,
    canCreatePrescription: true,
    canViewPatients:       true,
    canExportData:         true,
    canViewWhatsApp:       true,
    canViewMRManager:      true,
  },
  owner: {
    canViewRevenue:        true,
    canViewAllActivity:    true,
    canManageStaff:        true,
    canAddStaff:           true,
    canRemoveStaff:        true,
    canEditSettings:       true,
    canCreatePrescription: true,
    canViewPatients:       true,
    canExportData:         true,
    canViewWhatsApp:       true,
    canViewMRManager:      true,
  },
  doctor: {
    canViewRevenue:        true,
    canViewAllActivity:    true,
    canManageStaff:        false,
    canAddStaff:           false,
    canRemoveStaff:        false,
    canEditSettings:       false,
    canCreatePrescription: true,
    canViewPatients:       true,
    canExportData:         false,
    canViewWhatsApp:       true,
    canViewMRManager:      true,
  },
  receptionist: {
    canViewRevenue:        false,
    canViewAllActivity:    false,
    canManageStaff:        false,
    canAddStaff:           false,
    canRemoveStaff:        false,
    canEditSettings:       false,
    canCreatePrescription: false,
    canViewPatients:       true,
    canExportData:         false,
    canViewWhatsApp:       true,
    canViewMRManager:      false,
  },
  staff: {
    canViewRevenue:        false,
    canViewAllActivity:    false,
    canManageStaff:        false,
    canAddStaff:           false,
    canRemoveStaff:        false,
    canEditSettings:       false,
    canCreatePrescription: false,
    canViewPatients:       false,
    canExportData:         false,
    canViewWhatsApp:       false,
    canViewMRManager:      false,
  },
}

export const hasPermission = (user, permission) => {
  const role = user?.clinic_role || 'staff'
  return ROLE_PERMISSIONS[role]?.[permission] || false
}

export const getNavItems = (role) =>
  ROLE_NAV[role] || ROLE_NAV['staff']

// ─── New granular feature system ─────────────────────────────────────────────

export const ALL_FEATURES = [
  // Pages (sidebar visibility)
  { key: 'page_dashboard',      label: 'Dashboard',              category: 'Pages' },
  { key: 'page_appointments',   label: 'Appointments',           category: 'Pages' },
  { key: 'page_queue',          label: 'Queue Screen',           category: 'Pages' },
  { key: 'page_patients',       label: 'Patients',               category: 'Pages' },
  { key: 'page_whatsapp',       label: 'WhatsApp Chats',         category: 'Pages' },
  { key: 'page_prescriptions',  label: 'Rx History',             category: 'Pages' },
  { key: 'page_reminders',      label: 'Reminders',              category: 'Pages' },
  { key: 'page_missed_calls',   label: 'Missed Calls',           category: 'Pages' },
  { key: 'page_qr',             label: 'QR Codes',               category: 'Pages' },
  { key: 'page_settings',       label: 'Settings',               category: 'Pages' },
  { key: 'page_mr_manager',    label: 'MR Manager',             category: 'Pages' },
  { key: 'page_revenue_reports', label: 'Revenue Analytics',     category: 'Pages' },

  // Data visibility
  { key: 'view_revenue',         label: 'Revenue & payment data',  category: 'Data' },
  { key: 'view_patient_phone',   label: 'Patient phone numbers',   category: 'Data' },
  { key: 'view_patient_history', label: 'Full patient history',    category: 'Data' },
  { key: 'view_all_activity',    label: 'All staff activity log',  category: 'Data' },

  // Actions
  { key: 'action_add_appointment',     label: 'Add appointments',       category: 'Actions' },
  { key: 'action_cancel_appointment',  label: 'Cancel appointments',    category: 'Actions' },
  { key: 'action_add_walkin',          label: 'Add walk-in patients',   category: 'Actions' },
  { key: 'action_complete_visit',      label: 'Mark visit complete',    category: 'Actions' },
  { key: 'action_create_prescription', label: 'Create prescriptions',   category: 'Actions' },
  { key: 'action_send_whatsapp',       label: 'Send WhatsApp messages', category: 'Actions' },
  { key: 'action_export_data',         label: 'Export/download data',   category: 'Actions' },
]

// Default permissions per role (used when no custom override exists)
export const ROLE_DEFAULT_PERMISSIONS = {
  owner: {
    ...Object.fromEntries(ALL_FEATURES.map(f => [f.key, true])),
  },
  doctor_owner: {
    ...Object.fromEntries(ALL_FEATURES.map(f => [f.key, true])),
  },
  doctor: {
    page_dashboard: true, page_appointments: true, page_queue: true,
    page_patients: true, page_whatsapp: true, page_prescriptions: true,
    page_reminders: true, page_missed_calls: true, page_qr: false,
    page_settings: false, page_mr_manager: true, page_revenue_reports: true,
    view_revenue: true, view_patient_phone: true,
    view_patient_history: true, view_all_activity: true,
    action_add_appointment: true, action_cancel_appointment: true,
    action_add_walkin: true, action_complete_visit: true,
    action_create_prescription: true, action_send_whatsapp: true,
    action_export_data: false,
  },
  receptionist: {
    page_dashboard: true, page_appointments: true, page_queue: true,
    page_patients: true, page_whatsapp: true, page_prescriptions: false,
    page_reminders: false, page_missed_calls: true, page_qr: false,
    page_settings: false, page_mr_manager: false,
    view_revenue: false, view_patient_phone: true,
    view_patient_history: false, view_all_activity: false,
    action_add_appointment: true, action_cancel_appointment: true,
    action_add_walkin: true, action_complete_visit: false,
    action_create_prescription: false, action_send_whatsapp: true,
    action_export_data: false,
  },
  staff: {
    page_dashboard: true, page_appointments: true, page_queue: true,
    page_patients: false, page_whatsapp: false, page_prescriptions: false,
    page_reminders: false, page_missed_calls: false, page_qr: false,
    page_settings: false, page_mr_manager: false,
    view_revenue: false, view_patient_phone: false,
    view_patient_history: false, view_all_activity: false,
    action_add_appointment: false, action_cancel_appointment: false,
    action_add_walkin: true, action_complete_visit: true,
    action_create_prescription: false, action_send_whatsapp: false,
    action_export_data: false,
  },
}

// Merge role defaults with any doctor-set custom overrides
export const getEffectivePermissions = (staffMember) => {
  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[staffMember?.clinic_role] ||
                       ROLE_DEFAULT_PERMISSIONS['staff']
  return { ...roleDefaults, ...(staffMember?.custom_permissions || {}) }
}

// Check a single feature for a staff member (with custom override support)
export const canDo = (staffMember, featureKey) => {
  const perms = getEffectivePermissions(staffMember)
  return perms[featureKey] === true
}

// ─── Portal Role System ───────────────────────────────────────────────────────

export const PORTAL_ROLES = {
  SUPER_ADMIN:  'super_admin',   // Founder/CEO — sees everything
  ZONE_MANAGER: 'zone_manager',  // Sees zone performance only
  CITY_MANAGER: 'city_manager',  // Sees city performance only
  SALES_MR:     'sales_mr',      // Sees own pipeline + commission
  HR_MANAGER:   'hr_manager',    // Sees people data only
  FINANCE:      'finance',       // Sees revenue only (future)
}

export const PORTAL_PERMISSIONS = {
  super_admin: {
    see_revenue:          true,   // ONLY super_admin sees ₹
    see_company_revenue:  true,
    see_zone_revenue:     true,
    see_city_revenue:     true,
    see_mr_commission:    true,
    see_all_zones:        true,
    see_all_cities:       true,
    see_all_mrs:          true,
    see_hr_module:        true,
    see_hr_salaries:      true,
    manage_team:          true,
    add_clinic:           false,  // not their job
  },
  zone_manager: {
    see_revenue:          false,  // NO revenue
    see_company_revenue:  false,
    see_zone_revenue:     false,  // only performance %
    see_city_revenue:     false,
    see_mr_commission:    false,
    see_all_zones:        false,
    see_all_cities:       true,   // their zone cities only
    see_all_mrs:          true,   // their zone MRs only
    see_hr_module:        false,
    see_hr_salaries:      false,
    manage_team:          false,
    add_clinic:           false,
  },
  city_manager: {
    see_revenue:          false,
    see_company_revenue:  false,
    see_zone_revenue:     false,
    see_city_revenue:     false,
    see_mr_commission:    false,
    see_all_zones:        false,
    see_all_cities:       false,
    see_all_mrs:          true,   // their city MRs only
    see_hr_module:        false,
    see_hr_salaries:      false,
    manage_team:          false,
    add_clinic:           false,
  },
  sales_mr: {
    see_revenue:          false,
    see_company_revenue:  false,
    see_zone_revenue:     false,
    see_city_revenue:     false,
    see_mr_commission:    true,   // only THEIR commission
    see_all_zones:        false,
    see_all_cities:       false,
    see_all_mrs:          false,
    see_hr_module:        false,
    see_hr_salaries:      false,
    manage_team:          false,
    add_clinic:           true,   // their main job
  },
  hr_manager: {
    see_revenue:          false,
    see_company_revenue:  false,
    see_zone_revenue:     false,
    see_city_revenue:     false,
    see_mr_commission:    true,   // for payroll only
    see_all_zones:        false,
    see_all_cities:       false,
    see_all_mrs:          true,   // people management
    see_hr_module:        true,
    see_hr_salaries:      true,
    manage_team:          true,
    add_clinic:           false,
  },
}

// Maps legacy session.role → PORTAL_PERMISSIONS key
const ROLE_MAP = {
  super:     'super_admin',
  zone:      'zone_manager',
  city:      'city_manager',
  sales:     'sales_mr',
  mr:        'sales_mr',
  hr:        'hr_manager',
  installer: null,
}

export const portalCan = (user, permission) => {
  if (!user) return false
  const roleKey = user.portal_role || ROLE_MAP[user.role]
  if (!roleKey) return false
  return PORTAL_PERMISSIONS[roleKey]?.[permission] || false
}
