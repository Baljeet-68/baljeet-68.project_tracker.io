import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authFetch, getUser } from '../auth'
import { API_BASE_URL } from '../apiConfig';
import { Card, CardContent, CardActions, Button, Chip, Box, Tab, Tabs, TextField, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Select, FormControl, InputLabel, Grid, IconButton, LinearProgress, Avatar, AvatarGroup, Typography, Stack, Divider, Snackbar, Alert } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import DownloadIcon from '@mui/icons-material/Download'
import CloseIcon from '@mui/icons-material/Close'
import ImageIcon from '@mui/icons-material/Image'

export default function ProjectPage() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [screensList, setScreensList] = useState([])
  const [bugsList, setBugsList] = useState([])
  const [activityList, setActivityList] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [tabIndex, setTabIndex] = useState(0)
  const user = getUser()

  // Toast notification state
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  // Project date edit states (admin)
  const [projectStart, setProjectStart] = useState('')
  const [projectEnd, setProjectEnd] = useState('')

  // Dialog states
  const [bugDialog, setBugDialog] = useState(false)
  const [screenDialog, setScreenDialog] = useState(false)
  const [editingScreen, setEditingScreen] = useState(null)
  const [bugEditDialog, setBugEditDialog] = useState(false)
  const [bugEditId, setBugEditId] = useState(null)
  const [bugEditDeadline, setBugEditDeadline] = useState('')
  const [screenEditDeadlineDialog, setScreenEditDeadlineDialog] = useState(false)
  const [screenEditDeadlineId, setScreenEditDeadlineId] = useState(null)
  const [screenEditDeadlineValue, setScreenEditDeadlineValue] = useState('')

  // Form states
  const [bugForm, setBugForm] = useState({ description: '', severity: 'medium', screenId: '', module: '', assignedDeveloperId: '', attachments: [], deadline: '' })
  const [screenForm, setScreenForm] = useState({ title: '', module: '', assigneeId: '', plannedDeadline: '', notes: '' })


  // Filter states
  const [bugStatusFilter, setBugStatusFilter] = useState('')
  const [bugSeverityFilter, setBugSeverityFilter] = useState('')
  const [bugAssigneeFilter, setBugAssigneeFilter] = useState('')

  // Attachment preview
  const [previewDialog, setPreviewDialog] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState(null)

  useEffect(() => {
    loadData()
  }, [id])

  // Show toast notification
  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity })
  }

  const closeToast = () => {
    setToast({ ...toast, open: false })
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [projRes, screensRes, bugsRes, activityRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/projects/${id}`),
        authFetch(`${API_BASE_URL}/projects/${id}/screens`),
        authFetch(`${API_BASE_URL}/projects/${id}/bugs`),
        authFetch(`${API_BASE_URL}/projects/${id}/activity`)
      ])

      if (!projRes.ok) throw new Error('Failed to fetch project')
      const projData = await projRes.json()
      setProject(projData)
      // preload project start/end for admin editing as yyyy-mm-dd
      setProjectStart(projData.startDate ? new Date(projData.startDate).toISOString().slice(0,10) : '')
      setProjectEnd(projData.endDate ? new Date(projData.endDate).toISOString().slice(0,10) : '')

      if (screensRes.ok) setScreensList(await screensRes.json())
      if (bugsRes.ok) setBugsList(await bugsRes.json())
      if (activityRes.ok) setActivityList(await activityRes.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBug = async () => {
    if (!bugForm.description) return
    try {
      const res = await authFetch(`${API_BASE_URL}/projects/${id}/bugs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bugForm })
      })
      if (!res.ok) throw new Error('Failed to create bug')
      const newBug = await res.json()
      setBugsList([...bugsList, newBug])
      setBugForm({ description: '', severity: 'medium', screenId: '', module: '', assignedDeveloperId: '', attachments: [] })
      setBugDialog(false)
      loadData() // Reload to get updated activity
    } catch (e) {
      setError(e.message)
    }
  }

  // Open edit dialog for bug deadline (admin or assigned developer)
  const openBugEdit = (bug) => {
    setBugEditId(bug.id)
    setBugEditDeadline(bug.deadline ? new Date(bug.deadline).toISOString().slice(0,10) : '')
    setBugEditDialog(true)
  }

  const handleSaveBugDeadline = async () => {
    if (!bugEditId) return
    try {
      const res = await authFetch(`${API_BASE_URL}/bugs/${bugEditId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadline: bugEditDeadline || null })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to update bug deadline')
      }
      setBugEditDialog(false)
      setBugEditId(null)
      setBugEditDeadline('')
      loadData()
      showToast('Bug deadline updated successfully!', 'success')
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file, idx) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const newAttachment = {
          id: `att${Date.now()}_${idx}`,
          name: file.name,
          size: file.size,
          type: file.type,
          data: event.target.result // Base64 encoded data
        }
        setBugForm(prevForm => ({
          ...prevForm,
          attachments: [...prevForm.attachments, newAttachment]
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeAttachment = (attId) => {
    setBugForm({
      ...bugForm,
      attachments: bugForm.attachments.filter(a => a.id !== attId)
    })
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const isImageFile = (type) => type.startsWith('image/')

  const isVideoFile = (type) => type.startsWith('video/')

  const showAttachmentPreview = (attachment) => {
    setPreviewAttachment(attachment)
    setPreviewDialog(true)
  }

  const handleUpdateBugStatus = async (bugId, newStatus) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/bugs/${bugId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Failed to update bug status')
      const updatedBug = await res.json()
      setBugsList(bugsList.map(b => b.id === bugId ? updatedBug : b))
      loadData()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleUpdateScreenStatus = async (screenId, newStatus) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/screens/${screenId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, actualEndDate: new Date() })
      })
      if (!res.ok) throw new Error('Failed to update screen status')
      const updatedScreen = await res.json()
      setScreensList(screensList.map(s => s.id === screenId ? updatedScreen : s))
      loadData()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleAddScreen = async () => {
    if (!screenForm.title) return
    try {
      if (editingScreen) {
        // update existing screen
        const res = await authFetch(`${API_BASE_URL}/screens/${editingScreen.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(screenForm)
        })
        if (!res.ok) throw new Error('Failed to update screen')
        setEditingScreen(null)
      } else {
        const res = await authFetch(`${API_BASE_URL}/projects/${id}/screens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(screenForm)
        })
        if (!res.ok) throw new Error('Failed to create screen')
      }
      setScreenForm({ title: '', module: '', assigneeId: '', plannedDeadline: '', notes: '' })
      setScreenDialog(false)
      loadData()
    } catch (e) {
      setError(e.message)
    }
  }

  const openEditScreen = (s) => {
    setEditingScreen(s)
    setScreenForm({ title: s.title || '', module: s.module || '', assigneeId: s.assigneeId || '', plannedDeadline: s.plannedDeadline ? new Date(s.plannedDeadline).toISOString().slice(0,10) : '', notes: s.notes || '' })
    setScreenDialog(true)
  }

  const openScreenDeadlineEdit = (s) => {
    setScreenEditDeadlineId(s.id)
    setScreenEditDeadlineValue(s.plannedDeadline ? new Date(s.plannedDeadline).toISOString().slice(0,10) : '')
    setScreenEditDeadlineDialog(true)
  }

  const handleSaveScreenDeadline = async () => {
    if (!screenEditDeadlineId) return
    try {
      const res = await authFetch(`${API_BASE_URL}/screens/${screenEditDeadlineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plannedDeadline: screenEditDeadlineValue || null })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to update deadline')
      }
      setScreenEditDeadlineDialog(false)
      setScreenEditDeadlineId(null)
      setScreenEditDeadlineValue('')
      loadData()
      showToast('Screen deadline updated successfully!', 'success')
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  // Update project start/end (admin)
  const handleUpdateProjectDates = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: projectStart || null, endDate: projectEnd || null })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to update project dates')
      }
      loadData()
      showToast('Project dates updated successfully!', 'success')
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  const handleDeleteBug = async (bugId) => {
    if (!window.confirm('Delete this bug?')) return
    try {
      const res = await authFetch(`${API_BASE_URL}/bugs/${bugId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete bug')
      setBugsList(bugsList.filter(b => b.id !== bugId))
      loadData()
    } catch (e) {
      setError(e.message)
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'Open': return 'error'
      case 'In Progress': return 'warning'
      case 'Resolved': return 'success'
      case 'Closed': return 'default'
      case 'Planned': return 'info'
      case 'Blocked': return 'error'
      case 'Done': return 'success'
      default: return 'default'
    }
  }

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'low': return 'info'
      case 'medium': return 'warning'
      case 'high': return 'error'
      case 'critical': return 'error'
      default: return 'default'
    }
  }

  // Filter bugs
  const filteredBugs = bugsList.filter(b => {
    if (bugStatusFilter && b.status !== bugStatusFilter) return false
    if (bugSeverityFilter && b.severity !== bugSeverityFilter) return false
    if (bugAssigneeFilter && b.assignedDeveloperId !== bugAssigneeFilter) return false
    return true
  })

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}>Loading project...</Box>
  if (!project) return <Box sx={{ p: 4, color: 'error.main' }}>Project not found</Box>

  return (
    <Box sx={{ p: 3 }}>
      <Link to="/">← Back to Dashboard</Link>

      <Box sx={{ mt: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <div>
            <h2 style={{ margin: 0 }}>{project.name}</h2>
            <div style={{ color: '#666' }}>Client: {project.client}</div>
          </div>
          <Chip label={project.status} color={getStatusColor(project.status)} />
        </Box>
        <div style={{ color: '#666', marginBottom: '1rem' }}>{project.description}</div>

        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Chip label={`Tester: ${project.testerName}`} size="small" />
          <Chip label={`Devs: ${project.developerNames?.length || 0}`} size="small" />
          <Chip label={`Open Bugs: ${project.openBugsCount || 0}`} size="small" variant="outlined" />
          <Chip label={`Upcoming Deadlines: ${project.upcomingDeadlines || 0}`} size="small" variant="outlined" />
        </Box>
      </Box>

      {error && <Box sx={{ mb: 2, p: 2, bgcolor: '#ffebee', color: '#c62828', borderRadius: 1 }}>{error}</Box>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)}>
          <Tab label="Overview" />
          <Tab label="Screens/Tasks" />
          <Tab label="Bugs" />
          <Tab label="Activity" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      {tabIndex === 0 && (
        <Box>
          <h3>Project Details</h3>
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} md={4}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip label={project.status} color={getStatusColor(project.status)} size="medium" />
                      </Box>
                    </Box>

                    <Divider />

                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">Timeline</Typography>
                            <Box sx={{ mt: 1 }}>
                              {user?.role === 'admin' ? (
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                  <TextField label="Start" type="date" size="small" value={projectStart} onChange={(e) => setProjectStart(e.target.value)} InputLabelProps={{ shrink: true }} />
                                  <TextField label="End" type="date" size="small" value={projectEnd} onChange={(e) => setProjectEnd(e.target.value)} InputLabelProps={{ shrink: true }} />
                                  <Button size="small" variant="contained" onClick={handleUpdateProjectDates}>Save Dates</Button>
                                </Box>
                              ) : (
                                <Box>
                                  <Typography variant="body2"><strong>Start:</strong> {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</Typography>
                                  <Typography variant="body2"><strong>End:</strong> {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Team</Typography>
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AvatarGroup max={4}>
                          {project.developerNames && project.developerNames.length > 0 ? (
                            project.developerNames.map((d) => (
                              <Avatar key={d.id} alt={d.name}>{d.name?.split(' ').map(n=>n[0]).slice(0,2).join('')}</Avatar>
                            ))
                          ) : (
                            <Avatar>—</Avatar>
                          )}
                        </AvatarGroup>
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="body2"><strong>Tester:</strong> {project.testerName || '—'}</Typography>
                          <Typography variant="body2" color="text.secondary">{project.developerNames?.map(d => d.name).join(', ') || 'No developers assigned'}</Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Progress</Typography>
                      <Box sx={{ mt: 1 }}>
                        {screensList && screensList.length > 0 ? (
                          (() => {
                            const completed = project.completedScreensCount || 0
                            const total = screensList.length
                            const pct = Math.round((completed / Math.max(1, total)) * 100)
                            return (
                              <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2">{completed} / {total} screens</Typography>
                                  <Typography variant="body2">{pct}%</Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={pct} sx={{ mt: 1, height: 10, borderRadius: 2 }} />
                              </Box>
                            )
                          })()
                        ) : (
                          <Typography variant="body2" color="text.secondary">No screens added yet</Typography>
                        )}
                      </Box>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>{project.description || 'No description provided.'}</Typography>
                    </Box>

                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={`Open Bugs: ${project.openBugsCount || 0}`} color="error" />
                        <Chip label={`Completed Screens: ${project.completedScreensCount || 0}`} variant="outlined" />
                        <Chip label={`Total Screens: ${screensList.length}`} variant="outlined" />
                        <Chip label={`Client: ${project.client || '—'}`} variant="outlined" />
                      </Stack>
                    </Box>

                    <Box>
                      <Stack direction="row" spacing={1}>
                        {(user?.role === 'admin' || user?.role === 'developer') && (
                          <Button variant="contained" size="small" startIcon={<EditIcon />}>Edit Project</Button>
                        )}
                        <Button component={Link} to="/" size="small">Back to Dashboard</Button>
                      </Stack>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Screens/Tasks Tab */}
      {tabIndex === 1 && (
        <Box>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Screens/Tasks</h3>
            {user?.role === 'admin' && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setScreenDialog(true)}>
                New Screen
              </Button>
            )}
          </Box>

          {screensList.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', color: '#999' }}>No screens yet</Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Title</strong></TableCell>
                  <TableCell><strong>Module</strong></TableCell>
                  <TableCell><strong>Assignee</strong></TableCell>
                  <TableCell><strong>Deadline</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  {(user?.role === 'admin' || user?.role === 'developer') && <TableCell><strong>Actions</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {screensList.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.title}</TableCell>
                    <TableCell>{s.module}</TableCell>
                    <TableCell>{s.assigneeName}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{s.plannedDeadline ? new Date(s.plannedDeadline).toLocaleDateString() : '—'}</span>
                        {(user?.role === 'admin' || (user?.role === 'developer' && s.assigneeId === user.id)) && (
                          <IconButton size="small" onClick={() => openScreenDeadlineEdit(s)} title="Edit deadline">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {(user?.role === 'admin' || (user?.role === 'developer' && s.assigneeId === user.id)) ? (
                        <Select
                          value={s.status}
                          onChange={(e) => handleUpdateScreenStatus(s.id, e.target.value)}
                          size="small"
                          variant="standard"
                        >
                          <MenuItem value="Planned">Planned</MenuItem>
                          <MenuItem value="In Progress">In Progress</MenuItem>
                          <MenuItem value="Blocked">Blocked</MenuItem>
                          <MenuItem value="Done">Done</MenuItem>
                        </Select>
                      ) : (
                        <Chip label={s.status} color={getStatusColor(s.status)} size="small" />
                      )}
                    </TableCell>
                    {(user?.role === 'admin' || user?.role === 'developer') && (
                      <TableCell>
                        {user?.role === 'admin' && (
                          <Button size="small" startIcon={<EditIcon />} onClick={() => openEditScreen(s)}>Edit</Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Add Screen Dialog */}
          <Dialog open={screenDialog} onClose={() => setScreenDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Screen/Task</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Title"
                value={screenForm.title}
                onChange={(e) => setScreenForm({ ...screenForm, title: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Module"
                value={screenForm.module}
                onChange={(e) => setScreenForm({ ...screenForm, module: e.target.value })}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Assignee</InputLabel>
                <Select
                  value={screenForm.assigneeId}
                  onChange={(e) => setScreenForm({ ...screenForm, assigneeId: e.target.value })}
                  label="Assignee"
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {project.developerNames?.map(d => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Planned Deadline"
                type="date"
                value={screenForm.plannedDeadline}
                onChange={(e) => setScreenForm({ ...screenForm, plannedDeadline: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={screenForm.notes}
                onChange={(e) => setScreenForm({ ...screenForm, notes: e.target.value })}
                margin="normal"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setScreenDialog(false)}>Cancel</Button>
              <Button onClick={handleAddScreen} variant="contained">Create</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* Bugs Tab */}
      {tabIndex === 2 && (
        <Box>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Bugs</h3>
            {(user?.role === 'admin' || user?.role === 'tester' || user?.role === 'developer') && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setBugDialog(true)}>
                New Bug
              </Button>
            )}
          </Box>

          {/* Bug Filters */}
          <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={bugStatusFilter}
                onChange={(e) => setBugStatusFilter(e.target.value)}
                label="Status Filter"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="Open">Open</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Resolved">Resolved</MenuItem>
                <MenuItem value="Closed">Closed</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel>Severity Filter</InputLabel>
              <Select
                value={bugSeverityFilter}
                onChange={(e) => setBugSeverityFilter(e.target.value)}
                label="Severity Filter"
              >
                <MenuItem value="">All Severities</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel>Assignee Filter</InputLabel>
              <Select
                value={bugAssigneeFilter}
                onChange={(e) => setBugAssigneeFilter(e.target.value)}
                label="Assignee Filter"
              >
                <MenuItem value="">All Assignees</MenuItem>
                {project.developerNames?.map(d => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {filteredBugs.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', color: '#999' }}>No bugs found</Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Bug #</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Screen</strong></TableCell>
                  <TableCell><strong>Assigned Dev</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Severity</strong></TableCell>
                  <TableCell><strong>Deadline</strong></TableCell>
                  <TableCell><strong>Attachments</strong></TableCell>
                  {(user?.role === 'admin' || user?.role === 'developer') && <TableCell><strong>Actions</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBugs.map(b => (
                  <TableRow key={b.id}>
                    <TableCell>#{b.bugNumber}</TableCell>
                    <TableCell>{b.description}</TableCell>
                    <TableCell>{b.screenTitle}</TableCell>
                    <TableCell>{b.assignedDeveloperName}</TableCell>
                    <TableCell>
                      {(user?.role === 'admin' || (user?.role === 'developer' && b.assignedDeveloperId === user.id)) ? (
                        <Select
                          value={b.status}
                          onChange={(e) => handleUpdateBugStatus(b.id, e.target.value)}
                          size="small"
                          variant="standard"
                        >
                          <MenuItem value="Open">Open</MenuItem>
                          <MenuItem value="In Progress">In Progress</MenuItem>
                          <MenuItem value="Resolved">Resolved</MenuItem>
                          <MenuItem value="Closed">Closed</MenuItem>
                        </Select>
                      ) : (
                        <Chip label={b.status} color={getStatusColor(b.status)} size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={b.severity} color={getSeverityColor(b.severity)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{b.deadline ? new Date(b.deadline).toLocaleDateString() : '—'}</span>
                        {(user?.role === 'admin' || (user?.role === 'developer' && b.assignedDeveloperId === user.id)) && (
                          <IconButton size="small" onClick={() => openBugEdit(b)} title="Edit deadline">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {b.attachments && b.attachments.length > 0 ? (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {b.attachments.map((att, idx) => (
                            <Chip
                              key={idx}
                              icon={isImageFile(att.type || '') ? <ImageIcon /> : <AttachFileIcon />}
                              label={att.name}
                              size="small"
                              onClick={() => showAttachmentPreview(att)}
                              sx={{ cursor: 'pointer', maxWidth: 150 }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <span style={{ color: '#999' }}>—</span>
                      )}
                    </TableCell>
                    {(user?.role === 'admin' || user?.role === 'developer') && (
                      <TableCell>
                        {user?.role === 'admin' && (
                          <Button size="small" startIcon={<DeleteIcon />} onClick={() => handleDeleteBug(b.id)}>Delete</Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Add Bug Dialog */}
          <Dialog open={bugDialog} onClose={() => setBugDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Report New Bug</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={bugForm.description}
                onChange={(e) => setBugForm({ ...bugForm, description: e.target.value })}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Severity</InputLabel>
                <Select
                  value={bugForm.severity}
                  onChange={(e) => setBugForm({ ...bugForm, severity: e.target.value })}
                  label="Severity"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Screen/Module</InputLabel>
                <Select
                  value={bugForm.screenId}
                  onChange={(e) => setBugForm({ ...bugForm, screenId: e.target.value })}
                  label="Screen/Module"
                >
                  <MenuItem value="">Select Screen</MenuItem>
                  {screensList.map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.title}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Assign Developer</InputLabel>
                <Select
                  value={bugForm.assignedDeveloperId}
                  onChange={(e) => setBugForm({ ...bugForm, assignedDeveloperId: e.target.value })}
                  label="Assign Developer"
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {project.developerNames?.map(d => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Deadline"
                type="date"
                value={bugForm.deadline}
                onChange={(e) => setBugForm({ ...bugForm, deadline: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />

              {/* Attachments Section */}
              <Box sx={{ mt: 3, mb: 2 }}>
                <strong>Attachments</strong>
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AttachFileIcon />}
                    size="small"
                  >
                    Add Images/Videos
                    <input hidden multiple type="file" onChange={handleAttachmentChange} accept="image/*,video/*" />
                  </Button>
                </Box>

                {/* Attached Files List */}
                {bugForm.attachments.length > 0 && (
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 1.5, bgcolor: '#f9f9f9' }}>
                    {bugForm.attachments.map((att) => (
                      <Box key={att.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, p: 1, bgcolor: 'white', borderRadius: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                          {isImageFile(att.type) ? <ImageIcon sx={{ color: '#3b82f6' }} /> : <AttachFileIcon sx={{ color: '#666' }} />}
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500, wordBreak: 'break-word' }}>{att.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>{formatFileSize(att.size)}</div>
                          </Box>
                        </Box>
                        <IconButton size="small" onClick={() => removeAttachment(att.id)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setBugDialog(false)}>Cancel</Button>
              <Button onClick={handleAddBug} variant="contained">Create Bug</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* Activity Tab */}
      {tabIndex === 3 && (
        <Box>
          <h3>Activity Log</h3>
          {activityList.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', color: '#999' }}>No activity yet</Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {activityList.map(a => (
                <Card key={a.id}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <strong>{a.createdByName}</strong> {a.action} {a.entityType} #{a.entityId}
                        <div style={{ color: '#666', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          {new Date(a.createdAt).toLocaleString()}
                        </div>
                        {Object.keys(a.changes).length > 0 && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                            Changes: {JSON.stringify(a.changes)}
                          </div>
                        )}
                      </div>
                      <Chip label={a.action} size="small" variant="outlined" />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Attachment Preview Modal */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {previewAttachment?.name}
          <IconButton onClick={() => setPreviewDialog(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3 }}>
          {previewAttachment && isImageFile(previewAttachment.type) ? (
            <Box
              component="img"
              src={previewAttachment.data}
              sx={{ maxWidth: '100%', maxHeight: '500px', borderRadius: 1 }}
              alt={previewAttachment.name}
            />
          ) : previewAttachment && isVideoFile(previewAttachment.type) ? (
            <Box
              component="video"
              src={previewAttachment.data}
              controls
              sx={{ maxWidth: '100%', maxHeight: '500px', borderRadius: 1 }}
            />
          ) : (
            <Box sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 1, width: '100%', textAlign: 'center' }}>
              <AttachFileIcon sx={{ fontSize: 48, color: '#999', mb: 2 }} />
              <Box sx={{ fontSize: '1rem', fontWeight: 500, mb: 2 }}>File Preview</Box>
              <Box sx={{ fontSize: '0.875rem', color: '#666', mb: 1 }}>
                <strong>Name:</strong> {previewAttachment?.name}
              </Box>
              <Box sx={{ fontSize: '0.875rem', color: '#666', mb: 1 }}>
                <strong>Size:</strong> {formatFileSize(previewAttachment?.size)}
              </Box>
              <Box sx={{ fontSize: '0.875rem', color: '#666' }}>
                <strong>Type:</strong> {previewAttachment?.type}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Bug Deadline Edit Dialog */}
      <Dialog open={bugEditDialog} onClose={() => setBugEditDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Bug Deadline</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Deadline"
            type="date"
            value={bugEditDeadline}
            onChange={(e) => setBugEditDeadline(e.target.value)}
            InputLabelProps={{ shrink: true }}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBugEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveBugDeadline}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Screen Deadline Edit Dialog */}
      <Dialog open={screenEditDeadlineDialog} onClose={() => setScreenEditDeadlineDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Screen Deadline</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Deadline"
            type="date"
            value={screenEditDeadlineValue}
            onChange={(e) => setScreenEditDeadlineValue(e.target.value)}
            InputLabelProps={{ shrink: true }}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScreenEditDeadlineDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveScreenDeadline}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeToast} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

