'use client'
import { useMemo, useState } from 'react'
import { motion as Motion, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MessageCircle,
  PhoneMissed,
  Search,
  TrendingUp,
} from 'lucide-react'
import { missedCalls } from '../../data/mockData'
import Badge from '../../components/ui/Badge'
import { Button, FilterChip, FilterChipGroup } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import StatCard from '../../components/ui/StatCard'
import Table from '../../components/ui/Table'
// TODO: Ashutosh uncomment
// import { missedCallsApi } from '../../services/missedCallsApi'

const STATUS = {
  Booked: {
    label: 'Booked',
    variant: 'green',
    aiLabel: 'Follow-up converted',
    actionLabel: 'Handled',
    actionVariant: 'green',
  },
  Replied: {
    label: 'Replied',
    variant: 'blue',
    aiLabel: 'Patient replied',
    actionLabel: 'Review reply',
    actionVariant: 'blue',
  },
  'WhatsApp Sent': {
    label: 'WA Sent',
    variant: 'yellow',
    aiLabel: 'AI message sent',
    actionLabel: 'Awaiting reply',
    actionVariant: 'yellow',
  },
  'No Response': {
    label: 'No Response',
    variant: 'default',
    aiLabel: 'Needs staff review',
    actionLabel: 'Needs action',
    actionVariant: 'red',
  },
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'Booked', label: 'Booked' },
  { value: 'Replied', label: 'Replied' },
  { value: 'WhatsApp Sent', label: 'WA Sent' },
  { value: 'No Response', label: 'No Response' },
]

function normalise(value) {
  return String(value || '').toLowerCase()
}

