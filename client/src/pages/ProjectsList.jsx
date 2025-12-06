import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authFetch, getUser } from '../auth'
import { API_BASE_URL } from '../apiConfig';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Chip, Button, TextField, MenuItem, Select, FormControl, InputLabel } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

export default function ProjectsList() {
  const [projects, setProjects] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const user = getUser()

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
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'Planning':
      case 'Under Planning': return 'info'
      case 'Active':
      case 'Running': return 'success'
      case 'On Hold': return 'warning'
      case 'Completed': return 'default'
      case 'Critical': return 'error'
      default: return 'default'
    }
  }

  const filteredProjects = projects.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false
    return true
  })

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}>Loading projects...</Box>

  return (
    <Box sx={{ p: 3 }}>
      <Link to="/" style={{ textDecoration: 'none' }}>← Back to Dashboard</Link>

      <Box sx={{ mt: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <h2 style={{ margin: 0 }}>All Projects</h2>
          {user?.role === 'admin' && (
            <Button variant="contained" startIcon={<AddIcon />}>
              New Project
            </Button>
          )}
        </Box>
      </Box>

      {error && <Box sx={{ mb: 2, p: 2, bgcolor: '#ffebee', color: '#c62828', borderRadius: 1 }}>{error}</Box>}

      {/* Status Filter */}
      <Box sx={{ mb: 2 }}>
        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel>Status Filter</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status Filter"
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="Under Planning">Under Planning</MenuItem>
            <MenuItem value="Running">Running</MenuItem>
            <MenuItem value="On Hold">On Hold</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Critical">Critical</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {filteredProjects.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center', color: '#999' }}>No projects found</Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>Project Name</strong></TableCell>
              <TableCell><strong>Client</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Tester</strong></TableCell>
              <TableCell><strong>Developers</strong></TableCell>
              <TableCell><strong>Open Bugs</strong></TableCell>
              <TableCell><strong>Progress</strong></TableCell>
              <TableCell><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProjects.map(p => (
              <TableRow key={p.id}>
                <TableCell>
                  <strong>{p.name}</strong>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>{p.description}</div>
                </TableCell>
                <TableCell>{p.client || '—'}</TableCell>
                <TableCell>
                  <Chip label={p.status} color={getStatusColor(p.status)} size="small" />
                </TableCell>
                <TableCell>{p.testerName || '—'}</TableCell>
                <TableCell>
                  {p.developerNames?.map(d => d.name).join(', ') || 'None'}
                </TableCell>
                <TableCell>{p.openBugsCount || 0}</TableCell>
                <TableCell>
                  {(p.completedScreensCount || 0)} / {(p.totalScreensCount || 0)}
                </TableCell>
                <TableCell>
                  <Link to={`/projects/${p.id}`}>
                    <Button size="small" variant="outlined">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  )
}
