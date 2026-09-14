'use client'
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { motion as Motion } from 'framer-motion'
import { Bell, BellOff, Calendar, CheckCircle, FileText, Pill, Plus, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Badge from '../../components/ui/Badge'
import { Button, FilterChip, FilterChipGroup } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import StatCard from '../../components/ui/StatCard'
import Table from '../../components/ui/Table'
import { prescriptions as mockPrescriptions } from '../../data/mockData'
import { can } from '../../utils/auth'
// TODO: Ashutosh uncomment
// import { prescriptionsApi } from '../../services/prescriptionsApi'

const STATUS_META = {
  Active: {
    label: 'Active',
    variant: 'coral',
    icon: Bell,
    actionLabel: 'Pause Reminders',
    actionIcon: BellOff,
  },
  Completed: {
    label: 'Completed',
    variant: 'green',
    icon: CheckCircle,
    actionLabel: 'Activate Reminders',
    actionIcon: Bell,
  },
  Paused: {
    label: 'Paused',
    variant: 'yellow',
    icon: BellOff,
    actionLabel: 'Activate Reminders',
    actionIcon: Bell,
  },
}

function normalise(value) {
  return String(value || '').toLowerCase()
}

function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.Active
}

function SearchField({ value, onChange }) {
  return (
    <label className="rx-search-field">
      <span className="sr-only">Search prescriptions</span>
      <Search size={16} strokeWidth={1.8} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder="Search patient, diagnosis, ID..."
        aria-label="Search prescriptions"
      />
    </label>
  )
}

function StatusBadge({ status }) {
  const meta = statusMeta(status)
  const StatusIcon = meta.icon
  return (
    <Badge variant={meta.variant} type="dot">
      <StatusIcon size={12} strokeWidth={1.8} aria-hidden="true" />
      {meta.label}
    </Badge>
  )
}

