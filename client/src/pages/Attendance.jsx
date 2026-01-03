import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, CardHeader, CardBody, Badge, Button } from '../components/TailAdminComponents'
import { Table, Modal, InputGroup, Select, Alert, ConfirmDialog } from '../components/FormComponents'
import { 
  Calendar as CalendarIcon, Clock, Users, CheckCircle, XCircle, 
  AlertCircle, Search, Filter, Plus, ClipboardList, History,
  Check, X, Trash2, Eye
} from 'lucide-react'
import { API_BASE_URL } from '../apiConfig'
import { getUser } from '../auth'

export default function Attendance() {
  const location = useLocation()
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState(getUser())
  
  // Leave state
  const [leaves, setLeaves] = useState([])
  const isHRorAdmin = user.role === 'admin' || user.role === 'hr'
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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const formatDateISO = (dateStr) => {
    if (!dateStr) return ''
    return dateStr.split('T')[0]
  }

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return ''
    const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
    const parts = cleanDateStr.split('-')
    if (parts.length !== 3) return cleanDateStr
    
    const [year, month, day] = parts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthIndex = parseInt(month, 10) - 1
    return `${day}-${months[monthIndex]}-${year}`
  }
  
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

  useEffect(() => {
    if (location.state && location.state.tab) {
      setActiveTab(location.state.tab)
    }
    loadData()
  }, [location.state])

  const loadData = async () => {
    await Promise.all([
      fetchLeaves(),
      fetchSummary()
    ])
  }

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/leaves/stats/summary`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSummary(data)
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err)
    }
  }

  const fetchLeaves = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/leaves`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        setLeaves(data)
      }
    } catch (err) {
      console.error('Failed to fetch leaves:', err)
    }
  }

  const handleLeaveSubmit = async (e) => {
    e.preventDefault()
    
    // 0. Date validations
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(leaveForm.start_date)
    startDate.setHours(0, 0, 0, 0)

    // Only Compensation can have past dates
    if (leaveForm.type !== 'Compensation' && startDate < today) {
      setError('Leave request cannot be for a past date.')
      return
    }

    // 3-day advance rule for Paid Leave and Full Day Leave (unless emergency)
    if (!leaveForm.is_emergency && (leaveForm.type === 'Paid Leave' || leaveForm.type === 'Full Day')) {
      const threeDaysFromNow = new Date(today)
      threeDaysFromNow.setDate(today.getDate() + 3)
      
      if (startDate < threeDaysFromNow) {
        setError('Paid Leave and Full Day Leave must be requested at least 3 days in advance. Use "Emergency Leave" if needed.')
        return
      }
    }

    // 1. Max 2 short leaves per month warning
    if (leaveForm.type === 'Short Leave' || leaveForm.type === 'Early Leave') {
      const monthStart = leaveForm.start_date.substring(0, 7) // YYYY-MM
      const existingShort = leaveHistory.filter(l => 
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
    setError('')
    setSuccess('')

    const submitData = { ...leaveForm }
    if (!submitData.end_date || submitData.type !== 'Full Day') {
      submitData.end_date = submitData.start_date
    }

    try {
      const res = await fetch(`${API_BASE_URL}/leaves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit leave')

      setSuccess('Leave request submitted successfully!')
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
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/leaves/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        loadData()
      } else {
        const data = await res.json()
        alert(data.error)
      }
    } catch (err) {
      console.error('Failed to update leave status:', err)
    }
  }

  const handleCancelLeave = async (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Cancel Request',
      message: 'Are you sure you want to cancel this leave request?',
      type: 'danger',
      confirmText: 'Yes, Cancel it',
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/leaves/${id}/cancel`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
          if (res.ok) {
            loadData()
            setConfirmConfig(prev => ({ ...prev, isOpen: false }))
          }
        } catch (err) {
          console.error('Failed to cancel leave:', err)
        }
      }
    })
  }

  const leaveColumns = [
    { label: 'Employee', key: 'userName', render: (userName, row) => (
      <div className="flex flex-col">
        <span className="font-bold text-slate-700">{userName}</span>
        <span className="text-xs text-slate-400 font-medium">{row.userRole}</span>
      </div>
    )},
    { label: 'Type', key: 'type', render: (type, row) => (
      <div className="flex flex-col">
        <span className="font-medium text-slate-600">{type}</span>
        {row.is_emergency && (
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight flex items-center gap-0.5">
            <AlertCircle size={10} /> Emergency
          </span>
        )}
      </div>
    )},
    { label: 'Period', key: 'dates', render: (_, row) => (
      <div className="flex flex-col text-xs font-medium text-slate-500">
        {row.type === 'Half Day' ? (
          <span>{formatDateDisplay(row.start_date)} ({row.half_day_period})</span>
        ) : formatDateISO(row.start_date) === formatDateISO(row.end_date) ? (
          <span>{formatDateDisplay(row.start_date)}</span>
        ) : (
          <>
            <span>From: {formatDateDisplay(row.start_date)}</span>
            {row.end_date && <span>To: {formatDateDisplay(row.end_date)}</span>}
          </>
        )}
      </div>
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
  ]

  const myLeaves = leaves.filter(l => l.user_id === user.id)
  
  // Pending requests for current user (HR sees Tester/Dev/Ecom, Admin sees HR/Mgmt/Acc)
  const pendingRequests = leaves.filter(l => {
    if (l.status !== 'Submitted' && l.status !== 'Pending Approval') return false
    if (user.role === 'admin') {
      return ['hr', 'management', 'accountant'].includes(l.userRole?.toLowerCase())
    }
    if (user.role === 'hr') {
      return ['tester', 'developer', 'ecommerce'].includes(l.userRole?.toLowerCase())
    }
    return false
  })

  // All pending requests (for display count or global view)
  const allPending = leaves.filter(l => l.status === 'Submitted' || l.status === 'Pending Approval')

  const todayOnLeave = leaves.filter(l => {
    const today = new Date().toISOString().split('T')[0]
    const startDate = formatDateISO(l.start_date)
    const endDate = formatDateISO(l.end_date)
    return l.status === 'Approved' && today >= startDate && today <= endDate && l.type !== 'Half Day'
  })

  const todayOnHalfDay = leaves.filter(l => {
    const today = new Date().toISOString().split('T')[0]
    const startDate = formatDateISO(l.start_date)
    const endDate = formatDateISO(l.end_date)
    return l.status === 'Approved' && today >= startDate && today <= endDate && l.type === 'Half Day'
  })

  const pendingApproval = leaves.filter(l => {
    if (l.status !== 'Submitted' && l.status !== 'Pending Approval') return false
    if (user.role === 'admin') {
      return ['hr', 'management', 'accountant'].includes(l.userRole?.toLowerCase())
    }
    if (user.role === 'hr') {
      return ['tester', 'developer', 'ecommerce'].includes(l.userRole?.toLowerCase())
    }
    // For regular users, show their own pending
    return l.user_id === user.id
  })

  const leaveHistory = leaves.filter(l => l.user_id === user.id)

  const canConvertHalfDays = () => {
    const approvedHalfDays = leaveHistory.filter(l => l.type === 'Half Day' && l.status === 'Approved')
    return approvedHalfDays.length >= 2
  }

  const handleConvert = async () => {
    if (!window.confirm('Convert 2 approved Half Day leaves into 1 Paid Leave?')) return
    
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/leaves/convert`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setSuccess(data.message)
        loadData()
      } else {
        setError(data.error || 'Failed to convert leaves')
      }
    } catch (err) {
      console.error('Conversion error:', err)
      setError('An error occurred during conversion')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredData = () => {
    let data = []
    if (activeTab === 'onLeaveToday') data = todayOnLeave
    else if (activeTab === 'onHalfDayToday') data = todayOnHalfDay
    else if (activeTab === 'pendingApproval') data = pendingApproval
    else if (activeTab === 'leaveHistory') data = leaveHistory

    return data.filter(l => 
      l.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.type?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const activeTableData = getFilteredData()

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h4 className="font-bold text-slate-700 mb-1">Leave Management</h4>
            <p className="text-sm text-slate-500 font-medium">Manage and track leave requests</p>
          </div>
          <div className="flex gap-3">
            {user.role !== 'admin' && (
              <Button variant="primary" size="sm" className="flex items-center gap-2" onClick={() => setShowLeaveModal(true)}>
                <Plus size={14} /> Request Leave
              </Button>
            )}
          </div>
        </div>
      </Card>

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
            <div className="flex items-center gap-3 w-full md:w-auto">
              {activeTab === 'leaveHistory' && canConvertHalfDays() && (
                <Button variant="outline" size="xs" onClick={handleConvert} className="text-xs">
                  Convert 2 Half Days
                </Button>
              )}
              <div className="relative w-full md:w-64">
                <InputGroup
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

      {/* Leave Request Modal */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Request Leave"
        size="lg"
      >
        <form onSubmit={handleLeaveSubmit} className="space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          
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
  )
}
