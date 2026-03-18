import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Plus, Calendar as CalendarIcon, Filter, Check, X, Eye, Trash2, AlertCircle, ClipboardList } from 'lucide-react'
import PageContainer from '../components/layout/PageContainer'
import { Card, CardHeader, CardBody, Button, Badge } from '../components/TailAdminComponents'
import { Modal, InputGroup, Select, ConfirmDialog } from '../components/FormComponents'
import { authFetch } from '../auth'
import { handleError, handleApiResponse } from '../utils/errorHandler'
import LeaveTable, { formatDateISO, formatDatePretty } from '../components/attendance/LeaveTable'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export default function AttendanceEmployee({ user }) {
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [leaveBalance, setLeaveBalance] = useState({ total: 0, used: 0, pending: 0, balance: 0, halfDays: 0 })
  const [historyRecords, setHistoryRecords] = useState([])
  
  // Filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [historyStatus, setHistoryStatus] = useState('all')
  const [historySearchTerm, setHistorySearchTerm] = useState('')
  
  // Modals
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  
  // Leave Form
  const [leaveForm, setLeaveForm] = useState({
    type: 'Full Day',
    start_date: '',
    end_date: '',
    half_day_period: 'Morning',
    short_leave_time: '',
    is_emergency: false,
    reason: '',
    compensation_worked_date: '',
    compensation_worked_time: ''
  })

  const fetchBalance = useCallback(async (signal) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/leaves/balance`, { signal })
      const data = await handleApiResponse(res)
      setLeaveBalance(data)
    } catch (err) {
      if (err.name !== 'AbortError') handleError(err)
    }
  }, [])

  const fetchHistory = useCallback(async (signal) => {
    try {
      setHistoryLoading(true)
      const params = new URLSearchParams()
      if (selectedYear) params.append('year', selectedYear)
      if (selectedMonth !== 'all') params.append('month', selectedMonth)
      if (historyStatus !== 'all') params.append('status', historyStatus)
      if (historySearchTerm) params.append('search', historySearchTerm)
      
      const res = await authFetch(`${API_BASE_URL}/leaves/history?${params.toString()}`, { signal })
      const data = await handleApiResponse(res)
      setHistoryRecords(Array.isArray(data) ? data : [])
    } catch (err) {
      if (err.name !== 'AbortError') handleError(err)
    } finally {
      setHistoryLoading(false)
    }
  }, [selectedYear, selectedMonth, historyStatus, historySearchTerm])

  useEffect(() => {
    const controller = new AbortController()
    fetchBalance(controller.signal)
    fetchHistory(controller.signal)
    return () => controller.abort()
  }, [fetchBalance, fetchHistory])

  const handleLeaveSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const res = await authFetch(`${API_BASE_URL}/leaves`, {
        method: 'POST',
        body: JSON.stringify(leaveForm)
      })
      await handleApiResponse(res)
      toast.success('Leave request submitted successfully')
      setShowLeaveModal(false)
      setLeaveForm({
        type: 'Full Day',
        start_date: '',
        end_date: '',
        half_day_period: 'Morning',
        short_leave_time: '',
        is_emergency: false,
        reason: '',
        compensation_worked_date: '',
        compensation_worked_time: ''
      })
      fetchBalance()
      fetchHistory()
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelLeave = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return
    try {
      const res = await authFetch(`${API_BASE_URL}/leaves/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Cancelled' })
      })
      await handleApiResponse(res)
      toast.success('Leave request cancelled')
      fetchBalance()
      fetchHistory()
    } catch (err) {
      handleError(err)
    }
  }

  const handleConvert = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/leaves/convert-half-days`, { method: 'POST' })
      await handleApiResponse(res)
      toast.success('2 Half Days converted to 1 Full Day')
      fetchBalance()
      fetchHistory()
    } catch (err) {
      handleError(err)
    }
  }

  const monthOptions = [
    { label: 'All Months', value: 'all' },
    { label: 'January', value: 1 }, { label: 'February', value: 2 }, { label: 'March', value: 3 },
    { label: 'April', value: 4 }, { label: 'May', value: 5 }, { label: 'June', value: 6 },
    { label: 'July', value: 7 }, { label: 'August', value: 8 }, { label: 'September', value: 9 },
    { label: 'October', value: 10 }, { label: 'November', value: 11 }, { label: 'December', value: 12 }
  ]

  const availableYears = useMemo(() => {
    const years = new Set([new Date().getFullYear()])
    historyRecords.forEach(l => {
      if (l.start_date) years.add(new Date(l.start_date).getFullYear())
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [historyRecords])

  return (
    <PageContainer title="My Attendance & Leaves">
      <div className="flex flex-col gap-8">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-purple-700 to-pink-500 flex items-center justify-center text-white shadow-soft-lg">
                <CalendarIcon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Leave Balance</p>
                <h5 className="text-xl font-bold text-slate-700">{leaveBalance.balance} Days</h5>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-soft-lg">
                <Check size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Used Leaves</p>
                <h5 className="text-xl font-bold text-slate-700">{leaveBalance.used} Days</h5>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-orange-500 to-yellow-400 flex items-center justify-center text-white shadow-soft-lg">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Approval</p>
                <h5 className="text-xl font-bold text-slate-700">{leaveBalance.pending} Requests</h5>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-green-600 to-lime-400 flex items-center justify-center text-white shadow-soft-lg">
                  <Plus size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Request Leave</p>
                  <Button variant="primary" size="xs" onClick={() => setShowLeaveModal(true)} className="mt-1">
                    Apply Now
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Half Day Conversion Banner */}
        {leaveBalance.halfDays >= 2 && (
          <Card className="bg-gradient-to-r from-blue-600 to-cyan-400 text-white p-4 border-none">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <p className="font-bold">Half-Day Conversion Available</p>
                  <p className="text-sm text-blue-50">You have {leaveBalance.halfDays} half-days. You can convert 2 half-days into 1 full-day leave.</p>
                </div>
              </div>
              <Button variant="white" size="sm" onClick={handleConvert}>Convert Now</Button>
            </div>
          </Card>
        )}

        {/* History Section */}
        <Card>
          <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h6 className="font-bold text-slate-800">My Leave History</h6>
              <p className="text-sm text-slate-500 font-medium">View and track your previous leave requests.</p>
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
            </div>
          </CardHeader>
          <CardBody>
            <LeaveTable
              data={historyRecords}
              loading={historyLoading}
              user={user}
              onView={(l) => {
                setSelectedLeave(l)
                setShowDetailsModal(true)
              }}
              onCancel={handleCancelLeave}
              showEmployee={false}
              showActions={true}
            />
          </CardBody>
        </Card>

        {/* Request Modal */}
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

            {leaveForm.type === 'Full Day' && (
              <InputGroup
                label="End Date"
                type="date"
                value={leaveForm.end_date}
                onChange={(e) => setLeaveForm({...leaveForm, end_date: e.target.value})}
                min={leaveForm.start_date || new Date().toISOString().split('T')[0]}
                placeholder="Leave blank if same as start date"
              />
            )}

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
                  label="Hours Worked (1-12)"
                  type="number"
                  min="1"
                  max="12"
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

        {/* Details Modal */}
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
                  <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                  <div className="mt-1">
                    <Badge gradient={
                      selectedLeave.status === 'Approved' ? 'from-green-600 to-lime-400' :
                      selectedLeave.status === 'Rejected' ? 'from-red-600 to-rose-400' :
                      'from-blue-600 to-cyan-400'
                    }>{selectedLeave.status}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Leave Type</p>
                  <p className="font-medium text-slate-600">{selectedLeave.type}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Reason</p>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600 font-medium whitespace-pre-wrap">
                  {selectedLeave.reason || 'No reason provided.'}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PageContainer>
  )
}
