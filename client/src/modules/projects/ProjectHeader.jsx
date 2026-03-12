/**
 * @file ProjectHeader.jsx
 * @description Project header with status, progress, and stats
 */

import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Users, AlertCircle, CheckCircle } from 'lucide-react'
import { Badge, StatCard } from '../../components/TailAdminComponents'
import { getStatusGradient, calculateProjectProgress, formatDateDisplay } from './utils/formatters'

export function ProjectHeader({ project, screenshots, bugs }) {
    const progress = useMemo(
        () => calculateProjectProgress(screenshots),
        [screenshots]
    )

    const stats = useMemo(() => {
        return {
            totalScreens: screenshots?.length || 0,
            completedScreens: screenshots?.filter(s => s.status === 'Done').length || 0,
            openBugs: bugs?.filter(b => b.status === 'Open' || b.status === 'In Progress').length || 0,
            upcomingDeadlines: project?.upcomingDeadlines || 0
        }
    }, [screenshots, bugs, project])

    if (!project) return null

    return (
        <div className="mb-6">
            {/* Top Navigation */}
            <div className="flex items-center gap-2 mb-4">
                <Link to="/projects" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <ArrowLeft size={20} className="text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
                    <p className="text-sm text-slate-500">{project.client}</p>
                </div>
            </div>

            {/* Status & Progress */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-slate-600">Progress</h3>
                        <span className="text-lg font-bold text-slate-900">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-700"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        {stats.completedScreens} of {stats.totalScreens} screens completed
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Badge gradient={getStatusGradient(project.status)} size="lg">
                        {project.status}
                    </Badge>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={CheckCircle}
                    title="Screens"
                    value={stats.totalScreens}
                    change={stats.completedScreens}
                    gradient="from-emerald-500 to-emerald-600"
                />
                <StatCard
                    icon={AlertCircle}
                    title="Open Bugs"
                    value={stats.openBugs}
                    change={Math.max(0, stats.openBugs - 5)}
                    changeType="negative"
                    gradient="from-red-500 to-red-600"
                />
                <StatCard
                    icon={Calendar}
                    title="Upcoming"
                    value={stats.upcomingDeadlines}
                    change={0}
                    gradient="from-blue-500 to-blue-600"
                />
                <StatCard
                    icon={Users}
                    title="Developers"
                    value={project.developerNames?.length || 0}
                    change={0}
                    gradient="from-purple-500 to-purple-600"
                />
            </div>

            {/* Description */}
            {project.description && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-slate-700">{project.description}</p>
                </div>
            )}
        </div>
    )
}
