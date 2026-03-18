/**
 * @file common.jsx
 * @description Shared dashboard components for HR, Management, and other role dashboards
 */

import React from 'react'

export function StatsGrid({ stats = [] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
                const Icon = stat.icon
                return (
                    <div key={i} className="p-6 bg-white rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">{stat.title}</p>
                                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                            {Icon && <Icon className="w-8 h-8 text-gray-400" />}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export function ActivityTimeline({ activities = [], emptyIcon: Icon, emptyMessage }) {
    if (!activities || activities.length === 0) {
        return (
            <div className="text-center py-12">
                {Icon && <Icon className="w-12 h-12 mx-auto text-gray-400 mb-4" />}
                <p className="text-gray-500">{emptyMessage || 'No activity'}</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
                {activities.map((activity, i) => (
                    <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-500">{activity.timestamp}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function LeaveBreakdown({ leaveTypes = [] }) {
    const colorMap = {
        sick: 'bg-red-500',
        casual: 'bg-blue-500',
        earned: 'bg-green-500',
        unpaid: 'bg-yellow-500',
        default: 'bg-gray-500'
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Leave Breakdown</h3>
            <div className="space-y-4">
                {leaveTypes.map((leave, i) => (
                    <div key={i}>
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">{leave.label}</span>
                            <span className="text-sm text-gray-500">{leave.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${colorMap[leave.color] || colorMap.default}`}
                                style={{ width: `${leave.pct || 0}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function EmployeeStatus({ workingToday = 0, onLeave = 0, attendanceRate = 0 }) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Employee Status</h3>
            <div className="space-y-4">
                <div>
                    <p className="text-sm text-gray-600 mb-1">Working Today</p>
                    <p className="text-2xl font-bold text-blue-600">{workingToday}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-600 mb-1">On Leave</p>
                    <p className="text-2xl font-bold text-red-600">{onLeave}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                                className="h-2 rounded-full bg-green-500"
                                style={{ width: `${attendanceRate}%` }}
                            />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">{attendanceRate}%</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function PendingLeavesCard({ requests = [] }) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Pending Leave Requests</h3>
            {requests.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending requests</p>
            ) : (
                <div className="space-y-3">
                    {requests.map((req, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{req.userName}</p>
                                <p className="text-xs text-gray-500">{req.leaveType}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">{req.days} days</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
