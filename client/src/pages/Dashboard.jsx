import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch, getUser, clearToken, clearUser } from '../auth'
import { handleError, handleApiResponse } from '../utils/errorHandler'
import { LineChart, BarChart, PieChart, AreaChart, ParetoChart } from '../components/ChartComponents'
import { StatCard, Card, CardHeader, CardBody, Badge } from '../components/TailAdminComponents'
import PageLayout from '../components/layout/PageLayout'
import PageContainer from '../components/layout/PageContainer'
import {
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Users,
  Activity,
  ChevronDown,
  Bug,
  Layout,
  Calendar,
  Clock,
  UserCheck,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  Table,
  Plus,
  Zap,
  ArrowRight,
  ArrowUp,
  Briefcase,
  FileCheck,
  LogOut,
  Sparkles,
  TrendingDown
} from 'lucide-react'
import { API_BASE_URL } from '../apiConfig'
import { Loader } from '../components/Loader'

// role-based dashboards
import AdminDashboard from '../components/dashboard/AdminDashboard'
import DeveloperDashboard from '../components/dashboard/DeveloperDashboard'
import TesterDashboard from '../components/dashboard/TesterDashboard'
import HRDashboard from '../components/dashboard/HRDashboard'
import ManagementDashboard from '../components/dashboard/ManagementDashboard'
import DefaultDashboard from '../components/dashboard/DefaultDashboard'

/**
 * Enhanced Dashboard Component with role-based sub-views
 */
export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const user = getUser()
  const nav = useNavigate()

  const handleAuthError = useCallback((e) => {
    if (e.message?.includes('Unauthorized') || e.message?.includes('Token expired')) {
      clearToken()
      clearUser()
      nav('/login', { replace: true })
      handleError(new Error('Session expired. Please login again.'))
    } else {
      handleError(e)
    }
  }, [nav])

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch(`${API_BASE_URL}/dashboard/summary`)
      const data = await handleApiResponse(res)
      setDashboardData(data)
    } catch (e) {
      handleAuthError(e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [handleAuthError])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  if (loading) {
    return <Loader message="Loading operational dashboard..." />
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-lg font-semibold text-slate-700">Error Loading Dashboard</h2>
            <p className="mt-2 text-slate-500">{error}</p>
            <button
              onClick={loadDashboardData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </PageContainer>
    )
  }

  if (!dashboardData) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Activity className="mx-auto h-12 w-12 text-slate-400" />
            <h2 className="mt-4 text-lg font-semibold text-slate-700">No Dashboard Data</h2>
            <p className="mt-2 text-slate-500">Unable to load dashboard data</p>
          </div>
        </div>
      </PageContainer>
    )
  }

  const {
    systemOverview,
    myWorkSummary,
    bugAnalytics,
    projectHealth,
    developerWorkload,
    leaveOverview,
    recentActivity,
    userRole
  } = dashboardData;

  // choose dashboard component based on role (no hooks)
  let roleComponent = null
  const role = userRole?.toLowerCase()
  switch (role) {
    case 'admin':
      roleComponent = <AdminDashboard dashboardData={dashboardData} />
      break
    case 'developer':
    case 'ecommerce':
      roleComponent = <DeveloperDashboard dashboardData={dashboardData} />
      break
    case 'tester':
      roleComponent = <TesterDashboard dashboardData={dashboardData} />
      break
    case 'hr':
      roleComponent = <HRDashboard dashboardData={dashboardData} />
      break
    case 'management':
      roleComponent = <ManagementDashboard dashboardData={dashboardData} />
      break
    default:
      roleComponent = <DefaultDashboard dashboardData={dashboardData} />
  }

  return (
    <PageContainer>
      <PageLayout
        maxWidth="full"
        title="Operational Dashboard"
        subtitle={<span>Real-time system insights and performance metrics</span>}
        actions={
          <div className="flex gap-3">
            <button
              onClick={loadDashboardData}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 rounded-lg border border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 font-medium"
            >
              <Activity size={16} />
              Refresh
            </button>
          </div>
        }
      >
        {roleComponent}
      </PageLayout>
    </PageContainer>
  )
}
