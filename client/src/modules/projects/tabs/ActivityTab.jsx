/**
 * @file ActivityTab.jsx
 * @description Activity tab - project audit log and timeline
 */

import React from 'react'
import { Card, CardHeader, CardBody } from '../../../components/TailAdminComponents'
import { formatDateDisplay } from '../utils/formatters'
import {
    Bug,
    Layout,
    Flag,
    FileText,
    Zap,
    User,
    Clock
} from 'lucide-react'

const ACTIVITY_ICONS = {
    bug_created: <Bug size={16} className="text-red-500" />,
    bug_updated: <Bug size={16} className="text-orange-500" />,
    screen_created: <Layout size={16} className="text-blue-500" />,
    screen_updated: <Layout size={16} className="text-blue-400" />,
    milestone_created: <Flag size={16} className="text-purple-500" />,
    milestone_updated: <Flag size={16} className="text-purple-400" />,
    document_uploaded: <FileText size={16} className="text-green-500" />,
    project_document: <FileText size={16} className="text-slate-500" />,
    project_updated: <Zap size={16} className="text-yellow-500" />,
    default: <Clock size={16} className="text-slate-400" />
}

function getActivityIcon(entityType, action) {
    const key = `${entityType}_${action}`.toLowerCase()
    return ACTIVITY_ICONS[key] || ACTIVITY_ICONS.default
}

function getActivityDescription(activity) {
    const { entityType, action, createdByName } = activity

    const actionMap = {
        created: `created ${entityType}`,
        updated: `updated ${entityType}`,
        deleted: `deleted ${entityType}`,
        status_change: `changed ${entityType} status`,
        uploaded: `uploaded ${entityType}`,
        viewed: `viewed ${entityType}`,
        default: action
    }

    const desc = actionMap[action] || actionMap.default
    return `${createdByName || 'Unknown'} ${desc}`
}

export function ActivityTab({
    activity = [],
    isLoading = false
}) {
    const [visibleCount, setVisibleCount] = React.useState(10)

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 10)
    }

    const visibleActivity = activity.slice(0, visibleCount)
    const hasMore = activity.length > visibleCount

    if (isLoading) {
        return <div className="p-6 text-center text-slate-500">Loading activity...</div>
    }

    if (activity.length === 0) {
        return (
            <Card>
                <CardBody className="text-center py-12">
                    <Clock size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No activity recorded yet.</p>
                </CardBody>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardBody className="p-0">
                    <div className="divide-y">
                        {visibleActivity.map((entry, index) => (
                            <div key={entry.id || index} className="flex gap-4 p-4 hover:bg-slate-50 transition-colors">
                                {/* Timeline Icon */}
                                <div className="flex flex-col items-center flex-shrink-0">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        {getActivityIcon(entry.entityType, entry.action)}
                                    </div>
                                    {index !== visibleActivity.length - 1 && (
                                        <div className="h-8 w-0.5 bg-slate-200 mt-2"></div>
                                    )}
                                </div>

                                {/* Activity Details */}
                                <div className="flex-1 min-w-0 mt-1">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <h4 className="text-sm font-semibold text-slate-900">
                                            {getActivityDescription(entry)}
                                        </h4>
                                        <span className="text-xs text-slate-500 whitespace-nowrap">
                                            {formatDateDisplay(entry.createdAt)}
                                        </span>
                                    </div>

                                    {/* Changes Summary */}
                                    {entry.changes && (
                                        <div className="text-xs text-slate-600 space-y-1 mt-2">
                                            {Object.entries(entry.changes).map(([key, val]) => {
                                                // Skip internal fields
                                                if (['oldStatus', 'newStatus', 'bugNumber', 'description', 'title', 'deadline'].includes(key)) {
                                                    return null
                                                }
                                                return (
                                                    <div key={key}>
                                                        <span className="font-medium capitalize">{key}: </span>
                                                        <span className="text-slate-600">
                                                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* Status Change */}
                                    {entry.changes?.oldStatus && entry.changes?.newStatus && (
                                        <div className="text-xs text-slate-600 mt-2">
                                            <span className="font-medium">Status: </span>
                                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded mr-1">
                                                {entry.changes.oldStatus}
                                            </span>
                                            <span>→</span>
                                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded ml-1">
                                                {entry.changes.newStatus}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* User Avatar */}
                                <div className="flex-shrink-0 flex items-center">
                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <User size={14} className="text-white" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>

            {hasMore && (
                <div className="text-center pt-4">
                    <button
                        onClick={handleLoadMore}
                        className="px-6 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                    >
                        Load More Activity
                    </button>
                </div>
            )}
        </div>
    )
}
