'use client'
/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import {
  Activity,
  AlertCircle,
  Check,
  ChevronDown,
  Lock,
  Plus,
  Search,
  Shield,
  Unlock,
  Users,
  X,
} from 'lucide-react'
import Badge from '../../components/ui/Badge'
import { Button, FilterChip, FilterChipGroup, IconButton } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import StatCard from '../../components/ui/StatCard'
import Table from '../../components/ui/Table'
import { trapFocus, getFocusableElements } from '../../components/ui/focusUtils'
import { ROLE_LABELS, ROLE_PERMISSIONS, ALL_FEATURES, ROLE_DEFAULT_PERMISSIONS, getEffectivePermissions } from '../../config/roles'
import { staffApi } from '../../services/staffApi'
import { getClinicRole } from '../../utils/auth'
import { formatPhone, isValidPhone, phoneError, phoneInputValue } from '../../utils/phone'
import { storage } from '../../utils/storage'

const ROLE_BADGE = {
  owner: { variant: 'navy', avatarBg: 'var(--color-navy)', avatarText: 'var(--color-text-inverse)' },
  doctor_owner: { variant: 'navy', avatarBg: 'var(--color-navy)', avatarText: 'var(--color-text-inverse)' },
  doctor: { variant: 'blue', avatarBg: 'var(--color-info-bg)', avatarText: 'var(--color-info-text)' },
  receptionist: { variant: 'purple', avatarBg: 'var(--color-surface-subtle)', avatarText: 'var(--color-text-secondary)' },
  staff: { variant: 'default', avatarBg: 'var(--color-surface-subtle)', avatarText: 'var(--color-text-secondary)' },
}

const MOCK_STAFF = [
  {
    id: '1',
    name: 'Dr. Rajesh Sharma',
    phone: '+91 98765 43210',
    email: 'rajesh@sharma.com',
    clinic_role: 'doctor',
    is_active: true,
    last_login: 'Today 9:05 AM',
    custom_permissions: {},
  },
  {
    id: '2',
    name: 'Sunita Devi',
    phone: '+91 87654 32109',
    email: 'sunita@clinic.com',
    clinic_role: 'receptionist',
    is_active: true,
    last_login: 'Today 8:45 AM',
    custom_permissions: {
      view_revenue: false,
      action_cancel_appointment: false,
    },
  },
  {
    id: '3',
    name: 'Raju Helper',
    phone: '+91 76543 21098',
    email: '',
    clinic_role: 'staff',
    is_active: true,
    last_login: 'Yesterday',
    custom_permissions: {
      page_patients: true,
    },
  },
]

const MOCK_ACTIVITY = [
  { id: '1', staff_name: 'Dr. Rajesh', staff_role: 'doctor', action: 'Created prescription for Amit Sharma', time: '10:32 AM' },
  { id: '2', staff_name: 'Sunita', staff_role: 'receptionist', action: 'Booked appointment for Priya Gupta', time: '10:15 AM' },
  { id: '3', staff_name: 'Sunita', staff_role: 'receptionist', action: 'Added walk-in: Suresh Verma', time: '9:48 AM' },
  { id: '4', staff_name: 'Dr. Rajesh', staff_role: 'doctor', action: 'Marked T-05 visit complete', time: '9:30 AM' },
  { id: '5', staff_name: 'Raju', staff_role: 'staff', action: 'Updated patient record for Meena Patel', time: '9:10 AM' },
  { id: '6', staff_name: 'Sunita', staff_role: 'receptionist', action: 'Sent reminder to 8 patients for tomorrow', time: '8:55 AM' },
]

const ROLE_OPTIONS = [
  { key: 'doctor', label: 'Doctor' },
  { key: 'receptionist', label: 'Receptionist' },
  { key: 'staff', label: 'Staff' },
]

const PERMISSION_REFERENCE = [
  ['View Revenue', 'canViewRevenue'],
  ['View WhatsApp', 'canViewWhatsApp'],
  ['MR Manager', 'canViewMRManager'],
  ['View Patients', 'canViewPatients'],
  ['Rx History', 'canCreatePrescription'],
  ['Manage Staff', 'canManageStaff'],
  ['Edit Settings', 'canEditSettings'],
  ['Export Data', 'canExportData'],
]

function roleMeta(role) {
  return ROLE_BADGE[role] || ROLE_BADGE.staff
}

function roleLabel(role) {
  return ROLE_LABELS[role] || role || 'Staff'
}

function initialsFor(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ST'
}

function normalise(value) {
  return String(value || '').toLowerCase()
}

function permissionCount(member) {
  const effective = getEffectivePermissions(member)
  const enabled = ALL_FEATURES.filter(feature => effective[feature.key]).length
  return { enabled, total: ALL_FEATURES.length }
}

