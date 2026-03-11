import React, { useEffect, useState, useMemo, useCallback } from 'react'
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
  Table
} from 'lucide-react'
import { API_BASE_URL } from '../apiConfig'
import { Loader } from '../components/Loader'

/**
 * Enhanced Dashboard Component
 * @description Provides comprehensive operational visibility with modern UI
 */
export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const user = getUser()
  const nav = useNavigate()

  /**
   * Error handler for authentication failures
   */
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

  /**
   * Fetches comprehensive dashboard data
   */
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

  // Load data on mount
  useEffect(() => {
    if (user?.role?.toLowerCase() === 'hr') {
      nav('/notifications', { replace: true })
      return
    }
    loadDashboardData()
  }, [loadDashboardData, nav, user?.role])

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

  const isAdmin = userRole === 'admin';
  const isDeveloper = ['developer', 'tester', 'ecommerce'].includes(userRole);

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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Activity size={16} />
              Refresh
            </button>
          </div>
        }
      >
        {/* System Overview Cards */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">System Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatCard
              title="Projects"
              value={systemOverview.totalProjects}
              icon={Activity}
              gradient="from-purple-700 to-pink-500"
            />
            <StatCard
              title="Open Bugs"
              value={systemOverview.openBugs}
              icon={Bug}
              gradient="from-red-600 to-rose-400"
            />
            <StatCard
              title="Screens"
              value={systemOverview.totalScreens}
              icon={Layout}
              gradient="from-blue-600 to-cyan-400"
            />
            <StatCard
              title="Active Users"
              value={systemOverview.activeUsers}
              icon={Users}
              gradient="from-green-600 to-lime-400"
            />
            <StatCard
              title="Leaves Today"
              value={systemOverview.leavesToday}
              icon={Calendar}
              gradient="from-orange-500 to-yellow-400"
            />
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Bug Analytics */}
          <div className="lg:col-span-7">
            <Card className="h-full">
              <CardHeader className="flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-600" />
                <h6 className="font-bold">Bug Analytics</h6>
              </CardHeader>
              <CardBody className="min-h-[300px]">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-slate-500">Open</p>
                    <p className="text-2xl font-bold text-red-600">{bugAnalytics.byStatus.open}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500">In Progress</p>
                    <p className="text-2xl font-bold text-yellow-600">{bugAnalytics.byStatus.inProgress}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">{bugAnalytics.byStatus.resolved}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500">Closed</p>
                    <p className="text-2xl font-bold text-slate-600">{bugAnalytics.byStatus.closed}</p>
                  </div>
                </div>
                <PieChart
                  labels={['Open', 'In Progress', 'Resolved', 'Closed']}
                  series={[
                    bugAnalytics.byStatus.open,
                    bugAnalytics.byStatus.inProgress,
                    bugAnalytics.byStatus.resolved,
                    bugAnalytics.byStatus.closed
                  ]}
                  height={200}
                  colors={['#ef4444', '#f59e0b', '#10b981', '#64748b']}
                />
              </CardBody>
            </Card>
          </div>

          {/* Project Health */}
          <div className="lg:col-span-5">
            <Card className="h-full">
              <CardHeader className="flex items-center gap-2">
                <PieChartIcon size={20} className="text-green-600" />
                <h6 className="font-bold">Project Health</h6>
              </CardHeader>
              <CardBody className="min-h-[300px]">
                <div className="space-y-3">
                  {Object.entries(projectHealth.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">{status}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <h6 className="font-semibold text-sm mb-2">Top Projects with Bugs</h6>
                  <div className="space-y-2">
                    {projectHealth.topProjectsWithBugs.slice(0, 3).map((project, index) => (
                      <div key={project.id} className="flex justify-between items-center text-sm">
                        <span className="truncate">{project.name}</span>
                        <Badge gradient="from-red-600 to-rose-400" size="sm">
                          {project.openBugCount} open</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* My Work & Developer Workload */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* My Work Summary */}
          {isDeveloper && (
            <div className="lg:col-span-6">
              <Card className="h-full">
                <CardHeader className="flex items-center gap-2">
                  <UserCheck size={20} className="text-blue-600" />
                  <h6 className="font-bold">My Work Summary</h6>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard
                      title="My Tasks"
                      value={myWorkSummary.myTasks}
                      icon={Activity}
                      gradient="from-purple-700 to-pink-500"
                      className="p-3"
                    />
                    <StatCard
                      title="Assigned Bugs"
                      value={myWorkSummary.assignedBugs}
                      icon={Bug}
                      gradient="from-red-600 to-rose-400"
                      className="p-3"
                    />
                    <StatCard
                      title="Assigned Screens"
                      value={myWorkSummary.assignedScreens}
                      icon={Layout}
                      gradient="from-blue-600 to-cyan-400"
                      className="p-3"
                    />
                    <StatCard
                      title="Pending Leaves"
                      value={myWorkSummary.pendingLeaveRequests}
                      icon={Calendar}
                      gradient="from-orange-500 to-yellow-400"
                      className="p-3"
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Developer Workload */}
          {isAdmin && (
            <div className="lg:col-span-6">
              <Card className="h-full">
                <CardHeader className="flex items-center gap-2">
                  <Table size={20} className="text-green-600" />
                  <h6 className="font-bold">Developer Workload</h6>
                </CardHeader>
                <CardBody>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Developer</th>
                          <th className="text-center py-2">Bugs</th>
                          <th className="text-center py-2">Screens</th>
                          <th className="text-center py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {developerWorkload.slice(0, 5).map((dev) => (
                          <tr key={dev.id} className="border-b">
                            <td className="py-2">{dev.name}</td>
                            <td className="text-center py-2">{dev.assignedBugs}</td>
                            <td className="text-center py-2">{dev.assignedScreens}</td>
                            <td className="text-center py-2 font-semibold">
                              {dev.assignedBugs + dev.assignedScreens}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </div>

        {/* Leave Overview & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Leave Overview */}
          <div className="lg:col-span-4">
            <Card className="h-full">
              <CardHeader className="flex items-center gap-2">
                <Clock size={20} className="text-orange-600" />
                <h6 className="font-bold">Leave Overview</h6>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <StatCard
                    title="Leaves Today"
                    value={leaveOverview.leavesToday}
                    icon={Calendar}
                    gradient="from-orange-500 to-yellow-400"
                    className="p-3"
                  />
                  <StatCard
                    title="Pending Requests"
                    value={leaveOverview.pendingRequests}
                    icon={AlertCircle}
                    gradient="from-red-600 to-rose-400"
                    className="p-3"
                  />
                  <StatCard
                    title="This Month"
                    value={leaveOverview.leavesThisMonth}
                    icon={TrendingUp}
                    gradient="from-blue-600 to-cyan-400"
                    className="p-3"
                  />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-8">
            <Card className="h-full">
              <CardHeader className="flex items-center gap-2">
                <FileText size={20} className="text-purple-600" />
                <h6 className="font-bold">Recent Activity</h6>
              </CardHeader>
              <CardBody>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 truncate">{activity.description}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(activity.timestamp).toLocaleDateString()} by {activity.user}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </PageLayout>
    </PageContainer>
  )
}
