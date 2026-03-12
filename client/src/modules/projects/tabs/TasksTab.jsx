/**
 * @file TasksTab.jsx
 * @description Tasks tab - display aggregated tasks for the project
 */

import React, { useMemo } from 'react'
import { Card, CardHeader, CardBody, Badge } from '../../../components/TailAdminComponents'
import { AlertCircle, CheckSquare, BookOpen } from 'lucide-react'
import { formatDateDisplay } from '../utils/formatters'

const PRIORITY_COLORS = {
    high: 'from-red-600 to-rose-400',
    medium: 'from-orange-500 to-yellow-400',
    low: 'from-blue-600 to-cyan-400'
}

export function TasksTab({
    tasks = [],
    isLoading = false
}) {
    const tasksByCategory = useMemo(() => {
        return tasks.reduce((acc, task) => {
            if (!acc[task.category]) acc[task.category] = []
            acc[task.category].push(task)
            return acc
        }, {})
    }, [tasks])

    const categories = useMemo(
        () => Object.keys(tasksByCategory).sort(),
        [tasksByCategory]
    )

    if (isLoading) {
        return <div className="p-6 text-center text-slate-500">Loading tasks...</div>
    }

    if (tasks.length === 0) {
        return (
            <Card>
                <CardBody className="text-center py-12">
                    <CheckSquare size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No tasks at this time. Great job!</p>
                </CardBody>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {categories.map(category => (
                <Card key={category}>
                    <CardHeader>
                        <h3 className="text-lg font-bold text-slate-900 capitalize">
                            {category.replace('_', ' ')} ({tasksByCategory[category].length})
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {tasksByCategory[category].map(task => (
                                <div
                                    key={task.id}
                                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-slate-900 truncate">
                                            {task.title}
                                        </h4>
                                        <p className="text-xs text-slate-600 mt-1">
                                            {task.description}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            {task.priority && (
                                                <Badge gradient={PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.low} size="xs">
                                                    {task.priority}
                                                </Badge>
                                            )}
                                            {task.module && (
                                                <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                                                    {task.module}
                                                </span>
                                            )}
                                            {task.createdAt && (
                                                <span className="text-xs text-slate-500">
                                                    {formatDateDisplay(task.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {task.actionUrl && (
                                        <a
                                            href={task.actionUrl}
                                            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm whitespace-nowrap"
                                        >
                                            View →
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            ))}
        </div>
    )
}
