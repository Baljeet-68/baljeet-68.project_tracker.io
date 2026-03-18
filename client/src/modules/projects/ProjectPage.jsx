/**
 * @file ProjectPage.jsx
 * @description Main project detail page - clean modular refactor
 * Handles tab logic, dialog states, and API calls
 */

import React, { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader } from '../../components/Loader'
import { handleError, handleApiResponse } from '../../utils/errorHandler'
import { authFetch, getUser, getToken, clearToken, clearUser } from '../../auth'
import { API_BASE_URL } from '../../apiConfig'
import toast from 'react-hot-toast'
import PageContainer from '../../components/layout/PageContainer'
import { Card, CardHeader, CardBody } from '../../components/TailAdminComponents'
import { useTaskCount } from '../../context/TaskCountContext'

// Import hooks and utilities
import { useProjectData } from './hooks/useProjectData'
import {
    OverviewTab,
    MilestonesTab,
    ScreensTab,
    TasksTab,
    BugsTab,
    DocumentsTab,
    ActivityTab
} from './tabs'
import { ProjectHeader } from './ProjectHeader'
import { BugDialog, MilestoneDialog, ScreenDialog, DocumentDialog } from './dialogs'
import { TABS, TAB_LIST } from './utils/constants'

export default function ProjectPage() {
    const { id } = useParams()
    const nav = useNavigate()
    const user = getUser()
    const { refreshTaskCount } = useTaskCount()

    // Main data hook
    const {
        project,
        screens,
        bugs,
        milestones,
        documents,
        activity,
        tasks,
        loading,
        error,
        refetch,
        setScreens,
        setBugs,
        setMilestones,
        setDocuments,
        setActivity,
        setTasks
    } = useProjectData(id)

    // Tab state
    const [activeTab, setActiveTab] = useState(TABS.OVERVIEW)

    // Dialog states
    const [bugDialogOpen, setBugDialogOpen] = useState(false)
    const [editingBug, setEditingBug] = useState(null)
    const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false)
    const [editingMilestone, setEditingMilestone] = useState(null)
    const [screenDialogOpen, setScreenDialogOpen] = useState(false)
    const [editingScreen, setEditingScreen] = useState(null)

    const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [docSearchQuery, setDocSearchQuery] = useState('')

    /**
     * BUG HANDLERS
     */
    const handleAddBug = () => {
        setEditingBug(null)
        setBugDialogOpen(true)
    }

    const handleEditBug = (bug) => {
        setEditingBug(bug)
        setBugDialogOpen(true)
    }

    const handleSubmitBug = async (form) => {
        try {
            if (editingBug) {
                const res = await authFetch(`${API_BASE_URL}/bugs/${editingBug.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                })
                await handleApiResponse(res)
                toast.success('Bug updated successfully')
            } else {
                const res = await authFetch(`${API_BASE_URL}/projects/${id}/bugs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                })
                await handleApiResponse(res)
                toast.success('Bug reported successfully')
            }
            setBugDialogOpen(false)
            setEditingBug(null)
            refetch()
            refreshTaskCount()
        } catch (err) {
            handleError(err)
        }
    }

    const handleUpdateBugStatus = async (bugId, status) => {
        try {
            const res = await authFetch(`${API_BASE_URL}/bugs/${bugId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })
            await handleApiResponse(res)
            toast.success('Status updated')
            refetch()
            refreshTaskCount()
        } catch (err) {
            handleError(err)
        }
    }

    const handleDeleteBug = async (bugId) => {
        if (!window.confirm('Delete this bug? This action cannot be undone.')) return
        try {
            const res = await authFetch(`${API_BASE_URL}/bugs/${bugId}`, {
                method: 'DELETE'
            })
            await handleApiResponse(res)
            toast.success('Bug deleted')
            refetch()
        } catch (err) {
            handleError(err)
        }
    }

    /**
     * SCREEN HANDLERS
     */
    const handleAddScreen = () => {
        setEditingScreen(null)
        setScreenDialogOpen(true)
    }

    const handleEditScreen = (screen) => {
        setEditingScreen(screen)
        setScreenDialogOpen(true)
    }

    const handleSubmitScreen = async (form) => {
        try {
            if (editingScreen) {
                const res = await authFetch(`${API_BASE_URL}/screens/${editingScreen.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                })
                await handleApiResponse(res)
                toast.success('Screen updated successfully')
            } else {
                const res = await authFetch(`${API_BASE_URL}/projects/${id}/screens`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                })
                await handleApiResponse(res)
                toast.success('Screen added successfully')
            }
            setScreenDialogOpen(false)
            setEditingScreen(null)
            refetch()
            refreshTaskCount()
        } catch (err) {
            handleError(err)
        }
    }

    const handleUpdateScreenStatus = async (screenId, status) => {
        try {
            const res = await authFetch(`${API_BASE_URL}/screens/${screenId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })
            await handleApiResponse(res)
            toast.success('Status updated')
            refetch()
            refreshTaskCount()
        } catch (err) {
            handleError(err)
        }
    }

    const handleDeleteScreen = async (screenId) => {
        if (!window.confirm('Delete this screen? This action cannot be undone.')) return
        try {
            const res = await authFetch(`${API_BASE_URL}/screens/${screenId}`, {
                method: 'DELETE'
            })
            await handleApiResponse(res)
            toast.success('Screen deleted')
            refetch()
        } catch (err) {
            handleError(err)
        }
    }

    /**
     * MILESTONE HANDLERS
     */
    const handleAddMilestone = () => {
        setEditingMilestone(null)
        setMilestoneDialogOpen(true)
    }

    const handleEditMilestone = (milestone) => {
        setEditingMilestone(milestone)
        setMilestoneDialogOpen(true)
    }

    const handleSubmitMilestone = async (form) => {
        try {
            if (editingMilestone) {
                const res = await authFetch(`${API_BASE_URL}/milestones/${editingMilestone.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                })
                await handleApiResponse(res)
                toast.success('Milestone updated successfully')
            } else {
                const res = await authFetch(`${API_BASE_URL}/projects/${id}/milestones`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...form, projectId: id })
                })
                await handleApiResponse(res)
                toast.success('Milestone created successfully')
            }
            setMilestoneDialogOpen(false)
            setEditingMilestone(null)
            refetch()
        } catch (err) {
            handleError(err)
        }
    }

    const handleDeleteMilestone = async (milestoneId) => {
        if (!window.confirm('Delete this milestone? This action cannot be undone.')) return
        try {
            const res = await authFetch(`${API_BASE_URL}/milestones/${milestoneId}`, {
                method: 'DELETE'
            })
            await handleApiResponse(res)
            toast.success('Milestone deleted')
            refetch()
        } catch (err) {
            handleError(err)
        }
    }

    /**
     * DOCUMENT HANDLERS
     */
    const handleUploadDocument = async (form) => {
        try {
            setIsUploading(true)
            setUploadProgress(0)

            const formData = new FormData()
            formData.append('title', form.title)
            if (form.description) formData.append('description', form.description)
            formData.append('file', form.file)

            const xhr = new XMLHttpRequest()
            xhr.open('POST', `${API_BASE_URL}/projects/${id}/documents`, true)
            const token = getToken()
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`)
            }

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100)
                    setUploadProgress(percent)
                }
            }

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    toast.success('Document uploaded successfully')
                    setDocumentDialogOpen(false)
                    setIsUploading(false)
                    setUploadProgress(0)
                    refetch()
                } else {
                    const errMsg = JSON.parse(xhr.responseText).error || 'Upload failed'
                    toast.error(errMsg)
                    setIsUploading(false)
                }
            }

            xhr.onerror = () => {
                toast.error('Network error during upload')
                setIsUploading(false)
            }

            xhr.send(formData)
        } catch (err) {
            handleError(err)
            setIsUploading(false)
        }
    }

    const handleDeleteDocument = async (docId) => {
        if (!window.confirm('Delete this document? This action cannot be undone.')) return
        try {
            const res = await authFetch(`${API_BASE_URL}/documents/${docId}`, {
                method: 'DELETE'
            })
            await handleApiResponse(res)
            toast.success('Document deleted')
            refetch()
        } catch (err) {
            handleError(err)
        }
    }

    const handleDownloadDocument = async (doc) => {
        try {
            const apiOrigin = API_BASE_URL.replace(/\/api$/, '')
            const url = `${apiOrigin}${doc.downloadUrl}`
            const res = await authFetch(url, { method: 'GET' })
            const blob = await res.blob()
            const objectUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = objectUrl
            link.download = doc.fileName || 'document'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(objectUrl)
        } catch (err) {
            handleError(err)
        }
    }

    const handlePreviewDocument = (doc) => {
        toast.promise(
            (async () => {
                // Can implement in-modal preview here
                await handleDownloadDocument(doc)
            })(),
            {
                success: 'Document preview opened',
                error: 'Failed to open preview'
            }
        )
    }

    if (loading) {
        return (
            <PageContainer>
                <div className="flex items-center justify-center h-96">
                    <Loader />
                </div>
            </PageContainer>
        )
    }

    if (error) {
        return (
            <PageContainer>
                <div className="text-center py-12">
                    <p className="text-red-600 font-semibold">{error}</p>
                    <button onClick={() => refetch()} className="text-indigo-600 mt-4 underline">
                        Try again
                    </button>
                </div>
            </PageContainer>
        )
    }

    if (!project) {
        return (
            <PageContainer>
                <div className="text-center py-12">
                    <p className="text-slate-600">Project not found</p>
                </div>
            </PageContainer>
        )
    }

    return (
        <PageContainer>
            <div className="space-y-6">
                {/* Project Header */}
                <ProjectHeader project={project} screenshots={screens} bugs={bugs} />

                {/* Tabs */}
                <Card>
                    <CardHeader className="pb-0">
                        <ul className="flex flex-wrap p-1 list-none bg-gray-50 rounded-xl" role="tablist">
                            {TAB_LIST.map(tab => (
                                <li key={tab.key} className="flex-auto text-center">
                                    <button
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`z-30 block w-full px-4 py-2 mb-0 transition-all border-0 rounded-lg cursor-pointer text-slate-700 bg-inherit text-sm font-bold ${activeTab === tab.key ? 'bg-white shadow-soft-md' : 'opacity-60 hover:opacity-100'}`}
                                        role="tab"
                                        aria-selected={activeTab === tab.key}
                                    >
                                        {tab.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </CardHeader>
                    <CardBody className="p-6">
                        {activeTab === TABS.OVERVIEW && (
                            <OverviewTab
                                project={project}
                                screens={screens}
                                bugs={bugs}
                                milestones={milestones}
                            />
                        )}
                        {activeTab === TABS.MILESTONES && (
                            <MilestonesTab
                                milestones={milestones}
                                onAdd={handleAddMilestone}
                                onEdit={handleEditMilestone}
                                onDelete={handleDeleteMilestone}
                                isLoading={loading}
                            />
                        )}
                        {activeTab === TABS.SCREENS && (
                            <ScreensTab
                                screens={screens}
                                onAdd={handleAddScreen}
                                onEdit={handleEditScreen}
                                onDelete={handleDeleteScreen}
                                onUpdateStatus={handleUpdateScreenStatus}
                                isLoading={loading}
                            />
                        )}



                        {activeTab === TABS.TASKS && (
                            <TasksTab tasks={tasks} isLoading={loading} />
                        )}

                        {activeTab === TABS.BUGS && (
                            <BugsTab
                                bugs={bugs}
                                onAdd={handleAddBug}
                                onEdit={handleEditBug}
                                onDelete={handleDeleteBug}
                                onUpdateStatus={handleUpdateBugStatus}
                                isLoading={loading}
                            />
                        )}

                        {activeTab === TABS.DOCUMENTS && (
                            <DocumentsTab
                                documents={documents}
                                onAdd={() => setDocumentDialogOpen(true)}
                                onDelete={handleDeleteDocument}
                                onDownload={handleDownloadDocument}
                                onPreview={handlePreviewDocument}
                                isLoading={loading}
                                searchQuery={docSearchQuery}
                                onSearchChange={setDocSearchQuery}
                            />
                        )}

                        {activeTab === TABS.ACTIVITY && (
                            <ActivityTab activity={activity} isLoading={loading} />
                        )}
                    </CardBody>
                </Card>

                {/* Dialogs */}
                <BugDialog
                    isOpen={bugDialogOpen}
                    onClose={() => {
                        setBugDialogOpen(false)
                        setEditingBug(null)
                    }}
                    onSubmit={handleSubmitBug}
                    screens={screens}
                    developers={project.developerNames || []}
                    editingBug={editingBug}
                    title={editingBug ? 'Edit Bug' : 'Report New Bug'}
                />

                <ScreenDialog
                    isOpen={screenDialogOpen}
                    onClose={() => {
                        setScreenDialogOpen(false)
                        setEditingScreen(null)
                    }}
                    onSubmit={handleSubmitScreen}
                    developers={project.developerNames || []}
                    editingScreen={editingScreen}
                    title={editingScreen ? 'Edit Screen' : 'Add New Screen'}
                />

                <MilestoneDialog
                    isOpen={milestoneDialogOpen}
                    onClose={() => {
                        setMilestoneDialogOpen(false)
                        setEditingMilestone(null)
                    }}
                    onSubmit={handleSubmitMilestone}
                    editingMilestone={editingMilestone}
                    screens={screens}
                    title={editingMilestone ? 'Edit Milestone' : 'Create Milestone'}
                />

                <DocumentDialog
                    isOpen={documentDialogOpen}
                    onClose={() => {
                        setDocumentDialogOpen(false)
                        setIsUploading(false)
                        setUploadProgress(0)
                    }}
                    onSubmit={handleUploadDocument}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                />
            </div>
        </PageContainer>
    )
}
