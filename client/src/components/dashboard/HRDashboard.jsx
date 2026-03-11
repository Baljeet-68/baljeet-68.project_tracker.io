import React from 'react'
import {
    Users,
    Calendar,
    Clock,
    AlertCircle,
    TrendingUp,
    FileText,
    Activity,
    CheckCircle,
    Sparkles,
    ArrowRight
} from 'lucide-react'
import { StatCard, Card, CardHeader, CardBody, Badge } from '../TailAdminComponents'
import { BarChart, LineChart } from '../ChartComponents'

/**
 * HR Dashboard Component
 * @description Shows employee activity and leave management
 */
export default function HRDashboard({ dashboardData }) {
    const {
        leaveOverview,
        systemOverview,
        recentActivity
    } = dashboardData

    return (
        <div className="space-y-8">
            {/* HR Overview Stats */}
            <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500" />
                    HR Dashboard
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Pending Requests"
                        value={leaveOverview.pendingRequests}
                        icon={AlertCircle}
                        gradient="from-orange-600 to-amber-400"
                    />
                    <StatCard
                        title="Leaves Today"
                        value={leaveOverview.leavesToday}
                        icon={Calendar}
                        gradient="from-red-600 to-rose-400"
                    />
                    <StatCard
                        title="This Month"
                        value={leaveOverview.leavesThisMonth}
                        icon={TrendingUp}
                        gradient="from-blue-600 to-cyan-400"
                    />
                    <StatCard
                        title="Total Employees"
                        value={systemOverview.activeUsers}
                        icon={Users}
                        gradient="from-green-600 to-lime-400"
                    />
                </div>
            </div>

            {/* Leave Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leave Types */}
                <Card className="h-full bg-gradient-to-br from-white to-orange-50 border border-orange-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex items-center gap-2 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-yellow-50">
                        <Calendar size={20} className="text-orange-600" />
                        <h6 className="font-bold text-slate-700">Leave Breakdown</h6>
                    </CardHeader>
                    <CardBody className="min-h-[300px]">
                        <div className="space-y-3">
                            <div className="p-4 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg border border-orange-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-slate-700">Sick Leave</span>
                                    <span className="text-xl font-bold text-orange-600">8</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                                    <div className="bg-orange-500 h-1.5 rounded-full w-[40%]"></div>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg border border-amber-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-slate-700">Casual Leave</span>
                                    <span className="text-xl font-bold text-amber-600">12</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                                    <div className="bg-amber-500 h-1.5 rounded-full w-[60%]"></div>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border border-yellow-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-slate-700">Paid Time Off</span>
                                    <span className="text-xl font-bold text-yellow-600">5</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                                    <div className="bg-yellow-500 h-1.5 rounded-full w-[25%]"></div>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Employee Status */}
                <Card className="h-full bg-gradient-to-br from-white to-green-50 border border-green-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex items-center gap-2 border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
                        <Users size={20} className="text-green-600" />
                        <h6 className="font-bold text-slate-700">Employee Status</h6>
                    </CardHeader>
                    <CardBody className="min-h-[300px]">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200">
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">Working Today</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">42</p>
                                </div>
                                <CheckCircle size={24} className="text-green-600" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg border border-orange-200">
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">On Leave</p>
                                    <p className="text-2xl font-bold text-orange-600 mt-1">{leaveOverview.leavesToday}</p>
                                </div>
                                <Calendar size={24} className="text-orange-600" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg border border-blue-200">
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">Attendance Rate</p>
                                    <p className="text-2xl font-bold text-blue-600 mt-1">96%</p>
                                </div>
                                <TrendingUp size={24} className="text-blue-600" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Pending Leave Requests */}
            <Card className="h-full bg-gradient-to-br from-white to-red-50 border border-red-100 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex items-center gap-2 border-b border-red-100 bg-gradient-to-r from-red-50 to-rose-50">
                    <AlertCircle size={20} className="text-red-600" />
                    <h6 className="font-bold text-slate-700">Pending Leave Requests</h6>
                    <span className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        {leaveOverview.pendingRequests} pending
                    </span>
                </CardHeader>
                <CardBody>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1 group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-slate-700">Employee {1000 + i}</p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            <Badge gradient="from-orange-600 to-amber-500" size="sm">
                                                Sick Leave
                                            </Badge>
                                        </p>
                                        <p className="text-xs text-slate-400 mt-2">2 days pending approval</p>
                                    </div>
                                    <ArrowRight size={16} className="text-red-400 group-hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>

            {/* Recent Activity */}
            <Card className="h-full bg-gradient-to-br from-white to-purple-50 border border-purple-100 hover:shadow-lg transition-all duration-300">
                <CardHeader className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                    <h6 className="font-bold text-slate-700 flex items-center gap-2">
                        <Activity size={18} className="text-purple-600" />
                        Recent HR Activity
                    </h6>
                </CardHeader>
                <CardBody>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
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
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <FileText size={28} className="text-slate-300 mb-2" />
                                <p className="text-slate-400 font-medium">No recent activity</p>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>
        </div>
    )
}
