import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { authFetch, getUser, clearToken, clearUser } from '../auth'
import { API_BASE_URL } from '../apiConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Card, CardHeader, CardBody, Badge, Button, StatCard, PageHeader } from '../components/TailAdminComponents'
import { Table, Modal, InputGroup, Select, ProgressBar } from '../components/FormComponents'
import { Loader } from '../components/Loader'
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
  ChevronRight,
  Layout,
  Settings,
  MessageSquare,
  RefreshCw,
  Bug,
  Activity
} from 'lucide-react'

/**
 * Utility functions for formatting and UI helpers
 */
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '—'
  const cleanDateStr = typeof dateStr === 'string' && dateStr.includes('T') ? dateStr.split('T')[0] : (typeof dateStr === 'string' ? dateStr : new Date(dateStr).toISOString().split('T')[0])
  const parts = cleanDateStr.split('-')
  if (parts.length !== 3) return cleanDateStr

  const [year, month, day] = parts
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthIndex = parseInt(month, 10) - 1
  return `${day}-${months[monthIndex]}-${year}`
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const getStatusGradient = (status) => {
  if (!status) return 'from-slate-600 to-slate-300'
  const s = status.toLowerCase()
  
  switch (s) {
    case 'open': return 'from-red-600 to-rose-400'
    case 'in progress': return 'from-orange-500 to-yellow-400'
    case 'resolved':
    case 'donr':
    case 'done':
    case 'completed':
      return 'from-green-600 to-lime-400'
    case 'closed': return 'from-slate-600 to-slate-300'
    case 'blocked': return 'from-red-600 to-rose-400'
    case 'apporved':
    case 'approved':
      return 'from-purple-700 to-pink-500'
    case 'aproval pending':
    case 'approval pending':
      return 'from-blue-600 to-cyan-400'
    case 'pending': return 'from-slate-400 to-slate-300'
    case 'planning':
    case 'under planning':
    case 'planned':
      return 'from-blue-600 to-cyan-400'
    case 'active':
    case 'running':
      return 'from-purple-700 to-pink-500'
    case 'on hold': return 'from-orange-500 to-yellow-400'
    case 'maintenance': return 'from-slate-600 to-slate-300'
    case 'critical': return 'from-red-600 to-rose-400'
    default: return 'from-slate-600 to-slate-300'
  }
}

const getSeverityGradient = (severity) => {
  switch (severity) {
    case 'low': return 'from-blue-600 to-cyan-400'
    case 'medium': return 'from-orange-500 to-yellow-400'
    case 'high': return 'from-red-600 to-rose-400'
    case 'critical': return 'from-red-900 to-slate-800'
    default: return 'from-slate-600 to-slate-300'
  }
}

