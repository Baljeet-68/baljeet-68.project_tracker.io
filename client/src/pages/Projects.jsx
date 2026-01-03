import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch, getUser, clearToken, clearUser } from '../auth'
import { API_BASE_URL } from '../apiConfig';
import { Card, CardHeader, CardBody, Badge, Button } from '../components/TailAdminComponents'
import { Table, Select, Modal, InputGroup, Alert } from '../components/FormComponents'
import { Eye, Plus, Edit, FolderPlus, Briefcase, User, FileText } from 'lucide-react'
import { Loader } from '../components/Loader'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  
  // Project form
  const [projectForm, setProjectForm] = useState({ name: '', client: '', description: '', testerId: '', developerIds: [] })
  const [projectDialog, setProjectDialog] = useState(false)

  // Edit Project form
  const [editProjectForm, setEditProjectForm] = useState({ id: '', name: '', client: '', description: '', testerId: '', developerIds: [] })
  const [editProjectDialog, setEditProjectDialog] = useState(false)

  const user = getUser()
  const nav = useNavigate()

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [projectsRes, usersRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/projects`),
        authFetch(`${API_BASE_URL}/users`)
      ])
      
      if (!projectsRes.ok) throw new Error('Failed to fetch projects')
      if (projectsRes.ok) setProjects(await projectsRes.json())
      if (usersRes.ok) setUsers(await usersRes.json())
    } catch (e) {
      if (e.message === 'Unauthorized: Token expired or invalid') {
        clearToken()
        clearUser()
        nav('/login', { replace: true })
      } else {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!projectForm.name) {
      setError('Please enter project name')
      return
    }
    try {
      const res = await authFetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm)
      })
      if (!res.ok) throw new Error('Failed to create project')
      await load()
      setProjectForm({ name: '', client: '', description: '', testerId: '', developerIds: [] })
      setProjectDialog(false)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleEditProject = (project) => {
    setEditProjectForm({
      id: project.id,
      name: project.name,
      client: project.client || '',
      description: project.description || '',
      testerId: project.testerId || '',
      developerIds: Array.isArray(project.developerIds) ? project.developerIds : []
    })
    setEditProjectDialog(true)
  }

  const handleUpdateProject = async () => {
    if (!editProjectForm.name) {
      setError('Please enter project name')
      return
    }
    try {
      const { id, name, client, description, testerId, developerIds } = editProjectForm;
      const payload = { name, client, description, testerId, developerIds };
      
      const res = await authFetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update project')
      }
      await load()
      setEditProjectDialog(false)
    } catch (e) {
      setError(e.message)
    }
  }

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

  const filteredProjects = projects.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false
    return true
  })

  const columns = [
    {
      key: 'name',
      label: 'Project',
      render: (val, p) => (
        <div className="flex flex-col">
          <h6 className="mb-0 text-sm leading-normal">{val}</h6>
          <p className="mb-0 text-xs leading-tight text-slate-400 truncate max-w-xs">{p.description}</p>
        </div>
      )
    },
    { key: 'client', label: 'Client' },
    {
      key: 'status',
      label: 'Status',
      render: (status) => <Badge gradient={getStatusGradient(status)} size="sm">{status}</Badge>
    },
    {
      key: 'team',
      label: 'Team',
      render: (_, p) => (
        <div className="text-xs">
          <span className="text-slate-400">Tester:</span> {p.testerName || '—'}<br/>
          <span className="text-slate-400">Devs:</span> {p.developerNames?.length || 0}
        </div>
      )
    },
    {
      key: 'openBugsCount',
      label: 'Bugs',
      render: (val) => <span className="text-xs font-bold text-slate-400">{val || 0}</span>
    },
    {
      key: 'completion',
      label: 'Completion',
      render: (_, p) => (
        <div className="w-full max-w-[120px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xxs font-bold">{(p.completedScreensCount || 0)} / {(p.totalScreensCount || 0)}</span>
          </div>
          <div className="text-xs h-1 w-full bg-gray-100 rounded-lg overflow-hidden">
            <div 
              className="h-full bg-gradient-to-tl from-blue-600 to-cyan-400 rounded-lg transition-all duration-500"
              style={{ width: `${(p.totalScreensCount > 0 ? (p.completedScreensCount / p.totalScreensCount) * 100 : 0)}%` }}
            ></div>
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, p) => (
        <div className="flex gap-3">
          <Link to={`/projects/${p.id}`} className="text-slate-400 hover:text-fuchsia-500 transition-colors" title="View Project">
            <Eye size={18} />
          </Link>
          {user?.role === 'admin' && (
            <button onClick={() => handleEditProject(p)} className="text-slate-400 hover:text-blue-500 transition-colors" title="Edit Project">
              <Edit size={18} />
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-wrap -mx-3">
      <div className="w-full max-w-full px-3 mb-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <h6 className="font-bold text-slate-700 mb-0">Projects Management</h6>
                <p className="text-xs text-slate-500 font-medium">Track and organize all your projects</p>
              </div>
              {user?.role === 'admin' && (
                <Button size="sm" variant="primary" onClick={() => setProjectDialog(true)}>
                  <Plus size={14} className="mr-2" /> New Project
                </Button>
              )}
            </div>
            {error && (
              <Alert variant="danger" className="mt-4">
                {error}
              </Alert>
            )}
            
            <div className="mt-4 max-w-xs">
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
          </CardHeader>
          <CardBody className="px-0 pt-0 pb-2">
            <Table columns={columns} data={filteredProjects} loading={loading} pagination={true} pageSize={10} />
          </CardBody>
        </Card>
      </div>

      {/* Add Project Modal */}
      <Modal 
        isOpen={projectDialog} 
        title="Create New Project" 
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
          placeholder="My Awesome App"
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
        />
        <Select 
          label="Assign Tester"
          value={projectForm.testerId}
          onChange={(e) => setProjectForm({...projectForm, testerId: e.target.value})}
          options={[
            { label: 'Select Tester', value: '' },
            ...(users?.filter(u => u.role === 'tester' || u.role === 'admin').map(u => ({ label: u.name, value: u.id })) || [])
          ]}
        />
        <div className="mb-4">
          <label className="mb-2 ml-1 font-bold text-xs text-slate-700 block">
            Assign Developers
          </label>
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-slate-50">
            {users?.filter(u => u.role === 'developer' || u.role === 'admin').map(dev => (
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

      {/* Edit Project Modal */}
      <Modal 
        isOpen={editProjectDialog} 
        title="Edit Project" 
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
        />
        <Select 
          label="Assign Tester"
          value={editProjectForm.testerId}
          onChange={(e) => setEditProjectForm({...editProjectForm, testerId: e.target.value})}
          options={[
            { label: 'Select Tester', value: '' },
            ...(users?.filter(u => u.role === 'tester' || u.role === 'admin').map(u => ({ label: u.name, value: u.id })) || [])
          ]}
        />
        <div className="mb-4">
          <label className="mb-2 ml-1 font-bold text-xs text-slate-700 block">
            Assign Developers
          </label>
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-slate-50">
            {users?.filter(u => u.role === 'developer' || u.role === 'admin').map(dev => (
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
    </div>
  )
}