export default function Prescriptions() {
  const router = useRouter()
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError, setPageError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [prescriptions, setPrescriptions] = useState(mockPrescriptions)

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    try {
      // TODO: Ashutosh uncomment
      // const res = await prescriptionsApi.getAll()
      // setPrescriptions(res)
      setPrescriptions(mockPrescriptions)
    } catch (e) {
      setPageError(e?.message || e?.detail || 'Failed to load prescriptions')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const toggleReminder = id => {
    setPrescriptions(prev => prev.map(prescription => {
      if (prescription.id !== id) return prescription
      return {
        ...prescription,
        reminderStatus: prescription.reminderStatus === 'Active' ? 'Paused' : 'Active',
      }
    }))
  }

  const summary = useMemo(() => {
    const activeCount = prescriptions.filter(prescription => prescription.reminderStatus === 'Active').length
    const completedCount = prescriptions.filter(prescription => prescription.reminderStatus === 'Completed').length
    const pausedCount = prescriptions.filter(prescription => prescription.reminderStatus === 'Paused').length
    const totalSent = prescriptions.reduce((count, prescription) => count + prescription.remindersSent, 0)
    return { activeCount, completedCount, pausedCount, totalSent, total: prescriptions.length }
  }, [prescriptions])

  const statusCounts = useMemo(() => (
    prescriptions.reduce((counts, prescription) => {
      counts[prescription.reminderStatus] = (counts[prescription.reminderStatus] || 0) + 1
      return counts
    }, { all: prescriptions.length })
  ), [prescriptions])

  const filtered = useMemo(() => {
    const query = normalise(search.trim())
    return prescriptions.filter(prescription => {
      const matchesSearch = !query || [
        prescription.patientName,
        prescription.patientPhone,
        prescription.diagnosis,
        prescription.id,
        prescription.doctor,
        prescription.reminderStatus,
      ].some(value => normalise(value).includes(query))
      const matchesStatus = statusFilter === 'all' || prescription.reminderStatus === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [prescriptions, search, statusFilter])

  if (pageLoading) return <LoadingSpinner message="Loading prescriptions..." />
  if (pageError) return <ErrorBanner message={pageError} onRetry={loadData} />

  const canCreate = can('action_create_prescription')
  const hasActiveFilters = search.trim() || statusFilter !== 'all'
  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  return (
    <main className="rx-page ds-page" aria-labelledby="prescriptions-title">
      <style>{`
        .rx-page {
          display: grid;
          gap: var(--space-8);
          padding-inline: clamp(var(--space-4), 3vw, var(--space-8));
        }

        .rx-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-5);
        }

        .rx-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--space-5);
        }

        .rx-toolbar {
          display: grid;
          gap: var(--space-4);
        }

        .rx-toolbar-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
        }

        .rx-search-field {
          position: relative;
          display: block;
          width: min(440px, 100%);
        }

        .rx-search-field svg {
          position: absolute;
          left: var(--space-4);
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          pointer-events: none;
        }

        .rx-search-field input {
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

        .rx-search-field input:focus-visible {
          border-color: var(--color-blue);
          box-shadow: var(--shadow-focus);
        }

        .rx-patient-cell,
        .rx-prescription-cell {
          display: grid;
          gap: var(--space-1);
          min-width: 0;
        }

        .rx-medicine-list {
          display: grid;
          gap: var(--space-1);
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .rx-medicine-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-2);
          min-width: 0;
          color: var(--color-text-secondary);
          font-size: var(--text-xs);
        }

        .rx-actions-cell {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: var(--space-2);
        }

        @media (max-width: 1024px) {
          .rx-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .rx-page {
            gap: var(--space-6);
            padding-inline: var(--space-4);
          }

          .rx-page-header,
          .rx-toolbar-row {
            flex-direction: column;
            align-items: stretch;
          }

          .rx-kpi-grid {
            grid-template-columns: 1fr;
            gap: var(--space-4);
          }

          .rx-search-field {
            width: 100%;
          }
        }
      `}</style>

      <section className="rx-page-header">
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <h1 id="prescriptions-title" className="ds-section-title" style={{ margin: 0 }}>
            Prescriptions
          </h1>
          <p className="ds-section-subtitle" style={{ margin: 0, maxWidth: '680px' }}>
            View prescription history and manage WhatsApp medicine reminders.
          </p>
        </div>
        {canCreate ? (
          <Button leftIcon={Plus} onClick={() => router.push('/portal/rx/new')}>
            Open OPD Console
          </Button>
        ) : null}
      </section>

      <section className="rx-kpi-grid" aria-label="Prescription overview">
        <StatCard icon={Bell} label="Active Reminders" value={summary.activeCount} color="var(--color-coral)" badge="WhatsApp" />
        <StatCard icon={FileText} label="Total Prescriptions" value={summary.total} color="var(--color-blue)" badge="History" />
        <StatCard icon={CheckCircle} label="Completed" value={summary.completedCount} color="var(--color-success-text)" badge="Closed" />
        <StatCard icon={BellOff} label="Reminders Sent" value={summary.totalSent} color="var(--color-navy)" badge="Sent" />
      </section>

      <Card>
        <Card.Header
          title="Prescription history"
          subtitle="Search prescriptions, filter by reminder status, and access existing actions."
          action={hasActiveFilters ? <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button> : null}
        />
        <Card.Body style={{ display: 'grid', gap: 'var(--space-5)' }}>
          <div className="rx-toolbar">
            <div className="rx-toolbar-row">
              <SearchField value={search} onChange={setSearch} />
              <Badge variant="default" size="lg">
                {filtered.length} of {prescriptions.length} shown
              </Badge>
            </div>
            <FilterChipGroup value={statusFilter} onChange={setStatusFilter} aria-label="Filter prescriptions by reminder status">
              <FilterChip value="all" count={statusCounts.all}>All</FilterChip>
              <FilterChip value="Active" count={statusCounts.Active || 0}>Active</FilterChip>
              <FilterChip value="Completed" count={statusCounts.Completed || 0}>Completed</FilterChip>
              <FilterChip value="Paused" count={statusCounts.Paused || 0}>Paused</FilterChip>
            </FilterChipGroup>
          </div>

          {prescriptions.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="No prescriptions yet"
              description="Prescriptions created in the OPD Console appear here for reference."
              style={{
                border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-subtle)',
              }}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No prescriptions match these filters"
              description="Clear the search or status filter to see more prescription history."
              action={{ label: 'Clear filters', variant: 'secondary', onClick: clearFilters }}
              style={{
                border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-subtle)',
              }}
            />
          ) : (
            <Table aria-label="Prescription table" zebra stickyHeader>
              <Table.Head>
                <tr>
                  <Table.HeadCell width="22%">Patient</Table.HeadCell>
                  <Table.HeadCell width="28%">Prescription</Table.HeadCell>
                  <Table.HeadCell width="16%">Doctor</Table.HeadCell>
                  <Table.HeadCell width="13%">Date</Table.HeadCell>
                  <Table.HeadCell width="13%">Status</Table.HeadCell>
                  <Table.HeadCell width="16%" align="right">Actions</Table.HeadCell>
                </tr>
              </Table.Head>
              <Table.Body>
                {filtered.map((rx, index) => {
                  const meta = statusMeta(rx.reminderStatus)
                  const ActionIcon = meta.actionIcon
                  return (
                    <Motion.tr
                      key={rx.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.025, duration: 0.18 }}
                    >
                      <Table.Cell mobileLabel="Patient">
                        <div className="rx-patient-cell">
                          <strong style={{ color: 'var(--color-text-primary)' }}>{rx.patientName}</strong>
                          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>{rx.patientPhone}</span>
                          <Badge variant="default" size="sm">{rx.id}</Badge>
                        </div>
                      </Table.Cell>
                      <Table.Cell mobileLabel="Prescription">
                        <div className="rx-prescription-cell">
                          <strong style={{ color: 'var(--color-text-primary)' }}>{rx.diagnosis}</strong>
                          <ul className="rx-medicine-list" aria-label={`Medicines for ${rx.patientName}`}>
                            {rx.medicines.slice(0, 2).map(medicine => (
                              <li key={medicine} className="rx-medicine-item">
                                <Pill size={12} strokeWidth={1.8} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--color-text-muted)' }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{medicine}</span>
                              </li>
                            ))}
                          </ul>
                          {rx.medicines.length > 2 ? (
                            <Badge variant="blue" size="sm">+{rx.medicines.length - 2} more</Badge>
                          ) : null}
                        </div>
                      </Table.Cell>
                      <Table.Cell mobileLabel="Doctor">{rx.doctor}</Table.Cell>
                      <Table.Cell mobileLabel="Date">
                        <span style={{ display: 'grid', gap: 'var(--space-1)' }}>
                          <span>{rx.date}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                            <Calendar size={12} strokeWidth={1.8} aria-hidden="true" />
                            Follow-up {rx.followUpDate}
                          </span>
                        </span>
                      </Table.Cell>
                      <Table.Cell mobileLabel="Status">
                        <span style={{ display: 'grid', gap: 'var(--space-2)', justifyItems: 'start' }}>
                          <StatusBadge status={rx.reminderStatus} />
                          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                            {rx.remindersSent} sent
                          </span>
                        </span>
                      </Table.Cell>
                      <Table.Cell align="right" mobileLabel="Actions">
                        <div className="rx-actions-cell">
                          <Button
                            variant={rx.reminderStatus === 'Active' ? 'secondary' : 'primary'}
                            size="sm"
                            leftIcon={ActionIcon}
                            onClick={() => toggleReminder(rx.id)}
                          >
                            {meta.actionLabel}
                          </Button>
                        </div>
                      </Table.Cell>
                    </Motion.tr>
                  )
                })}
              </Table.Body>
            </Table>
          )}
        </Card.Body>
      </Card>
    </main>
  )
}
