import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Plus, Calendar as CalendarIcon, Filter, Check, X, Eye, Trash2, AlertCircle, ClipboardList, Settings } from 'lucide-react'
import PageContainer from '../components/layout/PageContainer'
import { Card, CardHeader, CardBody, Button, Badge } from '../components/TailAdminComponents'
import { Modal, InputGroup, Select, ConfirmDialog } from '../components/FormComponents'
import { authFetch } from '../auth'
import { handleError, handleApiResponse } from '../utils/errorHandler'
import LeaveTable, { formatDateISO, formatDatePretty } from '../components/attendance/LeaveTable'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export default function AttendanceAdmin({ user }) {
  const [activeTab, setActiveTab] = useState('onLeaveToday')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({
    onLeaveToday: 0,
    onHalfDayToday: 0,
    pendingRequests: 0,
    adminPendingRequests: 0,
    myPendingRequests: 0
  })
  const [leaves, setLeaves] = useState([])
  const [holidays, setHolidays] = useState([])
  
  // Filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modals
  const [showHolidayModal, setShowHolidaysModal] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'primary', confirmText: 'Confirm', onConfirm: () => {} })
  
  // Holiday Form
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '' })

  const isHRorAdmin = user.role === 'admin' || user.role === 'hr'

  const fetchSummary = useCallback(async (signal) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/leaves/summary`, { signal })
      const data = await handleApiResponse(res)
      setSummary(data)
    } catch (err) {
      if (err.name !== 'AbortError') handleError(err)
    }
  }, [])

  const fetchLeaves = useCallback(async (signal) => {
    try {
      setLoading(true)
      const res = await authFetch(`${API_BASE_URL}/leaves`, { signal })
      const data = await handleApiResponse(res)
      setLeaves(Array.isArray(data) ? data : [])
    } catch (err) {
      if (err.name !== 'AbortError') handleError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchHolidays = useCallback(async (signal) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/leaves/holidays`, { signal })
      const data = await handleApiResponse(res)
      setHolidays(Array.isArray(data) ? data : [])
    } catch (err) {
      if (err.name !== 'AbortError') handleError(err)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchSummary(controller.signal)
    fetchLeaves(controller.signal)
    fetchHolidays(controller.signal)
    return () => controller.abort()
  }, [fetchSummary, fetchLeaves, fetchHolidays])

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/leaves/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
      await handleApiResponse(res)
      fetchSummary()
      fetchLeaves()
    } catch (err) {
      handleError(err)
    }
  }

  const handleAddHoliday = async (e) => {
    e.preventDefault()
    try {
      const res = await authFetch(`${API_BASE_URL}/leaves/holidays`, {
        method: 'POST',
        body: JSON.stringify(holidayForm)
      })
      await handleApiResponse(res)
      setHolidayForm({ name: '', date: '' })
      fetchHolidays()
    } catch (err) {
      handleError(err)
    }
  }

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return
    try {
      const res = await authFetch(`${API_BASE_URL}/leaves/holidays/${id}`, { method: 'DELETE' })
      await handleApiResponse(res)
      fetchHolidays()
    } catch (err) {
      handleError(err)
    }
  }

  const filteredLeaves = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    let base = []
    
    if (activeTab === 'onLeaveToday') {
      base = leaves.filter(l => l.status === 'Approved' && today >= formatDateISO(l.start_date) && today <= formatDateISO(l.end_date) && l.type !== 'Half Day')
    } else if (activeTab === 'onHalfDayToday') {
      base = leaves.filter(l => l.status === 'Approved' && today === formatDateISO(l.start_date) && l.type === 'Half Day')
    } else if (activeTab === 'pendingApproval') {
      base = leaves.filter(l => l.status === 'Submitted' || l.status === 'Pending Approval')
    } else {
      base = leaves
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      base = base.filter(l => l.userName?.toLowerCase().includes(s) || l.reason?.toLowerCase().includes(s))
    }

    return base
  }, [leaves, activeTab, searchTerm])

  const monthOptions = [
    { label: 'All Months', value: 'all' },
    { label: 'January', value: 1 }, { label: 'February', value: 2 }, { label: 'March', value: 3 },
    { label: 'April', value: 4 }, { label: 'May', value: 5 }, { label: 'June', value: 6 },
    { label: 'July', value: 7 }, { label: 'August', value: 8 }, { label: 'September', value: 9 },
    { label: 'October', value: 10 }, { label: 'November', value: 11 }, { label: 'December', value: 12 }
  ]

  const availableYears = useMemo(() => {
    const years = new Set([new Date().getFullYear()])
    leaves.forEach(l => {
      if (l.start_date) years.add(new Date(l.start_date).getFullYear())
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [leaves])

  return (
    <PageContainer title="Attendance & Leave Management (Admin)">
      <div className="flex flex-col gap-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-purple-700 to-pink-500 flex items-center justify-center text-white shadow-soft-lg">
                <CalendarIcon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">On Leave Today</p>
                <h5 className="text-xl font-bold text-slate-700">{summary.onLeaveToday}</h5>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-soft-lg">
                <ClipboardList size={24} />
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
                <Filter size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Request</p>
                <h5 className="text-xl font-bold text-slate-700">{summary.pendingRequests}</h5>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-slate-700 to-slate-500 flex items-center justify-center text-white shadow-soft-lg">
                  <Settings size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configuration</p>
                  <Button variant="outline" size="xs" onClick={() => setShowHolidaysModal(true)} className="mt-1">
                    Manage Holidays
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
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
                onClick={() => setActiveTab('calendarView')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'calendarView' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                Calendar View
              </button>
            </div>
            <div className="flex flex-col lg:flex-row items-stretch gap-3 w-full md:w-auto">
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
                  placeholder="Search by employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search size={16} className="text-slate-400" />}
                />
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {activeTab === 'calendarView' ? (
              <div className="p-4">
                <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-slate-50 p-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {day}
                    </div>
                  ))}
                  {(() => {
                    const year = selectedYear
                    const month = selectedMonth === 'all' ? new Date().getMonth() + 1 : selectedMonth
                    const firstDay = new Date(year, month - 1, 1).getDay()
                    const daysInMonth = new Date(year, month, 0).getDate()
                    const cells = []
                    
                    for (let i = 0; i < firstDay; i++) {
                      cells.push(<div key={`empty-${i}`} className="bg-white min-h-[120px] p-2" />)
                    }
                    
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                      const onLeave = leaves.filter(l => {
                        const start = formatDateISO(l.start_date)
                        const end = formatDateISO(l.end_date)
                        return l.status === 'Approved' && dateStr >= start && dateStr <= end
                      })
                      
                      const isToday = new Date().toISOString().split('T')[0] === dateStr
                      const isWeekend = new Date(year, month - 1, day).getDay() === 0 || new Date(year, month - 1, day).getDay() === 6
                      const holiday = holidays.find(h => formatDateISO(h.date) === dateStr)

                      cells.push(
                        <div key={day} className={`bg-white min-h-[120px] p-2 border-slate-100 flex flex-col gap-1 transition-colors hover:bg-slate-50 ${isToday ? 'ring-2 ring-inset ring-purple-500' : ''}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-sm font-bold ${isToday ? 'text-purple-600' : isWeekend || holiday ? 'text-slate-400' : 'text-slate-700'}`}>
                              {day}
                            </span>
                            {holiday && (
                              <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md font-bold truncate max-w-[60px]" title={holiday.name}>
                                {holiday.name}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                            {onLeave.map((l, idx) => (
                              <div 
                                key={idx} 
                                className={`text-[10px] px-1.5 py-1 rounded-md border truncate font-medium cursor-default
                                  ${l.type === 'Half Day' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}
                                title={`${l.userName} (${l.type})`}
                              >
                                {l.userName}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }
                    return cells
                  })()}
                </div>
              </div>
            ) : (
              <LeaveTable 
                data={filteredLeaves} 
                loading={loading} 
                user={user} 
                onView={(l) => {
                  setSelectedLeave(l)
                  setShowDetailsModal(true)
                }}
                showEmployee={true}
                showActions={activeTab === 'pendingApproval'}
              />
            )}
          </CardBody>
        </Card>

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
                  <p className="text-xs font-bold text-slate-400 uppercase">Employee</p>
                  <p className="font-bold text-slate-700">{selectedLeave.userName}</p>
                  <p className="text-xs text-slate-500 font-medium">{selectedLeave.userRole}</p>
                </div>
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
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Reason</p>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600 font-medium whitespace-pre-wrap">
                  {selectedLeave.reason || 'No reason provided.'}
                </div>
              </div>

              {/* Approval/Rejection Actions */}
              {(selectedLeave.status === 'Submitted' || selectedLeave.status === 'Pending Approval') && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    variant="success" 
                    fullWidth
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

        {/* Holiday Modal */}
        <Modal
          isOpen={showHolidayModal}
          onClose={() => setShowHolidaysModal(false)}
          title="Public Holiday Configuration"
          size="md"
        >
          <div className="space-y-6">
            <form onSubmit={handleAddHoliday} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h6 className="text-xs font-bold text-slate-500 uppercase">Add New Holiday</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputGroup
                  label="Holiday Name"
                  placeholder="e.g. Christmas"
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  required
                />
                <InputGroup
                  label="Date"
                  type="date"
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button variant="primary" size="sm" type="submit">Add Holiday</Button>
              </div>
            </form>

            <div className="space-y-3">
              <h6 className="text-xs font-bold text-slate-500 uppercase px-1">Configured Holidays ({selectedYear})</h6>
              <div className="max-h-60 overflow-y-auto divide-y border rounded-xl bg-white">
                {holidays.filter(h => new Date(h.date).getFullYear() === selectedYear).length === 0 ? (
                  <p className="p-8 text-center text-sm text-slate-400 italic">No holidays configured for {selectedYear}</p>
                ) : (
                  holidays
                    .filter(h => new Date(h.date).getFullYear() === selectedYear)
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(h => (
                      <div key={h.id} className="flex justify-between items-center p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-sm">{h.name}</span>
                          <span className="text-xs text-slate-400">{formatDatePretty(h.date)}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
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
