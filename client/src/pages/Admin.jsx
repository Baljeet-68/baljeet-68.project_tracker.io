import React, { useEffect, useState } from 'react'
import { authFetch, getUser } from '../auth'
import { API_BASE_URL } from '../apiConfig'
import { Card, CardHeader, CardBody, Badge, Button } from '../components/TailAdminComponents'
import { Modal, InputGroup, Select, Table } from '../components/FormComponents'
import { Users, FolderPlus, UserPlus, RefreshCw, Edit, Trash2 } from 'lucide-react'

export default function Admin() {
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // User form
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'developer' })
  const [userDialog, setUserDialog] = useState(false)

  // Project form
  const [projectForm, setProjectForm] = useState({ name: '', client: '', description: '', testerId: '', developerIds: [] })
  const [projectDialog, setProjectDialog] = useState(false)

  // Edit Project form
  const [editProjectForm, setEditProjectForm] = useState({ id: '', name: '', client: '', description: '', testerId: '', developerIds: [] })
  const [editProjectDialog, setEditProjectDialog] = useState(false)

  // Edit User form
  const [editUserForm, setEditUserForm] = useState({ id: '', name: '', email: '', role: '', status: '', password: '' })
  const [editUserDialog, setEditUserDialog] = useState(false)

  const me = getUser()

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [usersRes, projectsRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/users`),
        authFetch(`${API_BASE_URL}/projects`)
      ])

      if (usersRes.ok) setUsers(await usersRes.json())
      if (projectsRes.ok) setProjects(await projectsRes.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      setError('Please fill all fields')
      return
    }
    try {
      const res = await authFetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      })
      if (!res.ok) throw new Error('Failed to create user')
      await load()
      setUserForm({ name: '', email: '', password: '', role: 'developer' })
      setUserDialog(false)
    } catch (e) {
      setError(e.message)
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
      developerIds: project.developerIds || []
    })
    setEditProjectDialog(true)
  }

  const handleUpdateProject = async () => {
    if (!editProjectForm.name) {
      setError('Please enter project name')
      return
    }
    try {
      const res = await authFetch(`${API_BASE_URL}/projects/${editProjectForm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProjectForm)
      })
      if (!res.ok) throw new Error('Failed to update project')
      await load()
      setEditProjectDialog(false)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleEditUser = (user) => {
    setEditUserForm({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.active === 1 ? 'active' : 'inactive',
      password: ''
    })
    setEditUserDialog(true)
  }

  const handleUpdateUser = async () => {
    if (!editUserForm.name || !editUserForm.email || !editUserForm.role) {
      setError('Please fill all fields')
      return
    }
    try {
      const { id, name, email, role, status, password } = editUserForm;
      const activeStatus = status === 'active' ? 1 : 0;
      const payload = { name, email, role, active: activeStatus };
      if (password) {
        payload.password = password;
      }

      const res = await authFetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to update user')
      await load()
      setEditUserDialog(false)
    } catch (e) {
      setError(e.message)
    }
  }

  const userColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { 
      key: 'role', 
      label: 'Role',
      render: (role) => {
        let gradient = 'from-slate-600 to-slate-300'
        if (role === 'admin') gradient = 'from-red-600 to-rose-400'
        if (role === 'tester') gradient = 'from-blue-600 to-cyan-400'
        if (role === 'developer') gradient = 'from-green-600 to-lime-400'
        return <Badge gradient={gradient}>{role}</Badge>
      }
    },
    {
      key: 'active',
      label: 'Status',
      render: (active) => (
        <Badge gradient={active ? 'from-green-600 to-lime-400' : 'from-slate-600 to-slate-300'}>
          {active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, user) => (
        <div className="flex gap-2">
          <button onClick={() => handleEditUser(user)} className="text-slate-400 hover:text-blue-500">
            <Edit size={16} />
          </button>
        </div>
      )
    }
  ]

  const projectColumns = [
    { key: 'name', label: 'Project Name' },
    { key: 'client', label: 'Client' },
    {
      key: 'status',
      label: 'Status',
      render: (status) => {
        let gradient = 'from-slate-600 to-slate-300'
        if (status === 'Running') gradient = 'from-green-600 to-lime-400'
        if (status === 'Critical') gradient = 'from-red-600 to-rose-400'
        return <Badge gradient={gradient}>{status}</Badge>
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, project) => (
        <div className="flex gap-2">
          <button onClick={() => handleEditProject(project)} className="text-slate-400 hover:text-blue-500">
            <Edit size={16} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-wrap -mx-3">
      <div className="w-full max-w-full px-3 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-slate-700">Admin Console</h4>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw size={14} className="mr-1 inline" /> Refresh
            </Button>
            <Button variant="info" size="sm" onClick={() => setUserDialog(true)}>
              <UserPlus size={14} className="mr-1 inline" /> Add User
            </Button>
            <Button variant="primary" size="sm" onClick={() => setProjectDialog(true)}>
              <FolderPlus size={14} className="mr-1 inline" /> Add Project
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 text-white bg-gradient-to-tl from-red-600 to-rose-400 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="w-full max-w-full px-3 mb-6">
        <Card>
          <CardHeader>
            <h6 className="font-bold"><Users size={18} className="mr-2 inline" /> Users Management</h6>
          </CardHeader>
          <CardBody>
            <Table columns={userColumns} data={users} loading={loading} pagination={true} pageSize={10} />
          </CardBody>
        </Card>
      </div>

      <div className="w-full max-w-full px-3 mb-6">
        <Card>
          <CardHeader>
            <h6 className="font-bold"><FolderPlus size={18} className="mr-2 inline" /> Projects Management</h6>
          </CardHeader>
          <CardBody>
            <Table columns={projectColumns} data={projects} loading={loading} pagination={true} pageSize={10} />
          </CardBody>
        </Card>
      </div>

      {/* Add User Modal */}
      <Modal 
        isOpen={userDialog} 
        title="Add New User" 
        onClose={() => setUserDialog(false)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setUserDialog(false)}>Cancel</Button>
            <Button variant="info" size="sm" onClick={handleCreateUser}>Create User</Button>
          </>
        }
      >
        <InputGroup 
          label="Full Name" 
          value={userForm.name} 
          onChange={(e) => setUserForm({...userForm, name: e.target.value})} 
          placeholder="John Doe"
        />
        <InputGroup 
          label="Email Address" 
          type="email"
          value={userForm.email} 
          onChange={(e) => setUserForm({...userForm, email: e.target.value})} 
          placeholder="john@example.com"
        />
        <InputGroup 
          label="Password" 
          type="password"
          value={userForm.password} 
          onChange={(e) => setUserForm({...userForm, password: e.target.value})} 
        />
        <Select 
          label="Role"
          value={userForm.role}
          onChange={(e) => setUserForm({...userForm, role: e.target.value})}
          options={[
            { label: 'Developer', value: 'developer' },
            { label: 'Tester', value: 'tester' },
            { label: 'Admin', value: 'admin' },
          ]}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal 
        isOpen={editUserDialog} 
        title="Edit User" 
        onClose={() => setEditUserDialog(false)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditUserDialog(false)}>Cancel</Button>
            <Button variant="info" size="sm" onClick={handleUpdateUser}>Save Changes</Button>
          </>
        }
      >
        <InputGroup 
          label="Full Name" 
          value={editUserForm.name} 
          onChange={(e) => setEditUserForm({...editUserForm, name: e.target.value})} 
        />
        <InputGroup 
          label="Email Address" 
          type="email"
          value={editUserForm.email} 
          onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})} 
        />
        <InputGroup 
          label="New Password (leave blank to keep current)" 
          type="password"
          value={editUserForm.password} 
          onChange={(e) => setEditUserForm({...editUserForm, password: e.target.value})} 
        />
        <Select 
          label="Role"
          value={editUserForm.role}
          onChange={(e) => setEditUserForm({...editUserForm, role: e.target.value})}
          options={[
            { label: 'Developer', value: 'developer' },
            { label: 'Tester', value: 'tester' },
            { label: 'Admin', value: 'admin' },
          ]}
        />
        <Select 
          label="Status"
          value={editUserForm.status}
          onChange={(e) => setEditUserForm({...editUserForm, status: e.target.value})}
          options={[
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ]}
        />
      </Modal>

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
          value={projectForm.name} 
          onChange={(e) => setProjectForm({...projectForm, name: e.target.value})} 
          placeholder="My Awesome App"
        />
        <InputGroup 
          label="Client Name" 
          value={projectForm.client} 
          onChange={(e) => setProjectForm({...projectForm, client: e.target.value})} 
          placeholder="Acme Corp"
        />
        <InputGroup 
          label="Description" 
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
            ...(users?.filter(u => u.role === 'tester').map(u => ({ label: u.name, value: u.id })) || [])
          ]}
        />
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
          value={editProjectForm.name} 
          onChange={(e) => setEditProjectForm({...editProjectForm, name: e.target.value})} 
        />
        <InputGroup 
          label="Client Name" 
          value={editProjectForm.client} 
          onChange={(e) => setEditProjectForm({...editProjectForm, client: e.target.value})} 
        />
        <InputGroup 
          label="Description" 
          value={editProjectForm.description} 
          onChange={(e) => setEditProjectForm({...editProjectForm, description: e.target.value})} 
        />
        <Select 
          label="Assign Tester"
          value={editProjectForm.testerId}
          onChange={(e) => setEditProjectForm({...editProjectForm, testerId: e.target.value})}
          options={[
            { label: 'Select Tester', value: '' },
            ...(users?.filter(u => u.role === 'tester').map(u => ({ label: u.name, value: u.id })) || [])
          ]}
        />
      </Modal>
    </div>
  )
}