export default function ProjectPage() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [screensList, setScreensList] = useState([])
  const [bugsList, setBugsList] = useState([])
  const [activityList, setActivityList] = useState([])
  const [milestonesList, setMilestonesList] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [tabIndex, setTabIndex] = useState(0)
  const user = getUser()
  const nav = useNavigate()

  // Project settings edit states (admin)
  const [projectStart, setProjectStart] = useState('')
  const [projectEnd, setProjectEnd] = useState('')
  const [projectStatus, setProjectStatus] = useState('')

  // Dialog states
  const [bugDialog, setBugDialog] = useState(false)
  const [screenDialog, setScreenDialog] = useState(false)
  const [milestoneDialog, setMilestoneDialog] = useState(false)
  const [editingScreen, setEditingScreen] = useState(null)
  const [editingMilestone, setEditingMilestone] = useState(null)
  const [bugEditDialog, setBugEditDialog] = useState(false)
  const [bugEditId, setBugEditId] = useState(null)
  const [bugEditDeadline, setBugEditDeadline] = useState('')
  const [screenEditDeadlineDialog, setScreenEditDeadlineDialog] = useState(false)
  const [screenEditDeadlineId, setScreenEditDeadlineId] = useState(null)
  const [screenEditDeadlineValue, setScreenEditDeadlineValue] = useState('')

  // Form states
  const [bugForm, setBugForm] = useState({ description: '', severity: 'medium', screenId: '', module: '', assignedDeveloperId: '', attachments: [], deadline: '' })
  const [screenForm, setScreenForm] = useState({ title: '', module: '', assigneeId: '', plannedDeadline: '', notes: '' })
  const [milestoneForm, setMilestoneForm] = useState({ milestoneNumber: '', module: '', timeline: '', status: 'Pending' })


  // Filter states
  const [bugFilters, setBugFilters] = useState({
    status: '',
    severity: '',
    assignee: ''
  })

  // Attachment preview
  const [previewDialog, setPreviewDialog] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState(null)
  const [previewBug, setPreviewBug] = useState(null)

  const generateProjectSummary = React.useCallback(() => {
    if (!project) return 'Loading project summary...';

    const status = project?.status || 'Active';
    const totalBugs = bugsList.length;
    const openBugs = bugsList.filter(b => b.status === 'Open' || b.status === 'In Progress').length;
    const resolvedBugs = totalBugs - openBugs;
    const totalTasks = screensList.length;
    const completedTasks = screensList.filter(s => s.status === 'Done').length;
    const pendingTasks = totalTasks - completedTasks;
    const totalMilestones = milestonesList.length;
    const completedMilestones = milestonesList.filter(m => m.status === 'Completed' || m.status === 'Done').length;
    const pendingMilestones = totalMilestones - completedMilestones;

    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const resolutionRate = totalBugs > 0 ? Math.round((resolvedBugs / totalBugs) * 100) : 0;
    const milestoneProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    // Developer Breakdown
    const devStats = (project?.developerNames || []).map(dev => {
      const devBugs = bugsList.filter(b => b.assignedDeveloperId === dev.id && (b.status === 'Open' || b.status === 'In Progress')).length;
      const devTasks = screensList.filter(s => s.assigneeId === dev.id && s.status !== 'Done').length;
      return { name: dev.name, bugs: devBugs, tasks: devTasks };
    }).filter(d => d.bugs > 0 || d.tasks > 0);

    const devBreakdownText = devStats.length > 0 
      ? ` Currently, the workload distribution is as follows: ${devStats.map(d => `${d.name} is managing ${d.tasks} pending task${d.tasks !== 1 ? 's' : ''} and ${d.bugs} open bug${d.bugs !== 1 ? 's' : ''}`).join('; ')}.`
      : '';

    const bugSummary = `A total of ${totalBugs} bugs have been reported throughout the project lifecycle, with ${resolvedBugs} successfully resolved (${resolutionRate}% resolution rate), leaving ${openBugs} issues currently active.`;
    const taskSummary = `Regarding the project scope, we have ${totalTasks} total tasks (screens) defined, of which ${completedTasks} are finalized, resulting in a ${progressPercentage}% completion rate. There are ${pendingTasks} tasks still requiring development effort.`;
    const milestoneSummary = totalMilestones > 0 ? `We have ${totalMilestones} milestones planned, with ${completedMilestones} completed (${milestoneProgress}% progress).` : '';

    const baseMessage = `Project "${project?.name || 'Unknown'}" for client "${project?.client || 'Unknown'}" is currently in the ${status} phase. `;

    switch (status) {
      case 'Planning':
        return `${baseMessage} We are currently in the structural definition phase. ${taskSummary} ${milestoneSummary} ${bugSummary}${devBreakdownText} The focus is on establishing a solid foundation before ramping up development.`;
      case 'Active':
      case 'Running':
        return `${baseMessage} The project is moving forward with active development and testing. ${taskSummary} ${milestoneSummary} ${bugSummary} This indicates a steady flow of implementation and quality assurance. ${devBreakdownText} The team is prioritizing high-impact tasks and resolving critical bugs to maintain momentum.`;
      case 'On Hold':
        return `${baseMessage} Development is currently paused, but we have a clear picture of the current state. ${taskSummary} ${milestoneSummary} ${bugSummary} Work will resume from this point once the current blockers are cleared. ${devBreakdownText}`;
      case 'Completed':
      case 'Done':
        return `${baseMessage} The project has been successfully delivered. ${totalTasks} out of ${totalTasks} tasks were completed, ${completedMilestones} of ${totalMilestones} milestones reached, and ${resolvedBugs} out of ${totalBugs} bugs were resolved during the process. The system is stable and meets the project requirements.`;
      case 'Critical':
        return `${baseMessage} Immediate attention is required due to the project's critical status. ${bugSummary} The volume of ${openBugs} open issues is impacting delivery. ${taskSummary} ${milestoneSummary} ${devBreakdownText} We are shifting resources to address these bottlenecks urgently.`;
      case 'Maintenance':
        return `${baseMessage} We are now in the post-launch support phase. ${bugSummary} Monitoring is ongoing to ensure system stability. ${taskSummary} ${milestoneSummary} Any new requirements will be handled as iterative updates. ${devBreakdownText}`;
      default:
        return `${baseMessage} The project is progressing through its current phase. ${taskSummary} ${milestoneSummary} ${bugSummary} ${devBreakdownText} We are monitoring performance metrics to ensure timely delivery.`;
    }
  }, [project, bugsList, screensList, milestonesList]);

  useEffect(() => {
    loadData()
  }, [id])

  /**
   * Centralized error handling for authentication issues
   */
  const handleAuthError = React.useCallback((e) => {
    if (e.message === 'Unauthorized: Token expired or invalid') {
      clearToken()
      clearUser()
      nav('/login', { replace: true })
    } else {
      toast.error(e.message)
    }
  }, [nav])

  /**
   * Fetch all project-related data concurrently
   */
  const loadData = async () => {
    setLoading(true)
    try {
      const [projRes, screensRes, bugsRes, activityRes, milestonesRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/projects/${id}`),
        authFetch(`${API_BASE_URL}/projects/${id}/screens`),
        authFetch(`${API_BASE_URL}/projects/${id}/bugs`),
        authFetch(`${API_BASE_URL}/projects/${id}/activity`),
        authFetch(`${API_BASE_URL}/projects/${id}/milestones`)
      ])

      if (!projRes.ok) throw new Error('Failed to fetch project')
      const projData = await projRes.json()
      setProject(projData)
      
      // Initialize edit states
      setProjectStart(projData.startDate ? new Date(projData.startDate).toISOString().slice(0, 10) : '')
      setProjectEnd(projData.endDate ? new Date(projData.endDate).toISOString().slice(0, 10) : '')
      setProjectStatus(projData.status || '')

      if (screensRes.ok) setScreensList(await screensRes.json())
      if (bugsRes.ok) setBugsList(await bugsRes.json())
      if (activityRes.ok) setActivityList(await activityRes.json())
      if (milestonesRes.ok) setMilestonesList(await milestonesRes.json())
    } catch (e) {
      handleAuthError(e)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle bug reporting with attachments
   */
  const handleAddBug = async () => {
    if (!bugForm.description) return
    try {
      const res = await authFetch(`${API_BASE_URL}/projects/${id}/bugs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...bugForm,
          deadline: bugForm.deadline || null
        })
      })
      if (!res.ok) throw new Error('Failed to create bug')
      
      setBugForm({ description: '', severity: 'medium', screenId: '', module: '', assignedDeveloperId: '', attachments: [], deadline: '' })
      setBugDialog(false)
      loadData()
    } catch (e) {
      handleAuthError(e)
    }
  }

  const openBugEdit = (bug) => {
    setBugEditId(bug.id)
    setBugEditDeadline(bug.deadline ? new Date(bug.deadline).toISOString().slice(0, 10) : '')
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
          data: event.target.result
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

  const isImageFile = (type) => type.startsWith('image/')
  const isVideoFile = (type) => type.startsWith('video/')

  const showAttachmentPreview = (attachment, bug = null) => {
    setPreviewAttachment(attachment)
    setPreviewBug(bug)
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
      loadData()
      toast.success('Bug status updated successfully!')
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
      loadData()
      toast.success('Screen status updated successfully!')
    } catch (e) {
      handleAuthError(e)
    }
  }

  const handleAddScreen = async () => {
    if (!screenForm.title) return
    try {
      if (editingScreen) {
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
      toast.success(editingScreen ? 'Screen updated successfully!' : 'Screen added successfully!')
    } catch (e) {
      handleAuthError(e)
    }
  }

  const openEditScreen = (s) => {
    setEditingScreen(s)
    setScreenForm({ title: s.title || '', module: s.module || '', assigneeId: s.assigneeId || '', plannedDeadline: s.plannedDeadline ? new Date(s.plannedDeadline).toISOString().slice(0, 10) : '', notes: s.notes || '' })
    setScreenDialog(true)
  }

  const openScreenDeadlineEdit = (s) => {
    setScreenEditDeadlineId(s.id)
    setScreenEditDeadlineValue(s.plannedDeadline ? new Date(s.plannedDeadline).toISOString().slice(0, 10) : '')
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
      toast.success('Screen deadline updated successfully!')
    } catch (e) {
      handleAuthError(e)
    }
  }

  const handleUpdateProjectSettings = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: projectStart || null,
          endDate: projectEnd || null,
          status: projectStatus
        })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to update project settings')
      }
      loadData()
      toast.success('Project settings updated successfully!')
    } catch (e) {
      handleAuthError(e)
    }
  }

  const handleDeleteBug = async (bugId) => {
    if (!window.confirm('Delete this bug?')) return
    try {
      const res = await authFetch(`${API_BASE_URL}/bugs/${bugId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete bug')
      loadData()
      toast.success('Bug deleted successfully!')
    } catch (e) {
      handleAuthError(e)
    }
  }

  const handleDeleteScreen = async (screenId) => {
    if (!window.confirm('Delete this screen?')) return
    try {
      const res = await authFetch(`${API_BASE_URL}/screens/${screenId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete screen')
      loadData()
      toast.success('Screen deleted successfully!')
    } catch (e) {
      handleAuthError(e)
    }
  }

  const handleAddMilestone = async () => {
    if (!milestoneForm.milestoneNumber) return
    try {
      if (editingMilestone) {
        const res = await authFetch(`${API_BASE_URL}/milestones/${editingMilestone.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(milestoneForm)
        })
        if (!res.ok) throw new Error('Failed to update milestone')
      } else {
        const res = await authFetch(`${API_BASE_URL}/projects/${id}/milestones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(milestoneForm)
        })
        if (!res.ok) throw new Error('Failed to create milestone')
      }
      setMilestoneForm({ milestoneNumber: '', module: '', timeline: '', status: 'Pending' })
      setMilestoneDialog(false)
      setEditingMilestone(null)
      loadData()
      toast.success(editingMilestone ? 'Milestone updated successfully!' : 'Milestone added successfully!')
    } catch (e) {
      handleAuthError(e)
    }
  }

  const openAddMilestone = () => {
    setEditingMilestone(null)
    setMilestoneForm({ milestoneNumber: '', module: '', timeline: '', status: 'Pending' })
    setMilestoneDialog(true)
  }

  const openEditMilestone = (m) => {
    setEditingMilestone(m)
    setMilestoneForm({
      milestoneNumber: m.milestoneNumber || '',
      module: m.module || '',
      timeline: m.timeline ? new Date(m.timeline).toISOString().slice(0, 10) : '',
      status: m.status || 'Pending'
    })
    setMilestoneDialog(true)
  }

  const handleToggleModule = (moduleTitle) => {
    const currentModules = milestoneForm.module ? milestoneForm.module.split(',').map(m => m.trim()).filter(m => m !== '') : []
    const newModules = currentModules.includes(moduleTitle)
      ? currentModules.filter(m => m !== moduleTitle)
      : [...currentModules, moduleTitle]
    setMilestoneForm({ ...milestoneForm, module: newModules.join(', ') })
  }

  const handleDeleteMilestone = async (mid) => {
    if (!window.confirm('Delete this milestone?')) return
    try {
      const res = await authFetch(`${API_BASE_URL}/milestones/${mid}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete milestone')
      loadData()
      toast.success('Milestone deleted successfully!')
    } catch (e) {
      handleAuthError(e)
    }
  }

  /**
   * Memoized bug list filtering
   */
  const filteredBugs = React.useMemo(() => {
    return bugsList.filter(b => {
      if (bugFilters.status && b.status !== bugFilters.status) return false
      if (bugFilters.severity && b.severity !== bugFilters.severity) return false
      if (bugFilters.assignee && b.assignedDeveloperId !== bugFilters.assignee) return false
      return true
    })
  }, [bugsList, bugFilters])

  /**
   * Formats activity details with descriptive text and icons
   */
  const getActivityDetails = React.useCallback((act) => {
    const { entityType, action, changes } = act;
    let description = '';
    let icon = <Clock size={14} />;
    let gradient = 'from-slate-600 to-slate-400';

    switch (entityType) {
      case 'bug':
        icon = <Bug size={14} />;
        gradient = 'from-red-600 to-rose-400';
        const bugRef = changes?.bugNumber ? `Bug #${changes.bugNumber}` : 'a bug';
        const bugDesc = changes?.description ? `: "${changes.description}"` : '';
        
        if (action === 'created') description = `Reported ${bugRef}${bugDesc}`;
        else if (action === 'status_change') description = `Changed status of ${bugRef} to "${changes.status || changes.newStatus}"`;
        else if (action === 'deadline_updated') description = `Updated deadline for ${bugRef} to ${formatDateDisplay(changes.deadline)}`;
        else if (action === 'updated') description = `Updated details for ${bugRef}${bugDesc}`;
        else if (action === 'deleted') description = `Deleted ${bugRef}${bugDesc}`;
        break;
      case 'screen':
        icon = <Layout size={14} />;
        gradient = 'from-blue-600 to-cyan-400';
        const screenTitle = changes?.title || 'Untitled';
        if (action === 'created') description = `Added a new screen: "${screenTitle}"`;
        else if (action === 'status_change') description = `Updated screen status to "${changes.status || changes.newStatus}"`;
        else if (action === 'deadline_updated') description = `Updated screen deadline to ${formatDateDisplay(changes.plannedDeadline)}`;
        else if (action === 'updated') description = `Updated screen details for "${screenTitle}"`;
        else if (action === 'deleted') description = `Deleted screen: "${screenTitle}"`;
        break;
      case 'project':
        icon = <Settings size={14} />;
        gradient = 'from-purple-700 to-pink-500';
        if (action === 'updated') description = `Updated project settings`;
        else if (action === 'deleted') description = `Deleted the project`;
        break;
      case 'milestone':
        icon = <Activity size={14} />;
        gradient = 'from-indigo-600 to-purple-500';
        const mNum = changes?.milestoneNumber || '';
        if (action === 'created') description = `Created milestone #${mNum}`;
        else if (action === 'updated') description = `Updated milestone #${mNum}`;
        else if (action === 'deleted') description = `Deleted milestone #${mNum}`;
        break;
      default:
        description = act.description || 'Performed an action';
    }

    return { description, icon, gradient };
  }, [])

  const screenColumns = [
    { key: 'title', label: 'Title' },
    { key: 'module', label: 'Module' },
    { key: 'assigneeName', label: 'Assignee' },
    {
      key: 'plannedDeadline',
      label: 'Deadline',
      render: (val, s) => (
        <div className="flex items-center gap-2">
          <span>{formatDateDisplay(val)}</span>
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
      key: 'attachments',
      label: 'Attachments',
      render: (attachments, b) => {
        // Defensive check: ensure attachments is an array
        let attList = [];
        try {
          if (Array.isArray(attachments)) {
            attList = attachments;
          } else if (typeof attachments === 'string' && attachments.trim() !== '') {
            attList = JSON.parse(attachments);
          }
        } catch (e) {
          console.error('Error parsing attachments for bug:', b.id, e);
          attList = [];
        }

        if (!Array.isArray(attList) || attList.length === 0) return <span className="text-slate-400 text-xs">No files</span>
        
        return (
          <div className="flex -space-x-2">
            {attList.map((att, idx) => (
              <button
                key={att.id || idx}
                onClick={() => showAttachmentPreview(att, b)}
                className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-slate-500 hover:text-fuchsia-600 hover:border-fuchsia-200 transition-all shadow-sm"
                title={att.name || 'Attachment'}
              >
                {isImageFile(att.type) ? <ImageIcon size={14} /> : <Paperclip size={14} />}
              </button>
            ))}
          </div>
        )
      }
    },
    {
      key: 'deadline',
      label: 'Deadline',
      render: (val, b) => (
        <div className="flex items-center gap-2">
          <span>{formatDateDisplay(val)}</span>
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
      <nav className="mb-6 px-4">
        <ol className="flex flex-wrap pt-1 mr-12 bg-transparent rounded-lg sm:mr-16">
          <li className="leading-normal text-sm">
            <Link className="opacity-50 text-slate-700 font-medium" to="/">Pages</Link>
          </li>
          <li className="text-sm pl-2 capitalize leading-normal text-slate-700 font-bold before:float-left before:pr-2 before:text-gray-300 before:content-['/']">
            Project Details
          </li>
        </ol>
      </nav>

      <div className="flex flex-wrap -mx-3">
        {/* Header Section */}
        <div className="w-full max-w-full px-3">
          <PageHeader
            title={project?.name || 'Project'}
            subtitle={<>Client: {project?.client || '—'}</>}
            actions={project?.status ? (
              <Badge gradient={getStatusGradient(project?.status)} size="lg">
                {project?.status}
              </Badge>
            ) : null}
          />
        </div>

        {/* Stats Row */}
        <div className="w-full max-w-full px-3 mb-6 lg:w-3/12">
          <StatCard
            title="Team"
            value={`${project?.developerNames?.length || 0} Developers`}
            icon={Users}
            gradient="from-blue-600 to-cyan-400"
          />
        </div>

        <div className="w-full max-w-full px-3 mb-6 lg:w-3/12">
          <StatCard
            title="Bugs"
            value={`${project?.openBugsCount || 0} Open Bugs`}
            icon={AlertCircle}
            gradient="from-red-600 to-rose-400"
          />
        </div>

        <div className="w-full max-w-full px-3 mb-6 lg:w-3/12">
          <StatCard
            title="Progress"
            value={`${project?.completedScreensCount || 0} / ${screensList.length} Done`}
            icon={CheckCircle}
            gradient="from-green-600 to-lime-400"
          >
            <ProgressBar
              value={project?.completedScreensCount || 0}
              max={screensList.length || 1}
              showLabel={false}
              gradient="from-green-600 to-lime-400"
            />
          </StatCard>
        </div>

        <div className="w-full max-w-full px-3 mb-6 lg:w-3/12">
          <StatCard
            title="Deadlines"
            value={`${project?.upcomingDeadlines || 0} Upcoming`}
            icon={Clock}
            gradient="from-orange-500 to-yellow-400"
          />
        </div>

        {/* Tabs Section */}
        <div className="w-full max-w-full px-3">
          <Card className="mb-6">
            <CardHeader className="p-4 pb-0">
              <div className="flex flex-wrap -mx-3">
                <div className="flex items-center w-full max-w-full px-3 shrink-0 md:w-8/12 md:flex-none">
                  <ul className="flex flex-wrap p-1 list-none bg-gray-50 rounded-xl" role="tablist">
                    {['Overview', 'Screens', 'Milestones', 'Bugs', 'Activity'].map((tab, idx) => (
                      <li key={tab} className="flex-auto text-center">
                        <button
                          onClick={() => setTabIndex(idx)}
                          className={`z-30 block w-full px-4 py-2 mb-0 transition-all border-0 rounded-lg cursor-pointer text-slate-700 bg-inherit text-sm font-bold ${tabIndex === idx ? 'bg-white shadow-soft-md' : 'opacity-60 hover:opacity-100'}`}
                        >
                          {tab}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardHeader>

            <CardBody className="p-6">
              {/* Tab Content */}
              {tabIndex === 0 && (
                <div className="flex flex-wrap -mx-3">
                  <div className="w-full max-w-full px-3 lg:w-7/12">
                    <div className="mb-8">
                      <h6 className="mb-4 font-bold text-slate-700 flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center mr-3">
                          <CheckCircle size={18} />
                        </div>
                        Project Summary
                      </h6>
                      <div className="p-5 bg-gradient-to-tr from-slate-800 to-slate-900 rounded-2xl shadow-soft-xl">
                        <p className="text-sm leading-relaxed text-white font-medium italic">
                          "{generateProjectSummary()}"
                        </p>
                      </div>
                    </div>

                    <h6 className="mb-4 font-bold text-slate-700">Project Description</h6>
                    <p className="text-sm leading-normal text-slate-600 bg-gray-50 p-4 rounded-xl">
                      {project?.description || 'No description provided.'}
                    </p>

                    <div className="mt-8">
                      <h6 className="mb-4 font-bold text-slate-700">Timeline & Settings</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-xs font-bold uppercase text-slate-400 mb-2">Start Date</p>
                          <p className="font-bold text-slate-700">{formatDateDisplay(project?.startDate)}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-xs font-bold uppercase text-slate-400 mb-2">Target End Date</p>
                          <p className="font-bold text-slate-700">{formatDateDisplay(project?.endDate)}</p>
                        </div>
                      </div>

                      {user?.role === 'admin' && (
                        <div className="mt-6 p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                          <p className="text-sm font-bold text-slate-700 mb-4">Update Project Settings</p>
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
                            <Select
                              label="Status"
                              value={projectStatus}
                              onChange={(e) => setProjectStatus(e.target.value)}
                              options={[
                                { value: 'Planning', label: 'Planning' },
                                { value: 'Active', label: 'Active' },
                                { value: 'Running', label: 'Running' },
                                { value: 'On Hold', label: 'On Hold' },
                                { value: 'Maintenance', label: 'Maintenance' },
                                { value: 'Completed', label: 'Completed' },
                                { value: 'Done', label: 'Done' },
                                { value: 'Critical', label: 'Critical' }
                              ]}
                              className="mb-0"
                            />
                            <Button size="sm" onClick={handleUpdateProjectSettings}>Save Changes</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-full max-w-full px-3 mt-6 lg:w-5/12 lg:mt-0">
                    <h6 className="mb-4 font-bold text-slate-700">Team Members</h6>
                    <div className="flex flex-col gap-4">
                      {project?.developerNames?.map(dev => (
                        <div key={dev.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-soft-sm">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-slate-600 to-slate-300 flex items-center justify-center text-white font-bold mr-4 shadow-soft-md">
                              {dev.name?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-bold mb-0 text-slate-700">{dev.name}</p>
                              <p className="text-xs text-slate-500 mb-0">Developer</p>
                            </div>
                          </div>
                          <Badge gradient="from-green-600 to-lime-400" size="sm">Active</Badge>
                        </div>
                      ))}
                      <div className="flex items-center justify-between p-4 bg-white border-l-4 border-fuchsia-500 rounded-2xl shadow-soft-md">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-purple-700 to-pink-500 flex items-center justify-center text-white font-bold mr-4 shadow-soft-lg">
                            {project?.testerName?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-bold mb-0 text-slate-700">{project?.testerName || 'Unassigned'}</p>
                            <p className="text-xs text-slate-500 mb-0">QA Tester</p>
                          </div>
                        </div>
                        <Badge gradient="from-purple-700 to-pink-500" size="sm">Tester</Badge>
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
                    <h6 className="font-bold mb-0">Project Milestones</h6>
                    {user?.role === 'admin' && (
                      <Button size="sm" onClick={openAddMilestone}>
                        <Plus size={14} className="mr-2" /> New Milestone
                      </Button>
                    )}
                  </div>
                  <Table 
                    columns={[
                      { key: 'milestoneNumber', label: 'Milestone #' },
                      { 
                        key: 'module', 
                        label: 'Modules', 
                        render: (val) => (
                          <div className="flex flex-wrap gap-2 max-w-[200px]">
                            {val ? val.split(',').map((m, idx) => (
                              <Badge key={idx} gradient="from-blue-600 to-cyan-400" size="sm">{m.trim()}</Badge>
                            )) : <span className="text-slate-400 italic text-xs">No modules</span>}
                          </div>
                        )
                      },
                      { key: 'timeline', label: 'Timeline', render: (val) => formatDateDisplay(val) },
                      {
                        key: 'status',
                        label: 'Status',
                        render: (status) => (
                          <Badge gradient={getStatusGradient(status)} size="sm">
                            {status || 'Pending'}
                          </Badge>
                        )
                      },
                      {
                        key: 'actions',
                        label: 'Actions',
                        render: (_, m) => (
                          <div className="flex gap-2">
                            <button onClick={() => openEditMilestone(m)} className="text-blue-500 hover:text-blue-700 transition-colors">
                              <Edit size={16} />
                            </button>
                            {user?.role === 'admin' && (
                              <button onClick={() => handleDeleteMilestone(m.id)} className="text-red-500 hover:text-red-700 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        )
                      }
                    ]} 
                    data={milestonesList} 
                    pagination={true} 
                    pageSize={10} 
                  />
                </div>
              )}

              {tabIndex === 3 && (
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
                      value={bugFilters.status}
                      onChange={(e) => setBugFilters(prev => ({ ...prev, status: e.target.value }))}
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
                      value={bugFilters.severity}
                      onChange={(e) => setBugFilters(prev => ({ ...prev, severity: e.target.value }))}
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
                      value={bugFilters.assignee}
                      onChange={(e) => setBugFilters(prev => ({ ...prev, assignee: e.target.value }))}
                      className="mb-0"
                    />
                  </div>
                  </div>

                  <Table columns={bugColumns} data={filteredBugs} pagination={true} pageSize={10} />
                </div>
              )}

              {tabIndex === 4 && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <h6 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Project Activity Feed</h6>
                    <button 
                      onClick={loadData} 
                      className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-fuchsia-600 transition-all flex items-center gap-2 text-xs font-bold"
                      title="Refresh Activity"
                    >
                      <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                      REFRESH
                    </button>
                  </div>

                  <div className="relative flex flex-col gap-10 before:absolute before:top-0 before:left-5 before:h-full before:w-0.5 before:bg-slate-100 pb-4">
                    {activityList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-6 border-4 border-white shadow-soft-sm">
                          <Activity size={36} />
                        </div>
                        <h6 className="text-slate-800 font-bold mb-1">No Activity Yet</h6>
                        <p className="text-slate-500 text-sm max-w-xs">Events related to this project will appear here as they happen.</p>
                      </div>
                    ) : (
                      [...activityList].reverse().map((act, idx) => {
                        const { description, icon, gradient } = getActivityDetails(act);
                        const isLast = idx === activityList.length - 1;

                        return (
                          <div key={idx} className="relative flex items-start ml-0 group animate-fadeIn">
                            {/* Timeline Point & Icon */}
                            <div className={`absolute left-0 top-0 w-10 h-10 rounded-xl bg-gradient-to-tl ${gradient} shadow-soft-md flex items-center justify-center text-white z-10 group-hover:scale-110 transition-transform duration-300`}>
                              {icon}
                            </div>
                            
                            <div className="flex-auto ml-14">
                              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft-sm group-hover:shadow-soft-md transition-all duration-300 group-hover:border-fuchsia-100">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 text-[10px] font-bold border border-slate-100">
                                      {act.createdByName?.charAt(0) || 'U'}
                                    </div>
                                    <p className="text-xs text-slate-500 mb-0 font-medium">
                                      <span className="text-slate-800 font-bold">{act.createdByName}</span>
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock size={10} className="text-slate-400" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                      {new Date(act.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                  </div>
                                </div>

                                <p className="text-sm font-bold text-slate-700 mb-0 leading-relaxed">
                                  {description}
                                </p>

                                {/* Detailed Changes Preview */}
                                {act.changes && (
                                  <div className="mt-3 pt-3 border-t border-slate-50">
                                    {act.entityType === 'bug' && act.action === 'status_change' && (
                                      <div className="flex items-center gap-2">
                                        <Badge gradient={getStatusGradient(act.changes.oldStatus)} size="sm">{act.changes.oldStatus}</Badge>
                                        <ChevronRight size={12} className="text-slate-300" />
                                        <Badge gradient={getStatusGradient(act.changes.newStatus || act.changes.status)} size="sm">{act.changes.newStatus || act.changes.status}</Badge>
                                      </div>
                                    )}
                                    
                                    {act.entityType === 'screen' && act.action === 'status_change' && (
                                      <div className="flex items-center gap-2">
                                        <Badge gradient={getStatusGradient(act.changes.oldStatus)} size="sm">{act.changes.oldStatus}</Badge>
                                        <ChevronRight size={12} className="text-slate-300" />
                                        <Badge gradient={getStatusGradient(act.changes.newStatus || act.changes.status)} size="sm">{act.changes.newStatus || act.changes.status}</Badge>
                                      </div>
                                    )}

                                    {act.action === 'deadline_updated' && (
                                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                        <Calendar size={12} className="text-fuchsia-500" />
                                        <span>New Deadline:</span>
                                        <span className="text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                          {formatDateDisplay(act.changes.deadline || act.changes.plannedDeadline)}
                                        </span>
                                      </div>
                                    )}

                                    {act.entityType === 'milestone' && act.action === 'created' && act.changes.module && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {act.changes.module.split(',').map((m, i) => (
                                          <span key={i} className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-bold border border-indigo-100">
                                            {m.trim()}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={milestoneDialog}
        title={editingMilestone ? 'Edit Milestone' : 'New Milestone'}
        onClose={() => setMilestoneDialog(false)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setMilestoneDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddMilestone}>{editingMilestone ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <InputGroup label="Milestone Number" value={milestoneForm.milestoneNumber} onChange={(e) => setMilestoneForm({ ...milestoneForm, milestoneNumber: e.target.value })} />
          
          <div className="mb-4">
            <label className="mb-3 ml-1 font-bold text-xs text-slate-700 uppercase tracking-wider">Select Modules (from Screens)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-4 border border-gray-200 rounded-2xl bg-slate-50/50 shadow-inner">
              {screensList.length === 0 ? (
                <p className="text-xs text-slate-500 italic col-span-full text-center py-4">No screens available to select as modules.</p>
              ) : (
                screensList.map(screen => {
                  const isChecked = milestoneForm.module ? milestoneForm.module.split(',').map(m => m.trim()).includes(screen.title) : false;
                  return (
                    <label 
                      key={screen.id} 
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                        isChecked 
                          ? 'bg-white border-fuchsia-200 shadow-soft-sm' 
                          : 'bg-transparent border-transparent hover:bg-white/60'
                      }`}
                    >
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-fuchsia-600 checked:border-fuchsia-600 transition-all cursor-pointer"
                          checked={isChecked}
                          onChange={() => handleToggleModule(screen.title)}
                        />
                        <CheckCircle 
                          className={`absolute w-3.5 h-3.5 text-white left-0.75 pointer-events-none transition-opacity ${isChecked ? 'opacity-100' : 'opacity-0'}`} 
                          size={14} 
                        />
                      </div>
                      <span className={`text-xs font-bold transition-colors ${isChecked ? 'text-slate-800' : 'text-slate-500'}`}>
                        {screen.title}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            {milestoneForm.module && (
              <div className="mt-4 flex flex-wrap gap-2">
                <p className="w-full text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Selected:</p>
                {milestoneForm.module.split(',').map(m => m.trim()).filter(m => m !== '').map((m, idx) => (
                  <Badge key={idx} gradient="from-blue-600 to-cyan-400" size="sm">{m}</Badge>
                ))}
              </div>
            )}
          </div>

          <InputGroup label="Timeline" type="date" value={milestoneForm.timeline} onChange={(e) => setMilestoneForm({ ...milestoneForm, timeline: e.target.value })} />
          <Select
            label="Status"
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'in progress', label: 'In Progress' },
              { value: 'done', label: 'Done' },
              { value: 'approved', label: 'Approved' },
              { value: 'approval pending', label: 'Approval Pending' }
            ]}
            value={milestoneForm.status}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, status: e.target.value })}
          />
        </div>
      </Modal>

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
            {previewBug && (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 w-full shadow-inner">
                <p className="text-sm font-bold text-slate-800 mb-3 leading-relaxed">{previewBug.description}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 text-[11px] font-bold uppercase tracking-wider">
                    <span className="opacity-60">Screen:</span> {previewBug.screenTitle || 'General'}
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-fuchsia-50 text-fuchsia-700 rounded-lg border border-fuchsia-100 text-[11px] font-bold uppercase tracking-wider">
                    <span className="opacity-60">Module:</span> {previewBug.module || 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ToastContainer position="bottom-right" theme="colored" />
    </div>
  )
}

