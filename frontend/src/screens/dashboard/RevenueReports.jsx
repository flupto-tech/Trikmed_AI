'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  IndianRupee, TrendingUp, TrendingDown, Calendar,
  ArrowUpRight, ArrowDownRight, RefreshCw, BarChart2,
  PieChart as PieIcon, ShieldAlert, Download
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { can } from '../../utils/auth'
import { dashboardApi } from '../../services/dashboardApi'
import { Button, FilterChip } from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'

// Custom tooltip for comparison chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl px-4 py-3 text-[12.5px]"
        style={{ background: 'var(--tm-surface,#fff)', border: '1px solid #DDE4F0', boxShadow: '0 4px 16px rgba(15,45,94,0.1)' }}>
        <p className="font-bold mb-1.5" style={{ color: 'var(--tm-text,#0F2D5E)' }}>{label}</p>
        {payload.map(p => (
          <div key={p.name} className="flex items-center gap-2 font-semibold py-0.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
            <span style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>
              {p.name === 'current' ? 'Current Period' : 'Previous Period'}:
            </span>
            <span style={{ color: 'var(--tm-text,#0F2D5E)' }}>
              ₹{p.value.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

function formatCurrency(value = 0) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function formatPercent(value = 0) {
  return `${Number(value || 0).toLocaleString('en-IN')}%`
}

function buildReportRows(breakdowns = {}) {
  const paymentTotal = breakdowns.payment_modes?.reduce((sum, item) => sum + item.value, 0) || 0
  const serviceTotal = breakdowns.appointment_types?.reduce((sum, item) => sum + item.value, 0) || 0

  return [
    ...(breakdowns.payment_modes || []).map(item => ({
      section: 'Payment method',
      name: item.name,
      amount: item.value,
      share: paymentTotal > 0 ? Math.round((item.value / paymentTotal) * 100) : 0,
    })),
    ...(breakdowns.appointment_types || []).map(item => ({
      section: 'Service category',
      name: item.name,
      amount: item.value,
      share: serviceTotal > 0 ? Math.round((item.value / serviceTotal) * 100) : 0,
    })),
  ]
}

function exportCsv(rows, selectedPeriod, currentSummary) {
  const lines = [
    ['Revenue report', selectedPeriod],
    ['Period', currentSummary?.label || selectedPeriod],
    ['Current revenue', currentSummary?.current ?? 0],
    ['Previous revenue', currentSummary?.previous ?? 0],
    [],
    ['Section', 'Name', 'Amount', 'Share'],
    ...rows.map(row => [row.section, row.name, row.amount, `${row.share}%`]),
  ]
  const csv = lines.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `revenue-report-${selectedPeriod}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function RevenueReports() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reportsData, setReportsData] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('monthly') // 'monthly' | 'quarterly' | 'yearly'

  const canSeeRevenue = can('view_revenue')

  const fetchReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await dashboardApi.getRevenueReports()
      setReportsData(res)
    } catch (e) {
      console.error('Failed to load revenue reports:', e)
      setError(e?.message || e?.detail || 'Failed to load revenue analytics reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canSeeRevenue) {
      fetchReports()
    }
  }, [canSeeRevenue])

  if (!canSeeRevenue) {
    return (
      <div className="ds-page flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
          <ShieldAlert size={28} style={{ color: '#DC2626' }} />
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--tm-text,#0F2D5E)' }}>Access Denied</h1>
        <p className="text-[14px] max-w-md" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>
          You do not have the required permissions to view clinic revenue & financial analytics reports. Please contact your administrator.
        </p>
      </div>
    )
  }

  if (loading) return <LoadingSpinner message="Loading revenue analytics…" />
  if (error) return <ErrorBanner message={error} onRetry={fetchReports} />

  const { summary = {}, charts = {}, breakdowns = {} } = reportsData || {}

  const currentSummary = summary[selectedPeriod === 'yearly' ? 'year' : selectedPeriod === 'quarterly' ? 'quarter' : 'month'] || {}

  // Compile comparisons
  const monthData = summary.month || {}
  const quarterData = summary.quarter || {}
  const yearData = summary.year || {}

  // Selection controls
  const periods = [
    { key: 'monthly', label: 'Monthly' },
    { key: 'quarterly', label: 'Quarterly' },
    { key: 'yearly', label: 'Yearly' }
  ]

  const chartData = selectedPeriod === 'quarterly' ? charts.quarterly : charts.monthly

  // Calculate max breakdown values for progress bars
  const maxPayment = breakdowns.payment_modes?.reduce((max, item) => Math.max(max, item.value), 1) || 1
  const maxAppType = breakdowns.appointment_types?.reduce((max, item) => Math.max(max, item.value), 1) || 1
  const reportRows = buildReportRows(breakdowns)
  const hasPaymentData = (breakdowns.payment_modes?.length || 0) > 0
  const hasServiceData = (breakdowns.appointment_types?.length || 0) > 0
  const hasChartData = (chartData?.length || 0) > 0

  return (
    <div className="ds-page revenue-page space-y-8">
      <style>{`
        .revenue-page {
          padding-inline: clamp(var(--space-4), 2vw, var(--space-6));
        }
        .revenue-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
          margin-bottom: var(--space-4);
        }
        .revenue-section-heading h2 {
          margin: 0;
          font-family: var(--font-display);
          font-size: var(--text-h4);
          font-weight: 700;
          color: var(--color-text-primary);
        }
        .revenue-section-heading p {
          margin: var(--space-1) 0 0;
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }
        .revenue-chart-card {
          border: calc(var(--space-0-5) / 2) solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface);
          box-shadow: var(--shadow-sm);
        }
        .revenue-chart-shell {
          min-height: 320px;
        }
        @media (max-width: 760px) {
          .revenue-page {
            padding-inline: var(--space-3);
          }
          .revenue-section-heading {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="ds-section-title">Revenue Analytics</h1>
          <p className="ds-section-subtitle mt-1">
            Compare financial performance across monthly, quarterly, and yearly intervals.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchReports}
            isLoading={loading}
          >
            Refresh Data
          </Button>
          <Button
            icon={Download}
            onClick={() => exportCsv(reportRows, selectedPeriod, currentSummary)}
            disabled={reportRows.length === 0}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Comparisons Row (Month, Quarter, Year Cards) */}
      <section>
        <div className="revenue-section-heading">
          <div>
            <h2>Revenue overview</h2>
            <p>Switch periods to compare collections and growth against the previous interval.</p>
          </div>
          <Badge variant={currentSummary.trend === 'up' ? 'green' : 'red'} size="lg">
            {currentSummary.trend === 'up' ? 'Growing' : 'Declining'} {formatPercent(Math.abs(currentSummary.percentage_change || 0))}
          </Badge>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { key: 'monthly', title: 'Monthly Revenue', data: monthData, color: 'var(--tm-text,#0F2D5E)' },
          { key: 'quarterly', title: 'Quarterly Revenue', data: quarterData, color: '#1A5CB5' },
          { key: 'yearly', title: 'Yearly Revenue', data: yearData, color: '#E5402B' }
        ].map(card => {
          const isSelected = selectedPeriod === card.key
          const trendUp = card.data.trend === 'up'
          return (
            <motion.div
              key={card.key}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedPeriod(card.key)}
              className="ds-card cursor-pointer transition-all duration-200"
              style={{
                borderColor: isSelected ? card.color : '#DDE4F0',
                borderWidth: isSelected ? '2px' : '1px',
                boxShadow: isSelected ? `0 6px 20px rgba(15,45,94,0.08)` : 'none'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${card.color}15` }}>
                  <IndianRupee size={18} style={{ color: card.color }} />
                </div>
                <div className={`flex items-center gap-1 text-[12px] font-bold px-2 py-0.5 rounded-md ${
                  trendUp ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'
                }`}>
                  {trendUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {card.data.percentage_change}%
                </div>
              </div>

              <span className="text-[13px] font-semibold text-[#6B7A9A] uppercase tracking-wider">{card.title}</span>
              <p className="text-[26px] font-bold mt-1.5 leading-none" style={{ color: 'var(--tm-text,#0F2D5E)' }}>
                ₹{(card.data.current ?? 0).toLocaleString('en-IN')}
              </p>

              <div className="flex items-center justify-between mt-5 pt-3 text-[12px]"
                style={{ borderTop: '1px solid #EFF2F7' }}>
                <span className="text-[#6B7A9A]">Previous: ₹{(card.data.previous ?? 0).toLocaleString('en-IN')}</span>
                <span className="font-semibold text-[#0F2D5E]">{card.data.label}</span>
              </div>
            </motion.div>
          )
        })}
      </div>
      </section>

      {/* Main Graph Card */}
      <section>
      <div className="revenue-section-heading">
        <div>
          <h2>Charts</h2>
          <p>Revenue trend, payment methods, and service/category contribution.</p>
        </div>
      </div>
      <div className="ds-card revenue-chart-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-[15px] font-bold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>
              Revenue Performance Overview ({selectedPeriod === 'yearly' ? 'Monthly Trend' : currentSummary.label})
            </h3>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>
              Comparing current performance vs the previous corresponding period.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {periods.map(p => (
              <FilterChip
                key={p.key}
                isActive={selectedPeriod === p.key}
                onClick={() => setSelectedPeriod(p.key)}
              >
                {p.label}
              </FilterChip>
            ))}
          </div>
        </div>

        {hasChartData ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0F2D5E" stopOpacity={0.16} />
                <stop offset="95%" stopColor="#0F2D5E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="previousGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D3D1C7" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#D3D1C7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#DDE4F0" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#6B7A9A', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6B7A9A', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip selectedPeriod={selectedPeriod} />} />
            <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" />
            <Area
              type="monotone"
              dataKey="current"
              stroke="#0F2D5E"
              strokeWidth={2.5}
              fill="url(#currentGrad)"
              name="Current Period"
              dot={{ fill: '#0F2D5E', r: 3 }}
            />
            <Area
              type="monotone"
              dataKey="previous"
              stroke="#B3B1A7"
              strokeDasharray="4 4"
              strokeWidth={2}
              fill="url(#previousGrad)"
              name="Previous Period"
              dot={{ fill: '#B3B1A7', r: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        ) : (
          <EmptyState
            icon={BarChart2}
            title="No revenue trend yet"
            description="Revenue trend data appears after paid appointments are available for this period."
            style={{ minHeight: 280 }}
          />
        )}
      </div>

      {/* Breakdowns section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Payment Modes Breakdown */}
        <div className="ds-card">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#0F2D5E]/10">
              <BarChart2 size={16} style={{ color: 'var(--tm-text,#0F2D5E)' }} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>Payment Channel Breakdown</h3>
              <p className="text-[12px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Revenue distribution by transaction mode</p>
            </div>
          </div>

          {hasPaymentData ? (
            <div style={{ height: 220, marginBottom: 'var(--space-5)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdowns.payment_modes} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" name="Revenue" fill="var(--color-navy)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={BarChart2}
              title="No payment data yet"
              description="Payment method revenue appears after paid appointments are recorded."
              style={{ minHeight: 220, padding: 'var(--space-8) var(--space-4)' }}
            />
          )}

          <div className="space-y-4">
            {breakdowns.payment_modes?.map((item, idx) => {
              const pct = Math.round((item.value / maxPayment) * 100)
              const totalAmount = breakdowns.payment_modes.reduce((acc, x) => acc + x.value, 0) || 1
              const itemPct = Math.round((item.value / totalAmount) * 100)
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between text-[13px] font-semibold">
                    <span style={{ color: 'var(--tm-text,#0F2D5E)' }}>{item.name}</span>
                    <span style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>
                      ₹{item.value.toLocaleString('en-IN')} <span className="text-[11px] font-medium ml-1">({itemPct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-gray-700 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: idx === 0 ? '#0F2D5E' : idx === 1 ? '#1A5CB5' : '#E5402B' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Appointment Types Breakdown */}
        <div className="ds-card">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#E5402B]/10">
              <PieIcon size={16} style={{ color: '#E5402B' }} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--tm-text,#0F2D5E)' }}>Consultation Stream Breakdown</h3>
              <p className="text-[12px]" style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>Revenue contribution by appointment type</p>
            </div>
          </div>

          {hasServiceData ? (
            <div style={{ height: 220, marginBottom: 'var(--space-5)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdowns.appointment_types} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" name="Revenue" fill="var(--color-coral)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={PieIcon}
              title="No service data yet"
              description="Service/category revenue appears after paid appointments are grouped by type."
              style={{ minHeight: 220, padding: 'var(--space-8) var(--space-4)' }}
            />
          )}

          <div className="space-y-4">
            {breakdowns.appointment_types?.map((item, idx) => {
              const pct = Math.round((item.value / maxAppType) * 100)
              const totalAmount = breakdowns.appointment_types.reduce((acc, x) => acc + x.value, 0) || 1
              const itemPct = Math.round((item.value / totalAmount) * 100)
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between text-[13px] font-semibold">
                    <span style={{ color: 'var(--tm-text,#0F2D5E)' }}>{item.name}</span>
                    <span style={{ color: 'var(--tm-text-muted,#6B7A9A)' }}>
                      ₹{item.value.toLocaleString('en-IN')} <span className="text-[11px] font-medium ml-1">({itemPct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-gray-700 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: idx === 0 ? '#E5402B' : idx === 1 ? '#0F2D5E' : '#1A5CB5' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      </section>

      <section>
        <div className="revenue-section-heading">
          <div>
            <h2>Detailed report</h2>
            <p>Breakdown rows used for operational review and CSV export.</p>
          </div>
          <Button
            variant="secondary"
            icon={Download}
            onClick={() => exportCsv(reportRows, selectedPeriod, currentSummary)}
            disabled={reportRows.length === 0}
          >
            Export CSV
          </Button>
        </div>

        {reportRows.length > 0 ? (
          <Table aria-label="Revenue detailed report" zebra stickyHeader>
            <Table.Head>
              <Table.Row>
                <Table.HeadCell>Section</Table.HeadCell>
                <Table.HeadCell>Name</Table.HeadCell>
                <Table.HeadCell align="right">Amount</Table.HeadCell>
                <Table.HeadCell align="right">Share</Table.HeadCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {reportRows.map((row) => (
                <Table.Row key={`${row.section}-${row.name}`}>
                  <Table.Cell mobileLabel="Section">
                    <Badge variant={row.section === 'Payment method' ? 'blue' : 'coral'} size="md">
                      {row.section}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell mobileLabel="Name">{row.name}</Table.Cell>
                  <Table.Cell align="right" mono mobileLabel="Amount">{formatCurrency(row.amount)}</Table.Cell>
                  <Table.Cell align="right" mobileLabel="Share">
                    <span style={{ fontWeight: 700 }}>{formatPercent(row.share)}</span>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <EmptyState
            icon={IndianRupee}
            title="No revenue data yet"
            description="Revenue entries appear when appointments are marked as paid."
          />
        )}
      </section>
    </div>
  )
}
