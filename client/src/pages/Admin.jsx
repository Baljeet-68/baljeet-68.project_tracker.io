import React, { useEffect, useState } from 'react'
import { authFetch, getUser } from '../auth'
import { Box, Card, CardContent, Grid, TextField, Button, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Container } from '@mui/material'
import RefreshSharpIcon from '@mui/icons-material/RefreshSharp'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import PeopleIcon from '@mui/icons-material/People'
import EditIcon from '@mui/icons-material/Edit'
import { Snackbar, Alert } from '@mui/material'
import { API_BASE_URL } from '../apiConfig'

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

  // Assign members to project
  const [assignDialog, setAssignDialog] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [assignTesterId, setAssignTesterId] = useState('')
  const [assignDeveloperIds, setAssignDeveloperIds] = useState([])

  // Update project status
  const [statusDialog, setStatusDialog] = useState(false)
  const [selectedStatusProjectId, setSelectedStatusProjectId] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('Active')
  const [statusToast, setStatusToast] = useState({ open: false, message: '', severity: 'success' })

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
      const res = await authFetch(`${API_BASE_URL}/api/users`, {
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

  const handleAssignMembers = async () => {
    if (!selectedProjectId || !assignTesterId) {
      setError('Please select project and tester')
      return
    }
    try {
      const res = await authFetch(`${API_BASE_URL}/projects/${selectedProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testerId: assignTesterId, developerIds: assignDeveloperIds })
      })
      if (!res.ok) throw new Error('Failed to assign members')
      await load()
      setAssignDialog(false)
      setSelectedProjectId('')
      setAssignTesterId('')
      setAssignDeveloperIds([])
    } catch (e) {
      setError(e.message)
    }
  }

  const handleUpdateProjectStatus = async () => {
    if (!selectedStatusProjectId) {
      setStatusToast({ open: true, message: 'Please select a project', severity: 'error' })
      return
    }
    try {
      const res = await authFetch(`${API_BASE_URL}/projects/${selectedStatusProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to update status')
      }
      await load()
      setStatusToast({ open: true, message: `Project status updated to "${selectedStatus}"`, severity: 'success' })
      setStatusDialog(false)
      setSelectedStatusProjectId('')
      setSelectedStatus('Active')
    } catch (e) {
      setStatusToast({ open: true, message: e.message, severity: 'error' })
    }
  }

  const closeStatusToast = () => {
    setStatusToast({ ...statusToast, open: false })
  }

  const testers = users.filter(u => u.role === 'tester')
  const developers = users.filter(u => u.role === 'developer')

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return 'error'
      case 'tester': return 'warning'
      case 'developer': return 'info'
      default: return 'default'
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'success'
      case 'Running': return 'success'
      case 'Planning': return 'info'
      case 'Under Planning': return 'info'
      case 'On Hold': return 'warning'
      case 'Completed': return 'default'
      case 'Critical': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box sx={{ py: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>Admin Console</Typography>
          <Typography variant="body2" color="text.secondary">Manage users, projects, and team assignments</Typography>
        </Box>
        <Button variant="contained" startIcon={<RefreshSharpIcon />} onClick={load} disabled={loading}>
          Refresh
        </Button>
      </Box>

      {error && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#ffebee', color: '#c62828', borderRadius: 1, border: '1px solid #ef5350' }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 32, color: '#51cbce', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{users.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <FolderOpenIcon sx={{ fontSize: 32, color: '#66bb6a', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{projects.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Projects</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#fbc02d', fontWeight: 700 }}>
                {users.filter(u => u.role === 'tester').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Testers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#66bb6a', fontWeight: 700 }}>
                {users.filter(u => u.role === 'developer').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Developers</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Management Cards */}
      <Grid container spacing={3}>
        {/* Create User Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <PersonAddIcon sx={{ color: '#51cbce', fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>Create User</Typography>
              </Box>
              <Button
                variant="contained"
                fullWidth
                startIcon={<AddCircleIcon />}
                onClick={() => setUserDialog(true)}
                sx={{ mb: 2 }}
              >
                New User
              </Button>
              <Dialog open={userDialog} onClose={() => setUserDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Create New User</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    margin="normal"
                    placeholder="John Doe"
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    margin="normal"
                    placeholder="john@example.com"
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    margin="normal"
                    placeholder="Secure password"
                  />
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      label="Role"
                    >
                      <MenuItem value="tester">Tester</MenuItem>
                      <MenuItem value="developer">Developer</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setUserDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateUser} variant="contained">Create</Button>
                </DialogActions>
              </Dialog>
            </CardContent>
          </Card>
        </Grid>

        {/* Create Project Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <FolderOpenIcon sx={{ color: '#66bb6a', fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>Create Project</Typography>
              </Box>
              <Button
                variant="contained"
                fullWidth
                startIcon={<AddCircleIcon />}
                onClick={() => setProjectDialog(true)}
                sx={{ mb: 2 }}
              >
                New Project
              </Button>
              <Dialog open={projectDialog} onClose={() => setProjectDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Create New Project</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                  <TextField
                    fullWidth
                    label="Project Name"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    margin="normal"
                    placeholder="e.g., Mobile App Redesign"
                  />
                  <TextField
                    fullWidth
                    label="Client Name"
                    value={projectForm.client}
                    onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })}
                    margin="normal"
                    placeholder="e.g., Acme Corp"
                  />
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    margin="normal"
                    placeholder="Project overview and goals..."
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setProjectDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateProject} variant="contained">Create</Button>
                </DialogActions>
              </Dialog>
            </CardContent>
          </Card>
        </Grid>

        {/* Assign Members to Project */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>Assign Project Members</Typography>
              <Button
                variant="contained"
                fullWidth
                startIcon={<AddCircleIcon />}
                onClick={() => setAssignDialog(true)}
                sx={{ mb: 2 }}
              >
                Assign Members to Project
              </Button>
              <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Assign Project Members</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Select Project</InputLabel>
                    <Select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      label="Select Project"
                    >
                      <MenuItem value="">-- Select Project --</MenuItem>
                      {projects.map(p => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth margin="normal">
                    <InputLabel>Primary Tester</InputLabel>
                    <Select
                      value={assignTesterId}
                      onChange={(e) => setAssignTesterId(e.target.value)}
                      label="Primary Tester"
                    >
                      <MenuItem value="">-- None --</MenuItem>
                      {testers.map(t => (
                        <MenuItem key={t.id} value={t.id}>{t.name} ({t.email})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth margin="normal">
                    <InputLabel>Developers (Multiple Select)</InputLabel>
                    <Select
                      multiple
                      value={assignDeveloperIds}
                      onChange={(e) => setAssignDeveloperIds(e.target.value)}
                      label="Developers"
                    >
                      {developers.map(d => (
                        <MenuItem key={d.id} value={d.id}>{d.name} ({d.email})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setAssignDialog(false)}>Cancel</Button>
                  <Button onClick={handleAssignMembers} variant="contained">Assign</Button>
                </DialogActions>
              </Dialog>
            </CardContent>
          </Card>
        </Grid>

        {/* Update Project Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>Update Project Status</Typography>
              <Button
                variant="contained"
                fullWidth
                startIcon={<EditIcon />}
                onClick={() => setStatusDialog(true)}
                sx={{ mb: 2 }}
              >
                Change Project Status
              </Button>
              <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Update Project Status</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Select Project</InputLabel>
                    <Select
                      value={selectedStatusProjectId}
                      onChange={(e) => setSelectedStatusProjectId(e.target.value)}
                      label="Select Project"
                    >
                      <MenuItem value="">-- Select Project --</MenuItem>
                      {projects.map(p => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth margin="normal">
                    <InputLabel>Project Status</InputLabel>
                    <Select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      label="Project Status"
                    >
                      <MenuItem value="Under Planning">Under Planning</MenuItem>
                      <MenuItem value="Running">Running</MenuItem>
                      <MenuItem value="On Hold">On Hold</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="Critical">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
                  <Button onClick={handleUpdateProjectStatus} variant="contained">Update Status</Button>
                </DialogActions>
              </Dialog>
            </CardContent>
          </Card>
        </Grid>

        {/* Users Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>All Users ({users.length})</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Name</Typography></TableCell>
                      <TableCell><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Email</Typography></TableCell>
                      <TableCell><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Role</Typography></TableCell>
                      <TableCell><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Status</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} hover>
                        <TableCell><Typography variant="body2">{u.name}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{u.email}</Typography></TableCell>
                        <TableCell>
                          <Chip label={u.role} color={getRoleColor(u.role)} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip label={u.active ? 'Active' : 'Inactive'} color={u.active ? 'success' : 'default'} size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Projects Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>All Projects ({projects.length})</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Project Name</Typography></TableCell>
                      <TableCell><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Client</Typography></TableCell>
                      <TableCell><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Status</Typography></TableCell>
                      <TableCell><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Tester</Typography></TableCell>
                      <TableCell><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Team</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projects.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{p.client || '—'}</Typography></TableCell>
                        <TableCell>
                          <Chip label={p.status} color={getStatusColor(p.status)} size="small" />
                        </TableCell>
                        <TableCell><Typography variant="body2">{p.testerName || 'Unassigned'}</Typography></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {p.developerNames && p.developerNames.map(dev => (
                              <Chip key={dev.id} label={dev.name} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Toast Notification */}
      <Snackbar 
        open={statusToast.open} 
        autoHideDuration={4000} 
        onClose={closeStatusToast} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeStatusToast} severity={statusToast.severity} sx={{ width: '100%' }}>
          {statusToast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
