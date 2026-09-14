'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, Building2, User, Phone } from 'lucide-react'
import { getSession } from '../../utils/auth'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { Button, FilterChip, FilterChipGroup } from '../../components/ui/Button'
import BackButton from '../../components/ui/BackButton'
import { showToast } from '../../components/ui/Toast'
import { portalApi } from '../../services/portalApi'

const DS = {
  bg: '#F7F9FF',
  cardBg: '#ffffff',
  cardBorder: '#DDE4F0',
  textPrimary: '#0F2D5E',
  textMuted: '#6B7A9A',
  textSubtle: '#9DBDE8',
  accent: '#1A5CB5',
}

const STATUS_STYLES = {
  pending_approval: { bg: '#fef3c7', color: '#92400e', label: 'Pending Approval' },
  approved: { bg: '#EFF6FF', color: '#1A5CB5', label: 'Approved' },
  rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
  install_scheduled: { bg: '#dbeafe', color: '#1e40af', label: 'Install Scheduled' },
  completed: { bg: '#f3f4f6', color: '#374151', label: 'Completed' },
}

function Card({ children, style = {} }) {
  return <div style={{ background: DS.cardBg, border: `1px solid ${DS.cardBorder}`, borderRadius: 12, ...style }}>{children}</div>
}

function normalizeOnboarding(clinic) {
  return {
    ...clinic,
    id: clinic.id,
    clinicName: clinic.clinicName || clinic.clinic_name || clinic.name || 'Unnamed Clinic',
    doctorName: clinic.doctorName || clinic.doctor_name || clinic.doctor || 'Doctor not set',
    specialty: clinic.specialty || clinic.specialization || 'General Physician',
    phone: clinic.phone || clinic.contact_phone || clinic.whatsapp_number || 'N/A',
    city: clinic.city || '',
    zone: clinic.zone || '',
    address: clinic.address || [clinic.address_line1, clinic.address_line2, clinic.pincode].filter(Boolean).join(', '),
    submittedDate: clinic.submittedDate || clinic.created_at || 'N/A',
    status: clinic.status || 'pending_approval',
  }
}

export default function OnboardingQueue() {
  const session = getSession()
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError, setPageError] = useState(null)
  const [onboardings, setOnboardings] = useState([])
  const [filter, setFilter] = useState('pending_approval')
  const [updatingId, setUpdatingId] = useState(null)

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    try {
      const res = await portalApi.getOnboardings()
      setOnboardings(res.map(normalizeOnboarding))
    } catch (e) {
      setPageError(e?.message || e?.detail || 'Failed to load onboarding queue')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const scopedOnboardings = onboardings.filter(o => {
    if (session?.role === 'city') return o.city === session?.city
    if (session?.role === 'zone') return o.zone === session?.zone
    return true
  })

  const filtered = filter === 'all' ? scopedOnboardings : scopedOnboardings.filter(o => o.status === filter)

  const counts = {
    all: scopedOnboardings.length,
    pending_approval: scopedOnboardings.filter(o => o.status === 'pending_approval').length,
    approved: scopedOnboardings.filter(o => o.status === 'approved').length,
    rejected: scopedOnboardings.filter(o => o.status === 'rejected').length,
  }

  const tabs = [
    { key: 'pending_approval', label: `Unapproved (${counts.pending_approval})` },
    { key: 'approved', label: `Approved (${counts.approved})` },
    { key: 'rejected', label: `Rejected (${counts.rejected})` },
    { key: 'all', label: `All (${counts.all})` },
  ]

  async function updateStatus(id, status) {
    setUpdatingId(id)
    try {
      const updated = await portalApi.updateOnboarding(id, { status })
      setOnboardings(items => items.map(item => item.id === id ? normalizeOnboarding(updated) : item))
      showToast(status === 'approved' ? 'Clinic approved and login activated' : 'Clinic rejected', status === 'approved' ? 'success' : 'error')
    } catch (e) {
      showToast(e?.detail || e?.message || 'Failed to update onboarding', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  if (pageLoading) return <LoadingSpinner message="Loading unapproved clinics..." />
  if (pageError) return <ErrorBanner message={pageError} onRetry={loadData} />

  return (
    <div style={{ padding: 24 }}>
      <BackButton />
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: DS.textPrimary, margin: 0 }}>Unapproved Clinics</h1>
        <p style={{ fontSize: 13, color: DS.textMuted, marginTop: 4 }}>
          Review self-signup clinics and activate their login after approval.
        </p>
      </div>

      <FilterChipGroup value={filter} onChange={setFilter} className="mb-5">
        {tabs.map(t => (
          <FilterChip key={t.key} value={t.key}>{t.label}</FilterChip>
        ))}
      </FilterChipGroup>

      {filtered.length === 0 ? (
        <Card style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: DS.textMuted, fontSize: 14 }}>No clinics in this category.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((o, i) => {
            const ss = STATUS_STYLES[o.status] || STATUS_STYLES.pending_approval
            const isPending = o.status === 'pending_approval'
            return (
              <motion.div key={o.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card style={{ padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <Building2 size={15} style={{ color: DS.accent }} />
                        <span style={{ fontSize: 15, fontWeight: 700, color: DS.textPrimary }}>{o.clinicName}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: ss.bg, color: ss.color }}>{ss.label}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: DS.textMuted }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <User size={11} /> {o.doctorName} · {o.specialty}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={11} /> {o.phone}
                        </span>
                        <span>{[o.city, o.zone].filter(Boolean).join(' · ') || 'Location not set'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} /> Submitted {o.submittedDate}
                        </span>
                      </div>
                      {o.address && (
                        <p style={{ fontSize: 12, color: DS.textSubtle, margin: '6px 0 0' }}>{o.address}</p>
                      )}
                    </div>

                    {isPending && ['city', 'super', 'zone'].includes(session?.role) && (
                      <div className="flex gap-3 flex-shrink-0">
                        <Button size="sm" icon={CheckCircle} loading={updatingId === o.id} onClick={() => updateStatus(o.id, 'approved')}>
                          Approve
                        </Button>
                        <Button size="sm" variant="danger" icon={XCircle} disabled={updatingId === o.id} onClick={() => updateStatus(o.id, 'rejected')}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
