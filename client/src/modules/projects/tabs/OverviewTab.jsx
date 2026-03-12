/**
 * @file OverviewTab.jsx
 * @description Project overview tab - displays summary and team info
 */

import React from 'react'
import { Card, CardHeader, CardBody } from '../../../components/TailAdminComponents'
import { Users, Calendar, Briefcase, FileText } from 'lucide-react'
import { formatDateDisplay } from '../utils/formatters'

export function OverviewTab({ project, screens, bugs, milestones }) {
    if (!project) return null

    const completedScreens = screens?.filter(s => s.status === 'Done').length || 0
    const openBugs = bugs?.filter(b => b.status === 'Open' || b.status === 'In Progress').length || 0
    const completedMilestones = milestones?.filter(m => m.status === 'Completed').length || 0

    return (
        <div className="space-y-6">
            {/* Project Summary Section */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-bold text-slate-900">Project Summary</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-slate-600">Project Name</label>
                            <p className="text-sm text-slate-900 mt-1">{project.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-600">Client</label>
                            <p className="text-sm text-slate-900 mt-1">{project.client || '—'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-600">Status</label>
                            <p className="text-sm text-slate-900 mt-1">{project.status || '—'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-600">Created By</label>
                            <p className="text-sm text-slate-900 mt-1">{project.createdByName || '—'}</p>
                        </div>
                    </div>

                    {project.description && (
                        <div>
                            <label className="text-sm font-semibold text-slate-600">Description</label>
                            <p className="text-sm text-slate-700 mt-1">{project.description}</p>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Timeline Section */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Calendar size={18} />
                        Timeline
                    </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-slate-600">Start Date</label>
                            <p className="text-sm text-slate-900 mt-1">
                                {project.startDate ? formatDateDisplay(project.startDate) : '—'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-600">End Date</label>
                            <p className="text-sm text-slate-900 mt-1">
                                {project.endDate ? formatDateDisplay(project.endDate) : '—'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-600">Duration</label>
                            <p className="text-sm text-slate-900 mt-1">
                                {project.startDate && project.endDate
                                    ? `${Math.ceil(
                                        (new Date(project.endDate) - new Date(project.startDate)) /
                                        (1000 * 60 * 60 * 24)
                                    )} days`
                                    : '—'}
                            </p>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Team Section */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Users size={18} />
                        Team Members
                    </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                    {/* Tester */}
                    <div>
                        <label className="text-sm font-semibold text-slate-600">Lead Tester</label>
                        <p className="text-sm text-slate-900 mt-1">{project.testerName || '—'}</p>
                    </div>

                    {/* Developers */}
                    <div>
                        <label className="text-sm font-semibold text-slate-600">Assigned Developers</label>
                        {project.developerNames && project.developerNames.length > 0 ? (
                            <ul className="mt-2 space-y-1">
                                {project.developerNames.map(dev => (
                                    <li key={dev.id} className="flex items-center gap-2 text-sm text-slate-700">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                        {dev.name}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500 mt-1">No developers assigned</p>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Milestone Overview */}
            {milestones && milestones.length > 0 && (
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Briefcase size={18} />
                            Milestone Overview
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-2">
                            <p className="text-sm text-slate-600">
                                <strong>{completedMilestones}</strong> of <strong>{milestones.length}</strong> milestones completed ({completedMilestones > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0}%)
                            </p>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                                    style={{
                                        width: `${milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Stats Summary */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <FileText size={18} />
                        Project Statistics
                    </h3>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900">{screens?.length || 0}</p>
                            <p className="text-xs text-slate-600 mt-1">Total Screens</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-emerald-600">{completedScreens}</p>
                            <p className="text-xs text-slate-600 mt-1">Completed</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{openBugs}</p>
                            <p className="text-xs text-slate-600 mt-1">Open Bugs</p>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    )
}
