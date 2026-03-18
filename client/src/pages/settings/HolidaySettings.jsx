import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardBody, Button } from '../../components/TailAdminComponents'
import { InputGroup, ConfirmDialog } from '../../components/FormComponents'
import { authFetch } from '../../auth'
import { API_BASE_URL } from '../../apiConfig'
import { handleError, handleApiResponse } from '../../utils/errorHandler'
import { toast } from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'

const formatDatePretty = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export default function HolidaySettings() {
  const [holidays, setHolidays] = useState([])
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '' })
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  const fetchHolidays = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/leaves/holidays`)
      const data = await handleApiResponse(res)
      setHolidays(Array.isArray(data) ? data : [])
    } catch (e) {
      handleError(e)
    }
  }, [])

  useEffect(() => {
    fetchHolidays()
  }, [fetchHolidays])

  const handleAddHoliday = async (e) => {
    e.preventDefault()
    try {
      const res = await authFetch(`${API_BASE_URL}/leaves/holidays`, {
        method: 'POST',
        body: JSON.stringify(holidayForm)
      })
      await handleApiResponse(res)
      toast.success('Holiday added successfully')
      setHolidayForm({ name: '', date: '' })
      fetchHolidays()
    } catch (e) {
      handleError(e)
    }
  }

  const handleDeleteHoliday = (holidayId) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Holiday',
      message: 'Are you sure you want to delete this holiday?',
      onConfirm: async () => {
        try {
          await authFetch(`${API_BASE_URL}/leaves/holidays/${holidayId}`, { method: 'DELETE' })
          toast.success('Holiday deleted')
          fetchHolidays()
          setConfirmConfig({ isOpen: false })
        } catch (e) {
          handleError(e)
        }
      }
    })
  }

  return (
    <Card>
      <CardHeader>Public Holiday Configuration</CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h6 className="text-sm font-bold text-slate-500 uppercase mb-4">Add New Holiday</h6>
            <form onSubmit={handleAddHoliday} className="space-y-4 p-4 bg-slate-50 rounded-xl border">
              <InputGroup
                label="Holiday Name"
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
              <Button type="submit" variant="primary" size="sm" className="w-full">
                <Plus size={16} className="mr-2" />
                Add Holiday
              </Button>
            </form>
          </div>
          <div>
            <h6 className="text-sm font-bold text-slate-500 uppercase mb-4">Configured Holidays</h6>
            <div className="max-h-96 overflow-y-auto border rounded-xl">
              {holidays.length === 0 ? (
                <p className="text-center py-10 text-slate-400">No holidays configured.</p>
              ) : (
                holidays.sort((a, b) => new Date(a.date) - new Date(b.date)).map(h => (
                  <div key={h.id} className="flex justify-between items-center p-3 border-b last:border-b-0">
                    <div>
                      <p className="font-bold text-slate-700">{h.name}</p>
                      <p className="text-xs text-slate-500">{formatDatePretty(h.date)}</p>
                    </div>
                    <button onClick={() => handleDeleteHoliday(h.id)} className="text-slate-400 hover:text-red-500 p-2">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardBody>
      <ConfirmDialog {...confirmConfig} onClose={() => setConfirmConfig({ isOpen: false })} />
    </Card>
  )
}
