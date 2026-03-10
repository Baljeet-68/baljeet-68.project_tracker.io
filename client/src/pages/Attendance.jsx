import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, CardHeader, CardBody, Badge, Button, PageHeader } from '../components/TailAdminComponents'
import { Table, Modal, InputGroup, Select, Alert, ConfirmDialog } from '../components/FormComponents'
import { 
  Calendar as CalendarIcon, Clock, Users, CheckCircle, XCircle, 
  AlertCircle, Search, Filter, Plus, ClipboardList, History,
  Check, X, Trash2, Eye
} from 'lucide-react'
import { Loader } from '../components/Loader'
import { API_BASE_URL } from '../apiConfig'
import { getUser, authFetch } from '../auth'
import { handleError, handleApiResponse } from '../utils/errorHandler'
import toast from 'react-hot-toast'
import PageContainer from '../components/layout/PageContainer'

export default function Attendance() {
  const location = useLocation()
  const [searchTerm, setSearchTerm] = useState('')
  const [user] = useState(getUser())
  const now = useMemo(() => new Date(), [])
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-12
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth) // 1-12
  
  // Leave state
  const [leaves, setLeaves] = useState([])
  const isHRorAdmin = useMemo(() => user.role === 'admin' || user.role === 'hr', [user.role])
  const [activeTab, setActiveTab] = useState(isHRorAdmin ? 'onLeaveToday' : 'leaveHistory')
  const [summary, setSummary] = useState({
    onLeaveToday: 0,
    onHalfDayToday: 0,
    pendingRequests: 0,
    adminPendingRequests: 0,
    myPendingRequests: 0,
    thisMonthLeaves: 0,
    thisMonthHalfDays: 0,
    paidLeaveTaken: 0
  })
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'primary' })
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyRecords, setHistoryRecords] = useState([])
  const [historySearchTerm, setHistorySearchTerm] = useState('')
  const [historyStatus, setHistoryStatus] = useState('all')
  
  const formatDateISO = useCallback((dateStr) => {
    if (!dateStr) return ''
    return dateStr.split('T')[0]
  }, [])

  const formatDatePretty = useCallback((dateStr) => {
    if (!dateStr) return ''
    const iso = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
  }, [])

  const formatTimePretty = useCallback((timeStr) => {
    if (!timeStr) return ''
    // Expect "HH:mm" or "HH:mm:ss"
    const [hhRaw, mmRaw] = String(timeStr).split(':')
    const hh = parseInt(hhRaw, 10)
    const mm = parseInt(mmRaw, 10)
    if (Number.isNaN(hh) || Number.isNaN(mm)) return timeStr
    const d = new Date()
    d.setHours(hh, mm, 0, 0)
    return new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit' }).format(d)
  }, [])

  const formatDateDisplay = useCallback((dateStr) => {
    if (!dateStr) return ''
    const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
    const parts = cleanDateStr.split('-')
    if (parts.length !== 3) return cleanDateStr
    
    const [year, month, day] = parts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthIndex = parseInt(month, 10) - 1
    return `${day}-${months[monthIndex]}-${year}`
  }, [])
  
  // Leave Form State
  const [leaveForm, setLeaveForm] = useState({
    type: 'Full Day',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    half_day_period: 'Morning',
    short_leave_time: '',
    compensation_worked_date: '',
    compensation_worked_time: '',
    reason: '',
    is_emergency: false
  })

  const fetchSummary = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/leaves/stats/summary`)
      const data = await handleApiResponse(res)
      setSummary(data)
    } catch (err) {
      handleError(err)
    }
  }, [])

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/leaves`)
      const data = await handleApiResponse(res)
      setLeaves(data)
    } catch (err) {
      handleError(err)
    }
  }, [])

  const fetchLeaveHistory = useCallback(async (year, month, searchTerm, statusFilter) => {
    try {
      setHistoryLoading(true)
      const params = new URLSearchParams()
      if (year) params.append('year', String(year))
      if (month && month !== 'all') params.append('month', String(month))
      if (!year && !month) {
        // Default to current year/month as per API contract
        params.set('year', String(currentYear))
        params.set('month', String(currentMonth))
      }
      if (searchTerm && searchTerm.trim()) {
        params.set('search', searchTerm.trim())
      }
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      const query = params.toString()
      const url = `${API_BASE_URL}/leaves/history${query ? `?${query}` : ''}`
      const res = await authFetch(url)
      const data = await handleApiResponse(res)
      setHistoryRecords(Array.isArray(data) ? data : [])
    } catch (err) {
      handleError(err)
    } finally {
      setHistoryLoading(false)
    }
  }, [API_BASE_URL, authFetch, currentMonth, currentYear, handleError])

  const availableYears = useMemo(() => {
    const years = new Set([currentYear])
    for (const l of leaves || []) {
      const iso = formatDateISO(l?.start_date)
      const y = iso ? new Date(iso).getFullYear() : NaN
      if (!Number.isNaN(y)) years.add(y)
    }
    return Array.from(years).sort((a, b) => b - a)
  }, [leaves, currentYear, formatDateISO])

  useEffect(() => {
    // Keep the selected year valid if the dataset changes (e.g., after creating/cancelling).
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(currentYear)
    }
  }, [availableYears, selectedYear, currentYear])

  const monthOptions = useMemo(() => ([
    { label: 'All', value: 'all' },
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 },
  ]), [])

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchLeaves(),
      fetchSummary()
    ])
    // Initial history load uses default filters (current year/month), empty search, all statuses
    await fetchLeaveHistory(selectedYear, selectedMonth, historySearchTerm, historyStatus)
  }, [fetchLeaves, fetchSummary, fetchLeaveHistory, selectedYear, selectedMonth, historySearchTerm, historyStatus])

  useEffect(() => {
    if (location.state && location.state.tab) {
      setActiveTab(location.state.tab)
    }
    loadData()
  }, [location.state, loadData])

  // Whenever filters change, reload history
  useEffect(() => {
    fetchLeaveHistory(selectedYear, selectedMonth, historySearchTerm, historyStatus)
  }, [selectedYear, selectedMonth, historySearchTerm, historyStatus, fetchLeaveHistory])

  const handleLeaveSubmit = async (e) => {
    e.preventDefault()
    
    // 0. Date validations
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(leaveForm.start_date)
    startDate.setHours(0, 0, 0, 0)

    // Only Compensation can have past dates
    if (leaveForm.type !== 'Compensation' && startDate < today) {
      toast.error('Leave request cannot be for a past date.')
      return
    }

    // 3-day advance rule for Paid Leave and Full Day Leave (unless emergency)
    if (!leaveForm.is_emergency && (leaveForm.type === 'Paid Leave' || leaveForm.type === 'Full Day')) {
      const threeDaysFromNow = new Date(today)
      threeDaysFromNow.setDate(today.getDate() + 3)
      
      if (startDate < threeDaysFromNow) {
        toast.error('Paid Leave and Full Day Leave must be requested at least 3 days in advance. Use "Emergency Leave" if needed.')
        return
      }
    }

    // 1. Max 2 short leaves per month warning
    if (leaveForm.type === 'Short Leave' || leaveForm.type === 'Early Leave') {
      const monthStart = leaveForm.start_date.substring(0, 7) // YYYY-MM
      const existingShort = leaves.filter(l => 
        l.user_id === user.id &&
        (l.type === 'Short Leave' || l.type === 'Early Leave') && 
        l.start_date.startsWith(monthStart) &&
        l.status !== 'Rejected'
      )
      if (existingShort.length >= 2) {
        if (!window.confirm('Warning: You have already taken 2 short leaves this month. This 3rd request might be rejected or flagged. Do you want to continue?')) {
          return
        }
      }
    }

    setLoading(true)

    const submitData = { ...leaveForm }
    if (!submitData.end_date || submitData.type !== 'Full Day') {
      submitData.end_date = submitData.start_date
    }

    try {
      const res = await authFetch(`${API_BASE_URL}/leaves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      await handleApiResponse(res)

      toast.success('Leave request submitted successfully!')
      setShowLeaveModal(false)
      loadData()
      // Reset form
      setLeaveForm({
        type: 'Full Day',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        half_day_period: 'Morning',
        short_leave_time: '',
        compensation_worked_date: '',
        compensation_worked_time: '',
        reason: '',
        is_emergency: false
      })
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/leaves/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })
      await handleApiResponse(res)
      toast.success(`Leave request ${status} successfully`)
      loadData()
    } catch (err) {
      handleError(err)
    }
  }

  const handleCancelLeave = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Cancel Leave Request',
      message: 'Are you sure you want to cancel this leave request?',
      type: 'danger',
      confirmText: 'Yes, Cancel it',
      onConfirm: async () => {
        try {
          const res = await authFetch(`${API_BASE_URL}/leaves/${id}/cancel`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
          })
          await handleApiResponse(res)
          toast.success('Leave request cancelled')
          loadData()
          setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        } catch (err) {
          handleError(err)
        }
      }
    })
  }

  const calculateDuration = useCallback((leave) => {
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
    const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    if (type === 'Full Day' || type === 'Paid Leave') return `${diffDays} day${diffDays === 1 ? '' : 's'}`
    // Compensation (and any future full-day-like type): show days if it spans more than 1 day, else "1 day"
    return `${diffDays} day${diffDays === 1 ? '' : 's'}`
  }, [formatDateISO])

  const renderDetails = useCallback((leave) => {
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
  }, [formatDatePretty, formatTimePretty])

  const leaveColumns = useMemo(() => [
    { label: 'Applied On', key: 'created_at', render: (createdAt) => {
      if (!createdAt) return <span className="text-slate-400">—</span>
      const pretty = formatDatePretty(createdAt)
      return pretty ? <span className="font-medium text-slate-700">{pretty}</span> : <span className="text-slate-400">—</span>
    }},
    { label: 'Employee', key: 'userName', render: (userName, row) => (
      <div className="flex flex-col">
        <span className="font-bold text-slate-700">{userName}</span>
        <span className="text-xs text-slate-400 font-medium">{row.userRole}</span>
      </div>
    )},
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
    }},
    { label: 'Actions', key: 'actions', render: (_, row) => (
      <div className="flex gap-2">
        <button 
          onClick={() => {
            setSelectedLeave(row)
            setShowDetailsModal(true)
          }}
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          title="View Details"
        >
          <Eye size={16} />
        </button>
        {/* Cancel for Owner */}
        {row.user_id === user.id && (row.status === 'Submitted' || row.status === 'Pending Approval') && (
          <button 
            onClick={() => handleCancelLeave(row.id)}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            title="Cancel"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    )}
  ], [calculateDuration, formatDateISO, formatDatePretty, renderDetails, user.id])

  const historyColumns = useMemo(() => leaveColumns.filter(col => col.key !== 'actions'), [leaveColumns])

  const leaveHistory = useMemo(() => leaves.filter(l => l.user_id === user.id), [leaves, user.id])

  const todayOnLeave = useMemo(() => leaves.filter(l => {
    const today = new Date().toISOString().split('T')[0]
    const startDate = formatDateISO(l.start_date)
    const endDate = formatDateISO(l.end_date)
    return l.status === 'Approved' && today >= startDate && today <= endDate && l.type !== 'Half Day'
  }), [leaves, formatDateISO])

  const todayOnHalfDay = useMemo(() => leaves.filter(l => {
    const today = new Date().toISOString().split('T')[0]
    const startDate = formatDateISO(l.start_date)
    const endDate = formatDateISO(l.end_date)
    return l.status === 'Approved' && today >= startDate && today <= endDate && l.type === 'Half Day'
  }), [leaves, formatDateISO])

  const pendingApproval = useMemo(() => leaves.filter(l => {
    if (l.status !== 'Submitted' && l.status !== 'Pending Approval') return false
    if (user.role === 'admin') {
      return ['hr', 'management', 'accountant'].includes(l.userRole?.toLowerCase())
    }
    if (user.role === 'hr') {
      return ['tester', 'developer', 'ecommerce'].includes(l.userRole?.toLowerCase())
    }
    // For regular users, show their own pending
    return l.user_id === user.id
  }), [leaves, user.id, user.role])

  const canConvertHalfDays = useMemo(() => {
    const approvedHalfDays = leaveHistory.filter(l => l.type === 'Half Day' && l.status === 'Approved')
    return approvedHalfDays.length >= 2
  }, [leaveHistory])

  const handleConvert = async () => {
    if (!window.confirm('Convert 2 approved Half Day leaves into 1 Paid Leave?')) return
    
    setLoading(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/leaves/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await handleApiResponse(res)
      toast.success(data.message || 'Leaves converted successfully')
      loadData()
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  const activeTableData = useMemo(() => {
    let data = []
    if (activeTab === 'onLeaveToday') data = todayOnLeave
    else if (activeTab === 'onHalfDayToday') data = todayOnHalfDay
    else if (activeTab === 'pendingApproval') data = pendingApproval
    else if (activeTab === 'leaveHistory') data = leaveHistory

    const search = searchTerm.trim().toLowerCase()

    return data.filter(l => {
      const startIso = formatDateISO(l?.start_date)
      if (!startIso) return false
      const startDate = new Date(startIso)
      if (Number.isNaN(startDate.getTime())) return false

      const matchesYear = startDate.getFullYear() === Number(selectedYear)
      const matchesMonth = selectedMonth === 'all'
        ? true
        : (startDate.getMonth() + 1) === Number(selectedMonth)

      const matchesSearch = !search
        ? true
        : (
          l.userName?.toLowerCase().includes(search) ||
          l.type?.toLowerCase().includes(search)
        )

      return matchesYear && matchesMonth && matchesSearch
    })
  }, [activeTab, todayOnLeave, todayOnHalfDay, pendingApproval, leaveHistory, searchTerm, selectedYear, selectedMonth, formatDateISO])

  if (loading && leaves.length === 0) {
    return <Loader message="Loading attendance data..." />
  }

  return (
    <PageContainer>
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Leave Management"
        subtitle="Manage and track leave requests"
        actions={user.role !== 'admin' ? (
          <Button variant="primary" size="sm" className="flex items-center gap-2" onClick={() => setShowLeaveModal(true)}>
            <Plus size={14} /> Request Leave
          </Button>
        ) : null}
      />

      {/* Summary Stats */}
      {user.role !== 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-soft-lg">
                <CalendarIcon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">This month leaves (Taken only)</p>
                <h5 className="text-xl font-bold text-slate-700">{summary.thisMonthLeaves}</h5>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-green-600 to-lime-400 flex items-center justify-center text-white shadow-soft-lg">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">This month halfday (Taken only)</p>
                <h5 className="text-xl font-bold text-slate-700">{summary.thisMonthHalfDays}</h5>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-orange-500 to-yellow-400 flex items-center justify-center text-white shadow-soft-lg">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paid leave pending</p>
                <h5 className="text-xl font-bold text-slate-700">{summary.paidLeaveTaken}</h5>
              </div>
            </div>
          </Card>
        </div>
      )}

      {isHRorAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-slate-600 to-slate-400 flex items-center justify-center text-white shadow-soft-lg">
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">On Leave Today</p>
                <h5 className="text-xl font-bold text-slate-700">{summary.onLeaveToday}</h5>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-slate-500 to-slate-300 flex items-center justify-center text-white shadow-soft-lg">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">On Halfday</p>
                <h5 className="text-xl font-bold text-slate-700">{summary.onHalfDayToday}</h5>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-orange-400 to-amber-200 flex items-center justify-center text-white shadow-soft-lg">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Request</p>
                <h5 className="text-xl font-bold text-slate-700">{summary.pendingRequests}</h5>
              </div>
            </div>
          </Card>
          {user.role === 'admin' && (
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-red-600 to-rose-400 flex items-center justify-center text-white shadow-soft-lg">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Pending</p>
                  <h5 className="text-xl font-bold text-slate-700">{summary.adminPendingRequests}</h5>
                </div>
              </div>
            </Card>
          )}
          {user.role === 'hr' && (
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-purple-700 to-pink-500 flex items-center justify-center text-white shadow-soft-lg">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Pending</p>
                  <h5 className="text-xl font-bold text-slate-700">{summary.myPendingRequests}</h5>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              {isHRorAdmin && (
                <>
                  <button 
                    onClick={() => setActiveTab('onLeaveToday')}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'onLeaveToday' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    On Leave Today
                  </button>
                  <button 
                    onClick={() => setActiveTab('onHalfDayToday')}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'onHalfDayToday' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    On Half Day Today
                  </button>
                  <button 
                    onClick={() => setActiveTab('pendingApproval')}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'pendingApproval' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    Pending for Approval
                  </button>
                </>
              )}
              {user.role !== 'admin' && (
                <button 
                  onClick={() => setActiveTab('leaveHistory')}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'leaveHistory' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  My Leaves History
                </button>
              )}
            </div>
            <div className="flex flex-col lg:flex-row items-stretch gap-3 w-full md:w-auto">
              {activeTab === 'leaveHistory' && canConvertHalfDays && (
                <Button variant="outline" size="xs" onClick={handleConvert} className="text-xs">
                  Convert 2 Half Days
                </Button>
              )}
              <div className="w-full md:w-32">
                <Select
                  label="Year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  options={availableYears.map(y => ({ label: String(y), value: y }))}
                  containerClassName="mb-0"
                />
              </div>
              <div className="w-full md:w-40">
                <Select
                  label="Month"
                  value={selectedMonth}
                  onChange={(e) => {
                    const v = e.target.value
                    setSelectedMonth(v === 'all' ? 'all' : parseInt(v, 10))
                  }}
                  options={monthOptions}
                  containerClassName="mb-0"
                />
              </div>
              <div className="relative w-full md:w-64">
                <InputGroup
                  label="Search"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search size={16} className="text-slate-400" />}
                />
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <Table 
              columns={activeTab === 'onLeaveToday' || activeTab === 'onHalfDayToday' ? leaveColumns.filter(c => c.key !== 'actions') : leaveColumns} 
              data={activeTableData} 
              pagination={true} 
              pageSize={10} 
            />
          </CardBody>
        </Card>
      </div>

      {/* Leave History Section */}
      <div className="flex flex-col gap-4 mt-10">
        <Card>
          <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h6 className="font-bold text-slate-800">Leave History</h6>
              <p className="text-sm text-slate-500 font-medium">
                View historical leave records with year and month filters.
              </p>
            </div>
            <div className="flex flex-col lg:flex-row items-stretch gap-3 w-full md:w-auto">
              <div className="w-full sm:w-32">
                <Select
                  label="Year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  options={availableYears.map(y => ({ label: String(y), value: y }))}
                  containerClassName="mb-0"
                />
              </div>
              <div className="w-full sm:w-44">
                <Select
                  label="Month"
                  value={selectedMonth}
                  onChange={(e) => {
                    const v = e.target.value
                    setSelectedMonth(v === 'all' ? 'all' : parseInt(v, 10))
                  }}
                  options={monthOptions}
                  containerClassName="mb-0"
                />
              </div>
              <div className="w-full sm:w-40">
                <Select
                  label="Status"
                  value={historyStatus}
                  onChange={(e) => setHistoryStatus(e.target.value)}
                  options={[
                    { label: 'All', value: 'all' },
                    { label: 'Submitted', value: 'Submitted' },
                    { label: 'Pending Approval', value: 'Pending Approval' },
                    { label: 'Approved', value: 'Approved' },
                    { label: 'Rejected', value: 'Rejected' },
                    { label: 'Cancelled', value: 'Cancelled' },
                  ]}
                  containerClassName="mb-0"
                />
              </div>
              <div className="relative w-full lg:w-64">
                <InputGroup
                  label="Search"
                  placeholder="Search by employee..."
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  icon={<Search size={16} className="text-slate-400" />}
                />
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <Table
              columns={historyColumns}
              data={historyRecords}
              loading={historyLoading}
              pagination={true}
              pageSize={10}
            />
          </CardBody>
        </Card>
      </div>

      {/* Leave Request Modal */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Request Leave"
        size="lg"
      >
        <form onSubmit={handleLeaveSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Leave Type"
              value={leaveForm.type}
              onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value})}
              options={[
                { label: 'Full Day Leave', value: 'Full Day' },
                { label: 'Half Day Leave', value: 'Half Day' },
                { label: 'Early Leave', value: 'Early Leave' },
                { label: 'Short Leave', value: 'Short Leave' },
                { label: 'Compensation Leave', value: 'Compensation' },
                { label: 'Paid Leave', value: 'Paid Leave' },
              ]}
              required
            />
            <InputGroup
              label={leaveForm.type === 'Full Day' ? "Start Date" : "Date of Leave"}
              type="date"
              value={leaveForm.start_date}
              onChange={(e) => setLeaveForm({...leaveForm, start_date: e.target.value})}
              min={leaveForm.type === 'Compensation' ? undefined : new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id="is_emergency"
              checked={leaveForm.is_emergency}
              onChange={(e) => setLeaveForm({...leaveForm, is_emergency: e.target.checked})}
              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
            />
            <label htmlFor="is_emergency" className="text-sm font-bold text-slate-600 cursor-pointer flex items-center gap-1">
              Emergency Leave 
              <span className="text-[10px] font-medium text-slate-400 normal-case">(Bypass 3-day rule)</span>
            </label>
          </div>

          {leaveForm.type === 'Full Day' ? (
            <InputGroup
              label="End Date"
              type="date"
              value={leaveForm.end_date}
              onChange={(e) => setLeaveForm({...leaveForm, end_date: e.target.value})}
              min={leaveForm.start_date || new Date().toISOString().split('T')[0]}
              placeholder="Leave blank if same as start date"
            />
          ) : null}

          {leaveForm.type === 'Half Day' && (
            <Select
              label="Half Day Period"
              value={leaveForm.half_day_period}
              onChange={(e) => setLeaveForm({...leaveForm, half_day_period: e.target.value})}
              options={[
                { label: 'Morning Session', value: 'Morning' },
                { label: 'Afternoon Session', value: 'Afternoon' },
              ]}
            />
          )}

          {(leaveForm.type === 'Early Leave' || leaveForm.type === 'Short Leave') && (
            <InputGroup
              label="Time"
              type="time"
              value={leaveForm.short_leave_time}
              onChange={(e) => setLeaveForm({...leaveForm, short_leave_time: e.target.value})}
              required
            />
          )}

          {leaveForm.type === 'Compensation' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-3 rounded-xl bg-slate-50">
              <InputGroup
                label="Worked Date"
                type="date"
                value={leaveForm.compensation_worked_date}
                onChange={(e) => setLeaveForm({...leaveForm, compensation_worked_date: e.target.value})}
                required
              />
              <InputGroup
                label="Worked Duration"
                placeholder="e.g. 4 hours"
                value={leaveForm.compensation_worked_time}
                onChange={(e) => setLeaveForm({...leaveForm, compensation_worked_time: e.target.value})}
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Reason</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all min-h-[100px] text-sm text-slate-700 font-medium"
              placeholder="Explain the reason for your leave request..."
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowLeaveModal(false)} type="button">Cancel</Button>
            <Button variant="primary" type="submit" loading={loading}>Submit Request</Button>
          </div>
        </form>
      </Modal>

      {/* Leave Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedLeave(null)
        }}
        title="Leave Request Details"
        size="md"
      >
        {selectedLeave && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Employee</p>
                <p className="font-bold text-slate-700">{selectedLeave.userName}</p>
                <p className="text-xs text-slate-500 font-medium">{selectedLeave.userRole}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                <div className="mt-1">
                  {(() => {
                    let gradient = 'from-slate-500 to-slate-300'
                    if (selectedLeave.status === 'Approved') gradient = 'from-green-600 to-lime-400'
                    if (selectedLeave.status === 'Rejected') gradient = 'from-red-600 to-rose-400'
                    if (selectedLeave.status === 'Submitted' || selectedLeave.status === 'Pending Approval') gradient = 'from-blue-600 to-cyan-400'
                    if (selectedLeave.status === 'Cancelled') gradient = 'from-slate-600 to-slate-400'
                    return <Badge gradient={gradient}>{selectedLeave.status}</Badge>
                  })()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Leave Type</p>
                <p className="font-medium text-slate-600">{selectedLeave.type}</p>
                {selectedLeave.is_emergency && (
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight flex items-center gap-0.5">
                    <AlertCircle size={10} /> Emergency
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Period</p>
                <div className="text-sm font-medium text-slate-600">
                  {selectedLeave.type === 'Half Day' ? (
                    <span>{formatDateDisplay(selectedLeave.start_date)} ({selectedLeave.half_day_period})</span>
                  ) : formatDateISO(selectedLeave.start_date) === formatDateISO(selectedLeave.end_date) ? (
                    <span>{formatDateDisplay(selectedLeave.start_date)}</span>
                  ) : (
                    <div className="flex flex-col">
                      <span>From: {formatDateDisplay(selectedLeave.start_date)}</span>
                      <span>To: {formatDateDisplay(selectedLeave.end_date)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(selectedLeave.type === 'Early Leave' || selectedLeave.type === 'Short Leave') && selectedLeave.short_leave_time && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Time</p>
                <p className="text-sm font-medium text-slate-600">{selectedLeave.short_leave_time}</p>
              </div>
            )}

            {selectedLeave.type === 'Compensation' && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Compensation Details</p>
                <div className="grid grid-cols-2 gap-4 text-sm font-medium text-slate-600">
                  <div>
                    <span className="text-slate-400 text-xs block">Worked Date</span>
                    {formatDateDisplay(selectedLeave.compensation_worked_date)}
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Worked Duration</span>
                    {selectedLeave.compensation_worked_time}
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Reason</p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600 font-medium whitespace-pre-wrap">
                {selectedLeave.reason || 'No reason provided.'}
              </div>
            </div>

            {/* Approval/Rejection Actions */}
            {(user.role === 'admin' || user.role === 'hr') && (selectedLeave.status === 'Submitted' || selectedLeave.status === 'Pending Approval') && selectedLeave.user_id !== user.id && (
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="success" 
                  fullWidth
                  className="flex items-center justify-center gap-2"
                  onClick={() => {
                    setConfirmConfig({
                      isOpen: true,
                      title: 'Approve Request',
                      message: `Are you sure you want to APPROVE this leave request for ${selectedLeave.userName}?`,
                      type: 'success',
                      confirmText: 'Approve',
                      onConfirm: () => {
                        handleStatusUpdate(selectedLeave.id, 'Approved')
                        setShowDetailsModal(false)
                        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                      }
                    })
                  }}
                >
                  <Check size={18} /> Approve
                </Button>
                <Button 
                  variant="danger" 
                  fullWidth
                  className="flex items-center justify-center gap-2"
                  onClick={() => {
                    setConfirmConfig({
                      isOpen: true,
                      title: 'Reject Request',
                      message: `Are you sure you want to REJECT this leave request for ${selectedLeave.userName}?`,
                      type: 'danger',
                      confirmText: 'Reject',
                      onConfirm: () => {
                        handleStatusUpdate(selectedLeave.id, 'Rejected')
                        setShowDetailsModal(false)
                        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                      }
                    })
                  }}
                >
                  <X size={18} /> Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
    </PageContainer>
  )
}
