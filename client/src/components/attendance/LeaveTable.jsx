import React, { useMemo, useCallback } from 'react'
import { Badge } from '../TailAdminComponents'
import { Table } from '../FormComponents'
import { Eye, Trash2, AlertCircle } from 'lucide-react'

export const formatDateISO = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

export const formatDatePretty = (dateStr) => {
  if (!dateStr) return ''
  const iso = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

export const formatTimePretty = (timeStr) => {
  if (!timeStr) return ''
  const [hhRaw, mmRaw] = String(timeStr).split(':')
  const hh = parseInt(hhRaw, 10)
  const mm = parseInt(mmRaw, 10)
  if (Number.isNaN(hh) || Number.isNaN(mm)) return timeStr
  const d = new Date()
  d.setHours(hh, mm, 0, 0)
  return new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit' }).format(d)
}

export const calculateDuration = (leave) => {
  const type = leave?.type
  if (type === 'Half Day') return '0.5 day'
  if (type === 'Short Leave') return 'Short'
  if (type === 'Early Leave') return 'Early'

  const startIso = formatDateISO(leave?.start_date)
  const endIso = formatDateISO(leave?.end_date) || startIso
  if (!startIso) return '—'
  const start = new Date(startIso)
  const end = new Date(endIso)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—'
  if (end < start) return '—'
  
  let workingDays = 0
  let currentDate = new Date(start)
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  const diffDays = workingDays
  return `${diffDays} day${diffDays === 1 ? '' : 's'}`
}

export const renderDetails = (leave) => {
  const type = leave?.type
  if (type === 'Half Day') return leave?.half_day_period || '—'
  if ((type === 'Short Leave' || type === 'Early Leave') && leave?.short_leave_time) {
    return `Time: ${formatTimePretty(leave.short_leave_time)}`
  }
  if (type === 'Compensation') {
    const workedDate = leave?.compensation_worked_date ? formatDatePretty(leave.compensation_worked_date) : ''
    const workedTime = leave?.compensation_worked_time || ''
    if (!workedDate && !workedTime) return '—'
    if (workedDate && workedTime) return `Worked: ${workedDate} • ${workedTime}`
    if (workedDate) return `Worked: ${workedDate}`
    return `Worked: ${workedTime}`
  }
  return '—'
}

export default function LeaveTable({ 
  data, 
  loading, 
  user, 
  onView, 
  onCancel, 
  showEmployee = true,
  showActions = true,
  pageSize = 10 
}) {
  const columns = useMemo(() => {
    const cols = [
      { label: 'Applied On', key: 'created_at', render: (createdAt) => {
        if (!createdAt) return <span className="text-slate-400">—</span>
        const pretty = formatDatePretty(createdAt)
        return pretty ? <span className="font-medium text-slate-700">{pretty}</span> : <span className="text-slate-400">—</span>
      }}
    ]

    if (showEmployee) {
      cols.push({ label: 'Employee', key: 'userName', render: (userName, row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-700">{userName}</span>
          <span className="text-xs text-slate-400 font-medium">{row.userRole}</span>
        </div>
      )})
    }

    cols.push(
      { label: 'Leave Type', key: 'type', render: (type, row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">{type}</span>
            {row.is_emergency && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 uppercase tracking-tight border border-red-100">
                <AlertCircle size={10} /> Emergency
              </span>
            )}
          </div>
        </div>
      )},
      { label: 'Period', key: 'dates', render: (_, row) => (
        <div className="flex flex-col text-xs font-medium text-slate-600">
          {row.type === 'Half Day' ? (
            <span>{formatDatePretty(row.start_date)} ({row.half_day_period})</span>
          ) : formatDateISO(row.start_date) === formatDateISO(row.end_date) ? (
            <span>{formatDatePretty(row.start_date)}</span>
          ) : (
            <span className="whitespace-nowrap">
              {formatDatePretty(row.start_date)} → {formatDatePretty(row.end_date)}
            </span>
          )}
        </div>
      )},
      { label: 'Duration', key: 'duration', render: (_, row) => (
        <span className="font-medium text-slate-700">{calculateDuration(row)}</span>
      )},
      { label: 'Details', key: 'details', render: (_, row) => (
        <span className="text-xs font-medium text-slate-600">{renderDetails(row)}</span>
      )},
      { label: 'Status', key: 'status', render: (status) => {
        let gradient = 'from-slate-500 to-slate-300'
        if (status === 'Approved') gradient = 'from-green-600 to-lime-400'
        if (status === 'Rejected') gradient = 'from-red-600 to-rose-400'
        if (status === 'Submitted' || status === 'Pending Approval') gradient = 'from-blue-600 to-cyan-400'
        if (status === 'Cancelled') gradient = 'from-slate-600 to-slate-400'
        
        return <Badge gradient={gradient}>{status}</Badge>
      }}
    )

    if (showActions) {
      cols.push({ label: 'Actions', key: 'actions', render: (_, row) => (
        <div className="flex gap-2">
          {onView && (
            <button 
              onClick={() => onView(row)}
              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              title="View Details"
            >
              <Eye size={16} />
            </button>
          )}
          {onCancel && row.user_id === user?.id && (row.status === 'Submitted' || row.status === 'Pending Approval') && (
            <button 
              onClick={() => onCancel(row.id)}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              title="Cancel"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )})
    }

    return cols
  }, [showEmployee, showActions, onView, onCancel, user?.id])

  return (
    <Table 
      columns={columns} 
      data={data} 
      loading={loading}
      pagination={true} 
      pageSize={pageSize} 
    />
  )
}
