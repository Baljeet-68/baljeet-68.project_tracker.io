import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { handleError, handleApiResponse } from '../utils/errorHandler'
import { authFetch, getUser } from '../auth'
import { API_BASE_URL } from '../apiConfig'
import toast from 'react-hot-toast'
import PageContainer from '../components/layout/PageContainer'
import { Card, CardHeader, CardBody } from '../components/TailAdminComponents'
import { useTaskCount } from '../context/TaskCountContext'

import { useProjectData } from '../modules/projects/hooks/useProjectData'
import {
    OverviewTab,
    MilestonesTab,
    ScreensTab,
    TasksTab,
    BugsTab,
    DocumentsTab,
    ActivityTab
} from '../modules/projects/tabs'
import { ProjectHeader } from '../modules/projects/ProjectHeader'
import { BugDialog, MilestoneDialog, ScreenDialog, DocumentDialog } from '../modules/projects/dialogs'
import { TABS, TAB_LIST } from '../modules/projects/utils/constants'

export default function ECommerceProjectPage() {
    const { id } = useParams()
    const nav = useNavigate()
    const user = getUser()
    const { refreshTaskCount } = useTaskCount()

    const {
        project, screens, bugs, milestones, documents, activity, tasks,
        loading, error, refetch, setScreens, setBugs, setMilestones, setDocuments, setActivity, setTasks
    } = useProjectData(id, true)

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

    if (loading) return <PageContainer><div className="flex items-center justify-center h-96"><Loader /></div></PageContainer>
    if (error) return <PageContainer><div className="text-center py-12"><p className="text-red-600">{error}</p></div></PageContainer>
    if (!project) return <PageContainer><div className="text-center py-12"><p className="text-slate-600">Project not found</p></div></PageContainer>

    return (
        <PageContainer>
            <div className="space-y-6">
                <ProjectHeader project={project} screenshots={screens} bugs={bugs} />
                <Card>
                    <CardHeader className="pb-0">
                        <ul className="flex flex-wrap p-1 list-none bg-gray-50 rounded-xl" role="tablist">
                            {TAB_LIST.map(tab => (
                                <li key={tab.key} className="flex-auto text-center">
                                    <button
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`z-30 block w-full px-4 py-2 mb-0 transition-all border-0 rounded-lg cursor-pointer text-slate-700 bg-inherit text-sm font-bold ${activeTab === tab.key ? 'bg-white shadow-soft-md' : 'opacity-60 hover:opacity-100'}`}
                                    >
                                        {tab.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </CardHeader>
                    <CardBody className="p-6">
                        {activeTab === TABS.OVERVIEW && <OverviewTab project={project} screens={screens} bugs={bugs} milestones={milestones} />}
                        {activeTab === TABS.MILESTONES && <MilestonesTab milestones={milestones} isLoading={loading} />}
                        {activeTab === TABS.SCREENS && <ScreensTab screens={screens} isLoading={loading} onUpdateStatus={handleUpdateScreenStatus} />}
                        {activeTab === TABS.TASKS && <TasksTab tasks={tasks} isLoading={loading} />}
                        {activeTab === TABS.BUGS && <BugsTab bugs={bugs} isLoading={loading} onUpdateStatus={handleUpdateBugStatus} />}
                        {activeTab === TABS.DOCUMENTS && <DocumentsTab documents={documents} isLoading={loading} />}
                        {activeTab === TABS.ACTIVITY && <ActivityTab activity={activity} isLoading={loading} />}
                    </CardBody>
                </Card>
            </div>
        </PageContainer>
    )
}
