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
