import React from 'react'
import {
    Activity,
    Bug,
    Layout,
    CheckCircle,
    Clock,
    AlertCircle,
    Calendar,
    TrendingUp,
    Zap,
    Plus,
    ArrowRight,
    FileText
} from 'lucide-react'
import { StatCard, Card, CardHeader, CardBody, Badge } from '../TailAdminComponents'
import { PieChart, BarChart } from '../ChartComponents'
import { ActivityTimeline } from './common'

/**
 * Developer Dashboard Component
 * @description Shows developer's workload and assigned tasks
 */
export default function DeveloperDashboard({ dashboardData }) {
    const {
        myWorkSummary,
        bugAnalytics,
        recentActivity,
        userRole
    } = dashboardData

    return (
        <div className="space-y-8">
            {/* My Work Summary */}
            <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" />
                    My Work Overview
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="My Tasks"
                        value={myWorkSummary.myTasks}
                        icon={Activity}
                        gradient="from-purple-700 to-pink-500"
                    />
                    <StatCard
                        title="Assigned Bugs"
                        value={myWorkSummary.assignedBugs}
                        icon={Bug}
                        gradient="from-red-600 to-rose-400"
                    />
                    <StatCard
                        title="Assigned Screens"
                        value={myWorkSummary.assignedScreens}
                        icon={Layout}
                        gradient="from-blue-600 to-cyan-400"
                    />
                    <StatCard
                        title="Pending Leaves"
                        value={myWorkSummary.pendingLeaveRequests}
                        icon={Calendar}
                        gradient="from-orange-500 to-yellow-400"
                    />
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" />
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <a
                        href="/projects"
                        className="p-4 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 rounded-lg border border-red-100 hover:shadow-md transition-all duration-200 hover:translate-y-1 group flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <Bug size={20} className="text-red-600" />
                            <span className="font-semibold text-slate-700">View My Bugs</span>
                        </div>
                        <ArrowRight size={16} className="text-red-400 group-hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all" />
                    </a>
                    <a
                        href="/tasks"
                        className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg border border-blue-100 hover:shadow-md transition-all duration-200 hover:translate-y-1 group flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <CheckCircle size={20} className="text-blue-600" />
                            <span className="font-semibold text-slate-700">View My Tasks</span>
                        </div>
                        <ArrowRight size={16} className="text-blue-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all" />
                    </a>
                </div>
            </div>

            {/* Bug Status & Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* My Bug Status */}
                <Card className="h-full bg-gradient-to-br from-white to-red-50 border border-red-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex items-center gap-2 border-b border-red-100 bg-gradient-to-r from-red-50 to-rose-50">
                        <Bug size={20} className="text-red-600" />
                        <h6 className="font-bold text-slate-700">Bug Status</h6>
                    </CardHeader>
                    <CardBody className="min-h-[300px]">
                        <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-br from-red-100 to-rose-100 rounded-lg border border-red-200">
                                <p className="text-xs text-slate-600 font-semibold uppercase">Open</p>
                                <p className="text-3xl font-bold text-red-600 mt-2">{bugAnalytics.byStatus.open}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-lg border border-yellow-200">
                                    <p className="text-xs text-slate-600 font-semibold uppercase">In Progress</p>
                                    <p className="text-2xl font-bold text-yellow-600 mt-1">{bugAnalytics.byStatus.inProgress}</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg border border-green-200">
                                    <p className="text-xs text-slate-600 font-semibold uppercase">Resolved</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">{bugAnalytics.byStatus.resolved}</p>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Fix Progress Chart */}
                <Card className="h-full bg-gradient-to-br from-white to-green-50 border border-green-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex items-center gap-2 border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
                        <TrendingUp size={20} className="text-green-600" />
                        <h6 className="font-bold text-slate-700">Bug Fix Progress</h6>
                    </CardHeader>
                    <CardBody className="min-h-[300px] flex flex-col justify-center">
                        <div className="text-center">
                            <p className="text-xs text-slate-500 font-semibold uppercase mb-2">Total Resolved</p>
                            <p className="text-4xl font-bold text-green-600">{bugAnalytics.byStatus.resolved}</p>
                            <p className="text-sm text-slate-500 mt-4">
                                {bugAnalytics.byStatus.inProgress === 0
                                    ? 'All bugs resolved! 🎉'
                                    : `${bugAnalytics.byStatus.inProgress} still in progress`}
                            </p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Recent Activity */}
            <ActivityTimeline 
                activities={recentActivity.map(a => ({
                    title: a.description,
                    timestamp: new Date(a.timestamp).toLocaleString()
                }))}
                emptyIcon={Activity}
                emptyMessage="You have no recent activities."
            />
        </div>
    )
}