function Avatar({ name, size = 40, role }) {
  const meta = roleMeta(role)
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'grid',
        placeItems: 'center',
        width: size,
        height: size,
        flex: '0 0 auto',
        borderRadius: 'var(--radius-md)',
        background: meta.avatarBg,
        color: meta.avatarText,
        fontFamily: 'var(--font-body)',
        fontSize: Math.max(11, Math.round(size * 0.32)),
        fontWeight: 800,
      }}
    >
      {initialsFor(name)}
    </span>
  )
}

function RoleBadge({ role }) {
  const meta = roleMeta(role)
  return <Badge variant={meta.variant}>{roleLabel(role)}</Badge>
}

function StatusBadge({ active }) {
  return (
    <Badge variant={active ? 'green' : 'default'} type="dot">
      {active ? 'Active' : 'Inactive'}
    </Badge>
  )
}

function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: on ? 'flex-end' : 'flex-start',
        width: '44px',
        height: '24px',
        padding: '2px',
        border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
        borderRadius: 'var(--radius-full)',
        background: on ? 'var(--color-navy)' : 'var(--color-surface-subtle)',
        cursor: 'pointer',
        transition: 'background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '18px',
          height: '18px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-xs)',
        }}
      />
    </button>
  )
}

function SearchField({ value, onChange, placeholder, label }) {
  return (
    <label className="staff-search-field">
      <span className="sr-only">{label}</span>
      <Search size={16} strokeWidth={1.8} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
      />
    </label>
  )
}

function useDialogFocus(onClose) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const previousActiveElement = document.activeElement

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
      trapFocus(event, dialogRef.current)
    }

    document.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => {
      getFocusableElements(dialogRef.current)[0]?.focus()
    })

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousActiveElement && document.contains(previousActiveElement)) {
        previousActiveElement.focus?.()
      }
    }
  }, [onClose])

  return dialogRef
}

