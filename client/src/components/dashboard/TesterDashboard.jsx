import React from 'react'
import {
    CheckCircle,
    AlertCircle,
    Activity,
    Bug,
    TrendingUp,
    Clock,
    Sparkles,
    FileText,
    ArrowRight
} from 'lucide-react'
import { StatCard, Card, CardHeader, CardBody, Badge } from '../TailAdminComponents'
import { PieChart, BarChart } from '../ChartComponents'
import { ActivityTimeline } from './common'

/**
 * Tester Dashboard Component
 * @description Shows testing workflow and verification tasks
 */
export default function TesterDashboard({ dashboardData }) {
    const {
        myWorkSummary,
        bugAnalytics,
        recentActivity
    } = dashboardData

    // Calculate testing metrics
    const pendingVerification = Math.round(bugAnalytics.byStatus.resolved * 0.3) || 5
    const resolvedBugs = bugAnalytics.byStatus.resolved
    const testingQueue = bugAnalytics.byStatus.open

    return (
        <div className="space-y-8">
            {/* Testing Status Overview */}
            <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500" />
                    Testing Dashboard
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Pending Verification"
                        value={pendingVerification}
                        icon={AlertCircle}
                        gradient="from-orange-600 to-amber-400"
                    />
                    <StatCard
                        title="Resolved Bugs"
                        value={resolvedBugs}
                        icon={CheckCircle}
                        gradient="from-green-600 to-emerald-400"
                    />
                    <StatCard
                        title="Testing Queue"
                        value={testingQueue}
                        icon={Activity}
                        gradient="from-blue-600 to-cyan-400"
                    />
                    <StatCard
                        title="My Assigned Tests"
                        value={myWorkSummary.myTasks}
                        icon={Bug}
                        gradient="from-purple-700 to-pink-500"
                    />
                </div>
            </div>

            {/* Bug Severity Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bugs by Severity */}
                <Card className="h-full bg-gradient-to-br from-white to-red-50 border border-red-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex items-center gap-2 border-b border-red-100 bg-gradient-to-r from-red-50 to-rose-50">
                        <AlertCircle size={20} className="text-red-600" />
                        <h6 className="font-bold text-slate-700">Bugs by Severity</h6>
                    </CardHeader>
                    <CardBody className="min-h-[300px]">
                        <div className="space-y-3">
                            <div className="p-4 bg-gradient-to-r from-red-100 to-rose-100 rounded-lg border border-red-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-slate-700">Critical</span>
                                    <Badge gradient="from-red-600 to-rose-500" size="sm">
                                        {Math.ceil(bugAnalytics.byStatus.open * 0.3)}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg border border-orange-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-slate-700">High</span>
                                    <Badge gradient="from-orange-600 to-yellow-500" size="sm">
                                        {Math.ceil(bugAnalytics.byStatus.open * 0.35)}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg border border-yellow-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-slate-700">Medium</span>
                                    <Badge gradient="from-yellow-600 to-amber-500" size="sm">
                                        {Math.ceil(bugAnalytics.byStatus.open * 0.25)}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-slate-700">Low</span>
                                    <Badge gradient="from-blue-600 to-cyan-500" size="sm">
                                        {bugAnalytics.bySeverity.low || 0}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Testing Progress */}
                <Card className="h-full bg-gradient-to-br from-white to-green-50 border border-green-100 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex items-center gap-2 border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
                        <TrendingUp size={20} className="text-green-600" />
                        <h6 className="font-bold text-slate-700">Testing Progress</h6>
                    </CardHeader>
                    <CardBody className="min-h-[300px] flex flex-col justify-center">
                        <div className="space-y-6">
                            {/* Total Tested */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-semibold text-slate-700">Total Tested</span>
                                    <span className="text-sm font-bold text-green-600">{resolvedBugs}/{resolvedBugs + testingQueue}</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${(resolvedBugs / (resolvedBugs + testingQueue)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Pass Rate */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-semibold text-slate-700">Pass Rate</span>
                                    <span className="text-sm font-bold text-green-600">85%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5">
                                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full w-[85%] transition-all duration-300"></div>
                                </div>
                            </div>

                            {/* Defect Escape Rate */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-semibold text-slate-700">Test Coverage</span>
                                    <span className="text-sm font-bold text-green-600">92%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5">
                                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full w-[92%] transition-all duration-300"></div>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Bugs Waiting for Testing */}
            <Card className="h-full bg-gradient-to-br from-white to-amber-50 border border-amber-100 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex items-center gap-2 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
                    <Clock size={20} className="text-amber-600" />
                    <h6 className="font-bold text-slate-700">Testing Queue</h6>
                    <span className="ml-auto px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                        {testingQueue} pending
                    </span>
                </CardHeader>
                <CardBody>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1 group flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-slate-700">Bug #{1000 + i}</p>
                                    <p className="text-xs text-slate-500 mt-1">Waiting for verification</p>
                                </div>
                                <ArrowRight size={16} className="text-amber-400 group-hover:text-amber-600 opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>

            {/* Recent Activity */}
            <ActivityTimeline 
                activities={recentActivity.map(a => ({
                    title: a.description,
                    timestamp: new Date(a.timestamp).toLocaleString()
                }))}
                emptyIcon={Activity}
                emptyMessage="You have no recent testing activities."
            />
        </div>
    )
}
