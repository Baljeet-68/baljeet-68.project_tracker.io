/**
 * @file useProjectData.js
 * @description Custom hook to fetch project data with loading and error states
 */

import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../../../auth'
import { API_BASE_URL } from '../../../apiConfig'
import { handleApiResponse } from '../../../utils/errorHandler'

export function useProjectData(projectId) {
    const [project, setProject] = useState(null)
    const [screens, setScreens] = useState([])
    const [bugs, setBugs] = useState([])
    const [milestones, setMilestones] = useState([])
    const [documents, setDocuments] = useState([])
    const [activity, setActivity] = useState([])
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const loadData = useCallback(async () => {
        if (!projectId) return

        setLoading(true)
        setError(null)

        try {
            const [projRes, screensRes, bugsRes, milestonesRes, docsRes, activityRes, tasksRes] = await Promise.all([
                authFetch(`${API_BASE_URL}/projects/${projectId}`),
                authFetch(`${API_BASE_URL}/projects/${projectId}/screens`),
                authFetch(`${API_BASE_URL}/projects/${projectId}/bugs`),
                authFetch(`${API_BASE_URL}/projects/${projectId}/milestones`),
                authFetch(`${API_BASE_URL}/projects/${projectId}/documents`),
                authFetch(`${API_BASE_URL}/projects/${projectId}/activity`),
                authFetch(`${API_BASE_URL}/tasks/project/${projectId}`)
            ])

            const projData = await handleApiResponse(projRes)
            const screensData = await handleApiResponse(screensRes)
            const bugsData = await handleApiResponse(bugsRes)
            const milestonesData = await handleApiResponse(milestonesRes)
            const docsData = await handleApiResponse(docsRes)
            const activityData = await handleApiResponse(activityRes)
            const tasksData = await handleApiResponse(tasksRes)

            setProject(projData)
            setScreens(Array.isArray(screensData) ? screensData : [])
            setBugs(Array.isArray(bugsData) ? bugsData : [])
            setMilestones(Array.isArray(milestonesData) ? milestonesData : [])
            setDocuments(Array.isArray(docsData) ? docsData : [])
            setActivity(Array.isArray(activityData) ? activityData : [])
            setTasks(Array.isArray(tasksData) ? tasksData : [])
        } catch (err) {
            setError(err.message || 'Failed to load project data')
        } finally {
            setLoading(false)
        }
    }, [projectId])

    useEffect(() => {
        loadData()
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
