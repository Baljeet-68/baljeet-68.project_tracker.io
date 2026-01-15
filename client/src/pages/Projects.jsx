import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch, getUser } from '../auth'
import { API_BASE_URL } from '../apiConfig';
import { Card, CardHeader, CardBody, Badge, Button, PageHeader } from '../components/TailAdminComponents'
import { Table, Select, Modal, InputGroup } from '../components/FormComponents'
import { Eye, Plus, Edit, FolderPlus, Briefcase, User, FileText } from 'lucide-react'
import { Loader } from '../components/Loader'
import { handleError, handleApiResponse } from '../utils/errorHandler'
import { toast } from 'react-hot-toast'

/**
 * Helper to get status gradient based on project status
 */
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

/**
 * Projects Management Page
 * Displays a list of all projects and allows admins to create/edit them
 */
export default function Projects() {
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  
  // Project form states
  const [projectForm, setProjectForm] = useState({ name: '', client: '', description: '', testerId: '', developerIds: [] })
  const [projectDialog, setProjectDialog] = useState(false)

  // Edit Project form states
  const [editProjectForm, setEditProjectForm] = useState({ id: '', name: '', client: '', description: '', testerId: '', developerIds: [] })
  const [originalProject, setOriginalProject] = useState(null)
  const [editProjectDialog, setEditProjectDialog] = useState(false)

  const user = getUser()
  const nav = useNavigate()

  useEffect(() => {
    load()
  }, [])

  /**
   * Fetch projects and users data
   */
  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const [projectsRes, usersRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/projects`),
        authFetch(`${API_BASE_URL}/users`)
      ])
      
      const projectsData = await handleApiResponse(projectsRes)
      setProjects(projectsData)
      
      const usersData = await handleApiResponse(usersRes)
      setUsers(usersData)
    } catch (e) {
      handleError(e)
    } finally {
      setLoading(false)
    }
  }, [nav])

  /**
   * Handle new project creation
   */
  const handleCreateProject = async () => {
    if (!projectForm.name) {
      toast.error('Please enter project name')
      return
    }
    try {
      const res = await authFetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm)
      })
      await handleApiResponse(res)
      
      toast.success('Project created successfully')
      await load()
      setProjectForm({ name: '', client: '', description: '', testerId: '', developerIds: [] })
      setProjectDialog(false)
    } catch (e) {
      handleError(e)
    }
  }

  /**
   * Open edit dialog with project data
   */
  const handleEditProject = (project) => {
    const projectData = {
      id: project.id,
      name: project.name,
      client: project.client || '',
      description: project.description || '',
      testerId: project.testerId || '',
      developerIds: Array.isArray(project.developerIds) ? project.developerIds : []
    }
    setEditProjectForm(projectData)
    setOriginalProject(projectData)
    setEditProjectDialog(true)
  }

  /**
   * Handle project update
   */
  const handleUpdateProject = async () => {
    if (!editProjectForm.name) {
      toast.error('Please enter project name')
      return
    }
    try {
      const { id, name, client, description, testerId, developerIds } = editProjectForm;
      
      // Check for changes
      const hasChanges = 
        name !== originalProject.name ||
        client !== originalProject.client ||
        description !== originalProject.description ||
        testerId !== originalProject.testerId ||
        JSON.stringify(developerIds.sort()) !== JSON.stringify(originalProject.developerIds.sort());

      if (!hasChanges) {
        console.info('[Projects] No changes detected for project:', id);
        toast('No changes detected', {
          icon: 'ℹ️',
          style: {
            background: '#f0f9ff',
            color: '#0369a1',
            border: '1px solid #bae6fd',
          }
        })
        setEditProjectDialog(false)
        return
      }

      const payload = { name, client, description, testerId, developerIds };
      
      const res = await authFetch(`${API_BASE_URL}/projects/${id}`, {
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

  const filteredProjects = React.useMemo(() => {
    return projects.filter(p => {
      if (statusFilter && p.status !== statusFilter) return false
      return true
    })
  }, [projects, statusFilter])

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
      key: 'team',
      label: 'Team',
      render: (_, p) => (
        <div className="text-xs">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-slate-400 font-medium">Tester:</span> 
            <span className="text-slate-600">{p.testerName || '—'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-medium">Devs:</span> 
            <span className="text-slate-600">{p.developerNames?.length || 0} assigned</span>
          </div>
        </div>
      )
    },
    {
      key: 'openBugsCount',
      label: 'Bugs',
      sortable: true,
      render: (val) => (
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-bold ${val > 0 ? 'text-red-500' : 'text-slate-400'}`}>{val || 0}</span>
          <span className="text-[10px] text-slate-400 uppercase font-bold">Open</span>
        </div>
      )
    },
    {
      key: 'completion',
      label: 'Progress',
      sortable: true,
      render: (_, p) => {
        const percentage = p.totalScreensCount > 0 ? (p.completedScreensCount / p.totalScreensCount) * 100 : 0;
        return (
          <div className="w-full max-w-[140px]">
            <div className="flex justify-between items-center mb-1.5 px-0.5">
              <span className="text-[10px] font-bold text-slate-500">{p.completedScreensCount || 0} / {p.totalScreensCount || 0} Screens</span>
              <span className="text-[10px] font-bold text-slate-700">{percentage.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, p) => (
        <div className="flex gap-2">
          <Link to={`/projects/${p.id}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View Project">
            <Eye size={18} />
          </Link>
          {user?.role === 'admin' && (
            <button onClick={() => handleEditProject(p)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit Project">
              <Edit size={18} />
            </button>
          )}
        </div>
      )
    }
  ], [user?.role])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Projects Management"
        subtitle="Track and organize all your projects"
        actions={user?.role === 'admin' ? (
          <Button size="sm" variant="primary" onClick={() => setProjectDialog(true)}>
            <Plus size={14} className="mr-2" /> New Project
          </Button>
        ) : null}
      />

      <Card>
        <CardHeader>
          <div className="max-w-xs">
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
