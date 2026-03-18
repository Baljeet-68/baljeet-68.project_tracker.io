import React, { useEffect, useState } from 'react'
import { authFetch, getUser } from '../auth'
import { API_BASE_URL } from '../apiConfig'
import { Card, CardHeader, CardBody, Badge, Button } from '../components/TailAdminComponents'
import { Modal, InputGroup, Select, Table, ConfirmDialog } from '../components/FormComponents'
import { Users as UsersIcon, UserPlus, RefreshCw, Edit, Trash2, Eye, EyeOff, Wand2, Mail, User, Lock, Shield, Code, Briefcase, UserCheck, Calculator, Search } from 'lucide-react'
import { handleError, handleApiResponse } from '../utils/errorHandler'
import { noChangesToastConfig } from '../utils/changeDetection'
import { toast } from 'react-hot-toast'
import PageLayout from '../components/layout/PageLayout'
import PageContainer from '../components/layout/PageContainer'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // User form
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'developer' })
  const [userDialog, setUserDialog] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'primary' })

  // Edit User form
  const [editUserForm, setEditUserForm] = useState({ id: '', name: '', email: '', role: '', status: '', password: '' })
  const [originalUser, setOriginalUser] = useState(null)
  const [editUserDialog, setEditUserDialog] = useState(false)
  const [editShowPassword, setEditShowPassword] = useState(false)

  const me = getUser()

  const roleStats = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    acc.total = (acc.total || 0) + 1
    return acc
  }, { total: 0 })

  const filteredUsers = React.useMemo(() => {
    return users.filter(u => {
      if (roleFilter && u.role !== roleFilter) return false
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchesName = u.name?.toLowerCase().includes(query)
        const matchesEmail = u.email?.toLowerCase().includes(query)
        if (!matchesName && !matchesEmail) return false
      }
      
      return true
    })
  }, [users, roleFilter, searchQuery])

  const statCards = [
    { label: 'Total Users', count: roleStats.total, icon: UsersIcon, color: 'from-blue-600 to-cyan-400' },
    { label: 'Admins', count: roleStats.admin || 0, icon: Shield, color: 'from-purple-700 to-pink-500' },
    { label: 'Developers', count: roleStats.developer || 0, icon: Code, color: 'from-green-600 to-lime-400' },
    { label: 'HR', count: roleStats.hr || 0, icon: UserCheck, color: 'from-orange-500 to-yellow-400' },
    { label: 'Management', count: roleStats.management || 0, icon: Briefcase, color: 'from-red-600 to-rose-400' },
    { label: 'Accountants', count: roleStats.accountant || 0, icon: Calculator, color: 'from-indigo-600 to-purple-400' },
  ]

  const generatePassword = (isEdit = false) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+'
    let pass = ''
    const array = new Uint8Array(12);
    window.crypto.getRandomValues(array);
    const passwordArray = Array.from(array).map(c => chars[c % chars.length]);
    pass = passwordArray.join('');
    if (isEdit) {
      setEditUserForm({ ...editUserForm, password: pass })
      setEditShowPassword(true)
    } else {
      setUserForm({ ...userForm, password: pass })
      setShowPassword(true)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [])

  const load = async (signal) => {
    setLoading(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/users`, { signal })
      const data = await handleApiResponse(res)
      setUsers(data)
    } catch (e) {
      if (e.name !== 'AbortError') {
        handleError(e)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      toast.error('Please fill all fields')
      return
    }
    try {
      const res = await authFetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      })
      await handleApiResponse(res)
      toast.success('User created successfully')
      await load()
      setUserForm({ name: '', email: '', password: '', role: 'developer' })
      setUserDialog(false)
      setShowPassword(false)
    } catch (e) {
      handleError(e)
    }
  }

  const handleEditUser = (user) => {
    setOriginalUser(user)
    setEditUserForm({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.active ? 'active' : 'inactive',
      password: ''
    })
    setEditUserDialog(true)
  }

  const handleUpdateUser = async () => {
    if (!editUserForm.name || !editUserForm.email || !editUserForm.role) {
      toast.error('Please fill all fields')
      return
    }
    try {
      const { id, name, email, role, status, password } = editUserForm;
      
      // Check for changes
      const activeStatus = status === 'active' ? 1 : 0;
      const hasChanges = 
        name !== originalUser.name ||
        email !== originalUser.email ||
        role !== originalUser.role ||
        activeStatus !== (originalUser.active ? 1 : 0) ||
        !!password;

      if (!hasChanges) {
        if (import.meta.env.DEV) {
          console.info('[Users] No changes detected for user:', id);
        }
        toast('No changes detected', noChangesToastConfig)
        setEditUserDialog(false)
        return
      }

      if (!id) {
        toast.error('User ID is missing. Please refresh and try again.');
        return;
      }
    
      const payload = { name, email, role, active: activeStatus };
      if (password) {
        payload.password = password;
      }

      const res = await authFetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      await handleApiResponse(res)
      toast.success('User updated successfully')
      await load()
      setEditUserDialog(false)
      setEditShowPassword(false)
    } catch (e) {
      handleError(e)
    }
  }

  const handleDeleteUser = async (user) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete User',
      onConfirm: async () => {
        try {
          const res = await authFetch(`${API_BASE_URL}/users/${user.id}`, {
            method: 'DELETE'
          })
          await handleApiResponse(res)
          toast.success('User deleted successfully')
          await load()
          setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        } catch (e) {
          handleError(e)
          setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
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
              onClick={() => handleDeleteUser(user)} 
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
  <PageContainer>
      <PageLayout
        maxWidth="full"
        title="User Management"
        subtitle="Manage team members and their roles"
        actions={(
          <Button variant="info" size="sm" onClick={() => setUserDialog(true)}>
            <UserPlus size={14} className="mr-1 inline" /> Add User
          </Button>
        )}
      >
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="p-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-tl ${stat.color} flex items-center justify-center text-white shadow-soft-lg`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <h5 className="text-xl font-bold text-slate-700">{stat.count}</h5>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap -mx-3">
        <div className="w-full max-w-full px-3 mb-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4 justify-between items-end w-full">
                <div className="w-full md:max-w-xs">
                  <InputGroup
                    label="Search Users"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search size={16} />}
                    className="mb-0"
                  />
                </div>
                <div className="w-full md:max-w-xs">
                  <Select
                    label="Filter by Role"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    options={[
                      { value: '', label: 'All Roles' },
                      { label: 'Admin', value: 'admin' },
                      { label: 'Developer', value: 'developer' },
                      { label: 'HR', value: 'hr' },
                      { label: 'E-commerce', value: 'ecommerce' },
                      { label: 'Management', value: 'management' },
                      { label: 'Accountant', value: 'accountant' },
                    ]}
                    className="mb-0"
                  />
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <Table columns={userColumns} data={filteredUsers} loading={loading} pagination={true} pageSize={10} />
            </CardBody>
          </Card>
        </div>
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
          label="Password" 
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

      <ConfirmDialog 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        confirmText={confirmConfig.confirmText}
        type={confirmConfig.type}
      />
    </PageLayout>
    </PageContainer>
  )
}
