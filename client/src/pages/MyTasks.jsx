import React from 'react'
import { useNavigate } from 'react-router-dom'
import PageContainer from '../components/layout/PageContainer'
import { Card, CardBody, PageHeader } from '../components/TailAdminComponents'
import { Table } from '../components/FormComponents'
import { API_BASE_URL } from '../apiConfig'
import { authFetch } from '../auth'

function groupByCategory(tasks) {
  const groups = {
    projects: [],
    leaves: [],
    bugs: [],
    hr: [],
    notifications: []
  }

  tasks.forEach((t) => {
    if (t.category === 'projects') groups.projects.push(t)
    else if (t.category === 'leaves') groups.leaves.push(t)
    else if (t.category === 'bugs') groups.bugs.push(t)
    else if (t.category === 'hr') groups.hr.push(t)
    else if (t.category === 'notifications') groups.notifications.push(t)
    else groups.notifications.push(t) // fallback
  })

  return groups
}

export default function MyTasks() {
  const [tasks, setTasks] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const navigate = useNavigate()

  React.useEffect(() => {
    let cancelled = false
    async function loadTasks() {
      try {
        const res = await authFetch(`${API_BASE_URL}/tasks/my`)
        if (!res.ok) {
          throw new Error('Failed to load tasks')
        }
        const data = await res.json()
        if (!cancelled) {
          setTasks(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load tasks')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    loadTasks()
    return () => {
      cancelled = true
    }
  }, [])

  const grouped = groupByCategory(tasks)

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{row.title}</span>
          {row.description && (
            <span className="text-xs text-slate-500 mt-0.5 line-clamp-2">
              {row.description}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (_, row) => {
        const priorityColors = {
          high: 'bg-red-100 text-red-800',
          medium: 'bg-yellow-100 text-yellow-800',
          low: 'bg-green-100 text-green-800'
        }
        const color = priorityColors[row.priority] || 'bg-gray-100 text-gray-800'
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${color}`}>
            {row.priority}
          </span>
        )
      }
    },
    {
      key: 'module',
      label: 'Module',
      render: (_, row) => (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 capitalize">
          {row.module}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (_, row) => {
        const d = row.createdAt ? new Date(row.createdAt) : null
        const label = d && !isNaN(d.getTime())
          ? d.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
          : '-'
        return <span className="text-xs text-slate-500">{label}</span>
      }
    },
    {
      key: 'action',
      label: 'Action',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => {
            if (row.actionUrl) {
              navigate(row.actionUrl)
            }
          }}
          className="inline-flex items-center rounded-lg border border-indigo-500 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          View
        </button>
      )
    }
  ]

  const renderSection = (title, items, category) => (
    <Card className="mb-6">
      <CardBody>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          <span className="text-xs font-medium text-slate-500">
            {items.length} task{items.length === 1 ? '' : 's'}
          </span>
        </div>
        {items.length === 0 ? (
          <div className="text-xs text-slate-500 py-6 text-center">
            No {category} tasks right now.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table columns={columns} data={items} />
          </div>
        )}
      </CardBody>
    </Card>
  )

  return (
    <PageContainer>
      <PageHeader
        title="My Tasks"
        subtitle="Aggregated work items from leaves, bugs, projects, screens, careers, and notifications."
      />

      {loading && (
        <Card>
          <CardBody>
            <div className="py-10 text-center text-sm text-slate-500">
              Loading your tasks...
            </div>
          </CardBody>
        </Card>
      )}

      {!loading && error && (
        <Card>
          <CardBody>
            <div className="py-10 text-center text-sm text-red-500">
              {error}
            </div>
          </CardBody>
        </Card>
      )}

      {!loading && !error && (
        <>
          {renderSection('Project Tasks', grouped.projects, 'project')}
          {renderSection('Leave Management', grouped.leaves, 'leave')}
          {renderSection('Bug Management', grouped.bugs, 'bug')}
          {renderSection('HR Tasks', grouped.hr, 'HR')}
          {renderSection('Notifications', grouped.notifications, 'notification')}
        </>
      )}
    </PageContainer>
  )
}

