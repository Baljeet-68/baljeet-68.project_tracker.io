import React, { useEffect, useState } from 'react'
import { authFetch, getUser } from '../auth'
import { API_BASE_URL } from '../apiConfig'
import { Card, CardHeader, CardBody, Badge, Button } from '../components/TailAdminComponents'
import { Modal, InputGroup, Select, Table, Alert } from '../components/FormComponents'
import { Users as UsersIcon, UserPlus, RefreshCw, Edit, Trash2, Eye, EyeOff, Wand2, Mail, User, Lock } from 'lucide-react'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // User form
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'developer' })
  const [userDialog, setUserDialog] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Edit User form
  const [editUserForm, setEditUserForm] = useState({ id: '', name: '', email: '', role: '', status: '', password: '' })
  const [editUserDialog, setEditUserDialog] = useState(false)
  const [editShowPassword, setEditShowPassword] = useState(false)

  // Delete User confirmation
  const [deleteUserDialog, setDeleteUserDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)

  const me = getUser()

  const generatePassword = (isEdit = false) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+'
    let pass = ''
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    if (isEdit) {
      setEditUserForm({ ...editUserForm, password: pass })
      setEditShowPassword(true)
    } else {
      setUserForm({ ...userForm, password: pass })
      setShowPassword(true)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(`${API_BASE_URL}/users`)
      if (res.ok) setUsers(await res.json())
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
      setShowPassword(false)
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
      setEditShowPassword(false)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    try {
      const res = await authFetch(`${API_BASE_URL}/users/${userToDelete.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete user')
      }
      await load()
      setDeleteUserDialog(false)
      setUserToDelete(null)
    } catch (e) {
      setError(e.message)
      setDeleteUserDialog(false)
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
        if (role === 'hr') gradient = 'from-purple-600 to-fuchsia-400'
        if (role === 'ecommerce') gradient = 'from-orange-600 to-yellow-400'
        if (role === 'management') gradient = 'from-indigo-600 to-blue-400'
        if (role === 'accountant') gradient = 'from-teal-600 to-emerald-400'
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
          <button onClick={() => handleEditUser(user)} className="text-slate-400 hover:text-blue-500 transition-colors" title="Edit User">
            <Edit size={16} />
          </button>
          {user.role !== 'admin' && (
            <button 
              onClick={() => {
                setUserToDelete(user)
                setDeleteUserDialog(true)
              }} 
              className="text-slate-400 hover:text-red-500 transition-colors"
              title="Delete User"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-wrap -mx-3">
      <div className="w-full max-w-full px-3 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="font-bold text-slate-700 mb-0">User Management</h4>
            <p className="text-xs text-slate-500 font-medium">Manage team members and their roles</p>
          </div>
          <div className="flex gap-2">
            
            <Button variant="info" size="sm" onClick={() => setUserDialog(true)}>
              <UserPlus size={14} className="mr-1 inline" /> Add User
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}
      </div>

      <div className="w-full max-w-full px-3 mb-6">
        <Card>
                    <CardBody>
            <Table columns={userColumns} data={users} loading={loading} pagination={true} pageSize={10} />
          </CardBody>
        </Card>
      </div>

      {/* Add User Modal */}
      <Modal 
        isOpen={userDialog} 
        title="Add New User" 
        onClose={() => {
          setUserDialog(false)
          setShowPassword(false)
        }}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => {
              setUserDialog(false)
              setShowPassword(false)
            }}>Cancel</Button>
            <Button variant="info" size="sm" onClick={handleCreateUser}>Create User</Button>
          </>
        }
      >
        <InputGroup 
          label="Full Name" 
          icon={<User size={16} className="text-slate-400" />}
          value={userForm.name} 
          onChange={(e) => setUserForm({...userForm, name: e.target.value})} 
          placeholder="John Doe"
        />
        <InputGroup 
          label="Email Address" 
          type="email"
          icon={<Mail size={16} className="text-slate-400" />}
          value={userForm.email} 
          onChange={(e) => setUserForm({...userForm, email: e.target.value})} 
          placeholder="john@example.com"
        />
        <InputGroup 
          label="Password" 
          type={showPassword ? 'text' : 'password'}
          icon={<Lock size={16} className="text-slate-400" />}
          value={userForm.password} 
          onChange={(e) => setUserForm({...userForm, password: e.target.value})} 
          rightElement={
            <>
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button 
                type="button"
                onClick={() => generatePassword(false)}
                className="text-slate-400 hover:text-blue-500 transition-colors"
                title="Generate Password"
              >
                <Wand2 size={16} />
              </button>
            </>
          }
        />
        <Select 
          label="Role"
          value={userForm.role}
          onChange={(e) => setUserForm({...userForm, role: e.target.value})}
          options={[
            { label: 'Admin', value: 'admin' },
            { label: 'Developer', value: 'developer' },
            { label: 'HR', value: 'hr' },
            { label: 'E-commerce', value: 'ecommerce' },
            { label: 'Management', value: 'management' },
            { label: 'Accountant', value: 'accountant' },
          ]}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal 
        isOpen={editUserDialog} 
        title="Edit User" 
        onClose={() => {
          setEditUserDialog(false)
          setEditShowPassword(false)
        }}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => {
              setEditUserDialog(false)
              setEditShowPassword(false)
            }}>Cancel</Button>
            <Button variant="info" size="sm" onClick={handleUpdateUser}>Save Changes</Button>
          </>
        }
      >
        <InputGroup 
          label="Full Name" 
          icon={<User size={16} className="text-slate-400" />}
          value={editUserForm.name} 
          onChange={(e) => setEditUserForm({...editUserForm, name: e.target.value})} 
        />
        <InputGroup 
          label="Email Address" 
          type="email"
          icon={<Mail size={16} className="text-slate-400" />}
          value={editUserForm.email} 
          onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})} 
        />
        <InputGroup 
          label="New Password (leave blank to keep current)" 
          type={editShowPassword ? 'text' : 'password'}
          icon={<Lock size={16} className="text-slate-400" />}
          value={editUserForm.password} 
          onChange={(e) => setEditUserForm({...editUserForm, password: e.target.value})} 
          rightElement={
            <>
              <button 
                type="button"
                onClick={() => setEditShowPassword(!editShowPassword)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title={editShowPassword ? "Hide Password" : "Show Password"}
              >
                {editShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button 
                type="button"
                onClick={() => generatePassword(true)}
                className="text-slate-400 hover:text-blue-500 transition-colors"
                title="Generate Password"
              >
                <Wand2 size={16} />
              </button>
            </>
          }
        />
        <Select 
          label="Role"
          value={editUserForm.role}
          onChange={(e) => setEditUserForm({...editUserForm, role: e.target.value})}
          options={[
            { label: 'Admin', value: 'admin' },
            { label: 'Developer', value: 'developer' },
            { label: 'HR', value: 'hr' },
            { label: 'E-commerce', value: 'ecommerce' },
            { label: 'Management', value: 'management' },
            { label: 'Accountant', value: 'accountant' },
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

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={deleteUserDialog}
        title="Confirm Deletion"
        onClose={() => setDeleteUserDialog(false)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteUserDialog(false)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDeleteUser}>Delete User</Button>
          </>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={32} />
          </div>
          <p className="text-slate-600">
            Are you sure you want to delete <span className="font-bold text-slate-800">{userToDelete?.name}</span>?
          </p>
          <p className="text-xs text-slate-400 mt-2">
            This action cannot be undone and will remove all associated data.
          </p>
        </div>
      </Modal>
    </div>
  )
}
