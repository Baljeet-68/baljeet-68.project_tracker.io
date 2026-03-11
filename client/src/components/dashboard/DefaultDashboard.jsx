import React from 'react'
import {
    LayoutDashboard,
    Activity,
    TrendingUp,
    Users,
    AlertCircle,
    Clock,
    Info
} from 'lucide-react'
import { StatCard, Card, CardHeader, CardBody } from '../TailAdminComponents'

/**
 * Default Dashboard Component
 * @description Fallback dashboard for unrecognized user roles
 * Shows basic system overview and recent activity
 */
export default function DefaultDashboard({ dashboardData }) {
    const {
        systemOverview,
        recentActivity
    } = dashboardData

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                    <LayoutDashboard size={24} className="text-blue-600" />
                    <h2 className="text-xl font-bold text-slate-800">Welcome to Dashboard</h2>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                    Here's an overview of your project management system. Contact your administrator if you'd like a customized dashboard for your role.
                </p>
                <div className="flex items-center gap-2 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                    <Info size={16} className="text-blue-600 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                        This is a general dashboard. Your account role may not have a specialized dashboard yet.
                    </p>
                </div>
            </div>

            {/* System Overview Stats */}
            <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-500" />
                    System Overview
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    <StatCard
                        title="Total Projects"
                        value={systemOverview.totalProjects}
                        icon={LayoutDashboard}
                        gradient="from-blue-600 to-cyan-400"
                    />
                    <StatCard
                        title="Active Users"
                        value={systemOverview.activeUsers}
                        icon={Users}
                        gradient="from-green-600 to-lime-400"
                    />
                    <StatCard
                        title="Open Bugs"
                        value={systemOverview.openBugs}
                        icon={AlertCircle}
                        gradient="from-red-600 to-rose-400"
                    />
                    <StatCard
                        title="Total Screens"
                        value={systemOverview.totalScreens}
                        icon={Clock}
                        gradient="from-purple-600 to-pink-400"
                    />
                    <StatCard
                        title="Leaves Today"
                        value={systemOverview.leavesToday}
                        icon={Activity}
                        gradient="from-orange-600 to-amber-400"
                    />
                </div>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="h-full bg-gradient-to-br from-white to-blue-50 border border-blue-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50">
                        <h6 className="font-bold text-slate-700 flex items-center gap-2">
                            <LayoutDashboard size={18} className="text-blue-600" />
                            System Health
                        </h6>
                    </CardHeader>
                    <CardBody className="space-y-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <p className="text-sm text-slate-600 font-medium">Status: <span className="text-green-600 font-bold">Healthy</span></p>
                            <p className="text-xs text-slate-500 mt-1">All systems operational</p>
                        </div>
                    </CardBody>
                </Card>

                <Card className="h-full bg-gradient-to-br from-white to-green-50 border border-green-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
                        <h6 className="font-bold text-slate-700 flex items-center gap-2">
                            <Users size={18} className="text-green-600" />
                            Users Online
                        </h6>
                    </CardHeader>
                    <CardBody className="space-y-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <p className="text-sm text-slate-600 font-medium">Active: <span className="text-green-600 font-bold">{systemOverview.activeUsers}</span></p>
                            <p className="text-xs text-slate-500 mt-1">Users logged in today</p>
                        </div>
                    </CardBody>
                </Card>

                <Card className="h-full bg-gradient-to-br from-white to-purple-50 border border-purple-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                        <h6 className="font-bold text-slate-700 flex items-center gap-2">
                            <TrendingUp size={18} className="text-purple-600" />
                            Recent Updates
                        </h6>
                    </CardHeader>
                    <CardBody className="space-y-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <p className="text-sm text-slate-600 font-medium">Latest: <span className="text-purple-600 font-bold">Today</span></p>
                            <p className="text-xs text-slate-500 mt-1">New updates available</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="h-full bg-gradient-to-br from-white to-slate-50 border border-slate-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                    <h6 className="font-bold text-slate-700 flex items-center gap-2">
                        <Activity size={18} className="text-slate-600" />
                        Recent Activity
                    </h6>
                </CardHeader>
                <CardBody>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {recentActivity && recentActivity.length > 0 ? (
                            recentActivity.map((activity, index) => (
                                <div key={activity.id} className="relative flex gap-4 group">
                                    {index < recentActivity.length - 1 && (
                                        <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gradient-to-b from-slate-300 to-transparent"></div>
                                    )}
                                    <div className="relative flex-shrink-0 w-6 h-6 rounded-full mt-1 border-2 border-white bg-gradient-to-r from-blue-500 to-cyan-500 shadow-md group-hover:shadow-lg transition-all duration-200 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                    <div className="flex-1 min-w-0 p-3 rounded-lg hover:bg-slate-100 transition-colors duration-150">
                                        <p className="text-sm text-slate-700 font-medium truncate">{activity.description}</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-xs text-slate-500">by {activity.user}</p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(activity.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Activity size={32} className="text-slate-300 mb-2" />
                                <p className="text-slate-400 font-medium">No recent activity</p>
                                <p className="text-xs text-slate-400 mt-1">Activity will appear here as events occur</p>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Help & Support */}
            <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <AlertCircle size={18} className="text-amber-600" />
                    Need Help?
                </h3>
                <p className="text-sm text-slate-700 mb-3">
                    If you have a specific role in the organization, your administrator can set up a customized dashboard tailored to your responsibilities.
                </p>
                <p className="text-xs text-slate-600">
                    <strong>Contact:</strong> Reach out to your project administrator to request role-specific dashboard configuration.
                </p>
            </div>
        </div>
    )
}
