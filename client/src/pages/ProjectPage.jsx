import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { authFetch, getUser, clearToken, clearUser } from '../auth'
import { API_BASE_URL } from '../apiConfig';
import { Card, CardHeader, CardBody, Badge, Button, StatCard, PageHeader } from '../components/TailAdminComponents'
import { Table, Modal, InputGroup, Select, ProgressBar } from '../components/FormComponents'
import { Loader } from '../components/Loader'
import { handleError, handleApiResponse } from '../utils/errorHandler'
import toast from 'react-hot-toast'
import PageContainer from '../components/layout/PageContainer'
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
  Activity,
  Upload,
  FileText
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
  const [documentsList, setDocumentsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [tabIndex, setTabIndex] = useState(0)
  const user = getUser()
  const nav = useNavigate()

  // Project settings edit states (admin)
  const [projectStatus, setProjectStatus] = useState('Active')
  const [projectStart, setProjectStart] = useState('')
  const [projectEnd, setProjectEnd] = useState('')
  const [originalProjectStatus, setOriginalProjectStatus] = useState('Active')
  const [originalProjectStart, setOriginalProjectStart] = useState('')
  const [originalProjectEnd, setOriginalProjectEnd] = useState('')

  // Dialog states
  const [bugDialog, setBugDialog] = useState(false)
  const [screenDialog, setScreenDialog] = useState(false)
  const [milestoneDialog, setMilestoneDialog] = useState(false)
  const [editingScreen, setEditingScreen] = useState(null)
  const [editingMilestone, setEditingMilestone] = useState(null)
  const [bugEditId, setBugEditId] = useState(null)
  const [bugEditDeadline, setBugEditDeadline] = useState('')
  const [bugEditOriginalDeadline, setBugEditOriginalDeadline] = useState('')
  const [bugEditDialog, setBugEditDialog] = useState(false)
  const [screenEditDeadlineDialog, setScreenEditDeadlineDialog] = useState(false)
  const [screenEditDeadlineId, setScreenEditDeadlineId] = useState(null)
  const [screenEditDeadlineValue, setScreenEditDeadlineValue] = useState('')
  const [screenEditDeadlineOriginalValue, setScreenEditDeadlineOriginalValue] = useState('')
  const [documentDialog, setDocumentDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [docsLoading, setDocsLoading] = useState(true)
  const [docSort, setDocSort] = useState({ column: 'createdAt', direction: 'desc' })
  const [docPreviewDialog, setDocPreviewDialog] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [previewDocUrl, setPreviewDocUrl] = useState(null)

  // Form states
  const [bugForm, setBugForm] = useState({ description: '', severity: 'medium', screenId: '', module: '', assignedDeveloperId: '', attachments: [], deadline: '' })
  const [screenForm, setScreenForm] = useState({ title: '', module: '', assigneeId: '', plannedDeadline: '', notes: '' })
  const [milestoneForm, setMilestoneForm] = useState({ milestoneNumber: '', module: '', timeline: '', status: 'Pending' })
  const [documentForm, setDocumentForm] = useState({ title: '', description: '', file: null })


  // Filter states
  const [bugFilters, setBugFilters] = useState(() => {
    const saved = localStorage.getItem(`bugFilters_${id}`)
    return saved ? JSON.parse(saved) : { status: '', severity: '', assignee: '' }
  })

  // Persist bug filters for this specific project
  useEffect(() => {
    localStorage.setItem(`bugFilters_${id}`, JSON.stringify(bugFilters))
  }, [bugFilters, id])

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

  const sortedDocuments = useMemo(() => {
    return [...documentsList].sort((a, b) => {
      const { column, direction } = docSort;
      let valA = a[column];
      let valB = b[column];
      
      if (column === 'createdAt') {
        valA = new Date(valA);
        valB = new Date(valB);
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [documentsList, docSort]);

  const handleDocSort = (column) => {
     setDocSort(prev => ({
       column,
       direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
     }));
   };

   useEffect(() => {
     loadData()
   }, [id])

  /**
   * Centralized error handling for authentication issues
   */
  const handleAuthError = React.useCallback((e) => {
    if (e.message?.includes('Unauthorized') || e.message?.includes('Token expired')) {
      clearToken()
      clearUser()
      nav('/login', { replace: true })
      handleError(new Error('Session expired. Please login again.'))
    } else {
      handleError(e)
    }
  }, [nav])

  /**
   * Fetch all project-related data concurrently
   */
  const loadData = async () => {
    setLoading(true)
    setDocsLoading(true)
    try {
      const [projRes, screensRes, bugsRes, activityRes, milestonesRes, docsRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/projects/${id}`),
        authFetch(`${API_BASE_URL}/projects/${id}/screens`),
        authFetch(`${API_BASE_URL}/projects/${id}/bugs`),
        authFetch(`${API_BASE_URL}/projects/${id}/activity`),
        authFetch(`${API_BASE_URL}/projects/${id}/milestones`),
        authFetch(`${API_BASE_URL}/projects/${id}/documents`)
      ])

      const projData = await handleApiResponse(projRes)
      setProject(projData)
      
      // Initialize edit states
      const startStr = projData.startDate ? new Date(projData.startDate).toISOString().slice(0, 10) : ''
      setProjectStart(startStr)
      setOriginalProjectStart(startStr)
      const endStr = projData.endDate ? new Date(projData.endDate).toISOString().slice(0, 10) : ''
      setProjectEnd(endStr)
      setOriginalProjectEnd(endStr)
      const statusStr = projData.status || ''
      setProjectStatus(statusStr)
      setOriginalProjectStatus(statusStr)

      const screensData = await handleApiResponse(screensRes)
      const bugsData = await handleApiResponse(bugsRes)
      const activityData = await handleApiResponse(activityRes)
      const milestonesData = await handleApiResponse(milestonesRes)
      const docsData = await handleApiResponse(docsRes)

      setScreensList(Array.isArray(screensData) ? screensData : [])
      setBugsList(Array.isArray(bugsData) ? bugsData : [])
      setActivityList(Array.isArray(activityData) ? activityData : [])
      setMilestonesList(Array.isArray(milestonesData) ? milestonesData : [])
      setDocumentsList(Array.isArray(docsData) ? docsData : [])
      setDocsLoading(false)
    } catch (e) {
      handleAuthError(e)
    } finally {
      setLoading(false)
      setDocsLoading(false)
    }
  }

  const handleUploadDocument = async () => {
    if (!documentForm.title || !documentForm.file) {
      toast.error('Title and file are required');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const form = new FormData();
      form.append('title', documentForm.title);
      if (documentForm.description) form.append('description', documentForm.description);
      form.append('file', documentForm.file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/projects/${id}/documents`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          setDocumentsList([data, ...documentsList]);
          setDocumentDialog(false);
          setDocumentForm({ title: '', description: '', file: null });
          toast.success('Document uploaded successfully');
        } else {
          let errorMsg = 'Failed to upload document';
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMsg = errorData.error || errorMsg;
          } catch (e) {}
          toast.error(errorMsg);
        }
        setUploading(false);
      };

      xhr.onerror = () => {
        toast.error('Network error during upload');
        setUploading(false);
      };

      xhr.send(form);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to process file');
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    const doc = documentsList.find(d => d.id === docId);
    if (!window.confirm(`Are you sure you want to delete "${doc?.title || 'this document'}"?`)) return;
    
    try {
      const res = await authFetch(`${API_BASE_URL}/documents/${docId}?projectId=${id}&title=${encodeURIComponent(doc?.title || '')}`, {
        method: 'DELETE'
      });
      await handleApiResponse(res);
      setDocumentsList(documentsList.filter(d => d.id !== docId));
      toast.success('Document deleted successfully');
    } catch (error) {
      handleError(error);
    }
  };

  const handleDownloadDocument = (doc) => {
    (async () => {
      try {
        const apiOrigin = API_BASE_URL.replace(/\/api$/, '');
        const url = `${apiOrigin}${doc.downloadUrl || ''}`;
        const res = await authFetch(url, { method: 'GET' });
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = doc.fileName || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      } catch (e) {
        handleError(e);
      }
    })();
  };

  const handleViewDocument = async (doc) => {
    setPreviewDoc(doc);
    setPreviewDocUrl(null);
    setDocPreviewDialog(true);

    // If it's an image, fetch a signed blob via auth and preview safely.
    try {
      if (doc.fileType?.startsWith('image/') && doc.downloadUrl) {
        const apiOrigin = API_BASE_URL.replace(/\/api$/, '');
        const url = `${apiOrigin}${doc.downloadUrl}`;
        const res = await authFetch(url, { method: 'GET' });
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        setPreviewDocUrl(objectUrl);
      }
    } catch (e) {
      console.warn('Failed to load preview:', e);
    }
    
    // Log view activity to server
    try {
      await authFetch(`${API_BASE_URL}/documents/${doc.id}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, title: doc.title })
      });
    } catch (e) {
      console.warn('Failed to log document view:', e);
    }
  };

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
      await handleApiResponse(res)
      
      setBugForm({ description: '', severity: 'medium', screenId: '', module: '', assignedDeveloperId: '', attachments: [], deadline: '' })
      setBugDialog(false)
      loadData()
    } catch (e) {
      handleAuthError(e)
    }
  }

  const openBugEdit = (bug) => {
    setBugEditId(bug.id)
    const deadlineStr = bug.deadline ? new Date(bug.deadline).toISOString().slice(0, 10) : ''
    setBugEditDeadline(deadlineStr)
    setBugEditOriginalDeadline(deadlineStr)
    setBugEditDialog(true)
  }

  const handleSaveBugDeadline = async () => {
    if (!bugEditId) return
    
    if (bugEditDeadline === bugEditOriginalDeadline) {
      console.info('[ProjectPage] No changes detected in bug deadline');
      toast('No changes detected', {
        icon: 'ℹ️',
        style: {
          background: '#f0f9ff',
          color: '#0369a1',
          border: '1px solid #bae6fd',
        }
      })
      setBugEditDialog(false)
      return
    }

    try {
      const res = await authFetch(`${API_BASE_URL}/bugs/${bugEditId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadline: bugEditDeadline || null })
      })
      await handleApiResponse(res)
      setBugEditDialog(false)
      setBugEditId(null)
      setBugEditDeadline('')
      loadData()
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
      await handleApiResponse(res)
      loadData()
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
      await handleApiResponse(res)
      loadData()
    } catch (e) {
      handleAuthError(e)
    }
  }

  const handleAddScreen = async () => {
    if (!screenForm.title) return
    try {
      if (editingScreen) {
        // Check for changes
        const hasChanges = 
          screenForm.title !== (editingScreen.title || '') ||
          screenForm.module !== (editingScreen.module || '') ||
          screenForm.assigneeId !== (editingScreen.assigneeId || '') ||
          screenForm.plannedDeadline !== (editingScreen.plannedDeadline ? new Date(editingScreen.plannedDeadline).toISOString().slice(0, 10) : '') ||
          screenForm.notes !== (editingScreen.notes || '');

        if (!hasChanges) {
            console.info('[ProjectPage] No changes detected in screen form');
            toast('No changes detected', {
            icon: 'ℹ️',
            style: {
              background: '#f0f9ff',
              color: '#0369a1',
              border: '1px solid #bae6fd',
            }
          })
          setEditingScreen(null)
          setScreenDialog(false)
          setScreenForm({ title: '', module: '', assigneeId: '', plannedDeadline: '', notes: '' })
          return
        }

        const res = await authFetch(`${API_BASE_URL}/screens/${editingScreen.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(screenForm)
        })
        await handleApiResponse(res)
        setEditingScreen(null)
      } else {
        const res = await authFetch(`${API_BASE_URL}/projects/${id}/screens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(screenForm)
        })
        await handleApiResponse(res)
      }
      setScreenForm({ title: '', module: '', assigneeId: '', plannedDeadline: '', notes: '' })
      setScreenDialog(false)
      loadData()
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
    const deadlineStr = s.plannedDeadline ? new Date(s.plannedDeadline).toISOString().slice(0, 10) : ''
    setScreenEditDeadlineValue(deadlineStr)
    setScreenEditDeadlineOriginalValue(deadlineStr)
    setScreenEditDeadlineDialog(true)
  }

  const handleSaveScreenDeadline = async () => {
    if (!screenEditDeadlineId) return

    if (screenEditDeadlineValue === screenEditDeadlineOriginalValue) {
      console.info('[ProjectPage] No changes detected in screen deadline');
      toast('No changes detected', {
        icon: 'ℹ️',
        style: {
          background: '#f0f9ff',
          color: '#0369a1',
          border: '1px solid #bae6fd',
        }
      })
      setScreenEditDeadlineDialog(false)
      setScreenEditDeadlineId(null)
      return
    }

    try {
      const res = await authFetch(`${API_BASE_URL}/screens/${screenEditDeadlineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plannedDeadline: screenEditDeadlineValue || null })
      })
      await handleApiResponse(res)
      setScreenEditDeadlineDialog(false)
      setScreenEditDeadlineId(null)
      setScreenEditDeadlineValue('')
      loadData()
    } catch (e) {
      handleAuthError(e)
    }
  }

  const handleUpdateProjectSettings = async () => {
    // Check for changes
    if (projectStart === originalProjectStart && 
        projectEnd === originalProjectEnd && 
        projectStatus === originalProjectStatus) {
      console.info('[ProjectPage] No changes detected in project settings');
      toast('No changes detected', {
        icon: 'ℹ️',
        style: {
          background: '#f0f9ff',
          color: '#0369a1',
          border: '1px solid #bae6fd',
        }
      })
      return
    }

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
      await handleApiResponse(res)
      loadData()
    } catch (e) {
      handleAuthError(e)
    }
  }

  const handleDeleteBug = async (bugId) => {
    if (!window.confirm('Delete this bug?')) return
    try {
      const res = await authFetch(`${API_BASE_URL}/bugs/${bugId}`, { method: 'DELETE' })
      await handleApiResponse(res)
      loadData()
    } catch (e) {
      handleAuthError(e)
    }
  }

  const handleDeleteScreen = async (screenId) => {
    if (!window.confirm('Delete this screen?')) return
    try {
      const res = await authFetch(`${API_BASE_URL}/screens/${screenId}`, { method: 'DELETE' })
      await handleApiResponse(res)
      loadData()
    } catch (e) {
      handleAuthError(e)
    }
  }

  const handleAddMilestone = async () => {
    if (!milestoneForm.milestoneNumber) return
    try {
      if (editingMilestone) {
        // Check for changes
        const milestoneTimeline = editingMilestone.timeline ? new Date(editingMilestone.timeline).toISOString().slice(0, 10) : '';
        const hasChanges = 
          milestoneForm.milestoneNumber !== (editingMilestone.milestoneNumber || '') ||
          milestoneForm.module !== (editingMilestone.module || '') ||
          milestoneForm.timeline !== milestoneTimeline ||
          milestoneForm.status !== (editingMilestone.status || 'Pending');

        if (!hasChanges) {
          console.info('[ProjectPage] No changes detected in milestone form');
          toast('No changes detected', {
            icon: 'ℹ️',
            style: {
              background: '#f0f9ff',
              color: '#0369a1',
              border: '1px solid #bae6fd',
            }
          })
          setEditingMilestone(null)
          setMilestoneDialog(false)
          setMilestoneForm({ milestoneNumber: '', module: '', timeline: '', status: 'Pending' })
          return
        }

        const res = await authFetch(`${API_BASE_URL}/milestones/${editingMilestone.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(milestoneForm)
        })
        await handleApiResponse(res)
      } else {
        const res = await authFetch(`${API_BASE_URL}/projects/${id}/milestones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(milestoneForm)
        })
        await handleApiResponse(res)
      }
      setMilestoneForm({ milestoneNumber: '', module: '', timeline: '', status: 'Pending' })
      setMilestoneDialog(false)
      setEditingMilestone(null)
      loadData()
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
      await handleApiResponse(res)
      loadData()
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
    <PageContainer>
    <div className="container-fluid py-4">
      {/* Breadcrumbs */}
      <nav className="mb-6 px-4">
        <ol className="flex flex-wrap pt-1 mr-12 bg-transparent rounded-lg sm:mr-16">
          <li className="leading-normal text-sm">
            <Link className="opacity-50 text-slate-700 font-medium" to="/dashboard">Pages</Link>
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
                    {['Overview', 'Screens', 'Milestones', 'Bugs', 'Activity', 'Project Docs'].map((tab, idx) => (
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
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
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
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
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
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
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

              {tabIndex === 5 && (
                <div className="animate-fadeIn">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                    <div>
                      <h6 className="font-bold text-slate-700 uppercase text-xs tracking-wider mb-1">Project Documents</h6>
                      <p className="text-xs text-slate-500">Manage and share project-related files and documentation.</p>
                    </div>
                    <button 
                      onClick={() => setDocumentDialog(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 font-bold text-center text-white uppercase align-middle transition-all bg-gradient-to-tl from-purple-700 to-pink-500 rounded-xl cursor-pointer text-xs shadow-soft-md hover:shadow-soft-lg active:opacity-85"
                    >
                      <Plus size={16} strokeWidth={3} />
                      Upload Document
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full mb-0 align-top border-collapse border-spacing-0 text-slate-500">
                      <thead className="align-bottom">
                        <tr>
                          <th 
                            className="px-6 py-3 font-bold text-left uppercase align-middle bg-transparent border-b border-slate-100 shadow-none text-[10px] tracking-wider opacity-70 text-slate-700 cursor-pointer hover:text-fuchsia-600 transition-colors"
                            onClick={() => handleDocSort('title')}
                          >
                            <div className="flex items-center gap-1">
                              Document
                              {docSort.column === 'title' && (docSort.direction === 'asc' ? '↑' : '↓')}
                            </div>
                          </th>
                          <th className="px-6 py-3 font-bold text-left uppercase align-middle bg-transparent border-b border-slate-100 shadow-none text-[10px] tracking-wider opacity-70 text-slate-700">Description</th>
                          <th 
                            className="px-6 py-3 font-bold text-center uppercase align-middle bg-transparent border-b border-slate-100 shadow-none text-[10px] tracking-wider opacity-70 text-slate-700 cursor-pointer hover:text-fuchsia-600 transition-colors"
                            onClick={() => handleDocSort('createdAt')}
                          >
                            <div className="flex items-center justify-center gap-1">
                              Uploaded Date
                              {docSort.column === 'createdAt' && (docSort.direction === 'asc' ? '↑' : '↓')}
                            </div>
                          </th>
                          <th className="px-6 py-3 font-bold text-center uppercase align-middle bg-transparent border-b border-slate-100 shadow-none text-[10px] tracking-wider opacity-70 text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {docsLoading ? (
                          // Skeleton Loading
                          [...Array(3)].map((_, i) => (
                            <tr key={i} className="animate-pulse">
                              <td className="p-4 border-b border-slate-50">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                                  <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-100 rounded w-24"></div>
                                    <div className="h-3 bg-slate-100 rounded w-32"></div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 border-b border-slate-50">
                                <div className="h-4 bg-slate-100 rounded w-full max-w-xs"></div>
                              </td>
                              <td className="p-4 border-b border-slate-50">
                                <div className="h-4 bg-slate-100 rounded w-16 mx-auto"></div>
                              </td>
                              <td className="p-4 border-b border-slate-50">
                                <div className="flex justify-center gap-2">
                                  <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
                                  <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : sortedDocuments.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="p-12 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                                  <FileText size={32} />
                                </div>
                                <p className="text-sm font-bold text-slate-400">No documents found for this project</p>
                                <p className="text-xs text-slate-400 mt-1">Upload files to share them with the team.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          sortedDocuments.map((doc) => (
                            <tr key={doc.id} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 align-middle bg-transparent border-b border-slate-50 shadow-none">
                                <div className="flex px-2 py-1">
                                  <div className="flex items-center justify-center w-10 h-10 mr-4 text-white rounded-xl bg-gradient-to-tl from-blue-600 to-cyan-400 shadow-soft-sm">
                                    <FileText size={18} />
                                  </div>
                                  <div className="flex flex-col justify-center">
                                    <h6 className="mb-0 text-sm font-bold leading-normal text-slate-700">{doc.title}</h6>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{doc.fileType?.split('/')[1] || 'FILE'}</span>
                                      <span className="text-[10px] text-slate-300">•</span>
                                      <span className="text-[10px] font-bold text-slate-400">{formatFileSize(doc.fileSize)}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 align-middle bg-transparent border-b border-slate-50 shadow-none">
                                <p className="mb-0 text-xs font-bold text-slate-600 max-w-xs truncate" title={doc.description}>{doc.description || 'No description'}</p>
                              </td>
                              <td className="p-4 text-center align-middle bg-transparent border-b border-slate-50 shadow-none">
                                <span className="text-xs font-bold text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</span>
                              </td>
                              <td className="p-4 text-center align-middle bg-transparent border-b border-slate-50 shadow-none">
                                <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleViewDocument(doc)}
                                    className="p-2 rounded-lg hover:bg-white hover:shadow-soft-md text-slate-400 hover:text-fuchsia-600 transition-all"
                                    title="View Document"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadDocument(doc)}
                                    className="p-2 rounded-lg hover:bg-white hover:shadow-soft-md text-slate-400 hover:text-blue-600 transition-all"
                                    title="Download Document"
                                  >
                                    <Download size={16} />
                                  </button>
                                  {user?.role === 'admin' && (
                                    <button
                                      onClick={() => handleDeleteDocument(doc.id)}
                                      className="p-2 rounded-lg hover:bg-white hover:shadow-soft-md text-slate-400 hover:text-red-600 transition-all"
                                      title="Delete Document"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Document Upload Modal */}
      <Modal
        isOpen={documentDialog}
        title="Upload Project Document"
        onClose={() => setDocumentDialog(false)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDocumentDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleUploadDocument} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <InputGroup 
            label="Document Title" 
            placeholder="e.g., Project Specification"
            value={documentForm.title} 
            onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })} 
          />
          <div className="flex flex-col gap-1">
            <label className="ml-1 font-bold text-xs text-slate-700 uppercase tracking-wider">Description</label>
            <textarea
              className="p-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition-all min-h-[100px]"
              placeholder="Brief description of the document..."
              value={documentForm.description}
              onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="ml-1 font-bold text-xs text-slate-700 uppercase tracking-wider">File</label>
            <div className="relative group">
              <input
                type="file"
                className="hidden"
                id="doc-file-upload"
                onChange={(e) => setDocumentForm({ ...documentForm, file: e.target.files[0] })}
              />
              <label
                htmlFor="doc-file-upload"
                className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-fuchsia-400 transition-all group"
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mb-3 group-hover:bg-fuchsia-50 group-hover:text-fuchsia-500 transition-all">
                    <Upload size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-600 mb-1">
                    {documentForm.file ? documentForm.file.name : 'Click to select a file'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {documentForm.file ? formatFileSize(documentForm.file.size) : 'Any document or archive format'}
                  </p>
                </div>
              </label>
            </div>
          </div>
          {uploading && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Uploading...</span>
                <span className="text-[10px] font-bold text-fuchsia-600">{uploadProgress}%</span>
              </div>
              <ProgressBar value={uploadProgress} max={100} showLabel={false} gradient="from-purple-700 to-pink-500" />
            </div>
          )}
        </div>
      </Modal>

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

      {/* Project Document Preview Modal */}
      <Modal
        isOpen={docPreviewDialog}
        title={previewDoc?.title || 'Document Preview'}
        onClose={() => {
          if (previewDocUrl) URL.revokeObjectURL(previewDocUrl);
          setPreviewDocUrl(null);
          setDocPreviewDialog(false);
        }}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => {
              if (previewDocUrl) URL.revokeObjectURL(previewDocUrl);
              setPreviewDocUrl(null);
              setDocPreviewDialog(false);
            }}>Close</Button>
            <Button size="sm" onClick={() => handleDownloadDocument(previewDoc)}>
              <Download size={14} className="mr-2" /> Download
            </Button>
          </>
        }
      >
        {previewDoc && (
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-soft-md shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <h6 className="text-slate-800 font-bold mb-1">{previewDoc.title}</h6>
                <p className="text-xs text-slate-500 mb-0">{previewDoc.fileName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge gradient="from-slate-600 to-slate-300" size="sm">{previewDoc.fileType || 'Unknown Type'}</Badge>
                  <Badge gradient="from-blue-600 to-cyan-400" size="sm">{formatFileSize(previewDoc.fileSize)}</Badge>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</p>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl text-sm text-slate-600 leading-relaxed shadow-soft-sm">
                {previewDoc.description || <span className="italic opacity-50">No description provided for this document.</span>}
              </div>
            </div>

            {/* File Preview if possible */}
            <div className="border-t border-slate-100 pt-6">
              {previewDoc.fileType?.startsWith('image/') ? (
                <div className="flex justify-center p-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <img 
                    src={previewDocUrl || ''} 
                    alt={previewDoc.title} 
                    className="max-w-full max-h-[400px] rounded-xl shadow-soft-lg object-contain" 
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-slate-300 mb-4 shadow-soft-sm">
                    <FileText size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-500 mb-1">Preview not available for this file type</p>
                  <p className="text-xs text-slate-400 mb-4">Please download the file to view its content</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Uploaded By</p>
                <p className="text-xs font-bold text-slate-700">{previewDoc.createdBy || 'System'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Upload Date</p>
                <p className="text-xs font-bold text-slate-700">{new Date(previewDoc.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
    </PageContainer>
  )
}

