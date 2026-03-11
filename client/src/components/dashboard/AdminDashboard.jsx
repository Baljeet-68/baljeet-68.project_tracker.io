import React from 'react'
import {
    BarChart3,
    PieChart as PieChartIcon,
    Activity,
    Bug,
    Layout,
    Users,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Sparkles,
    FileText
} from 'lucide-react'
import { StatCard, Card, CardHeader, CardBody, Badge } from '../TailAdminComponents'
import { LineChart, BarChart, PieChart } from '../ChartComponents'

/**
 * Admin Dashboard Component
 * @description Shows system-wide overview and management metrics
 */
export default function AdminDashboard({ dashboardData }) {
    const {
        systemOverview,
        bugAnalytics,
        projectHealth,
        developerWorkload,
        recentActivity
    } = dashboardData

    return (
        <div className="space-y-8">
            {/* System Stats */}
            <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500" />
                    System Overview
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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
                        icon={AlertCircle}
                        gradient="from-orange-500 to-yellow-400"
                    />
                </div>
            </div>

            {/* Bug Analytics & Project Health */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Bug Analytics */}
                <div className="lg:col-span-7">
                    <Card className="h-full bg-gradient-to-br from-white to-blue-50 border border-blue-100 hover:shadow-lg transition-all duration-300">
                        <CardHeader className="flex items-center gap-2 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <BarChart3 size={20} className="text-blue-600" />
                            <h6 className="font-bold text-slate-700">Bug Analytics</h6>
                        </CardHeader>
                        <CardBody className="min-h-[300px]">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-3 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border border-red-100 hover:shadow-md transition-all duration-200">
                                    <p className="text-xs text-slate-500 font-semibold uppercase">Open</p>
                                    <p className="text-2xl font-bold text-red-600 mt-1">{bugAnalytics.byStatus.open}</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-100 hover:shadow-md transition-all duration-200">
                                    <p className="text-xs text-slate-500 font-semibold uppercase">In Progress</p>
                                    <p className="text-2xl font-bold text-yellow-600 mt-1">{bugAnalytics.byStatus.inProgress}</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100 hover:shadow-md transition-all duration-200">
                                    <p className="text-xs text-slate-500 font-semibold uppercase">Resolved</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">{bugAnalytics.byStatus.resolved}</p>
                                </div>
                                <div className="p-3 bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg border border-slate-200 hover:shadow-md transition-all duration-200">
                                    <p className="text-xs text-slate-500 font-semibold uppercase">Closed</p>
                                    <p className="text-2xl font-bold text-slate-600 mt-1">{bugAnalytics.byStatus.closed}</p>
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
                    <Card className="h-full bg-gradient-to-br from-white to-green-50 border border-green-100 hover:shadow-lg transition-all duration-300">
                        <CardHeader className="flex items-center gap-2 border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
                            <PieChartIcon size={20} className="text-green-600" />
                            <h6 className="font-bold text-slate-700">Project Health</h6>
                        </CardHeader>
                        <CardBody className="min-h-[300px]">
                            <div className="space-y-3 mb-6">
                                {Object.entries(projectHealth.byStatus).map(([status, count]) => (
                                    <div key={status} className="flex justify-between items-center p-3 rounded-lg hover:bg-green-50 transition-colors duration-150">
                                        <span className="text-sm text-slate-600 font-medium">{status}</span>
                                        <span className="font-semibold text-lg text-slate-700">{count}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-green-200 pt-4">
                                <h6 className="font-semibold text-sm mb-3 text-slate-700 flex items-center gap-2">
                                    <AlertCircle size={16} className="text-orange-500" />
                                    Top Projects with Bugs
                                </h6>
                                <div className="space-y-2">
                                    {projectHealth.topProjectsWithBugs.slice(0, 3).map((project) => (
                                        <div key={project.id} className="flex justify-between items-center text-sm p-2 rounded hover:bg-green-50 transition-colors duration-150">
                                            <span className="truncate text-slate-600 font-medium">{project.name}</span>
                                            <Badge gradient="from-red-600 to-rose-400" size="sm">
                                                {project.openBugCount} open
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Developer Workload & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Developer Workload */}
                <div className="lg:col-span-5">
                    <Card className="h-full bg-gradient-to-br from-white to-emerald-50 border border-emerald-100 hover:shadow-lg transition-all duration-300">
                        <CardHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                            <h6 className="font-bold text-slate-700 flex items-center gap-2">
                                <Users size={18} className="text-emerald-600" />
                                Team Workload
                            </h6>
                        </CardHeader>
                        <CardBody>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                                            <th className="text-left py-3 px-2 font-semibold text-slate-600">Developer</th>
                                            <th className="text-center py-3 px-2 font-semibold text-slate-600">
                                                <Bug size={14} className="inline" />
                                            </th>
                                            <th className="text-center py-3 px-2 font-semibold text-slate-600">
                                                <Layout size={14} className="inline" />
                                            </th>
                                            <th className="text-center py-3 px-2 font-semibold text-slate-600">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {developerWorkload.slice(0, 5).map((dev) => (
                                            <tr key={dev.id} className="border-b border-emerald-100 hover:bg-emerald-50 transition-colors duration-150">
                                                <td className="py-3 px-2 text-slate-700 font-medium">{dev.name}</td>
                                                <td className="text-center py-3 px-2 text-red-600 font-semibold">{dev.assignedBugs}</td>
                                                <td className="text-center py-3 px-2 text-blue-600 font-semibold">{dev.assignedScreens}</td>
                                                <td className="text-center py-3 px-2 font-bold text-slate-800 bg-gradient-to-r from-emerald-100 to-teal-100 rounded">
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

                {/* Recent Activity */}
                <div className="lg:col-span-7">
                    <Card className="h-full bg-gradient-to-br from-white to-purple-50 border border-purple-100 hover:shadow-lg transition-all duration-300">
                        <CardHeader className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                            <h6 className="font-bold text-slate-700 flex items-center gap-2">
                                <Activity size={18} className="text-purple-600" />
                                Recent Activity
                            </h6>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                {recentActivity.length > 0 ? (
                                    recentActivity.map((activity, index) => (
                                        <div key={activity.id} className="relative flex gap-4 group">
                                            {index < recentActivity.length - 1 && (
                                                <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 to-transparent"></div>
                                            )}
                                            <div className="relative flex-shrink-0 w-6 h-6 rounded-full mt-1 border-2 border-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-md group-hover:shadow-lg transition-all duration-200 flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            </div>
                                            <div className="flex-1 min-w-0 p-3 rounded-lg hover:bg-purple-100 transition-colors duration-150">
                                                <p className="text-sm text-slate-700 font-medium truncate">{activity.description}</p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {new Date(activity.timestamp).toLocaleDateString()} · {activity.user}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <FileText size={32} className="text-slate-300 mb-3" />
                                        <p className="text-slate-400 font-medium">No activity yet</p>
                                        <p className="text-xs text-slate-400 mt-1">Your actions will appear here</p>
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    )
}
