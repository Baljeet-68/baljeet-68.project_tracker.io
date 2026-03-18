import React, { useEffect, useState } from 'react'
import { authFetch, getUser } from '../auth'
import { API_BASE_URL } from '../apiConfig'
import { Card, CardHeader, CardBody, Badge, Button, PageHeader } from '../components/TailAdminComponents'
import { Modal, InputGroup, Select, Table, ConfirmDialog } from '../components/FormComponents'
import { Megaphone, Plus, Edit, Trash2, Calendar, Target, User, Users as UsersIcon, Pin } from 'lucide-react'
import { Loader } from '../components/Loader'
import { handleError, handleApiResponse } from '../utils/errorHandler'
import { noChangesToastConfig } from '../utils/changeDetection'
import { toast } from 'react-hot-toast'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import DOMPurify from 'dompurify'
import PageContainer from '../components/layout/PageContainer'

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [announcementDialog, setAnnouncementDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [originalAnnouncement, setOriginalAnnouncement] = useState(null)
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'primary' })

  const [form, setForm] = useState({
    id: '',
    title: '',
    content: '',
    targetType: 'all',
    targetValue: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    active: true,
    pinned: false
  })

  const me = getUser()
  const isAdminOrHR = me?.role === 'admin' || me?.role === 'hr'

  const filteredAnnouncements = React.useMemo(() => {
    let result = announcements
    if (!isAdminOrHR) {
      const now = new Date()
      result = announcements.filter(a => {
        const endDate = new Date(a.endDate)
        endDate.setHours(23, 59, 59, 999)
        return a.active && endDate >= now
      })
    }
    // Sort: pinned first, then by startDate desc
    return [...result].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.startDate) - new Date(a.startDate)
    })
  }, [announcements, isAdminOrHR])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    if (isAdminOrHR) loadUsers(controller.signal)
    return () => controller.abort()
  }, [isAdminOrHR])

  const load = async (signal) => {
    setLoading(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/announcements`, { signal })
      const data = await handleApiResponse(res)
      setAnnouncements(data)
    } catch (e) {
      if (e.name !== 'AbortError') {
        handleError(e)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async (signal) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/users`, { signal })
      const data = await handleApiResponse(res)
      setUsers(data)
    } catch (e) {
      if (e.name !== 'AbortError') {
        handleError(e)
      }
    }
  }

  const handleSave = async () => {
    if (!form.title || !form.content || !form.startDate || !form.endDate) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      if (isEditing) {
        // Check for changes
        const hasChanges = 
          form.title !== originalAnnouncement.title ||
          DOMPurify.sanitize(form.content) !== originalAnnouncement.content ||
          form.targetType !== originalAnnouncement.targetType ||
          form.targetValue !== originalAnnouncement.targetValue ||
          form.startDate !== originalAnnouncement.startDate ||
          form.endDate !== originalAnnouncement.endDate ||
          form.active !== originalAnnouncement.active ||
          form.pinned !== originalAnnouncement.pinned;

        if (!hasChanges) {
          if (import.meta.env.DEV) {
            console.info('[Announcements] No changes detected for announcement:', form.id);
          }
          toast('No changes detected', noChangesToastConfig)
          setAnnouncementDialog(false)
          resetForm()
          return
        }
      }

      const method = isEditing ? 'PATCH' : 'POST'
      const url = isEditing ? `${API_BASE_URL}/announcements/${form.id}` : `${API_BASE_URL}/announcements`
      
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      await handleApiResponse(res)
      toast.success(isEditing ? 'Announcement updated successfully' : 'Announcement created successfully')
      
      await load()
      setAnnouncementDialog(false)
      resetForm()
    } catch (e) {
      handleError(e)
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
          await handleApiResponse(res)
          toast.success('Announcement deleted successfully')
          await load()
          setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        } catch (e) {
          handleError(e)
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
      active: true,
      pinned: false
    })
    setIsEditing(false)
  }

  const openEdit = (a) => {
    const data = {
      id: a.id,
      title: a.title,
      content: a.content,
      targetType: a.targetType,
      targetValue: a.targetValue || '',
      startDate: a.startDate.split('T')[0],
      endDate: a.endDate.split('T')[0],
      active: !!a.active,
      pinned: !!a.pinned
    }
    setForm(data)
    setOriginalAnnouncement(data)
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
    <PageContainer>
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

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <Loader message="Loading announcements..." />
        ) : isAdminOrHR ? (
          <Card>
            <CardBody>
              <Table columns={columns} data={filteredAnnouncements} loading={loading} pagination={true} pageSize={10} />
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map(a => (
                <Card key={a.id} className="h-full border-l-4 border-l-purple-500">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-slate-700">{a.title}</h5>
                        {a.pinned && <Pin size={14} className="text-indigo-600 fill-indigo-600" />}
                      </div>
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
                    <div 
                      className="text-slate-600 text-sm mb-6 prose prose-slate max-w-none line-clamp-4"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(a.content) }}
                    />
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
          
          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">Content</label>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <ReactQuill 
                theme="snow" 
                value={form.content} 
                onChange={(val) => setForm({ ...form, content: val })}
                className="h-48 mb-12 border-none"
              />
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="text-sm font-bold text-slate-700">Active Status</p>
                <p className="text-xs text-slate-500 text-nowrap">Visible to targeted users</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex items-center gap-2">
                <Pin size={16} className={form.pinned ? 'text-indigo-600' : 'text-slate-400'} />
                <div>
                  <p className="text-sm font-bold text-slate-700">Pin Announcement</p>
                  <p className="text-xs text-slate-500 text-nowrap">Keep at top of the list</p>
                </div>
              </div>
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog config={confirmConfig} onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
    </div>
    </PageContainer>
  )
}
