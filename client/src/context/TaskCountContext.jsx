import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authFetch } from '../auth'
import { API_BASE_URL } from '../apiConfig'
import { handleApiResponse } from '../utils/errorHandler'

const TaskCountContext = createContext()

export function TaskCountProvider({ children }) {
  const [taskCount, setTaskCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const refreshTaskCount = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/tasks/count`)
      const data = await handleApiResponse(res)
      setTaskCount(data.total || 0)
    } catch (error) {
      console.error('Failed to fetch task count:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshTaskCount()
  }, [refreshTaskCount])

  return (
    <TaskCountContext.Provider value={{ taskCount, refreshTaskCount, loading }}>
      {children}
    </TaskCountContext.Provider>
  )
}

export function useTaskCount() {
  const context = useContext(TaskCountContext)
  if (!context) {
    throw new Error('useTaskCount must be used within a TaskCountProvider')
  }
  return context
}