function ManageAccessDrawer({ staff, onClose, onSave }) {
  const drawerRef = useDialogFocus(onClose)
  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[staff.clinic_role] || ROLE_DEFAULT_PERMISSIONS.staff
  const [perms, setPerms] = useState(() => getEffectivePermissions(staff))
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')

  const grouped = useMemo(() => {
    const groups = {}
    ALL_FEATURES.forEach(feature => {
      if (!groups[feature.category]) groups[feature.category] = []
      groups[feature.category].push(feature)
    })
    return groups
  }, [])

  const togglePerm = key => setPerms(prev => ({ ...prev, [key]: !prev[key] }))

  const getHint = key => {
    const isDefault = perms[key] === roleDefaults[key]
    if (isDefault) return { text: `Default for ${roleLabel(staff.clinic_role)}`, variant: 'default' }
    if (perms[key] === true) return { text: 'Enabled override', variant: 'green' }
    return { text: 'Restricted override', variant: 'red' }
  }

  const handleReset = () => setPerms({ ...roleDefaults })

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const changedPerms = {}
    Object.entries(perms).forEach(([key, value]) => {
      if (value !== roleDefaults[key]) changedPerms[key] = value
    })

    try {
      await staffApi.updatePermissions(staff.id, changedPerms)
      storage.setJson(`trikmed_perms_${staff.id}`, changedPerms)

      setToast(`Access updated for ${staff.name.split(' ').find(word => !word.startsWith('Dr.')) || staff.name.split(' ')[0]}`)
      setTimeout(() => {
        setToast('')
        onSave(staff.id, changedPerms)
        onClose()
      }, 1100)
    } catch (e) {
      console.error('Failed to update staff permissions:', e)
      setError(e?.detail || e?.message || 'Could not update permissions. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          background: 'color-mix(in srgb, var(--color-navy) 42%, transparent)',
          backdropFilter: 'blur(3px)',
        }}
      />
      <Motion.aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-access-title"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        onClick={event => event.stopPropagation()}
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          width: 'min(460px, 96vw)',
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <header
          style={{
            display: 'grid',
            gap: 'var(--space-4)',
            padding: 'var(--space-6)',
            borderBottom: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Manage Access
              </span>
              <h2 id="manage-access-title" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h3)', fontWeight: 700 }}>
                Staff permissions
              </h2>
            </div>
            <IconButton icon={X} ariaLabel="Close access drawer" onClick={onClose} variant="subtle" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Avatar name={staff.name} size={44} role={staff.clinic_role} />
            <div style={{ display: 'grid', gap: 'var(--space-1)', minWidth: 0 }}>
              <strong style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-body)' }}>{staff.name}</strong>
              <RoleBadge role={staff.clinic_role} />
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)' }}>
          {error ? (
            <div role="alert" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-3) var(--space-4)', border: 'calc(var(--space-0-5) / 2) solid var(--color-error-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-error-bg)', color: 'var(--color-error-text)', fontSize: 'var(--text-sm)', fontWeight: 650 }}>
              {error}
            </div>
          ) : null}
          {['Pages', 'Data', 'Actions'].map(category => (
            <section key={category} style={{ display: 'grid', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
              <h3 style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {category}
              </h3>
              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                {(grouped[category] || []).map(feature => {
                  const hint = getHint(feature.key)
                  return (
                    <div
                      key={feature.key}
                      style={{
                        display: 'grid',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-4)',
                        border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--color-surface)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                        <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 650 }}>{feature.label}</span>
                        <Toggle on={perms[feature.key]} onChange={() => togglePerm(feature.key)} label={`Toggle ${feature.label}`} />
                      </div>
                      <Badge variant={hint.variant} size="sm" type="outline">{hint.text}</Badge>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        <footer
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            padding: 'var(--space-5) var(--space-6)',
            borderTop: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
          }}
        >
          <Button variant="secondary" fullWidth onClick={handleReset}>Reset to Defaults</Button>
          <Button fullWidth isLoading={saving} onClick={handleSave}>Save Changes</Button>
        </footer>

        <AnimatePresence>
          {toast ? (
            <Motion.div
              role="status"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              style={{
                position: 'absolute',
                right: 'var(--space-6)',
                bottom: '88px',
                left: 'var(--space-6)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-navy)',
                color: 'var(--color-text-inverse)',
                boxShadow: 'var(--shadow-lg)',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
              }}
            >
              {toast}
            </Motion.div>
          ) : null}
        </AnimatePresence>
      </Motion.aside>
    </>
  )
}

function AddStaffModal({ onClose, onAdded }) {
  const dialogRef = useDialogFocus(onClose)
  const [form, setForm] = useState({ name: '', phone: '', email: '', clinic_role: 'doctor', pin: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [err, setErr] = useState('')

  const updateField = field => event => setForm(current => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async event => {
    event.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) { setErr('Name and phone are required.'); return }
    if (!isValidPhone(form.phone)) { setErr(phoneError()); return }
    setErr('')
    setSubmitting(true)
    try {
      const res = await staffApi.invite({ ...form, phone: phoneInputValue(form.phone) })
      setSuccess({ login_id: res.login_id, temp_password: res.temp_password })
      onAdded(res)
    } catch (e) {
      console.error('Failed to add staff:', e)
      setErr(e?.message || 'Failed to add staff.')
    } finally {
      setSubmitting(false)
    }
  }

  const fieldStyle = {
    width: '100%',
    minHeight: '42px',
    padding: '0 var(--space-3)',
    border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    font: '500 var(--text-sm) / 1 var(--font-body)',
    outline: 'none',
  }

  const labelStyle = {
    display: 'block',
    marginBottom: 'var(--space-2)',
    color: 'var(--color-text-muted)',
    fontSize: 'var(--text-xs)',
    fontWeight: 800,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  }

  return (
    <div
      role="presentation"
      className="staff-modal-backdrop"
      onClick={onClose}
    >
      <Motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-staff-title"
        aria-describedby="add-staff-description"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onClick={event => event.stopPropagation()}
        style={{
          width: 'min(460px, 100%)',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-xl)',
          padding: 'var(--space-8)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <h2 id="add-staff-title" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h3)', fontWeight: 700 }}>
              Add Staff Member
            </h2>
            <p id="add-staff-description" style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              They will receive login credentials to share.
            </p>
          </div>
          <IconButton icon={X} ariaLabel="Close add staff modal" onClick={onClose} variant="subtle" />
        </div>

        {success ? (
          <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
            <div
              role="status"
              style={{
                display: 'grid',
                gap: 'var(--space-3)',
                padding: 'var(--space-5)',
                border: 'calc(var(--space-0-5) / 2) solid var(--color-success-border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-success-bg)',
              }}
            >
              <Badge variant="green" size="lg"><Check size={13} strokeWidth={1.8} aria-hidden="true" /> Staff added successfully</Badge>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                Share these credentials with the staff member.
              </p>
              <div style={{ display: 'grid', gap: 'var(--space-2)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Login ID: <strong style={{ color: 'var(--color-text-primary)' }}>{success.login_id}</strong></span>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Temp Password: <strong style={{ color: 'var(--color-text-primary)' }}>{success.temp_password}</strong></span>
              </div>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                Staff can log in via the Staff Login tab and should change their PIN after first login.
              </p>
            </div>
            <Button fullWidth onClick={onClose}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {err ? (
              <div role="alert" style={{ padding: 'var(--space-3) var(--space-4)', border: 'calc(var(--space-0-5) / 2) solid var(--color-error-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-error-bg)', color: 'var(--color-error-text)', fontSize: 'var(--text-sm)', fontWeight: 650 }}>
                {err}
              </div>
            ) : null}
            <div>
              <label htmlFor="staff-name" style={labelStyle}>Full Name *</label>
              <input id="staff-name" value={form.name} onChange={updateField('name')} placeholder="Dr. Sunita Joshi" style={fieldStyle} aria-invalid={err && !form.name.trim() ? 'true' : undefined} />
            </div>
            <div>
              <label htmlFor="staff-phone" style={labelStyle}>Phone *</label>
              <input
                id="staff-phone"
                type="tel"
                inputMode="numeric"
                value={formatPhone(form.phone)}
                onChange={event => setForm(current => ({ ...current, phone: phoneInputValue(event.target.value) }))}
                placeholder="98765 43210"
                style={fieldStyle}
                aria-invalid={err && !isValidPhone(form.phone) ? 'true' : undefined}
              />
            </div>
            <div>
              <label htmlFor="staff-email" style={labelStyle}>Email (optional)</label>
              <input id="staff-email" type="email" value={form.email} onChange={updateField('email')} placeholder="name@clinic.com" style={fieldStyle} />
            </div>
            <div>
              <label htmlFor="staff-role" style={labelStyle}>Role *</label>
              <select id="staff-role" value={form.clinic_role} onChange={updateField('clinic_role')} style={{ ...fieldStyle, cursor: 'pointer' }}>
                <option value="doctor">Doctor</option>
                <option value="receptionist">Receptionist</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div>
              <label htmlFor="staff-pin" style={labelStyle}>PIN (optional, 4-digit quick login)</label>
              <input id="staff-pin" type="text" inputMode="numeric" value={form.pin} onChange={updateField('pin')} placeholder="e.g. 1234" maxLength={4} style={fieldStyle} />
            </div>
            <Button type="submit" isLoading={submitting} fullWidth>Add Staff Member</Button>
          </form>
        )}
      </Motion.div>
    </div>
  )
}

function RemoveConfirmDialog({ staff, onConfirm, onCancel }) {
  const dialogRef = useDialogFocus(onCancel)
  return (
    <div role="presentation" className="staff-modal-backdrop" onClick={onCancel}>
      <Motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-staff-title"
        aria-describedby="remove-staff-description"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onClick={event => event.stopPropagation()}
        style={{
          width: 'min(380px, 100%)',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-xl)',
          padding: 'var(--space-7)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--color-error-bg)', color: 'var(--color-error-text)', flex: '0 0 auto' }}>
            <AlertCircle size={18} strokeWidth={1.8} />
          </span>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <h2 id="remove-staff-title" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h4)', fontWeight: 700 }}>
              Remove Staff Member?
            </h2>
            <p id="remove-staff-description" style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
              Remove <strong>{staff.name}</strong> from clinic? They will lose dashboard access immediately.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button variant="secondary" fullWidth onClick={onCancel}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={onConfirm}>Yes, Remove</Button>
        </div>
      </Motion.div>
    </div>
  )
}

function StaffTableRow({ member, canManage, onRoleChange, onToggleActive, onRemove, onManageAccess }) {
  const [roleOpen, setRoleOpen] = useState(false)
  const customCount = Object.keys(member.custom_permissions || {}).length
  const permissions = permissionCount(member)

  return (
    <Table.Row>
      <Table.Cell mobileLabel="Name">
        <div className="staff-person-cell">
          <Avatar name={member.name} size={42} role={member.clinic_role} />
          <div style={{ display: 'grid', gap: 'var(--space-1)', minWidth: 0 }}>
            <strong style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-body)' }}>{member.name}</strong>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>{member.email || 'No email added'}</span>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>{member.phone}</span>
          </div>
        </div>
      </Table.Cell>
      <Table.Cell mobileLabel="Role">
        <RoleBadge role={member.clinic_role} />
      </Table.Cell>
      <Table.Cell mobileLabel="Permissions">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
          <Badge variant="blue" type="outline">{permissions.enabled}/{permissions.total} enabled</Badge>
          {customCount ? (
            <Badge variant="purple" type="dot">
              <Lock size={11} strokeWidth={1.8} aria-hidden="true" />
              {customCount} override{customCount === 1 ? '' : 's'}
            </Badge>
          ) : (
            <Badge variant="default">Role defaults</Badge>
          )}
        </div>
      </Table.Cell>
      <Table.Cell mobileLabel="Status">
        <StatusBadge active={member.is_active} />
        <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
          Last login: {member.last_login || 'Never'}
        </div>
      </Table.Cell>
      <Table.Cell mobileLabel="Actions">
        {canManage && member.clinic_role !== 'owner' ? (
          <div className="staff-actions-cell">
            <Button variant="secondary" size="sm" leftIcon={Unlock} onClick={() => onManageAccess(member)}>Access</Button>
            <div style={{ position: 'relative' }}>
              <Button
                variant="secondary"
                size="sm"
                rightIcon={ChevronDown}
                aria-haspopup="menu"
                aria-expanded={roleOpen}
                onClick={() => setRoleOpen(open => !open)}
              >
                Role
              </Button>
              <AnimatePresence>
                {roleOpen ? (
                  <Motion.div
                    role="menu"
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.1 }}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + var(--space-2))',
                      zIndex: 20,
                      minWidth: '164px',
                      overflow: 'hidden',
                      border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-surface)',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  >
                    {ROLE_OPTIONS.map(option => (
                      <button
                        key={option.key}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onRoleChange(member.id, option.key)
                          setRoleOpen(false)
                        }}
                        className="staff-role-menu-item"
                      >
                        {member.clinic_role === option.key ? <Check size={13} strokeWidth={1.8} aria-hidden="true" /> : <span aria-hidden="true" style={{ width: '13px' }} />}
                        {option.label}
                      </button>
                    ))}
                  </Motion.div>
                ) : null}
              </AnimatePresence>
            </div>
            <Button variant="secondary" size="sm" onClick={() => onToggleActive(member.id)}>
              {member.is_active ? 'Deactivate' : 'Activate'}
            </Button>
            <Button variant="danger" size="sm" onClick={() => onRemove(member)}>Remove</Button>
          </div>
        ) : (
          <Badge variant="default">View only</Badge>
        )}
      </Table.Cell>
    </Table.Row>
  )
}

