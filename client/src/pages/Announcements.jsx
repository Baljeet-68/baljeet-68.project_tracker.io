import React, { useEffect, useState } from 'react'
import { authFetch, getUser } from '../auth'
import { API_BASE_URL } from '../apiConfig'
import { Card, CardHeader, CardBody, Badge, Button, PageHeader } from '../components/TailAdminComponents'
import { Modal, InputGroup, Select, Table, Alert, ConfirmDialog } from '../components/FormComponents'
import { Megaphone, Plus, Edit, Trash2, Calendar, Target, User, Users as UsersIcon } from 'lucide-react'
import { Loader } from '../components/Loader'

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [announcementDialog, setAnnouncementDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'primary' })

  const [form, setForm] = useState({
    id: '',
    title: '',
    content: '',
    targetType: 'all',
    targetValue: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    active: true
  })

  const me = getUser()
  const isAdminOrHR = me?.role === 'admin' || me?.role === 'hr'

  useEffect(() => {
    load()
    if (isAdminOrHR) loadUsers()
  }, [])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(`${API_BASE_URL}/announcements`)
      if (res.ok) setAnnouncements(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/users`)
      if (res.ok) setUsers(await res.json())
    } catch (e) {
      console.error('Failed to load users', e)
    }
  }

  const handleSave = async () => {
    if (!form.title || !form.content || !form.startDate || !form.endDate) {
      setError('Please fill all required fields')
      return
    }

    try {
      const method = isEditing ? 'PATCH' : 'POST'
      const url = isEditing ? `${API_BASE_URL}/announcements/${form.id}` : `${API_BASE_URL}/announcements`
      
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (!res.ok) throw new Error('Failed to save announcement')
      
      await load()
      setAnnouncementDialog(false)
      resetForm()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Announcement',
      message: 'Are you sure you want to delete this announcement?',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await authFetch(`${API_BASE_URL}/announcements/${id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('Failed to delete')
          await load()
          setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        } catch (e) {
          setError(e.message)
          setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  const resetForm = () => {
    setForm({
      id: '',
      title: '',
      content: '',
      targetType: 'all',
      targetValue: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      active: true
    })
    setIsEditing(false)
  }

  const openEdit = (a) => {
    setForm({
      id: a.id,
      title: a.title,
      content: a.content,
      targetType: a.targetType,
      targetValue: a.targetValue || '',
      startDate: a.startDate.split('T')[0],
      endDate: a.endDate.split('T')[0],
      active: !!a.active
    })
    setIsEditing(true)
    setAnnouncementDialog(true)
  }

  const columns = [
    { key: 'title', label: 'Title' },
    { 
      key: 'targetType', 
      label: 'Target',
      render: (_, a) => {
        let text = 'All Users'
        if (a.targetType === 'role') text = `Role: ${a.targetValue}`
        if (a.targetType === 'user') {
          const u = users.find(user => user.id === a.targetValue)
          text = `User: ${u ? u.name : a.targetValue}`
        }
        return <Badge gradient="from-blue-600 to-cyan-400">{text}</Badge>
      }
    },
    { 
      key: 'dates', 
      label: 'Duration',
      render: (_, a) => (
        <span className="text-xs text-slate-500">
          {new Date(a.startDate).toLocaleDateString()} - {new Date(a.endDate).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'active',
      label: 'Status',
      render: (active) => (
        <Badge gradient={active ? 'from-green-600 to-lime-400' : 'from-slate-600 to-slate-300'}>
          {active ? 'Active' : 'Inactive'}
        </Badge>
      )
    }
  ]

  if (isAdminOrHR) {
    columns.push({
      key: 'actions',
      label: 'Actions',
      render: (_, a) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(a)} className="text-slate-400 hover:text-blue-500 transition-colors">
            <Edit size={16} />
          </button>
          <button onClick={() => handleDelete(a.id)} className="text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      )
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Announcements"
        subtitle="View and manage company-wide or targeted announcements"
        actions={isAdminOrHR ? (
          <Button variant="info" size="sm" onClick={() => { resetForm(); setAnnouncementDialog(true); }}>
            <Plus size={14} className="mr-1 inline" /> Create Announcement
          </Button>
        ) : null}
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <Loader message="Loading announcements..." />
        ) : isAdminOrHR ? (
          <Card>
            <CardBody>
              <Table columns={columns} data={announcements} loading={loading} pagination={true} pageSize={10} />
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {announcements.length > 0 ? (
              announcements.map(a => (
                <Card key={a.id} className="h-full border-l-4 border-l-purple-500">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <h5 className="font-bold text-slate-700">{a.title}</h5>
                      <Megaphone size={16} className="text-purple-500" />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar size={12} className="text-slate-400" />
                      <span className="text-xs text-slate-400">
                        Until {new Date(a.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <p className="text-slate-600 text-sm whitespace-pre-wrap">{a.content}</p>
                  </CardBody>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400">
                <Megaphone size={48} className="mx-auto mb-4 opacity-20" />
                <p>No active announcements at the moment.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={announcementDialog}
        title={isEditing ? "Edit Announcement" : "Create Announcement"}
        onClose={() => setAnnouncementDialog(false)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAnnouncementDialog(false)}>Cancel</Button>
            <Button variant="info" size="sm" onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <InputGroup
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Important Update"
            required
          />
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-slate-700">Content</label>
            <textarea
              className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm min-h-[120px]"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write announcement content here..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Target Type"
              icon={<Target size={16} className="text-slate-400" />}
              value={form.targetType}
              onChange={(e) => setForm({ ...form, targetType: e.target.value, targetValue: '' })}
              options={[
                { value: 'all', label: 'All Users' },
                { value: 'role', label: 'By Role' },
                { value: 'user', label: 'Specific User' }
              ]}
            />

            {form.targetType === 'role' && (
              <Select
                label="Select Role"
                icon={<UsersIcon size={16} className="text-slate-400" />}
                value={form.targetValue}
                onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                options={[
                  { value: 'admin', label: 'Admin' },
                  { value: 'tester', label: 'Tester' },
                  { value: 'developer', label: 'Developer' },
                  { value: 'hr', label: 'HR' },
                  { value: 'ecommerce', label: 'E-commerce' },
                  { value: 'management', label: 'Management' },
                  { value: 'accountant', label: 'Accountant' }
                ]}
              />
            )}

            {form.targetType === 'user' && (
              <Select
                label="Select User"
                icon={<User size={16} className="text-slate-400" />}
                value={form.targetValue}
                onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                options={users.map(u => ({ value: u.id, label: u.name }))}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputGroup
              label="Start Date"
              type="date"
              icon={<Calendar size={16} className="text-slate-400" />}
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
            <InputGroup
              label="End Date"
              type="date"
              icon={<Calendar size={16} className="text-slate-400" />}
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <input
              type="checkbox"
              id="ann-active"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="ann-active" className="text-sm font-medium text-slate-700 cursor-pointer">
              Active Announcement
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog config={confirmConfig} onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
    </div>
  )
}