export default function MissedCalls() {
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError, setPageError] = useState(null)
  const [callsList, setCallsList] = useState(missedCalls)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const prefersReducedMotion = useReducedMotion()

  const loadData = async () => {
    setPageLoading(true)
    setPageError(null)
    try {
      // TODO: Ashutosh uncomment
      // const res = await missedCallsApi.getAll()
      // setCallsList(res)
      setCallsList(missedCalls)
    } catch (e) {
      setPageError(e?.message || e?.detail || 'Failed to load missed calls')
    } finally {
      setPageLoading(false)
    }
  }

  const summary = useMemo(() => {
    const total = callsList.length
    const booked = callsList.filter(call => call.followUpStatus === 'Booked').length
    const replied = callsList.filter(call => call.followUpStatus === 'Replied').length
    const sent = callsList.filter(call => call.followUpStatus === 'WhatsApp Sent').length
    const needsAction = callsList.filter(call => call.followUpStatus === 'No Response').length
    const converted = total ? Math.round(((booked + replied) / total) * 100) : 0

    return { total, booked, replied, sent, needsAction, converted }
  }, [callsList])

  const statusCounts = useMemo(() => (
    callsList.reduce((counts, call) => {
      counts[call.followUpStatus] = (counts[call.followUpStatus] || 0) + 1
      return counts
    }, { all: callsList.length })
  ), [callsList])

  const filteredCalls = useMemo(() => {
    const query = normalise(searchTerm.trim())
    return callsList.filter(call => {
      const matchesStatus = statusFilter === 'all' || call.followUpStatus === statusFilter
      const matchesSearch = !query || [
        call.name,
        call.phone,
        call.date,
        call.time,
        call.followUpStatus,
        call.followUpTime,
        call.convertedTo,
      ].some(field => normalise(field).includes(query))

      return matchesStatus && matchesSearch
    })
  }, [callsList, searchTerm, statusFilter])

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
  }

  if (pageLoading) return <LoadingSpinner message="Loading missed calls..." />
  if (pageError) return <ErrorBanner message={pageError} onRetry={loadData} />

  const hasActiveFilters = searchTerm.trim() || statusFilter !== 'all'
  const showCelebration = summary.total === 0 || (summary.needsAction === 0 && statusFilter === 'No Response')

  return (
    <main className="missed-calls-page ds-page" aria-labelledby="missed-calls-title">
      <style>{`
        .missed-calls-page {
          display: grid;
          gap: var(--space-8);
          padding-inline: clamp(var(--space-4), 3vw, var(--space-8));
        }

        .missed-calls-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-5);
        }

        .missed-calls-kpis {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--space-5);
        }

        .missed-calls-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-5);
          padding: var(--space-5);
          border: calc(var(--space-0-5) / 2) solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface);
          box-shadow: var(--shadow-sm);
        }

        .missed-calls-banner[data-tone="success"] {
          border-color: var(--color-success-border);
          background: var(--color-success-bg);
        }

        .missed-calls-banner[data-tone="attention"] {
          border-color: var(--color-warning-border);
          background: var(--color-warning-bg);
        }

        .missed-calls-toolbar {
          display: grid;
          gap: var(--space-4);
        }

        .missed-calls-search {
          position: relative;
          max-width: 420px;
        }

        .missed-calls-search svg {
          position: absolute;
          left: var(--space-4);
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          pointer-events: none;
        }

        .missed-calls-search input {
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

        .missed-calls-search input:focus-visible {
          border-color: var(--color-blue);
          box-shadow: var(--shadow-focus);
        }

        .missed-calls-table-card {
          overflow: visible;
        }

        .missed-calls-patient {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          min-width: 0;
        }

        .missed-calls-avatar {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          flex: 0 0 auto;
          border-radius: var(--radius-md);
          background: var(--color-error-bg);
          color: var(--color-error-text);
        }

        .missed-calls-steps {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--space-5);
        }

        .missed-calls-step {
          display: grid;
          gap: var(--space-3);
          padding: var(--space-4);
          border: calc(var(--space-0-5) / 2) solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface);
        }

        @media (max-width: 1024px) {
          .missed-calls-kpis {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .missed-calls-steps {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .missed-calls-page {
            gap: var(--space-6);
            padding-inline: var(--space-4);
          }

          .missed-calls-header,
          .missed-calls-banner {
            flex-direction: column;
            align-items: stretch;
          }

          .missed-calls-kpis,
          .missed-calls-steps {
            grid-template-columns: 1fr;
            gap: var(--space-4);
          }

          .missed-calls-search {
            max-width: none;
          }
        }
      `}</style>

      <section className="missed-calls-header">
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <h1 id="missed-calls-title" className="ds-section-title" style={{ margin: 0 }}>
            Missed Calls
          </h1>
          <p className="ds-section-subtitle" style={{ margin: 0, maxWidth: '680px' }}>
            Track auto WhatsApp follow-ups, patient replies, and bookings created from missed calls.
          </p>
        </div>
        <Badge variant={summary.needsAction ? 'yellow' : 'green'} size="lg" type="subtle">
          {summary.needsAction ? `${summary.needsAction} need attention` : 'All caught up'}
        </Badge>
      </section>

      <section className="missed-calls-kpis" aria-label="Missed call overview">
        <StatCard
          icon={PhoneMissed}
          label="Total Missed"
          value={summary.total}
          color="var(--color-error-text)"
          badge="Today"
        />
        <StatCard
          icon={MessageCircle}
          label="AI Follow-ups"
          value={summary.sent + summary.booked + summary.replied + summary.needsAction}
          color="var(--color-blue)"
          badge="WhatsApp"
        />
        <StatCard
          icon={CheckCircle}
          label="Appointments Booked"
          value={summary.booked}
          color="var(--color-success-text)"
          badge="Converted"
        />
        <StatCard
          icon={TrendingUp}
          label="Conversion Rate"
          value={summary.converted}
          suffix="%"
          color="var(--color-coral)"
          badge="Month"
        />
      </section>

      <Motion.section
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        className="missed-calls-banner"
        data-tone={summary.needsAction ? 'attention' : 'success'}
        aria-live="polite"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <span
            aria-hidden="true"
            style={{
              display: 'grid',
              placeItems: 'center',
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: summary.needsAction ? 'var(--color-warning-border)' : 'var(--color-success-border)',
              color: summary.needsAction ? 'var(--color-warning-text)' : 'var(--color-success-text)',
            }}
          >
            {summary.needsAction ? <AlertCircle size={20} strokeWidth={1.8} /> : <CheckCircle size={20} strokeWidth={1.8} />}
          </span>
          <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h4)', fontWeight: 600 }}>
              {summary.needsAction ? 'Missed calls still need staff attention' : 'No missed calls requiring attention'}
            </h2>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              {summary.needsAction
                ? 'Review callers with no response while TrikMed continues sending the automated booking follow-up.'
                : 'Every call today has been answered or auto-replied to. Keep it up.'}
            </p>
          </div>
        </div>
        <Badge variant={summary.needsAction ? 'yellow' : 'green'} size="lg">
          {summary.needsAction ? `${summary.needsAction} pending` : 'Handled'}
        </Badge>
      </Motion.section>

      <Card className="missed-calls-table-card">
        <Card.Header
          title="Missed call inbox"
          subtitle="Search callers, filter by follow-up status, and review booking outcomes."
          style={{ paddingBottom: 'var(--space-5)' }}
        />
        <Card.Body style={{ display: 'grid', gap: 'var(--space-5)', paddingTop: 0 }}>
          <div className="missed-calls-toolbar">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
              <label className="missed-calls-search">
                <span className="sr-only">Search missed calls</span>
                <Search size={16} strokeWidth={1.8} aria-hidden="true" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Search patient, phone, status..."
                  aria-label="Search missed calls"
                />
              </label>
              {hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null}
            </div>

            <FilterChipGroup
              value={statusFilter}
              onChange={setStatusFilter}
              aria-label="Filter missed calls by follow-up status"
            >
              {FILTERS.map(filter => (
                <FilterChip
                  key={filter.value}
                  value={filter.value}
                  count={statusCounts[filter.value] || 0}
                >
                  {filter.label}
                </FilterChip>
              ))}
            </FilterChipGroup>
          </div>

          {showCelebration ? (
            <EmptyState
              icon={CheckCircle}
              title="No missed calls today"
              description="Every call today has been answered or auto-replied to. Keep it up."
              style={{
                border: 'calc(var(--space-0-5) / 2) solid var(--color-success-border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-success-bg)',
              }}
            />
          ) : filteredCalls.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No missed calls match these filters"
              description="Try a different search term or status filter to widen the inbox."
              action={{ label: 'Clear filters', variant: 'secondary', onClick: clearFilters }}
              style={{
                border: 'calc(var(--space-0-5) / 2) solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-subtle)',
              }}
            />
          ) : (
            <Table aria-label="Missed calls table" zebra stickyHeader>
              <Table.Head>
                <tr>
                  <Table.HeadCell width="24%">Patient</Table.HeadCell>
                  <Table.HeadCell width="16%">Phone</Table.HeadCell>
                  <Table.HeadCell width="14%">Time</Table.HeadCell>
                  <Table.HeadCell width="13%">Status</Table.HeadCell>
                  <Table.HeadCell width="17%">AI Follow-up</Table.HeadCell>
                  <Table.HeadCell width="16%">Booking Status</Table.HeadCell>
                  <Table.HeadCell width="14%">Actions</Table.HeadCell>
                </tr>
              </Table.Head>
              <Table.Body>
                {filteredCalls.map((call, index) => {
                  const status = STATUS[call.followUpStatus] || STATUS['No Response']
                  return (
                    <Motion.tr
                      key={call.id}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.025, duration: 0.18 }}
                      style={{
                        '--badge-subtle-bg': index % 2 ? 'var(--color-surface)' : undefined,
                      }}
                    >
                      <Table.Cell mobileLabel="Patient">
                        <div className="missed-calls-patient">
                          <span className="missed-calls-avatar" aria-hidden="true">
                            <PhoneMissed size={16} strokeWidth={1.8} />
                          </span>
                          <span style={{ display: 'grid', gap: 'var(--space-1)', minWidth: 0 }}>
                            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                              {call.name}
                            </span>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                              {call.id}
                            </span>
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell mono mobileLabel="Phone">{call.phone}</Table.Cell>
                      <Table.Cell mobileLabel="Time">
                        <span style={{ display: 'grid', gap: 'var(--space-1)' }}>
                          <span style={{ fontWeight: 700 }}>{call.time}</span>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>{call.date}</span>
                        </span>
                      </Table.Cell>
                      <Table.Cell mobileLabel="Status">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </Table.Cell>
                      <Table.Cell mobileLabel="AI Follow-up">
                        <span style={{ display: 'grid', gap: 'var(--space-1)' }}>
                          <Badge variant={status.variant} type="dot">{status.aiLabel}</Badge>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                            Sent {call.followUpTime}
                          </span>
                        </span>
                      </Table.Cell>
                      <Table.Cell mobileLabel="Booking Status">
                        {call.convertedTo ? (
                          <Badge variant="green">{call.convertedTo}</Badge>
                        ) : (
                          <Badge variant={call.followUpStatus === 'No Response' ? 'yellow' : 'default'}>
                            Not booked
                          </Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell mobileLabel="Actions">
                        <Badge variant={status.actionVariant} type="outline">
                          {status.actionLabel}
                        </Badge>
                      </Table.Cell>
                    </Motion.tr>
                  )
                })}
              </Table.Body>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Card variant="flat">
        <Card.Header
          title="How missed call follow-up works"
          subtitle="The workflow remains automatic so staff can focus on callers who still need a human response."
        />
        <Card.Body>
          <div className="missed-calls-steps">
            {[
              { step: '1', title: 'Call missed', desc: 'A patient calls the clinic and the call is not answered.', icon: PhoneMissed },
              { step: '2', title: 'Auto detected', desc: 'TrikMed detects the missed call and starts the follow-up flow.', icon: Clock },
              { step: '3', title: 'WhatsApp sent', desc: 'The patient receives the booking link and can reply directly.', icon: MessageCircle },
              { step: '4', title: 'Booking tracked', desc: 'Created appointments and replies appear in this inbox.', icon: CheckCircle },
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.step} className="missed-calls-step">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Badge variant="navy" type="solid">{item.step}</Badge>
                    <Icon size={18} strokeWidth={1.8} style={{ color: 'var(--color-blue)' }} aria-hidden="true" />
                  </div>
                  <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-h5)', fontWeight: 600 }}>
                      {item.title}
                    </h3>
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card.Body>
      </Card>
    </main>
  )
}
