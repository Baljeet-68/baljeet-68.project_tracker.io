/**
 * @file useProjectData.js
 * @description Custom hook to fetch project data with loading and error states
 */

import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../../../auth'
import { API_BASE_URL } from '../../../apiConfig'
import { handleApiResponse } from '../../../utils/errorHandler'

export function useProjectData(projectId, isEcommerce = false) {
    const [project, setProject] = useState(null)
    const [screens, setScreens] = useState([])
    const [bugs, setBugs] = useState([])
    const [milestones, setMilestones] = useState([])
    const [documents, setDocuments] = useState([])
    const [activity, setActivity] = useState([])
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const loadData = useCallback(async (signal) => {
        if (!projectId) return

        setLoading(true)
        setError(null)

        const basePath = isEcommerce ? 'ecommerce-projects' : 'projects'

        try {
            const [projData, screensData, bugsData, milestonesData, docsData, activityData, tasksData] = await Promise.all([
                authFetch(`${API_BASE_URL}/${basePath}/${projectId}`, { signal }).then(handleApiResponse),
                authFetch(`${API_BASE_URL}/projects/${projectId}/screens`, { signal }).then(handleApiResponse),
                authFetch(`${API_BASE_URL}/projects/${projectId}/bugs`, { signal }).then(handleApiResponse),
                authFetch(`${API_BASE_URL}/projects/${projectId}/milestones`, { signal }).then(handleApiResponse),
                authFetch(`${API_BASE_URL}/projects/${projectId}/documents`, { signal }).then(handleApiResponse),
                authFetch(`${API_BASE_URL}/projects/${projectId}/activity`, { signal }).then(handleApiResponse),
                authFetch(`${API_BASE_URL}/tasks/project/${projectId}`, { signal }).then(handleApiResponse)
            ])

            setProject(projData)
            setScreens(Array.isArray(screensData) ? screensData : [])
            setBugs(Array.isArray(bugsData) ? bugsData : [])
            setMilestones(Array.isArray(milestonesData) ? milestonesData : [])
            setDocuments(Array.isArray(docsData) ? docsData : [])
            setActivity(Array.isArray(activityData) ? activityData : [])
            setTasks(Array.isArray(tasksData) ? tasksData : [])
        } catch (err) {
            if (err.name !== 'AbortError') {
                setError(err.message || 'Failed to load project data')
            }
        } finally {
            setLoading(false)
        }
    }, [projectId])

    useEffect(() => {
        const controller = new AbortController()
        loadData(controller.signal)
        return () => controller.abort()
    }, [projectId, loadData])

    return {
        project,
        screens,
        bugs,
        milestones,
        documents,
        activity,
        tasks,
        loading,
        error,
        refetch: loadData,
        setScreens,
        setBugs,
        setMilestones,
        setDocuments,
        setActivity,
        setTasks
    }
}
