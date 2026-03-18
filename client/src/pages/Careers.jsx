import React, { useEffect, useState } from 'react'
import { authFetch, getUser } from '../auth'
import { API_BASE_URL } from '../apiConfig'
import { Card, CardHeader, CardBody, Badge, Button, PageHeader } from '../components/TailAdminComponents'
import { Modal, InputGroup, Select, Table, Alert } from '../components/FormComponents'
import { Briefcase, Plus, Edit, Trash2, Users, FileText, MapPin, Clock, DollarSign, Calendar, ArrowLeft } from 'lucide-react'
import { handleError, handleApiResponse } from '../utils/errorHandler'
import { noChangesToastConfig } from '../utils/changeDetection'
import toast from 'react-hot-toast'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import DOMPurify from 'dompurify'
import PageContainer from '../components/layout/PageContainer'

export default function Careers() {
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('jobs') // 'jobs' or 'applications'
  const [view, setView] = useState('list') // 'list' or 'form'
  const [editingApplication, setEditingApplication] = useState(null)
  const [appForm, setAppForm] = useState({
    interviewDate: '',
    interviewerName: '',
    interviewNotes: ''
  })
  const user = getUser()
  const isAdminOrHR = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'hr'

  // Job form state
  const [editingJob, setEditingJob] = useState(null)
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    location: '',
    type: 'Full-time',
    salary: '',
    status: 'active'
  })

  useEffect(() => {
    const controller = new AbortController()
    loadJobs(controller.signal)
    if (isAdminOrHR) {
      loadApplications(controller.signal)
    }
    return () => controller.abort()
  }, [isAdminOrHR])

  const loadJobs = async (signal) => {
    setLoading(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/jobs`, { signal })
      const data = await handleApiResponse(res)
      setJobs(data)
    } catch (e) {
      if (e.name !== 'AbortError') {
        handleError(e)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadApplications = async (signal) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/applications`, { signal })
      const data = await handleApiResponse(res)
      setApplications(data)
    } catch (e) {
      if (e.name !== 'AbortError') {
        handleError(e)
      }
    }
  }

  const handleSaveJob = async () => {
    if (!jobForm.title || !jobForm.description) {
      toast.error('Title and Description are required')
      return
    }

    try {
      if (editingJob) {
        // Check for changes
        const hasChanges = 
          jobForm.title !== (editingJob.title || '') ||
          DOMPurify.sanitize(jobForm.description) !== (editingJob.description || '') ||
          jobForm.location !== (editingJob.location || '') ||
          jobForm.type !== (editingJob.type || 'Full-time') ||
          jobForm.salary !== (editingJob.salary || '') ||
          jobForm.status !== (editingJob.status || 'active');

        if (!hasChanges) {
          if (import.meta.env.DEV) {
            console.info('[Careers] No changes detected for job:', editingJob.id);
          }
          toast('No changes detected', noChangesToastConfig)
          setView('list')
          setEditingJob(null)
          return
        }
      }

      const method = editingJob ? 'PATCH' : 'POST'
      const url = editingJob ? `${API_BASE_URL}/jobs/${editingJob.id}` : `${API_BASE_URL}/jobs`
      
      const payload = { ...jobForm, description: DOMPurify.sanitize(jobForm.description) };

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      await handleApiResponse(res)
      toast.success(editingJob ? 'Job updated' : 'Job posted')
      setView('list')
      setEditingJob(null)
      setJobForm({ title: '', description: '', location: '', type: 'Full-time', salary: '', status: 'active' })
      loadJobs()
    } catch (e) {
      handleError(e)
    }
  }

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Delete this job post?')) return
    try {
      const res = await authFetch(`${API_BASE_URL}/jobs/${id}`, { method: 'DELETE' })
      await handleApiResponse(res)
      toast.success('Job deleted')
      loadJobs()
    } catch (e) {
      handleError(e)
    }
  }

  const handleUpdateApplicationDetails = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/applications/${editingApplication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appForm)
      })
      await handleApiResponse(res)
      toast.success('Application details updated')
      setEditingApplication(null)
      loadApplications()
    } catch (e) {
      handleError(e)
    }
  }

  const handleUpdateJobStatus = async (id, status) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      await handleApiResponse(res)
      toast.success('Status updated')
      loadJobs()
    } catch (e) {
      handleError(e)
    }
  }

  const handleUpdateAppStatus = async (id, status) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      await handleApiResponse(res)
      toast.success('Status updated')
      loadApplications()
    } catch (e) {
      handleError(e)
    }
  }

  const openEditJob = (job) => {
    setEditingJob(job)
    setJobForm({
      title: job.title,
      description: job.description,
      location: job.location || '',
      type: job.type || 'Full-time',
      salary: job.salary || '',
      status: job.status || 'active'
    })
    setView('form')
  }

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'clean']
    ],
  }

  if (!isAdminOrHR) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-slate-500">Only Admin and HR can access this page.</p>
      </div>
    )
  }

  if (view === 'form') {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setView('list'); setEditingJob(null); }}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">{editingJob ? 'Edit Job Post' : 'Post New Job'}</h3>
            <p className="text-sm text-slate-500">Fill in the details for the job opening</p>
          </div>
        </div>

        <Card className="w-full">
          <CardBody className="p-6">
            <div className="flex flex-col gap-6">
              <InputGroup 
                label="Job Title" 
                value={jobForm.title} 
                onChange={(e) => setJobForm({...jobForm, title: e.target.value})} 
                placeholder="e.g. Senior React Developer" 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup 
                  label="Location" 
                  value={jobForm.location} 
                  onChange={(e) => setJobForm({...jobForm, location: e.target.value})} 
                  placeholder="e.g. Remote / Indore" 
                />
                <Select
                  label="Job Type"
                  options={[
                    { value: 'Full-time', label: 'Full-time' },
                    { value: 'Part-time', label: 'Part-time' },
                    { value: 'Contract', label: 'Contract' },
                    { value: 'Internship', label: 'Internship' }
                  ]}
                  value={jobForm.type}
                  onChange={(e) => setJobForm({...jobForm, type: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup 
                  label="Salary Range" 
                  value={jobForm.salary} 
                  onChange={(e) => setJobForm({...jobForm, salary: e.target.value})} 
                  placeholder="e.g. ₹5L - ₹8L" 
                />
                {editingJob && (
                  <Select
                    label="Status"
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                      { value: 'closed', label: 'Closed' }
                    ]}
                    value={jobForm.status}
                    onChange={(e) => setJobForm({...jobForm, status: e.target.value})}
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Job Description</label>
                <div className="quill-wrapper">
                  <ReactQuill 
                    theme="snow"
                    value={jobForm.description}
                    onChange={(content) => setJobForm({...jobForm, description: content})}
                    modules={quillModules}
                    className="bg-white"
                    placeholder="Detail the responsibilities and requirements..."
                  />
                </div>
                <style dangerouslySetInnerHTML={{ __html: `
                  .quill-wrapper .ql-toolbar {
                    border-top-left-radius: 0.75rem;
                    border-top-right-radius: 0.75rem;
                    border-color: #e2e8f0;
                    background-color: #f8fafc;
                  }
                  .quill-wrapper .ql-container {
                    border-bottom-left-radius: 0.75rem;
                    border-bottom-right-radius: 0.75rem;
                    border-color: #e2e8f0;
                    min-height: 250px;
                    font-size: 0.875rem;
                    font-family: inherit;
                  }
                  .quill-wrapper .ql-editor {
                    min-height: 250px;
                  }
                  .quill-wrapper .ql-editor.ql-blank::before {
                    font-style: normal;
                    color: #94a3b8;
                  }
                `}} />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-slate-100">
                <Button variant="secondary" onClick={() => { setView('list'); setEditingJob(null); }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveJob}>
                  {editingJob ? 'Update Job Post' : 'Post Job Opening'}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <PageContainer>
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Career Management"
        subtitle="Post jobs and manage candidate applications"
        actions={activeTab === 'jobs' ? (
          <Button onClick={() => { setEditingJob(null); setJobForm({ title: '', description: '', location: '', type: 'Full-time', salary: '', status: 'active' }); setView('form'); }}>
            <Plus size={18} className="mr-2" /> Post New Job
          </Button>
        ) : null}
      />

      <div className="flex border-b border-gray-200">
        <button
          className={`px-6 py-3 text-sm font-bold transition-all ${activeTab === 'jobs' ? 'border-b-2 border-fuchsia-500 text-fuchsia-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('jobs')}
        >
          <div className="flex items-center gap-2">
            <Briefcase size={16} /> Job Posts
          </div>
        </button>
        <button
          className={`px-6 py-3 text-sm font-bold transition-all ${activeTab === 'applications' ? 'border-b-2 border-fuchsia-500 text-fuchsia-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('applications')}
        >
          <div className="flex items-center gap-2">
            <Users size={16} /> Applications ({applications.length})
          </div>
        </button>
      </div>

      {activeTab === 'jobs' ? (
        <Card>
          {/* <CardHeader>
            <h6 className="font-bold mb-4 text-slate-700 pb-4 uppercase text-xs tracking-wider">Active Job Listings</h6>
          </CardHeader> */}
          <CardBody className="flex-auto p-0" >
            <Table
              columns={[
                { key: 'title', label: 'Job Title' },
                { key: 'location', label: 'Location', render: (val) => val || 'N/A' },
                { key: 'type', label: 'Type' },
                { key: 'status', label: 'Status', render: (val, job) => (
                  <Select
                    containerClassName="mb-0"
                    className="min-w-[120px]"
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                      { value: 'closed', label: 'Closed' }
                    ]}
                    value={val}
                    onChange={(e) => handleUpdateJobStatus(job.id, e.target.value)}
                  />
                )},
                { key: 'createdAt', label: 'Posted Date', render: (val) => new Date(val).toLocaleDateString() },
                { key: 'actions', label: 'Actions', render: (_, job) => (
                  <div className="flex gap-2">
                    <button onClick={() => openEditJob(job)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteJob(job.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              ]}
              data={jobs}
              pagination={true}
              pageSize={10}
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          
          <CardBody className="flex-auto p-0">
            <Table
              columns={[
                { key: 'fullName', label: 'Candidate' },
                { key: 'email', label: 'Email' },
                { key: 'jobId', label: 'Job', render: (jid) => jobs.find(j => j.id === jid)?.title || 'Unknown Job' },
                { key: 'status', label: 'Status', render: (val, app) => (
                  <Select
                    containerClassName="mb-0"
                    className="min-w-[120px]"
                    options={[
                      { value: 'applied', label: 'Applied' },
                      { value: 'reviewing', label: 'Reviewing' },
                      { value: 'shortlisted', label: 'Shortlisted' },
                      { value: 'rejected', label: 'Rejected' },
                      { value: 'hired', label: 'Hired' }
                    ]}
                    value={val}
                    onChange={(e) => handleUpdateAppStatus(app.id, e.target.value)}
                  />
                )},
                { key: 'appliedAt', label: 'Applied On', render: (val) => new Date(val).toLocaleDateString() },
                { key: 'interview', label: 'Interview', render: (_, app) => (
                  app.interviewDate ? (
                    <div className="flex flex-col text-xs">
                      <span className="font-bold text-slate-700">{new Date(app.interviewDate).toLocaleDateString()}</span>
                      <span className="text-slate-500">{app.interviewerName}</span>
                    </div>
                  ) : <span className="text-slate-400 text-xs italic">Not Scheduled</span>
                )},
                { key: 'resume', label: 'Resume', render: (_, app) => (
                  <div className="flex items-center gap-3">
                    {app.resumeUrl ? (
                      <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="text-fuchsia-600 hover:underline flex items-center gap-1.5 font-bold text-xs">
                        <FileText size={14} /> View
                      </a>
                    ) : <span className="text-slate-400 text-xs">No Resume</span>}
                    <button 
                      onClick={() => {
                        setEditingApplication(app)
                        setAppForm({
                          interviewDate: app.interviewDate ? new Date(app.interviewDate).toISOString().split('T')[0] : '',
                          interviewerName: app.interviewerName || '',
                          interviewNotes: app.interviewNotes || ''
                        })
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Update Interview Details"
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                )}
              ]}
              data={applications}
              pagination={true}
              pageSize={10}
            />
          </CardBody>
        </Card>
      )}
    </div>

    <Modal
      isOpen={!!editingApplication}
      onClose={() => setEditingApplication(null)}
      title="Update Application Details"
      size="md"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditingApplication(null)}>Cancel</Button>
          <Button onClick={handleUpdateApplicationDetails}>Save Details</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <InputGroup
          label="Interview Date"
          type="date"
          value={appForm.interviewDate}
          onChange={(e) => setAppForm({ ...appForm, interviewDate: e.target.value })}
        />
        <InputGroup
          label="Interviewer Name"
          placeholder="e.g. Jane Smith"
          value={appForm.interviewerName}
          onChange={(e) => setAppForm({ ...appForm, interviewerName: e.target.value })}
        />
        <InputGroup
          label="Interview Notes"
          as="textarea"
          rows={4}
          placeholder="Enter feedback or internal notes..."
          value={appForm.interviewNotes}
          onChange={(e) => setAppForm({ ...appForm, interviewNotes: e.target.value })}
        />
      </div>
    </Modal>
    </PageContainer>
  )
}