export default function StaffManagement() {
  const clinicRole = getClinicRole()
  const canManage = clinicRole === 'owner' || clinicRole === 'doctor_owner'

  const [tab, setTab] = useState('members')
  const [staffList, setStaffList] = useState(MOCK_STAFF)
  const [activity, setActivity] = useState(MOCK_ACTIVITY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [accessTarget, setAccessTarget] = useState(null)
  const [actionError, setActionError] = useState('')
  const [activityFilter, setActivityFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadStaffData = useCallback(async () => {
    setLoading(true)
    try {
      const [members, activityLog] = await Promise.all([
        staffApi.getAll(),
        staffApi.getActivity().catch(() => []),
      ])
      setStaffList(members)
      setActivity(activityLog)
      setError(null)
    } catch (e) {
      console.error('Failed to load staff:', e)
      setError(e?.detail || e?.message || 'Failed to load staff')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStaffData()
  }, [loadStaffData])

  const summary = useMemo(() => {
    const active = staffList.filter(member => member.is_active).length
    const custom = staffList.filter(member => Object.keys(member.custom_permissions || {}).length > 0).length
    const managerRoles = staffList.filter(member => ['owner', 'doctor_owner', 'doctor'].includes(member.clinic_role)).length
    return { total: staffList.length, active, inactive: staffList.length - active, custom, managerRoles }
  }, [staffList])

  const roleOptions = useMemo(() => {
    const roles = Array.from(new Set(staffList.map(member => member.clinic_role).filter(Boolean)))
    return roles.map(role => ({ value: role, label: roleLabel(role), count: staffList.filter(member => member.clinic_role === role).length }))
  }, [staffList])

  const visibleStaff = useMemo(() => {
    const query = normalise(searchTerm.trim())
    return staffList.filter(member => {
      const matchesSearch = !query || [
        member.name,
        member.phone,
        member.email,
        member.last_login,
        roleLabel(member.clinic_role),
      ].some(value => normalise(value).includes(query))
      const matchesRole = roleFilter === 'all' || member.clinic_role === roleFilter
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? member.is_active : !member.is_active)
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [roleFilter, searchTerm, staffList, statusFilter])

  const activityStaff = useMemo(() => Array.from(new Set(activity.map(item => item.staff_name))), [activity])

  const filteredActivity = useMemo(() => (
    activityFilter === 'all' ? activity : activity.filter(item => item.staff_name === activityFilter)
  ), [activity, activityFilter])

  const clearFilters = () => {
    setSearchTerm('')
    setRoleFilter('all')
    setStatusFilter('all')
  }

  const handleAdded = newMember => setStaffList(prev => [...prev, newMember])

  const handleRoleChange = async (id, newRole) => {
    setActionError('')
    const previous = staffList
    setStaffList(prev => prev.map(member => member.id === id ? { ...member, clinic_role: newRole } : member))
    try {
      await staffApi.update(id, { clinic_role: newRole })
    } catch (e) {
      console.error('Failed to update staff role:', e)
      setStaffList(previous)
      setActionError(e?.detail || e?.message || 'Could not update staff role. Please try again.')
    }
  }

  const handleToggleActive = async id => {
    setActionError('')
    const previous = staffList
    const member = staffList.find(item => item.id === id)
    if (!member) return
    setStaffList(prev => prev.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item))
    try {
      await staffApi.update(id, { is_active: !member.is_active })
    } catch (e) {
      console.error('Failed to update staff status:', e)
      setStaffList(previous)
      setActionError(e?.detail || e?.message || 'Could not update staff status. Please try again.')
    }
  }

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return
    setActionError('')
    const previous = staffList
    const target = removeTarget
    setStaffList(prev => prev.filter(member => member.id !== removeTarget.id))
    setRemoveTarget(null)
    try {
      await staffApi.remove(target.id)
    } catch (e) {
      console.error('Failed to remove staff member:', e)
      setStaffList(previous)
      setActionError(e?.detail || e?.message || 'Could not remove staff member. Please try again.')
    }
  }

  const handlePermissionsSaved = (staffId, changedPerms) => {
    setStaffList(prev => prev.map(member =>
      member.id === staffId ? { ...member, custom_permissions: changedPerms } : member
    ))
  }

  if (loading) return <LoadingSpinner message="Loading staff..." />
  if (error) return <ErrorBanner message={error} onRetry={loadStaffData} />

  const hasActiveFilters = searchTerm.trim() || roleFilter !== 'all' || statusFilter !== 'all'

  return (
    <>
      <main className="staff-page ds-page" aria-labelledby="staff-management-title">
        <style>{`
          .staff-page {
            display: grid;
            gap: var(--space-8);
            padding-inline: clamp(var(--space-4), 3vw, var(--space-8));
          }

          .staff-page-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-5);
          }

          .staff-kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: var(--space-5);
          }

          .staff-tabs {
            display: flex;
            gap: var(--space-2);
            padding: var(--space-1);
            border: calc(var(--space-0-5) / 2) solid var(--color-border);
            border-radius: var(--radius-lg);
            background: var(--color-surface-subtle);
            width: fit-content;
          }

          .staff-tab {
            display: inline-flex;
            align-items: center;
            gap: var(--space-2);
            min-height: 36px;
            padding: 0 var(--space-4);
            border: 0;
            border-radius: var(--radius-md);
            background: transparent;
            color: var(--color-text-secondary);
            cursor: pointer;
            font: 700 var(--text-sm) / 1 var(--font-body);
          }

          .staff-tab[aria-selected="true"] {
            background: var(--color-surface);
            color: var(--color-navy);
            box-shadow: var(--shadow-xs);
          }

          .staff-search-field {
            position: relative;
            display: block;
            width: min(420px, 100%);
          }

          .staff-search-field svg {
            position: absolute;
            left: var(--space-4);
            top: 50%;
            transform: translateY(-50%);
            color: var(--color-text-muted);
            pointer-events: none;
          }

          .staff-search-field input {
            width: 100%;
            min-height: 42px;
            padding: 0 var(--space-4) 0 var(--space-10);
            border: calc(var(--space-0-5) / 2) solid var(--color-border);
            border-radius: var(--radius-md);
            background: var(--color-surface);
            box-shadow: var(--shadow-xs);
            color: var(--color-text-primary);
            font: 500 var(--text-sm) / 1 var(--font-body);
            outline: none;
            transition: border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out);
          }

          .staff-search-field input:focus-visible {
            border-color: var(--color-blue);
            box-shadow: var(--shadow-focus);
          }

          .staff-toolbar {
            display: grid;
            gap: var(--space-4);
          }

          .staff-toolbar-row {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-4);
          }

          .staff-person-cell {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            min-width: 0;
          }

          .staff-actions-cell {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: flex-end;
            gap: var(--space-2);
          }

          .staff-role-menu-item {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            width: 100%;
            padding: var(--space-3) var(--space-4);
            border: 0;
            background: var(--color-surface);
            color: var(--color-text-primary);
            cursor: pointer;
            font: 600 var(--text-sm) / 1 var(--font-body);
            text-align: left;
          }

          .staff-role-menu-item:hover,
          .staff-role-menu-item:focus-visible {
            background: var(--color-surface-subtle);
            outline: none;
          }

          .staff-modal-backdrop {
            position: fixed;
            inset: 0;
            z-index: 50;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--space-4);
            background: color-mix(in srgb, var(--color-navy) 42%, transparent);
            backdrop-filter: blur(3px);
          }

          .staff-activity-list {
            display: grid;
            gap: var(--space-3);
          }

          .staff-activity-item {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            padding: var(--space-4);
            border: calc(var(--space-0-5) / 2) solid var(--color-border);
            border-radius: var(--radius-lg);
            background: var(--color-surface);
          }

          @media (max-width: 1024px) {
            .staff-kpi-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 640px) {
            .staff-page {
              gap: var(--space-6);
              padding-inline: var(--space-4);
            }

            .staff-page-header,
            .staff-toolbar-row {
              flex-direction: column;
              align-items: stretch;
            }

            .staff-kpi-grid {
              grid-template-columns: 1fr;
              gap: var(--space-4);
            }

            .staff-tabs,
            .staff-search-field {
              width: 100%;
            }

            .staff-tab {
              flex: 1;
              justify-content: center;
              padding-inline: var(--space-3);
            }
          }
        `}</style>

        {actionError ? (
          <div role="alert" style={{ padding: 'var(--space-3) var(--space-4)', border: 'calc(var(--space-0-5) / 2) solid var(--color-error-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-error-bg)', color: 'var(--color-error-text)', fontSize: 'var(--text-sm)', fontWeight: 650 }}>
            {actionError}
          </div>
        ) : null}

        <section className="staff-page-header">
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <h1 id="staff-management-title" className="ds-section-title" style={{ margin: 0 }}>
              Staff Management
            </h1>
            <p className="ds-section-subtitle" style={{ margin: 0, maxWidth: '680px' }}>
              Manage staff accounts, roles, and dashboard permissions for your clinic.
            </p>
          </div>
          {canManage ? (
            <Button leftIcon={Plus} onClick={() => setShowAdd(true)}>Add Staff</Button>
          ) : null}
        </section>

        <section className="staff-kpi-grid" aria-label="Staff overview">
          <StatCard icon={Users} label="Total Staff" value={summary.total} color="var(--color-blue)" badge="Accounts" />
          <StatCard icon={Check} label="Active Staff" value={summary.active} color="var(--color-success-text)" badge="Enabled" />
          <StatCard icon={Lock} label="Custom Access" value={summary.custom} color="var(--color-coral)" badge="Overrides" />
          <StatCard icon={Shield} label="Clinical Roles" value={summary.managerRoles} color="var(--color-navy)" badge="Doctors" />
        </section>

        <div className="staff-tabs" role="tablist" aria-label="Staff management views">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'members'}
            className="staff-tab"
            onClick={() => setTab('members')}
          >
            <Users size={15} strokeWidth={1.8} aria-hidden="true" />
            Staff Members
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'activity'}
            className="staff-tab"
            onClick={() => setTab('activity')}
          >
            <Activity size={15} strokeWidth={1.8} aria-hidden="true" />
            Activity Log
          </button>
        </div>

        {tab === 'members' ? (
          <>
            <Card>
              <Card.Header
                title="Staff directory"
                subtitle="Find staff members and filter by role or account status."
                action={hasActiveFilters ? <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button> : null}
              />
              <Card.Body style={{ display: 'grid', gap: 'var(--space-5)' }}>
                <div className="staff-toolbar">
                  <div className="staff-toolbar-row">
                    <SearchField
                      value={searchTerm}
                      onChange={setSearchTerm}
                      placeholder="Search name, phone, email, role..."
                      label="Search staff"
                    />
                    <Badge variant="default" size="lg">
                      {visibleStaff.length} of {staffList.length} shown
                    </Badge>
                  </div>
                  <FilterChipGroup value={roleFilter} onChange={setRoleFilter} aria-label="Filter staff by role">
                    <FilterChip value="all" count={staffList.length}>All roles</FilterChip>
                    {roleOptions.map(option => (
                      <FilterChip key={option.value} value={option.value} count={option.count}>{option.label}</FilterChip>
                    ))}
                  </FilterChipGroup>
                  <FilterChipGroup value={statusFilter} onChange={setStatusFilter} aria-label="Filter staff by status">
                    <FilterChip value="all" count={staffList.length}>All status</FilterChip>
                    <FilterChip value="active" count={summary.active}>Active</FilterChip>
                    <FilterChip value="inactive" count={summary.inactive}>Inactive</FilterChip>
                  </FilterChipGroup>
                </div>

                {staffList.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No staff added yet"
                    description="Add staff members to assign roles and permissions."
                    action={canManage ? { label: 'Add Staff', onClick: () => setShowAdd(true) } : undefined}
                    style={{ border: 'calc(var(--space-0-5) / 2) solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-subtle)' }}
                  />
                ) : visibleStaff.length === 0 ? (
                  <EmptyState
                    icon={Search}
                    title="No staff match these filters"
                    description="Clear the search or filters to see more staff accounts."
                    action={{ label: 'Clear filters', variant: 'secondary', onClick: clearFilters }}
                    style={{ border: 'calc(var(--space-0-5) / 2) solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-subtle)' }}
                  />
                ) : (
                  <Table aria-label="Staff members table" zebra>
                    <Table.Head>
                      <tr>
                        <Table.HeadCell width="30%">Name</Table.HeadCell>
                        <Table.HeadCell width="14%">Role</Table.HeadCell>
                        <Table.HeadCell width="24%">Permissions</Table.HeadCell>
                        <Table.HeadCell width="16%">Status</Table.HeadCell>
                        <Table.HeadCell width="22%" align="right">Actions</Table.HeadCell>
                      </tr>
                    </Table.Head>
                    <Table.Body>
                      {visibleStaff.map(member => (
                        <StaffTableRow
                          key={member.id}
                          member={member}
                          canManage={canManage}
                          onRoleChange={handleRoleChange}
                          onToggleActive={handleToggleActive}
                          onRemove={setRemoveTarget}
                          onManageAccess={setAccessTarget}
                        />
                      ))}
                    </Table.Body>
                  </Table>
                )}
              </Card.Body>
            </Card>

            <Card variant="flat">
              <Card.Header
                title="Default role permissions"
                subtitle="Reference matrix only. Custom staff overrides are managed from the Access action."
              />
              <Card.Body>
                <Table aria-label="Default role permissions matrix" zebra>
                  <Table.Head>
                    <tr>
                      <Table.HeadCell>Permission</Table.HeadCell>
                      {['owner', 'doctor', 'receptionist', 'staff'].map(role => (
                        <Table.HeadCell key={role} align="center">{roleLabel(role)}</Table.HeadCell>
                      ))}
                    </tr>
                  </Table.Head>
                  <Table.Body>
                    {PERMISSION_REFERENCE.map(([label, permission]) => (
                      <Table.Row key={permission}>
                        <Table.Cell mobileLabel="Permission">{label}</Table.Cell>
                        {['owner', 'doctor', 'receptionist', 'staff'].map(role => (
                          <Table.Cell key={role} align="center" mobileLabel={roleLabel(role)}>
                            {ROLE_PERMISSIONS[role]?.[permission]
                              ? <Badge variant="green" type="solid"><Check size={12} strokeWidth={1.8} aria-hidden="true" /> Yes</Badge>
                              : <Badge variant="default">No</Badge>}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </Card.Body>
            </Card>
          </>
        ) : (
          <Card>
            <Card.Header
              title="Activity log"
              subtitle="Recent staff actions recorded for today."
            />
            <Card.Body style={{ display: 'grid', gap: 'var(--space-5)' }}>
              <div className="staff-toolbar-row">
                <label style={{ display: 'grid', gap: 'var(--space-2)', minWidth: '220px' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Staff</span>
                  <select
                    value={activityFilter}
                    onChange={event => setActivityFilter(event.target.value)}
                    style={{
                      minHeight: '38px',
                      padding: '0 var(--space-3)',
                      border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text-primary)',
                      font: '600 var(--text-sm) / 1 var(--font-body)',
                      outline: 'none',
                    }}
                  >
                    <option value="all">All Staff</option>
                    {activityStaff.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </label>
                <Badge variant="default" size="lg">
                  {filteredActivity.length} action{filteredActivity.length === 1 ? '' : 's'} today
                </Badge>
              </div>

              {filteredActivity.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No activity found"
                  description="No staff actions match the selected filter."
                  style={{ border: 'calc(var(--space-0-5) / 2) solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-subtle)' }}
                />
              ) : (
                <div className="staff-activity-list" aria-label="Staff activity log">
                  {filteredActivity.map((log, index) => (
                    <Motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.025 }}
                      className="staff-activity-item"
                    >
                      <Avatar name={log.staff_name} size={34} role={log.staff_role} />
                      <div style={{ display: 'grid', gap: 'var(--space-1)', minWidth: 0, flex: 1 }}>
                        <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>
                          <strong>{log.staff_name}</strong> - {log.action}
                        </span>
                        <RoleBadge role={log.staff_role} />
                      </div>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>{log.time}</span>
                    </Motion.div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        )}
      </main>

      <AnimatePresence>
        {showAdd ? <AddStaffModal onClose={() => setShowAdd(false)} onAdded={handleAdded} /> : null}
        {removeTarget ? (
          <RemoveConfirmDialog
            staff={removeTarget}
            onConfirm={handleRemoveConfirm}
            onCancel={() => setRemoveTarget(null)}
          />
        ) : null}
        {accessTarget ? (
          <ManageAccessDrawer
            staff={accessTarget}
            onClose={() => setAccessTarget(null)}
            onSave={handlePermissionsSaved}
          />
        ) : null}
      </AnimatePresence>
    </>
  )
}
