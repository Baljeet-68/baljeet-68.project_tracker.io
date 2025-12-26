import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { authFetch, getUser, clearToken, clearUser } from '../auth'
import { API_BASE_URL } from '../apiConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Card, CardHeader, CardBody, Badge, Button } from '../components/TailAdminComponents'
import { Table, Modal, InputGroup, Select, ProgressBar } from '../components/FormComponents'
import { 
  Edit, 
  Trash2, 
  Plus, 
  Paperclip, 
  Download, 
  X, 
  Image as ImageIcon, 
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  ChevronRight
} from 'lucide-react'

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
  const nav = useNavigate()

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

  const handleAuthError = (e) => {
    if (e.message === 'Unauthorized: Token expired or invalid') {
      clearToken()
      clearUser()
      nav('/login', { replace: true })
    } else {
      toast.error(e.message)
    }
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
      handleAuthError(e)
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
      handleAuthError(e)
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
      toast.success('Bug deadline updated successfully!')
    } catch (e) {
      handleAuthError(e)
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
      showToast('Bug status updated successfully!', 'success')
    } catch (e) {
      handleAuthError(e)
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
      showToast('Screen status updated successfully!', 'success')
    } catch (e) {
      handleAuthError(e)
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
      showToast(editingScreen ? 'Screen updated successfully!' : 'Screen added successfully!', 'success')
    } catch (e) {
      handleAuthError(e)
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
      handleAuthError(e)
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
      handleAuthError(e)
    }
  }

  const handleDeleteBug = async (bugId) => {
    if (!window.confirm('Delete this bug?')) return
    try {
      const res = await authFetch(`${API_BASE_URL}/bugs/${bugId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete bug')
      setBugsList(bugsList.filter(b => b.id !== bugId))
      loadData()
      showToast('Bug deleted successfully!', 'success')
    } catch (e) {
      handleAuthError(e)
    }
  }

  const handleDeleteScreen = async (screenId) => {
    if (!window.confirm('Delete this screen?')) return
    try {
      const res = await authFetch(`${API_BASE_URL}/screens/${screenId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete screen')
      setScreensList(screensList.filter(s => s.id !== screenId))
      loadData()
      toast.success('Screen deleted successfully!')
    } catch (e) {
      handleAuthError(e)
    }
  }

  const getStatusGradient = (status) => {
    switch(status) {
      case 'Open': return 'from-red-600 to-rose-400'
      case 'In Progress': return 'from-orange-500 to-yellow-400'
      case 'Resolved': return 'from-green-600 to-lime-400'
      case 'Closed': return 'from-slate-600 to-slate-300'
      case 'Planned': return 'from-blue-600 to-cyan-400'
      case 'Blocked': return 'from-red-600 to-rose-400'
      case 'Done': return 'from-green-600 to-lime-400'
      default: return 'from-slate-600 to-slate-300'
    }
  }

  const getSeverityGradient = (severity) => {
    switch(severity) {
      case 'low': return 'from-blue-600 to-cyan-400'
      case 'medium': return 'from-orange-500 to-yellow-400'
      case 'high': return 'from-red-600 to-rose-400'
      case 'critical': return 'from-red-900 to-slate-800'
      default: return 'from-slate-600 to-slate-300'
    }
  }

  const showToast = (message, type = 'info') => {
    toast[type](message)
  }

  // Filter bugs
  const filteredBugs = bugsList.filter(b => {
    if (bugStatusFilter && b.status !== bugStatusFilter) return false
    if (bugSeverityFilter && b.severity !== bugSeverityFilter) return false
    if (bugAssigneeFilter && b.assignedDeveloperId !== bugAssigneeFilter) return false
    return true
  })

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-fuchsia-200 border-t-fuchsia-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-medium">Loading project details...</p>
    </div>
  )
  
  if (!project) return (
    <div className="p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
        <AlertCircle size={32} />
      </div>
      <h3 className="text-xl font-bold text-slate-800">Project not found</h3>
      <p className="text-slate-500 mb-6">The project you are looking for does not exist or has been deleted.</p>
      <Link to="/" className="text-fuchsia-600 font-bold hover:underline inline-flex items-center">
        <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
      </Link>
    </div>
  )

  const screenColumns = [
    { key: 'title', label: 'Title' },
    { key: 'module', label: 'Module' },
    { key: 'assigneeName', label: 'Assignee' },
    { 
      key: 'plannedDeadline', 
      label: 'Deadline',
      render: (val, s) => (
        <div className="flex items-center gap-2">
          <span>{val ? new Date(val).toLocaleDateString() : '—'}</span>
          {(user?.role === 'admin' || (user?.role === 'developer' && s.assigneeId === user.id)) && (
            <button onClick={() => openScreenDeadlineEdit(s)} className="text-slate-400 hover:text-blue-500 transition-colors">
              <Edit size={14} />
            </button>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (status, s) => {
        if (user?.role === 'admin' || (user?.role === 'developer' && s.assigneeId === user.id)) {
          return (
            <select
              value={status}
              onChange={(e) => handleUpdateScreenStatus(s.id, e.target.value)}
              className="text-xs border-0 bg-transparent font-bold focus:ring-0 cursor-pointer"
            >
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Done">Done</option>
            </select>
          )
        }
        return <Badge gradient={getStatusGradient(status)} size="sm">{status}</Badge>
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, s) => (
        <div className="flex gap-2">
          {user?.role === 'admin' && (
            <>
              <button onClick={() => openEditScreen(s)} className="text-slate-400 hover:text-blue-500 transition-colors">
                <Edit size={16} />
              </button>
              <button onClick={() => handleDeleteScreen(s.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      )
    }
  ]

  const bugColumns = [
    { key: 'bugNumber', label: 'Bug #', render: (val) => <span className="font-bold">#{val}</span> },
    { key: 'description', label: 'Description', render: (val) => <div className="max-w-xs truncate">{val}</div> },
    { key: 'screenTitle', label: 'Screen' },
    { key: 'assignedDeveloperName', label: 'Assigned Dev' },
    {
      key: 'status',
      label: 'Status',
      render: (status, b) => {
        if (user?.role === 'admin' || (user?.role === 'developer' && b.assignedDeveloperId === user.id)) {
          return (
            <select
              value={status}
              onChange={(e) => handleUpdateBugStatus(b.id, e.target.value)}
              className="text-xs border-0 bg-transparent font-bold focus:ring-0 cursor-pointer"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          )
        }
        return <Badge gradient={getStatusGradient(status)} size="sm">{status}</Badge>
      }
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (sev) => <Badge gradient={getSeverityGradient(sev)} size="sm">{sev}</Badge>
    },
    {
      key: 'deadline',
      label: 'Deadline',
      render: (val, b) => (
        <div className="flex items-center gap-2">
          <span>{val ? new Date(val).toLocaleDateString() : '—'}</span>
          {(user?.role === 'admin' || (user?.role === 'developer' && b.assignedDeveloperId === user.id)) && (
            <button onClick={() => openBugEdit(b)} className="text-slate-400 hover:text-blue-500 transition-colors">
              <Edit size={14} />
            </button>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, b) => (
        <div className="flex gap-2">
          {(user?.role === 'admin' || user?.role === 'tester') && (
            <button onClick={() => handleDeleteBug(b.id)} className="text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="container-fluid py-4">
      {/* Breadcrumbs */}
      <nav className="mb-4">
        <ol className="flex flex-wrap pt-1 mr-12 bg-transparent rounded-lg sm:mr-16">
          <li className="leading-normal text-sm">
            <Link className="opacity-50 text-slate-700" to="/">Pages</Link>
          </li>
          <li className="text-sm pl-2 capitalize leading-normal text-slate-700 before:float-left before:pr-2 before:text-gray-300 before:content-['/']">
            Project Details
          </li>
        </ol>
        <h6 className="mb-0 font-bold capitalize">Project Details</h6>
      </nav>

      <div className="flex flex-wrap -mx-3">
        {/* Header Section */}
        <div className="w-full max-w-full px-3 mb-6">
          <Card>
            <CardBody className="p-4">
              <div className="flex flex-wrap items-center -mx-3">
                <div className="flex-none w-auto max-w-full px-3">
                  <div className="relative inline-flex items-center justify-center text-white transition-all duration-200 ease-soft-in-out text-base h-18.5 w-18.5 rounded-xl">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-tl from-purple-700 to-pink-500 shadow-soft-2xl">
                      <Calendar className="text-white" />
                    </div>
                  </div>
                </div>
                <div className="flex-none w-auto max-w-full px-3 my-auto">
                  <div className="h-full">
                    <h5 className="mb-1 font-bold">{project?.name}</h5>
                    <p className="mb-0 font-semibold leading-normal text-sm">Client: {project?.client}</p>
                  </div>
                </div>
                <div className="w-full max-w-full px-3 mx-auto mt-4 sm:my-auto sm:mr-0 md:w-1/2 md:flex-none lg:w-4/12">
                  <div className="relative flex flex-wrap items-center justify-end">
                    <Badge gradient={getStatusGradient(project?.status)} size="lg">
                      {project?.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Stats Row */}
        <div className="w-full max-w-full px-3 mb-6 lg:w-3/12">
          <Card className="h-full">
            <CardBody className="p-4">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-tl from-blue-600 to-cyan-400 shadow-soft-2xl mr-3">
                  <Users className="text-white" size={18} />
                </div>
                <div>
                  <p className="mb-0 text-xs font-semibold leading-tight opacity-60 uppercase">Team</p>
                  <h6 className="mb-0 font-bold">{project?.developerNames?.length || 0} Developers</h6>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-0">Tester: <span className="font-bold">{project?.testerName}</span></p>
            </CardBody>
          </Card>
        </div>

        <div className="w-full max-w-full px-3 mb-6 lg:w-3/12">
          <Card className="h-full">
            <CardBody className="p-4">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-tl from-red-600 to-rose-400 shadow-soft-2xl mr-3">
                  <AlertCircle className="text-white" size={18} />
                </div>
                <div>
                  <p className="mb-0 text-xs font-semibold leading-tight opacity-60 uppercase">Bugs</p>
                  <h6 className="mb-0 font-bold">{project.openBugsCount || 0} Open Bugs</h6>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-0">Total resolved: <span className="font-bold">{bugsList.filter(b => b.status === 'Resolved').length}</span></p>
            </CardBody>
          </Card>
        </div>

        <div className="w-full max-w-full px-3 mb-6 lg:w-3/12">
          <Card className="h-full">
            <CardBody className="p-4">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-tl from-green-600 to-lime-400 shadow-soft-2xl mr-3">
                  <CheckCircle className="text-white" size={18} />
                </div>
                <div>
                  <p className="mb-0 text-xs font-semibold leading-tight opacity-60 uppercase">Progress</p>
                  <h6 className="mb-0 font-bold">{project.completedScreensCount || 0} / {screensList.length} Done</h6>
                </div>
              </div>
              <ProgressBar 
                value={project.completedScreensCount || 0} 
                max={screensList.length || 1} 
                showLabel={false}
                gradient="from-green-600 to-lime-400"
              />
            </CardBody>
          </Card>
        </div>

        <div className="w-full max-w-full px-3 mb-6 lg:w-3/12">
          <Card className="h-full">
            <CardBody className="p-4">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-tl from-orange-500 to-yellow-400 shadow-soft-2xl mr-3">
                  <Clock className="text-white" size={18} />
                </div>
                <div>
                  <p className="mb-0 text-xs font-semibold leading-tight opacity-60 uppercase">Deadlines</p>
                  <h6 className="mb-0 font-bold">{project.upcomingDeadlines || 0} Upcoming</h6>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-0">Ending: <span className="font-bold">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</span></p>
            </CardBody>
          </Card>
        </div>

        {/* Tabs Section */}
        <div className="w-full max-w-full px-3">
          <div className="relative flex flex-col min-w-0 break-words bg-white border-0 shadow-soft-xl rounded-2xl bg-clip-border mb-6">
            <div className="p-4 pb-0">
              <div className="flex flex-wrap -mx-3">
                <div className="flex items-center w-full max-w-full px-3 shrink-0 md:w-8/12 md:flex-none">
                  <ul className="flex flex-wrap p-1 list-none bg-gray-50 rounded-xl" role="tablist">
                    {['Overview', 'Screens', 'Bugs', 'Activity'].map((tab, idx) => (
                      <li key={tab} className="flex-auto text-center">
                        <button
                          onClick={() => setTabIndex(idx)}
                          className={`z-30 block w-full px-4 py-1 mb-0 transition-all border-0 rounded-lg cursor-pointer text-slate-700 bg-inherit ${tabIndex === idx ? 'bg-white shadow-soft-md font-bold' : 'opacity-60'}`}
                        >
                          {tab}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex-auto p-4">
              {/* Tab Content */}
              {tabIndex === 0 && (
                <div className="flex flex-wrap -mx-3">
                  <div className="w-full max-w-full px-3 lg:w-7/12">
                    <h6 className="mb-4 font-bold">Project Description</h6>
                    <p className="text-sm leading-normal text-slate-600">
                      {project.description || 'No description provided.'}
                    </p>
                    
                    <div className="mt-8">
                      <h6 className="mb-4 font-bold">Timeline & Settings</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <p className="text-xs font-bold uppercase text-slate-400 mb-2">Start Date</p>
                          <p className="font-bold">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <p className="text-xs font-bold uppercase text-slate-400 mb-2">Target End Date</p>
                          <p className="font-bold">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                      
                      {user?.role === 'admin' && (
                        <div className="mt-6 p-4 border border-dashed border-gray-300 rounded-xl">
                          <p className="text-sm font-bold mb-4">Update Project Timeline</p>
                          <div className="flex flex-wrap gap-4 items-end">
                            <InputGroup 
                              label="Start" 
                              type="date" 
                              value={projectStart} 
                              onChange={(e) => setProjectStart(e.target.value)} 
                              className="mb-0"
                            />
                            <InputGroup 
                              label="End" 
                              type="date" 
                              value={projectEnd} 
                              onChange={(e) => setProjectEnd(e.target.value)} 
                              className="mb-0"
                            />
                            <Button size="sm" onClick={handleUpdateProjectDates}>Save</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full max-w-full px-3 mt-6 lg:w-5/12 lg:mt-0">
                    <h6 className="mb-4 font-bold">Team Members</h6>
                    <div className="flex flex-col gap-4">
                      {project?.developerNames?.map(dev => (
                        <div key={dev.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-tl from-slate-600 to-slate-300 flex items-center justify-center text-white font-bold mr-3">
                              {dev.name?.split(' ').map(n=>n[0]).slice(0,2).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-bold mb-0">{dev.name}</p>
                              <p className="text-xs text-slate-500 mb-0">Developer</p>
                            </div>
                          </div>
                          <Badge gradient="from-green-600 to-lime-400" size="sm">Active</Badge>
                        </div>
                      ))}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border-l-4 border-fuchsia-500">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-tl from-purple-700 to-pink-500 flex items-center justify-center text-white font-bold mr-3">
                            {project.testerName?.split(' ').map(n=>n[0]).slice(0,2).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-bold mb-0">{project.testerName}</p>
                            <p className="text-xs text-slate-500 mb-0">QA Tester</p>
                          </div>
                        </div>
                        <Badge gradient="from-purple-700 to-pink-500" size="sm">Lead</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tabIndex === 1 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h6 className="font-bold mb-0">Screens & Tasks</h6>
                    {user?.role === 'admin' && (
                      <Button size="sm" onClick={() => { setEditingScreen(null); setScreenForm({ title: '', module: '', assigneeId: '', plannedDeadline: '', notes: '' }); setScreenDialog(true); }}>
                        <Plus size={14} className="mr-2" /> New Screen
                      </Button>
                    )}
                  </div>
                  <Table columns={screenColumns} data={screensList} pagination={true} pageSize={10} />
                </div>
              )}

              {tabIndex === 2 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h6 className="font-bold mb-0">Bug Tracker</h6>
                    {(user?.role === 'admin' || user?.role === 'tester' || user?.role === 'developer') && (
                      <Button size="sm" onClick={() => setBugDialog(true)}>
                        <Plus size={14} className="mr-2" /> Report Bug
                      </Button>
                    )}
                  </div>
                  
                  {/* Bug Filters */}
                  <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="w-full md:w-auto min-w-[150px]">
                      <Select 
                        label="Status" 
                        options={[
                          { value: '', label: 'All Statuses' },
                          { value: 'Open', label: 'Open' },
                          { value: 'In Progress', label: 'In Progress' },
                          { value: 'Resolved', label: 'Resolved' },
                          { value: 'Closed', label: 'Closed' }
                        ]} 
                        value={bugStatusFilter} 
                        onChange={(e) => setBugStatusFilter(e.target.value)}
                        className="mb-0"
                      />
                    </div>
                    <div className="w-full md:w-auto min-w-[150px]">
                      <Select 
                        label="Severity" 
                        options={[
                          { value: '', label: 'All Severities' },
                          { value: 'low', label: 'Low' },
                          { value: 'medium', label: 'Medium' },
                          { value: 'high', label: 'High' },
                          { value: 'critical', label: 'Critical' }
                        ]} 
                        value={bugSeverityFilter} 
                        onChange={(e) => setBugSeverityFilter(e.target.value)}
                        className="mb-0"
                      />
                    </div>
                    <div className="w-full md:w-auto min-w-[150px]">
                      <Select 
                        label="Assignee" 
                        options={[
                          { value: '', label: 'All Developers' },
                          ...(project?.developerNames?.map(d => ({ value: d.id, label: d.name })) || [])
                        ]} 
                        value={bugAssigneeFilter} 
                        onChange={(e) => setBugAssigneeFilter(e.target.value)}
                        className="mb-0"
                      />
                    </div>
                  </div>
                  
                  <Table columns={bugColumns} data={filteredBugs} pagination={true} pageSize={10} />
                </div>
              )}

              {tabIndex === 3 && (
                <div>
                  <h6 className="font-bold mb-4">Project Activity Feed</h6>
                  <div className="relative flex flex-col gap-6 before:absolute before:top-0 before:left-4 before:h-full before:w-0.5 before:bg-gray-200">
                    {activityList.length === 0 ? (
                      <p className="text-slate-500 text-sm ml-8">No activity recorded yet.</p>
                    ) : (
                      activityList.map((act, idx) => (
                        <div key={idx} className="relative flex items-start ml-4 pl-6">
                          <div className="absolute left-[-12px] top-1 w-6 h-6 rounded-full bg-white border-4 border-fuchsia-500 z-10"></div>
                          <div className="flex-auto">
                            <p className="text-sm font-bold text-slate-700 mb-0">{act.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-slate-500 mb-0 font-semibold">{act.userName}</p>
                              <span className="text-slate-300 text-xs">•</span>
                              <p className="text-xs text-slate-400 mb-0">{new Date(act.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={screenDialog}
        title={editingScreen ? 'Edit Screen' : 'New Screen'}
        onClose={() => setScreenDialog(false)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setScreenDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddScreen}>{editingScreen ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <InputGroup label="Title" value={screenForm.title} onChange={(e) => setScreenForm({ ...screenForm, title: e.target.value })} />
          <InputGroup label="Module" value={screenForm.module} onChange={(e) => setScreenForm({ ...screenForm, module: e.target.value })} />
          <Select 
            label="Assignee" 
            options={[
              { value: '', label: 'Unassigned' },
              ...(project?.developerNames?.map(d => ({ value: d.id, label: d.name })) || [])
            ]} 
            value={screenForm.assigneeId} 
            onChange={(e) => setScreenForm({ ...screenForm, assigneeId: e.target.value })} 
          />
          <InputGroup label="Planned Deadline" type="date" value={screenForm.plannedDeadline} onChange={(e) => setScreenForm({ ...screenForm, plannedDeadline: e.target.value })} />
          <div className="mb-4">
            <label className="mb-2 ml-1 font-bold text-xs text-slate-700">Notes</label>
            <textarea
              className="focus:shadow-soft-primary-outline text-sm leading-5.6 block w-full appearance-none rounded-lg border border-solid border-gray-300 bg-white bg-clip-padding px-3 py-2 font-normal text-gray-700 transition-all focus:border-fuchsia-300 focus:outline-none focus:transition-shadow"
              rows="3"
              value={screenForm.notes}
              onChange={(e) => setScreenForm({ ...screenForm, notes: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Screen Deadline Edit Modal */}
      <Modal
        isOpen={screenEditDeadlineDialog}
        title="Edit Screen Deadline"
        onClose={() => setScreenEditDeadlineDialog(false)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setScreenEditDeadlineDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveScreenDeadline}>Save Changes</Button>
          </>
        }
      >
        <InputGroup label="New Deadline" type="date" value={screenEditDeadlineValue} onChange={(e) => setScreenEditDeadlineValue(e.target.value)} />
      </Modal>

      {/* Bug Report Modal */}
      <Modal
        isOpen={bugDialog}
        title="Report New Bug"
        onClose={() => setBugDialog(false)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setBugDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddBug}>Submit Bug</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="mb-4">
            <label className="mb-2 ml-1 font-bold text-xs text-slate-700">Description</label>
            <textarea
              className="focus:shadow-soft-primary-outline text-sm leading-5.6 block w-full appearance-none rounded-lg border border-solid border-gray-300 bg-white bg-clip-padding px-3 py-2 font-normal text-gray-700 transition-all focus:border-fuchsia-300 focus:outline-none focus:transition-shadow"
              rows="3"
              value={bugForm.description}
              onChange={(e) => setBugForm({ ...bugForm, description: e.target.value })}
              required
            />
          </div>
          <Select 
            label="Severity" 
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' }
            ]} 
            value={bugForm.severity} 
            onChange={(e) => setBugForm({ ...bugForm, severity: e.target.value })} 
          />
          <Select 
            label="Related Screen" 
            options={[
              { value: '', label: 'General / No Screen' },
              ...(screensList.map(s => ({ value: s.id, label: s.title })) || [])
            ]} 
            value={bugForm.screenId} 
            onChange={(e) => setBugForm({ ...bugForm, screenId: e.target.value })} 
          />
          <Select 
            label="Assign Developer" 
            options={[
              { value: '', label: 'Unassigned' },
              ...(project?.developerNames?.map(d => ({ value: d.id, label: d.name })) || [])
            ]} 
            value={bugForm.assignedDeveloperId} 
            onChange={(e) => setBugForm({ ...bugForm, assignedDeveloperId: e.target.value })} 
          />
          <InputGroup label="Deadline" type="date" value={bugForm.deadline} onChange={(e) => setBugForm({ ...bugForm, deadline: e.target.value })} />
          
          <div className="mb-4">
            <label className="mb-2 ml-1 font-bold text-xs text-slate-700">Attachments</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Plus className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                </div>
                <input type="file" className="hidden" multiple onChange={handleAttachmentChange} />
              </label>
            </div>
            {bugForm.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {bugForm.attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg">
                    {isImageFile(att.type) ? <ImageIcon size={14} className="text-blue-500" /> : <Paperclip size={14} className="text-slate-400" />}
                    <span className="text-xs truncate max-w-[100px]">{att.name}</span>
                    <button onClick={() => removeAttachment(att.id)} className="text-red-500 hover:text-red-700">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Bug Edit Modal */}
      <Modal
        isOpen={bugEditDialog}
        title="Edit Bug Deadline"
        onClose={() => setBugEditDialog(false)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setBugEditDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveBugDeadline}>Save Changes</Button>
          </>
        }
      >
        <InputGroup label="New Deadline" type="date" value={bugEditDeadline} onChange={(e) => setBugEditDeadline(e.target.value)} />
      </Modal>

      {/* Attachment Preview Modal */}
      <Modal
        isOpen={previewDialog}
        title={previewAttachment?.name || 'Preview'}
        onClose={() => setPreviewDialog(false)}
      >
        {previewAttachment && (
          <div className="flex flex-col items-center">
            {isImageFile(previewAttachment.type) ? (
              <img src={previewAttachment.data} alt={previewAttachment.name} className="max-w-full rounded-lg shadow-soft-xl" />
            ) : isVideoFile(previewAttachment.type) ? (
              <video src={previewAttachment.data} controls className="max-w-full rounded-lg shadow-soft-xl" />
            ) : (
              <div className="p-8 text-center">
                <Paperclip size={48} className="text-slate-300 mb-4 mx-auto" />
                <p className="text-slate-500 mb-4">Preview not available for this file type.</p>
                <a 
                  href={previewAttachment.data} 
                  download={previewAttachment.name}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-tl from-purple-700 to-pink-500 text-white rounded-lg font-bold text-sm shadow-soft-md"
                >
                  <Download size={16} className="mr-2" /> Download File
                </a>
              </div>
            )}
            <div className="mt-4 text-xs text-slate-500">
              {formatFileSize(previewAttachment.size)} • {previewAttachment.type}
            </div>
          </div>
        )}
      </Modal>

      <ToastContainer position="bottom-right" theme="colored" />
    </div>
  )
}

