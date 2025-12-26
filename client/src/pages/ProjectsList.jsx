import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch, getUser, clearToken, clearUser } from '../auth'
import { API_BASE_URL } from '../apiConfig';
import { Card, CardHeader, CardBody, Badge, Button } from '../components/TailAdminComponents'
import { Table, Select } from '../components/FormComponents'
import { Eye, Plus } from 'lucide-react'

export default function ProjectsList() {
  const [projects, setProjects] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const user = getUser()
  const nav = useNavigate()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/projects`)
      if (!res.ok) throw new Error('Failed to fetch projects')
      const data = await res.json()
      setProjects(data)
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
      label: '',
      render: (_, p) => (
        <Link to={`/projects/${p.id}`} className="text-slate-400 hover:text-fuchsia-500 transition-colors">
          <Eye size={18} />
        </Link>
      )
    }
  ]

  return (
    <div className="flex flex-wrap -mx-3">
      <div className="w-full max-w-full px-3 mb-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h6 className="font-bold">Projects Management</h6>
              {user?.role === 'admin' && (
                <Button size="sm" variant="primary">
                  <Plus size={14} className="mr-2" /> New Project
                </Button>
              )}
            </div>
            {error && (
              <div className="mt-4 p-4 text-white bg-gradient-to-tl from-red-600 to-rose-400 rounded-lg text-sm">
                {error}
              </div>
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
    </div>
  )
}
