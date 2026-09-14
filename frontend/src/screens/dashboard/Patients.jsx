'use client'
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, X, Calendar, Phone, Mail, Droplet, Activity, Clock, FileText, ChevronRight } from 'lucide-react'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { Button } from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import Drawer from '../../components/ui/Drawer'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import SearchInput from '../../components/ui/SearchInput'
import Skeleton from '../../components/ui/Skeleton'
import Table from '../../components/ui/Table'
import { can } from '../../utils/auth'
import { dashboardApi } from '../../services/dashboardApi'
import { patientsApi } from '../../services/patientsApi'

const SOURCE = {
  WhatsApp: { bg: '#EFF6FF', color: '#1A5CB5', border: '#BFDBFE' },
  'QR Code': { bg: '#EFF6FF', color: '#1A5CB5', border: '#BFDBFE' },
  'Walk-in': { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  Phone:     { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  Online:    { bg: '#EFF6FF', color: '#0891b2', border: '#BFDBFE' },
}

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getPatientAppointments(patient, allAppts) {
  return allAppts.filter(
    (appt) => appt.patientId === patient.id || appt.patient_id === patient.id || appt.patientId === patient.patientId
  )
}

function getLatestAppointment(appts) {
  return [...appts]
    .filter((a) => a?.date || a?.appointment_date)
    .sort((a, b) => new Date(b.date || b.appointment_date).getTime() - new Date(a.date || a.appointment_date).getTime())[0]
}

function derivePatientSummary(patient, allAppts) {
  const appts = getPatientAppointments(patient, allAppts)
  const latest = getLatestAppointment(appts)
  return {
    source: patient.source || latest?.source || 'Walk-in',
    condition: patient.condition || latest?.reason || latest?.notes || 'General consultation',
    lastVisit: latest ? fmtDate(latest.date || latest.appointment_date) : '—',
    totalVisits: appts.length,
  }
}

const VISIT_STATUS = {
  completed: { label: 'Completed', bg: '#e8f5e9', color: '#1b5e20', border: '#c8e6c9' },
  'no-show': { label: 'No-show',   bg: '#fce4ec', color: '#b71c1c', border: '#f48fb1' },
  waiting:   { label: 'Waiting',   bg: '#fff8e1', color: '#f57f17', border: '#ffe082' },
  confirmed: { label: 'Confirmed', bg: '#EFF6FF', color: '#1A5CB5', border: '#BFDBFE' },
}

function PatientModal({ patient, onClose, allAppts }) {
  const patientAppts = getPatientAppointments(patient, allAppts).slice(0, 8)
  const summary = derivePatientSummary(patient, allAppts)
  const src = SOURCE[summary.source] || SOURCE.Phone
  const initials = (patient.name || '').split(' ').map(n => n[0]).join('').slice(0, 2)

  const fields = [
    { icon: Phone,    label: 'Phone',        value: can('view_patient_phone') ? patient.phone : '••••••••••' },
    { icon: Mail,     label: 'Email',        value: patient.email || '—' },
    { icon: Droplet,  label: 'Blood Group',  value: patient.bloodGroup || '—' },
    { icon: Activity, label: 'Condition',    value: summary.condition },
    { icon: Clock,    label: 'Last Visit',   value: summary.lastVisit },
    { icon: Calendar, label: 'Total Visits', value: `${summary.totalVisits} visits` },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="w-full max-w-lg overflow-hidden"
        style={{ background: 'var(--tm-surface,#fff)', borderRadius: '12px', boxShadow: '0 8px 40px rgba(15,45,94,0.14)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ position: 'relative', padding: '24px 28px', background: 'var(--tm-surface2,#F7F9FF)', borderBottom: '1px solid #DDE4F0' }}>
          <button onClick={onClose}
            style={{ position: 'absolute', top: '20px', right: '20px', width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: '#DDE4F0', color: 'var(--tm-text-muted,#6B7A9A)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#C8D6F0'}
            onMouseLeave={e => e.currentTarget.style.background = '#DDE4F0'}>
            <X size={15} />
          </button>
          <div className="flex items-center gap-4">
            <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: '#1A5CB5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: 700, flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--tm-text,#0F2D5E)' }}>{patient.name}</h2>
              <p style={{ fontSize: '13px', color: 'var(--tm-text-muted,#6B7A9A)', marginTop: '2px' }}>{patient.age} years · {patient.gender}</p>
              <span style={{ display: 'inline-block', fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '6px', marginTop: '8px', background: src.bg, color: src.color, border: `1px solid ${src.border}` }}>
                {summary.source}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
          <div style={{ padding: '24px 28px' }}>

            {/* Info fields */}
            <div style={{ marginBottom: '24px' }}>
              {fields.map((info, idx) => (
                <div key={info.label} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '11px 0', borderBottom: idx < fields.length - 1 ? '1px solid #DDE4F0' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <info.icon size={12} style={{ color: 'var(--tm-text-muted,#6B7A9A)', flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--tm-text-muted,#6B7A9A)' }}>{info.label}</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--tm-text,#0F2D5E)', textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{info.value}</span>
                </div>
              ))}
            </div>

            {/* Notes */}
            {patient.notes && (
              <div style={{ padding: '14px 16px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a', marginBottom: '24px' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: '#d97706', marginBottom: '6px' }}>
                  <FileText size={12} /> Note
                </p>
                <p style={{ fontSize: '13px', color: '#92400e', lineHeight: '1.5' }}>{patient.notes}</p>
              </div>
            )}

            {/* Visit history — gated by view_patient_history permission */}
            {can('view_patient_history') && <div>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--tm-text-muted,#6B7A9A)', marginBottom: '10px' }}>Visit History</p>
              <div style={{ height: '1px', background: '#DDE4F0', marginBottom: '0' }} />
              {patientAppts.length === 0 ? (
                <p style={{ fontSize: '13px', textAlign: 'center', padding: '20px 0', color: 'var(--tm-text-muted,#6B7A9A)' }}>No appointments found</p>
              ) : (
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #DDE4F0', marginTop: '10px' }}>
                  {/* Visit table header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 90px', padding: '8px 14px', background: 'var(--tm-surface2,#F7F9FF)', borderBottom: '1px solid #DDE4F0' }}>
                    {['Date', 'Reason', 'Status'].map(h => (
                      <span key={h} style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--tm-text-muted,#6B7A9A)' }}>{h}</span>
                    ))}
                  </div>
                  {patientAppts.map((a, idx) => {
                    const vs = VISIT_STATUS[a.status] || VISIT_STATUS.confirmed
                    return (
                      <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 90px', alignItems: 'center', padding: '9px 14px', background: idx % 2 === 0 ? '#fff' : '#F7F9FF', borderBottom: idx < patientAppts.length - 1 ? '1px solid #DDE4F0' : 'none' }}>
                        <span style={{ fontSize: '12px', color: 'var(--tm-text-muted,#6B7A9A)' }}>{fmtDate(a.date)}</span>
                        <p style={{ fontSize: '13px', color: 'var(--tm-text,#0F2D5E)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{a.reason}</p>
                        <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: vs.bg, color: vs.color, border: `1px solid ${vs.border}`, display: 'inline-block' }}>
                          {vs.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>}
            {!can('view_patient_history') && (
              <div style={{ padding: '14px 16px', borderRadius: '8px', background: 'var(--tm-surface2,#F7F9FF)', border: '1px solid #DDE4F0', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: 'var(--tm-text-muted,#6B7A9A)' }}>Patient history is not available for your role.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const SOURCE_VARIANTS = {
  WhatsApp: 'blue',
  'QR Code': 'blue',
  'Walk-in': 'yellow',
  Phone: 'blue',
  Online: 'coral',
}

const VISIT_VARIANTS = {
  completed: 'green',
  'no-show': 'red',
  waiting: 'yellow',
  confirmed: 'blue',
}

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'PT'
}

function SourceBadge({ source }) {
  return (
    <Badge variant="default" size="lg" type="subtle">
      {source || 'Unknown'}
    </Badge>
  )
}

function VisitStatusBadge({ status }) {
  const details = VISIT_STATUS[status] || VISIT_STATUS.confirmed
  return (
    <Badge variant={VISIT_VARIANTS[status] || 'blue'} size="md" type="subtle">
      {details.label}
    </Badge>
  )
}

function PatientAvatar({ name, size = 40 }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-grid',
        placeItems: 'center',
        width: size,
        height: size,
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-blue)',
        color: 'var(--color-text-inverse)',
        fontSize: size > 44 ? 'var(--text-body)' : 'var(--text-xs)',
        fontWeight: 800,
        flexShrink: 0,
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {getInitials(name)}
    </span>
  )
}

function PatientsSkeleton() {
  return (
    <div className="ds-page" aria-label="Patients loading" aria-busy="true" style={{ display: 'grid', gap: 'var(--space-8)', width: '100%', maxWidth: 1440, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-5)', alignItems: 'flex-start' }}>
        <div style={{ display: 'grid', gap: 'var(--space-2)', width: 'min(420px, 100%)' }}>
          <Skeleton variant="text" height="var(--text-h2)" width="52%" />
          <Skeleton variant="text" width="38%" />
        </div>
        <Skeleton variant="rect" width="128px" height="36px" borderRadius="var(--radius-md)" />
      </div>
      <Card>
        <Card.Body style={{ display: 'grid', gap: 'var(--space-5)' }}>
          <Skeleton variant="rect" height="42px" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-4)' }}>
            {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} variant="rect" height="72px" />)}
          </div>
        </Card.Body>
      </Card>
      <Card>
        <Card.Body style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 130px 90px 40px', gap: 'var(--space-4)', alignItems: 'center' }}>
              <Skeleton variant="text" />
              <Skeleton variant="text" />
              <Skeleton variant="text" />
              <Skeleton variant="rect" height="24px" borderRadius="var(--radius-sm)" />
              <Skeleton variant="circle" width="24px" height="24px" />
            </div>
          ))}
        </Card.Body>
      </Card>
    </div>
  )
}

function PatientMobileCard({ patient, allAppts, onOpen, index }) {
  const summary = derivePatientSummary(patient, allAppts)

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen(patient)
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(patient)}
      onKeyDown={handleKeyDown}
      aria-label={`Open details for ${patient.name}`}
      style={{
        display: 'grid',
        gap: 'var(--space-4)',
        padding: 'var(--space-5)',
        border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
          <PatientAvatar name={patient.name} />
          <div style={{ minWidth: 0 }}>
            <strong style={{ display: 'block', color: 'var(--color-navy)', fontSize: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {patient.name}
            </strong>
            <span style={{ display: 'block', marginTop: 'var(--space-1)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              {patient.age || '--'}y · {patient.gender || 'Not specified'}
            </span>
          </div>
        </div>
        <ChevronRight size={18} strokeWidth={1.8} aria-hidden="true" style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
      </div>
      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <p style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', lineHeight: 1.55 }}>
          {summary.condition}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
          <SourceBadge source={summary.source} />
          <Badge variant="default" size="lg" type="outline">{summary.totalVisits} visits</Badge>
          <Badge variant="blue" size="lg" type="outline">Last {summary.lastVisit}</Badge>
        </div>
      </div>
    </motion.article>
  )
}

function PatientsDataTable({ patients, allAppts, onOpen }) {
  return (
    <Table aria-label="Patient directory" stickyHeader className="patients-desktop-table">
      <Table.Head>
        <Table.Row>
          <Table.HeadCell>Patient</Table.HeadCell>
          <Table.HeadCell>Condition & Source</Table.HeadCell>
          <Table.HeadCell width="140px">Last Visit</Table.HeadCell>
          <Table.HeadCell width="110px" align="center">Visits</Table.HeadCell>
          <Table.HeadCell width="56px" align="right">Details</Table.HeadCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {patients.map((patient, index) => {
          const summary = derivePatientSummary(patient, allAppts)
          return (
            <Table.Row
              key={patient.id}
              onRowClick={() => onOpen(patient)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onOpen(patient)
                }
              }}
              aria-label={`Open details for ${patient.name}`}
              style={{ background: index % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-subtle)' }}
            >
              <Table.Cell mobileLabel="Patient">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
                  <PatientAvatar name={patient.name} />
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block', color: 'var(--color-navy)', fontSize: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {patient.name}
                    </strong>
                    <span style={{ display: 'block', marginTop: 'var(--space-1)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                      {patient.age || '--'}y · {patient.gender || 'Not specified'} · {patient.id}
                    </span>
                  </div>
                </div>
              </Table.Cell>
              <Table.Cell truncate mobileLabel="Condition & Source">
                <div style={{ display: 'grid', gap: 'var(--space-2)', minWidth: 0 }}>
                  <span style={{ color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {summary.condition}
                  </span>
                  <SourceBadge source={summary.source} />
                </div>
              </Table.Cell>
              <Table.Cell mobileLabel="Last Visit" style={{ color: 'var(--color-text-secondary)' }}>{summary.lastVisit}</Table.Cell>
              <Table.Cell align="center" mobileLabel="Visits">
                <Badge variant="blue" size="lg" type="outline">{summary.totalVisits}</Badge>
              </Table.Cell>
              <Table.Cell align="right" mobileLabel="Details">
                <span aria-hidden="true" style={{ display: 'inline-grid', placeItems: 'center', width: 32, height: 32, borderRadius: 'var(--radius-md)', color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)' }}>
                  <ChevronRight size={16} strokeWidth={1.8} />
                </span>
              </Table.Cell>
            </Table.Row>
          )
        })}
      </Table.Body>
    </Table>
  )
}

function DetailField({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)', padding: 'var(--space-4)', border: 'calc(var(--space-0-5) / 2) solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-subtle)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
        {label}
      </span>
      <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-body)', fontWeight: 600, overflowWrap: 'anywhere' }}>{value}</span>
    </div>
  )
}

function PatientDetailDrawer({ patient, onClose, allAppts }) {
  if (!patient) return null

  const patientAppts = getPatientAppointments(patient, allAppts).slice(0, 8)
  const summary = derivePatientSummary(patient, allAppts)
  const fields = [
    { icon: Phone, label: 'Phone', value: can('view_patient_phone') ? patient.phone || '--' : 'Restricted' },
    { icon: Mail, label: 'Email', value: patient.email || '--' },
    { icon: Droplet, label: 'Blood Group', value: patient.bloodGroup || '--' },
    { icon: Activity, label: 'Condition', value: summary.condition },
    { icon: Clock, label: 'Last Visit', value: summary.lastVisit },
    { icon: Calendar, label: 'Total Visits', value: `${summary.totalVisits} visits` },
  ]

  return (
    <Drawer
      open={Boolean(patient)}
      onClose={onClose}
      title={patient.name}
      subtitle={`${patient.age || '--'} years · ${patient.gender || 'Not specified'}`}
      size="lg"
    >
      <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
        <Card variant="subtle">
          <Card.Body style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <PatientAvatar name={patient.name} size={56} />
            <div style={{ display: 'grid', gap: 'var(--space-2)', minWidth: 0 }}>
              <SourceBadge source={summary.source} />
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                {summary.condition}
              </p>
            </div>
          </Card.Body>
        </Card>

        <section aria-label="Patient information" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
          {fields.map(field => <DetailField key={field.label} {...field} />)}
        </section>

        {patient.notes ? (
          <Card variant="subtle">
            <Card.Body style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-warning-text)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <FileText size={14} strokeWidth={1.8} aria-hidden="true" />
                Note
              </span>
              <p style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', lineHeight: 1.65 }}>{patient.notes}</p>
            </Card.Body>
          </Card>
        ) : null}

        <section aria-label="Visit history" style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--color-navy)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-h4)' }}>Visit History</h3>
            <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Recent appointments linked to this patient.
            </p>
          </div>
          {!can('view_patient_history') ? (
            <Card variant="subtle">
              <Card.Body>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>Patient history is not available for your role.</p>
              </Card.Body>
            </Card>
          ) : patientAppts.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No visits yet"
              description="Appointments for this patient will appear here once booked."
              style={{ padding: 'var(--space-8) var(--space-4)' }}
            />
          ) : (
            <Table aria-label={`Visit history for ${patient.name}`}>
              <Table.Head>
                <Table.Row>
                  <Table.HeadCell>Date</Table.HeadCell>
                  <Table.HeadCell>Reason</Table.HeadCell>
                  <Table.HeadCell width="120px">Status</Table.HeadCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {patientAppts.map(appt => (
                  <Table.Row key={appt.id}>
                    <Table.Cell mobileLabel="Date" style={{ color: 'var(--color-text-secondary)' }}>{fmtDate(appt.date || appt.appointment_date)}</Table.Cell>
                    <Table.Cell truncate mobileLabel="Reason">{appt.reason || appt.notes || 'Consultation'}</Table.Cell>
                    <Table.Cell mobileLabel="Status"><VisitStatusBadge status={appt.status} /></Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </section>
      </div>
    </Drawer>
  )
}

export default function Patients() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError,   setPageError]   = useState(null)
  const [patientList, setPatientList] = useState([])
  const [allAppts,    setAllAppts]    = useState([])

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    try {
      const [patients, appointments] = await Promise.all([
        patientsApi.getAll(),
        dashboardApi.getAppointments(),
      ])
      setPatientList(patients || [])
      setAllAppts(appointments || [])
    } catch (e) {
      console.error('Failed to load patients:', e)
      setPageError(e?.detail || e?.message || 'Failed to load patients')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [page, setPage] = useState(1)
  const PER_PAGE = 15

  const normalizedSearch = search.toLowerCase()
  const filtered = useMemo(() =>
    patientList.filter(p =>
      [p.name, p.phone, p.id, p.condition].some(v => (v || '').toLowerCase().includes(normalizedSearch))
    ), [normalizedSearch, patientList])

  const patientSummary = useMemo(() => ({
    active: patientList.filter(p => p.status === 'active').length,
  }), [patientList])
  const paginated = useMemo(() => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE), [filtered, page])
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  if (pageLoading) return <PatientsSkeleton />
  if (pageError)   return <ErrorBanner message={pageError} onRetry={loadData} />

  return (
    <div className="ds-page patients-shell">
      <style>{`
        .patients-shell {
          display: grid;
          gap: var(--space-8);
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
        }
        .patients-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-5);
        }
        .patients-toolbar {
          display: grid;
          gap: var(--space-5);
        }
        .patients-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-4);
        }
        .patients-mobile-list {
          display: none;
        }
        .patients-results {
          display: grid;
          gap: var(--space-5);
        }
        .patients-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
          flex-wrap: wrap;
        }
        @media (max-width: 767px) {
          .patients-shell {
            gap: var(--space-6);
          }
          .patients-page-header {
            display: grid;
            gap: var(--space-4);
          }
          .patients-summary-grid {
            grid-template-columns: 1fr;
          }
          .patients-desktop-table {
            display: none !important;
          }
          .patients-mobile-list {
            display: grid;
            gap: var(--space-4);
          }
        }
      `}</style>

      <div className="patients-page-header">
        <div>
          <h1 className="ds-section-title">Patients</h1>
          <p className="ds-section-subtitle">{patientList.length} registered patients · {filtered.length} shown</p>
        </div>
        <Badge variant="blue" size="lg" type="outline">
          <Users size={14} strokeWidth={1.8} aria-hidden="true" />
          {patientSummary.active} active
        </Badge>
      </div>

      <Card>
        <Card.Body className="patients-toolbar">
          <SearchInput
            value={search}
            onChange={value => { setSearch(value); setPage(1) }}
            placeholder="Search patients by name, phone, condition, or patient ID..."
            aria-label="Search patients by name, phone, condition, or patient ID"
          />
          <div className="patients-summary-grid" aria-label="Patient directory summary">
            {[
              { label: 'Total Patients', value: patientList.length },
              { label: 'Visible Results', value: filtered.length },
              { label: 'Active Patients', value: patientSummary.active },
            ].map(item => (
              <div key={item.label} style={{ display: 'grid', gap: 'var(--space-1)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-subtle)', border: 'calc(var(--space-0-5) / 2) solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</span>
                <strong style={{ color: 'var(--color-navy)', fontSize: 'var(--text-h3)', lineHeight: 1 }}>{item.value}</strong>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      <section className="patients-results" aria-label="Patient results">
        {paginated.length === 0 ? (
          <Card>
            <EmptyState
              icon={Users}
              title={patientList.length === 0 ? 'No patients yet' : 'No patients found'}
              description={patientList.length === 0
                ? 'Your patient directory will populate automatically as appointments are booked.'
                : 'Try another name, phone number, condition, or patient ID.'}
            />
          </Card>
        ) : (
          <>
            <div className="patients-mobile-list">
              {paginated.map((patient, index) => (
                <PatientMobileCard
                  key={patient.id}
                  patient={patient}
                  allAppts={allAppts}
                  index={index}
                  onOpen={setSelectedPatient}
                />
              ))}
            </div>
            <PatientsDataTable patients={paginated} allAppts={allAppts} onOpen={setSelectedPatient} />
          </>
        )}
      </section>

      {totalPages > 1 && (
        <div className="patients-pagination">
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Showing {(page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} patients
          </p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <PatientDetailDrawer
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
        allAppts={allAppts}
      />
    </div>
  )

  return (
    <div className="ds-page space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="ds-section-title">Patients</h1>
          <p className="ds-section-subtitle">{patientList.length} registered patients</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '6px', background: 'var(--tm-surface2,#EFF6FF)', border: '1px solid #BFDBFE' }}>
          <Users size={14} style={{ color: '#1A5CB5' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A5CB5' }}>
            {patientList.filter(p => p.status === 'active').length} active
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }} />
        <input
          type="text"
          placeholder="Search by name, phone, condition, or patient ID..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="ds-input"
          style={{ paddingLeft: '42px', fontSize: '14px' }}
        />
      </div>

      {/* Table */}
      <div className="ds-table">
        {/* Table header */}
        <div className="ds-table-header">
          <div className="grid w-full gap-4" style={{ gridTemplateColumns: '2fr 2fr 120px 80px 40px' }}>
            {['Patient', 'Condition & Source', 'Last Visit', 'Visits', ''].map(h => (
              <span key={h} className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{h}</span>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {paginated.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[15px] font-medium" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>No patients found</p>
          </div>
        )}

        {/* Rows */}
        {paginated.map((p, i) => {
          const summary = derivePatientSummary(p, allAppts)
          const src = SOURCE[summary.source] || SOURCE.Phone
          const initials = (p.name || '').split(' ').map(n => n[0]).join('').slice(0, 2)
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="ds-table-row cursor-pointer group"
              onClick={() => setSelectedPatient(p)}
            >
              <div className="grid w-full gap-4 items-center" style={{ gridTemplateColumns: '2fr 2fr 120px 80px 40px' }}>
                {/* Patient */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0"
                    style={{ background: '#1A5CB5' }}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold group-hover:text-[#1A5CB5] transition-colors" style={{ color: 'var(--tm-text,#0F2D5E)' }}>
                      {p.name}
                    </p>
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{p.age}y · {p.gender}</p>
                  </div>
                </div>
                {/* Condition */}
                <div>
                  <p className="text-[14px]" style={{ color: 'var(--tm-text,#2D3748)' }}>{summary.condition}</p>
                  <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', marginTop: '4px', background: src.bg, color: src.color, border: `1px solid ${src.border}` }}>
                    {summary.source}
                  </span>
                </div>
                {/* Last visit */}
                <p className="text-[13px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>{summary.lastVisit}</p>
                {/* Visits */}
                <span className="text-[15px] font-bold" style={{ color: '#1A5CB5' }}>{summary.totalVisits}</span>
                {/* Arrow */}
                <ChevronRight size={16} style={{ color: '#DDE4F0' }} className="group-hover:text-[#1A5CB5] transition-colors" />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[13px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} patients
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</Button>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</Button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedPatient && <PatientModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} allAppts={allAppts} />}
      </AnimatePresence>
    </div>
  )
}
