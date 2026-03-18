import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch, getUser } from '../auth'
import { API_BASE_URL } from '../apiConfig';
import { Card, CardHeader, CardBody, Badge, Button } from '../components/TailAdminComponents'
import { Table, Select, Modal, InputGroup, ConfirmDialog } from '../components/FormComponents'
import { Eye, Plus, Edit, FolderPlus, Briefcase, User, FileText, Search, Trash2 } from 'lucide-react'
import { Loader } from '../components/Loader'
import { handleError, handleApiResponse } from '../utils/errorHandler'
import { noChangesToastConfig } from '../utils/changeDetection'
import { toast } from 'react-hot-toast'
import PageLayout from '../components/layout/PageLayout'
import PageContainer from '../components/layout/PageContainer'

const getStatusGradient = (status) => {
  switch(status) {
    case 'Under Planning': return 'from-slate-600 to-slate-300';
    case 'Running': return 'from-green-600 to-lime-400';
    case 'On Hold': return 'from-orange-500 to-yellow-400';
    case 'Completed': return 'from-blue-600 to-cyan-400';
    case 'Critical': return 'from-red-600 to-rose-400';
    default: return 'from-slate-600 to-slate-300';
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ECommerceProjects() {
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [projectForm, setProjectForm] = useState({ name: '', client: '', description: '', developerIds: [], startDate: '', endDate: '' })
  const [projectDialog, setProjectDialog] = useState(false)

  const [editProjectForm, setEditProjectForm] = useState({ id: '', name: '', client: '', description: '', developerIds: [], startDate: '', endDate: '' })
  const [originalProject, setOriginalProject] = useState(null)
  const [editProjectDialog, setEditProjectDialog] = useState(false)
  
  const [confirmConfig, setConfirmConfig] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: () => {}, 
    type: 'primary' 
  })

  const user = getUser()
  const nav = useNavigate()

  const load = React.useCallback(async (signal) => {
    setLoading(true)
    try {
      const [projectsRes, usersRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/ecommerce-projects`, { signal }),
        authFetch(`${API_BASE_URL}/users`, { signal })
      ])
      
      const projectsData = await handleApiResponse(projectsRes)
      setProjects(projectsData)
      
      const usersData = await handleApiResponse(usersRes)
      setUsers(usersData)
    } catch (e) {
      if (e.name !== 'AbortError') {
        handleError(e)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const handleCreateProject = async () => {
    if (!projectForm.name) {
      toast.error('Please enter project name')
      return
    }
    try {
      const res = await authFetch(`${API_BASE_URL}/ecommerce-projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm)
      })
      await handleApiResponse(res)
      
      toast.success('Project created successfully')
      await load()
      setProjectForm({ name: '', client: '', description: '', developerIds: [] })
      setProjectDialog(false)
    } catch (e) {
      handleError(e)
    }
  }

  const handleEditProject = (project) => {
    const projectData = {
      id: project.id,
      name: project.name,
      client: project.client || '',
      description: project.description || '',
      developerIds: Array.isArray(project.developerIds) ? project.developerIds : [],
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ''
    }
    setEditProjectForm(projectData)
    setOriginalProject(projectData)
    setEditProjectDialog(true)
  }

  const handleUpdateProject = async () => {
    if (!editProjectForm.name) {
      toast.error('Please enter project name')
      return
    }
    try {
      const { id, ...payload } = editProjectForm;
      
      const hasChanges = JSON.stringify(payload) !== JSON.stringify(originalProject);

      if (!hasChanges) {
        toast('No changes detected', noChangesToastConfig)
        setEditProjectDialog(false)
        return
      }

      const res = await authFetch(`${API_BASE_URL}/ecommerce-projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      await handleApiResponse(res)
      
      toast.success('Project updated successfully')
      await load()
      setEditProjectDialog(false)
    } catch (e) {
      handleError(e)
    }
  }

  const handleDeleteProject = (p) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Project',
      message: `Are you sure you want to delete project "${p.name}"? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await authFetch(`${API_BASE_URL}/ecommerce-projects/${p.id}`, {
            method: 'DELETE'
          })
          await handleApiResponse(res)
          toast.success('Project deleted successfully')
          load()
          setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        } catch (e) {
          handleError(e)
          setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  const filteredProjects = React.useMemo(() => {
    return projects.filter(p => {
      if (statusFilter && p.status !== statusFilter) return false
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchesName = p.name?.toLowerCase().includes(query)
        const matchesClient = p.client?.toLowerCase().includes(query)
        if (!matchesName && !matchesClient) return false
      }
      
      return true
    })
  }, [projects, statusFilter, searchQuery])

  const columns = React.useMemo(() => [
    {
      key: 'name',
      label: 'Project',
      sortable: true,
      render: (val, p) => (
        <div className="flex flex-col">
          <h6 className="mb-0 text-sm font-bold text-slate-700">{val}</h6>
          <p className="mb-0 text-xs leading-tight text-slate-400 truncate max-w-xs">{p.description}</p>
        </div>
      )
    },
    { key: 'client', label: 'Client', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => <Badge gradient={getStatusGradient(status)} size="sm">{status}</Badge>
    },
    {
      key: 'startDate',
      label: 'Start Date',
      sortable: true,
      render: (val) => <span className="text-xs text-slate-600">{formatDate(val)}</span>
    },
    {
      key: 'endDate',
      label: 'End Date',
      sortable: true,
      render: (val) => <span className="text-xs text-slate-600">{formatDate(val)}</span>
    },
    {
      key: 'team',
      label: 'Team',
      render: (_, p) => (
        <div className="text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-medium">Devs:</span> 
            <span className="text-slate-600">{p.developerNames?.length || 0} assigned</span>
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, p) => (
        <div className="flex gap-2">
          <Link to={`/ecommerce-projects/${p.id}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View Project">
            <Eye size={18} />
          </Link>
          {user?.role === 'admin' && (
            <>
              <button onClick={() => handleEditProject(p)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit Project">
                <Edit size={18} />
              </button>
              <button onClick={() => handleDeleteProject(p)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete Project">
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      )
    }
  ], [user?.role])

  return (
  <PageContainer>
      <PageLayout
        maxWidth="full"
        title="E-Commerce Projects"
        subtitle="Track and organize all your e-commerce projects"
        actions={user?.role === 'admin' ? (
          <Button size="sm" variant="primary" onClick={() => setProjectDialog(true)}>
            <Plus size={14} className="mr-2" /> New Project
          </Button>
        ) : null}
      >
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-end w-full">
            <div className="w-full md:max-w-xs">
              <InputGroup
                label="Search Projects"
                placeholder="Search by name or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={16} />}
                className="mb-0"
              />
            </div>
            <div className="w-full md:max-w-xs">
              <Select
                label="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'Under Planning', label: 'Under Planning' },
                  { value: 'Running', label: 'Running' },
                  { value: 'On Hold', label: 'On Hold' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Critical', label: 'Critical' },
                ]}
                className="mb-0"
              />
            </div>
          </div>
        </CardHeader>
        <CardBody className="px-0 pt-0 pb-2">
          <Table columns={columns} data={filteredProjects} loading={loading} pagination={true} pageSize={10} />
        </CardBody>
      </Card>

      <Modal 
        isOpen={projectDialog} 
        title="Create New E-Commerce Project" 
        onClose={() => setProjectDialog(false)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setProjectDialog(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreateProject}>Create Project</Button>
          </>
        }
      >
        <InputGroup 
          label="Project Name" 
          icon={<Briefcase size={16} className="text-slate-400" />}
          value={projectForm.name} 
          onChange={(e) => setProjectForm({...projectForm, name: e.target.value})} 
          placeholder="My Awesome Store"
        />
        <InputGroup 
          label="Client Name" 
          icon={<User size={16} className="text-slate-400" />}
          value={projectForm.client} 
          onChange={(e) => setProjectForm({...projectForm, client: e.target.value})} 
          placeholder="Acme Corp"
        />
        <InputGroup 
          label="Description" 
          icon={<FileText size={16} className="text-slate-400" />}
          value={projectForm.description} 
          onChange={(e) => setProjectForm({...projectForm, description: e.target.value})} 
          placeholder="Brief project description..."
          as="textarea"
          rows={3}
        />
        <div className="grid grid-cols-2 gap-4">
          <InputGroup
            label="Start Date"
            type="date"
            value={projectForm.startDate}
            onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
          />
          <InputGroup
            label="End Date"
            type="date"
            value={projectForm.endDate}
            onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
          />
        </div>
        <div className="mb-4">
          <label className="mb-2 ml-1 font-bold text-xs text-slate-700 block">
            Assign Developers
          </label>
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-slate-50">
            {users?.filter(u => u.role === 'developer' || u.role === 'admin' || u.role === 'ecommerce').map(dev => (
              <label key={dev.id} className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer transition-colors">
                <input 
                  type="checkbox"
                  checked={projectForm.developerIds.includes(dev.id)}
                  onChange={(e) => {
                    const ids = e.target.checked 
                      ? [...projectForm.developerIds, dev.id]
                      : projectForm.developerIds.filter(id => id !== dev.id);
                    setProjectForm({...projectForm, developerIds: ids});
                  }}
                  className="rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500"
                />
                <span className="text-sm text-slate-600">{dev.name}</span>
                {dev.role === 'admin' && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">Admin</span>}
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={editProjectDialog} 
        title="Edit E-Commerce Project" 
        onClose={() => setEditProjectDialog(false)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditProjectDialog(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleUpdateProject}>Save Changes</Button>
          </>
        }
      >
        <InputGroup 
          label="Project Name" 
          icon={<Briefcase size={16} className="text-slate-400" />}
          value={editProjectForm.name} 
          onChange={(e) => setEditProjectForm({...editProjectForm, name: e.target.value})} 
        />
        <InputGroup 
          label="Client Name" 
          icon={<User size={16} className="text-slate-400" />}
          value={editProjectForm.client} 
          onChange={(e) => setEditProjectForm({...editProjectForm, client: e.target.value})} 
        />
        <InputGroup 
          label="Description" 
          icon={<FileText size={16} className="text-slate-400" />}
          value={editProjectForm.description} 
          onChange={(e) => setEditProjectForm({...editProjectForm, description: e.target.value})} 
          placeholder="Brief project description..."
          as="textarea"
          rows={3}
        />
        <div className="grid grid-cols-2 gap-4">
          <InputGroup
            label="Start Date"
            type="date"
            value={editProjectForm.startDate}
            onChange={(e) => setEditProjectForm({ ...editProjectForm, startDate: e.target.value })}
          />
          <InputGroup
            label="End Date"
            type="date"
            value={editProjectForm.endDate}
            onChange={(e) => setEditProjectForm({ ...editProjectForm, endDate: e.target.value })}
          />
        </div>
        <div className="mb-4">
          <label className="mb-2 ml-1 font-bold text-xs text-slate-700 block">
            Assign Developers
          </label>
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-slate-50">
            {users?.filter(u => u.role === 'developer' || u.role === 'admin' || u.role === 'ecommerce').map(dev => (
              <label key={dev.id} className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer transition-colors">
                <input 
                  type="checkbox"
                  checked={editProjectForm.developerIds?.includes(dev.id)}
                  onChange={(e) => {
                    const currentIds = editProjectForm.developerIds || [];
                    const ids = e.target.checked 
                      ? [...currentIds, dev.id]
                      : currentIds.filter(id => id !== dev.id);
                    setEditProjectForm({...editProjectForm, developerIds: ids});
                  }}
                  className="rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500"
                />
                <span className="text-sm text-slate-600">{dev.name}</span>
                {dev.role === 'admin' && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">Admin</span>}
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        type={confirmConfig.type}
      />
    </PageLayout>
    </PageContainer>
  )
}
