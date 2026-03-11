import React, { memo, useMemo, useState, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch, getUser, clearToken, clearUser } from '../../auth'
import { handleError, handleApiResponse } from '../../utils/errorHandler'
// import { StatCard } from '../TailAdminComponents'
import PageLayout from '../layout/PageLayout'
import PageContainer from '../layout/PageContainer'
import { Activity, Sparkles, Users, Calendar, AlertCircle, TrendingUp, CheckCircle, ArrowRight, FileText } from 'lucide-react'
import { API_BASE_URL } from '../../apiConfig'
import { Loader } from '../Loader'
import { StatCard, Card, CardHeader, CardBody, Badge } from '../TailAdminComponents'
import { StatsGrid, ActivityTimeline, LeaveBreakdown, EmployeeStatus, PendingLeavesCard } from './common'

// role dashboards
import AdminDashboard from './AdminDashboard'
import DeveloperDashboard from './DeveloperDashboard'
import TesterDashboard from './TesterDashboard'
import ManagementDashboard from './ManagementDashboard'
import DefaultDashboard from './DefaultDashboard'

export function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const user = getUser()
    const nav = useNavigate()

    const handleAuthError = useCallback((e) => {
        if (/Unauthorized|Token expired/.test(e.message)) {
            clearToken(); clearUser()
            nav('/login', { replace: true })
            handleError(new Error('Session expired. Please login again.'))
        } else handleError(e)
    }, [nav])

    const loadDashboardData = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            const res = await authFetch(`${API_BASE_URL}/dashboard/summary`)
            setDashboardData(await handleApiResponse(res))
        } catch (e) {
            handleAuthError(e); setError(e.message)
        } finally { setLoading(false) }
    }, [handleAuthError])

    useEffect(() => { loadDashboardData() }, [loadDashboardData])

    if (loading) return <Loader message="Loading operational dashboard..." />
    if (error) return (
        <div className="p-6 bg-red-50 text-red-700 rounded">
            <p>Error: {error}</p>
            <button onClick={loadDashboardData} className="mt-2 px-4 py-2 bg-red-600 text-white rounded">
                Retry
            </button>
        </div>
    )

    const { userRole } = dashboardData
    let roleComponent
    switch (userRole?.toLowerCase()) {
        case 'admin': roleComponent = <AdminDashboard dashboardData={dashboardData} />; break
        case 'developer':
        case 'ecommerce': roleComponent = <DeveloperDashboard dashboardData={dashboardData} />; break
        case 'tester': roleComponent = <TesterDashboard dashboardData={dashboardData} />; break
        case 'hr': roleComponent = <HRDashboard dashboardData={dashboardData} />; break
        case 'management': roleComponent = <ManagementDashboard dashboardData={dashboardData} />; break
        default: roleComponent = <DefaultDashboard dashboardData={dashboardData} />
    }

    return (
        <PageContainer>
            <PageLayout
                maxWidth="full"
                title="Operational Dashboard"
                subtitle={<span>Real-time system insights and performance metrics</span>}
            >
                {roleComponent}
            </PageLayout>
        </PageContainer>
    )
}

export function HRDashboard({ dashboardData }) {
    const { leaveOverview, systemOverview, recentActivity } = dashboardData

    const leaveTypes = useMemo(() => [
        { label: 'Sick Leave', count: leaveOverview.sick || 0, color: 'orange', pct: leaveOverview.sickPct },
        { label: 'Casual Leave', count: leaveOverview.casual || 0, color: 'amber', pct: leaveOverview.casualPct },
        { label: 'Paid Time Off', count: leaveOverview.pto || 0, color: 'yellow', pct: leaveOverview.ptoPct },
    ], [leaveOverview])

    const attendanceRate = systemOverview.attendanceRate ?? 0
    const workingToday = systemOverview.workingToday ?? 0

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">HR Dashboard</h2>
            </div>
            <StatsGrid
                stats={[
                    { title: 'Pending Requests', value: leaveOverview.pendingRequests, icon: AlertCircle, gradient: 'orange' },
                    { title: 'Leaves Today', value: leaveOverview.leavesToday, icon: Calendar, gradient: 'red' },
                    { title: 'This Month', value: leaveOverview.leavesThisMonth, icon: TrendingUp, gradient: 'blue' },
                    { title: 'Total Employees', value: systemOverview.activeUsers, icon: Users, gradient: 'green' },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LeaveBreakdown leaveTypes={leaveTypes} />
                <EmployeeStatus workingToday={workingToday} onLeave={leaveOverview.leavesToday} attendanceRate={attendanceRate} />
            </div>

            <PendingLeavesCard requests={dashboardData.pendingLeaves || []} />

            <ActivityTimeline
                activities={recentActivity}
                emptyIcon={FileText}
                emptyMessage="No recent activity"
            />
        </div>
    )
}

export default memo(HRDashboard)
