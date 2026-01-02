import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody, Badge, Button } from '../components/TailAdminComponents'
import { Table, Modal, InputGroup, Select, Alert } from '../components/FormComponents'
import { 
  Calendar as CalendarIcon, Clock, Users, CheckCircle, XCircle, 
  AlertCircle, Search, Filter, Plus, ClipboardList, History,
  Check, X, Trash2
} from 'lucide-react'
import { API_BASE_URL } from '../apiConfig'
import { getUser } from '../auth'

export default function Attendance() {
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState(getUser())
  
  // Leave state
  const [leaves, setLeaves] = useState([])
  const [activeTab, setActiveTab] = useState('onLeaveToday')
  const [summary, setSummary] = useState({
    onLeaveToday: 0,
    onHalfDayToday: 0,
    pendingRequests: 0,
    adminPendingRequests: 0,
    myPendingRequests: 0
  })
  const [showLeaveModal, setShowLeaveModal] = useState(false)
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
    loadData()
  }, [])

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
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return
    try {
      const res = await fetch(`${API_BASE_URL}/leaves/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        loadData()
      }
    } catch (err) {
      console.error('Failed to cancel leave:', err)
    }
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
        {/* Approve/Reject for HR/Admin */}
        {(user.role === 'admin' || user.role === 'hr') && (row.status === 'Submitted' || row.status === 'Pending Approval') && row.user_id !== user.id && (
          <>
            <button 
              onClick={() => handleStatusUpdate(row.id, 'Approved')}
              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
              title="Approve"
            >
              <Check size={16} />
            </button>
            <button 
              onClick={() => handleStatusUpdate(row.id, 'Rejected')}
              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              title="Reject"
            >
              <X size={16} />
            </button>
          </>
        )}
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
            <Button variant="primary" size="sm" className="flex items-center gap-2" onClick={() => setShowLeaveModal(true)}>
              <Plus size={14} /> Request Leave
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-soft-lg">
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-green-600 to-lime-400 flex items-center justify-center text-white shadow-soft-lg">
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-orange-500 to-yellow-400 flex items-center justify-center text-white shadow-soft-lg">
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
        {user.role !== 'admin' && (
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

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
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
              <button 
                onClick={() => setActiveTab('leaveHistory')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'leaveHistory' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                My Leaves History
              </button>
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
    </div>
  )
}
