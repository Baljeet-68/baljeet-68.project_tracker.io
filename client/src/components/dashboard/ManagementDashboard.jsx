import React from 'react'
import {
    Briefcase,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    BarChart3,
    PieChart,
    Activity,
    Zap,
    Target
} from 'lucide-react'
import { StatCard, Card, CardHeader, CardBody, Badge } from '../TailAdminComponents'
import { BarChart, LineChart, PieChart as PieChartComponent } from '../ChartComponents'
import { ActivityTimeline } from './common'

/**
 * Management Dashboard Component
 * @description Shows high-level project health and business metrics
 */
export default function ManagementDashboard({ dashboardData }) {
    const {
        systemOverview,
        projectHealth,
        bugAnalytics,
        recentActivity
    } = dashboardData

    // Prepare chart data
    const projectStatusData = {
        series: [
            {
                name: 'Projects',
                data: Object.values(projectHealth.byStatus || { running: 0, completed: 0, 'on-hold': 0 })
            }
        ],
        categories: Object.keys(projectHealth.byStatus || { running: 0, completed: 0, 'on-hold': 0 })
    }

    const bugTrendData = {
        series: [{ name: 'Bugs', data: bugAnalytics.trend || [] }],
        categories: bugAnalytics.trendCategories || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }

    const bugStatusData = {
        series: [
            bugAnalytics.byStatus?.open || 0,
            bugAnalytics.byStatus?.['in-progress'] || 0,
            bugAnalytics.byStatus?.resolved || 0,
            bugAnalytics.byStatus?.closed || 0
        ],
        labels: ['Open', 'In Progress', 'Resolved', 'Closed']
    }

    return (
        <div className="space-y-8">
            {/* Executive Summary */}
            <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Zap size={16} className="text-blue-500" />
                    Executive Dashboard
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    <StatCard
                        title="Active Projects"
                        value={projectHealth.byStatus?.running || 0}
                        icon={Briefcase}
                        gradient="from-blue-600 to-cyan-400"
                    />
                    <StatCard
                        title="Completed"
                        value={projectHealth.byStatus?.completed || 0}
                        icon={CheckCircle}
                        gradient="from-green-600 to-lime-400"
                    />
                    <StatCard
                        title="On Hold"
                        value={projectHealth.byStatus?.['on-hold'] || 0}
                        icon={Clock}
                        gradient="from-orange-600 to-amber-400"
                    />
                    <StatCard
                        title="Open Bugs"
                        value={bugAnalytics.byStatus?.open || 0}
                        icon={AlertCircle}
                        gradient="from-red-600 to-rose-400"
                    />
                    <StatCard
                        title="Total Users"
                        value={systemOverview.activeUsers}
                        icon={Activity}
                        gradient="from-purple-600 to-pink-400"
                    />
                </div>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="h-full bg-gradient-to-br from-white to-blue-50 border border-blue-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50">
                        <h6 className="font-bold text-slate-700 flex items-center gap-2">
                            <Target size={18} className="text-blue-600" />
                            Project Success Rate
                        </h6>
                    </CardHeader>
                    <CardBody className="flex items-center justify-center min-h-[150px]">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-blue-600">{`${Math.round((projectHealth?.onTimeDeliveryRate || 0) * 100)}%`}</div>
                            <p className="text-sm text-slate-500 mt-2">On-time delivery</p>
                            <div className="flex gap-2 mt-4">
                                <Badge gradient="from-green-600 to-emerald-500" size="sm">↑ +5% from last month</Badge>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="h-full bg-gradient-to-br from-white to-orange-50 border border-orange-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-yellow-50">
                        <h6 className="font-bold text-slate-700 flex items-center gap-2">
                            <AlertCircle size={18} className="text-orange-600" />
                            Bug Resolution Rate
                        </h6>
                    </CardHeader>
                    <CardBody className="flex items-center justify-center min-h-[150px]">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-orange-600">{`${Math.round((bugAnalytics?.resolutionRate || 0) * 100)}%`}</div>
                            <p className="text-sm text-slate-500 mt-2">Bugs fixed this month</p>
                            <div className="flex gap-2 mt-4">
                                <Badge gradient="from-yellow-600 to-amber-500" size="sm">→ Stable trend</Badge>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="h-full bg-gradient-to-br from-white to-green-50 border border-green-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
                        <h6 className="font-bold text-slate-700 flex items-center gap-2">
                            <TrendingUp size={18} className="text-green-600" />
                            Team Productivity
                        </h6>
                    </CardHeader>
                    <CardBody className="flex items-center justify-center min-h-[150px]">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-green-600">{`${Math.round((projectHealth.utilizationRate || 0) * 100)}%`}</div>
                            <p className="text-sm text-slate-500 mt-2">Resource utilization</p>
                            <div className="flex gap-2 mt-4">
                                <Badge gradient="from-green-600 to-lime-500" size="sm">↑ +8% efficiency</Badge>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Status Overview */}
                <Card className="h-full bg-gradient-to-br from-white to-blue-50 border border-blue-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50">
                        <h6 className="font-bold text-slate-700 flex items-center gap-2">
                            <BarChart3 size={18} className="text-blue-600" />
                            Project Status Distribution
                        </h6>
                    </CardHeader>
                    <CardBody className="min-h-[350px]">
                        <BarChart
                            series={projectStatusData.series}
                            categories={projectStatusData.categories}
                            height={280}
                            colors={['#0ea5e9', '#10b981', '#f59e0b']}
                        />
                    </CardBody>
                </Card>

                {/* Bug Status Overview */}
                <Card className="h-full bg-gradient-to-br from-white to-red-50 border border-red-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="border-b border-red-100 bg-gradient-to-r from-red-50 to-rose-50">
                        <h6 className="font-bold text-slate-700 flex items-center gap-2">
                            <PieChart size={18} className="text-red-600" />
                            Bug Distribution
                        </h6>
                    </CardHeader>
                    <CardBody className="min-h-[350px]">
                        <PieChartComponent
                            series={bugStatusData.series}
                            labels={bugStatusData.labels}
                            height={280}
                            colors={['#ef4444', '#f97316', '#22c55e', '#6366f1']}
                        />
                    </CardBody>
                </Card>
            </div>

            {/* Bug Trend and Project Health */}
            {bugAnalytics.trend && bugAnalytics.trend.length > 0 && (
                <div className="grid grid-cols-1 gap-6">
                <Card className="h-full bg-gradient-to-br from-white to-purple-50 border border-purple-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                        <h6 className="font-bold text-slate-700 flex items-center gap-2">
                            <TrendingUp size={18} className="text-purple-600" />
                            Bug Trend (Last 7 Days)
                        </h6>
                    </CardHeader>
                    <CardBody className="min-h-[350px]">
                        <LineChart
                            series={bugTrendData.series}
                            categories={bugTrendData.categories}
                            height={280}
                            colors={['#a855f7']}
                        />
                    </CardBody>
                </Card>
            </div>
            )}

            {/* Top Projects and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Projects by Bug Count */}
                <Card className="h-full bg-gradient-to-br from-white to-orange-50 border border-orange-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-yellow-50">
                        <h6 className="font-bold text-slate-700">Top Projects by Risk</h6>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {projectHealth.topProjectsWithBugs && projectHealth.topProjectsWithBugs.length > 0 ? (
                                projectHealth.topProjectsWithBugs.slice(0, 5).map((project, index) => (
                                    <div key={project.id} className="p-4 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg border border-orange-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1 group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-slate-700">{project.name}</p>
                                                <p className="text-xs text-slate-500 mt-1">{project.bugs} open bugs</p>
                                            </div>
                                            <Badge
                                                gradient={index === 0 ? "from-red-600 to-rose-500" : "from-orange-600 to-amber-500"}
                                                size="sm"
                                            >
                                                {index === 0 ? 'High Risk' : 'Medium'}
                                            </Badge>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                                            <div
                                                className={`h-1.5 rounded-full ${index === 0 ? 'bg-red-500' : 'bg-orange-500'}`}
                                                style={{ width: `${Math.min(project.bugs * 20, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    <p>No project data available</p>
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Recent Executive Activity */}
                <div className="lg:col-span-1">
                    <ActivityTimeline 
                        activities={(recentActivity || []).map(a => ({
                            title: a.description,
                            timestamp: new Date(a.timestamp).toLocaleString()
                        }))}
                        emptyIcon={Activity}
                        emptyMessage="No critical changes recorded recently."
                    />
                </div>
            </div>
        </div>
    )
}
