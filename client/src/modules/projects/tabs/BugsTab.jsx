/**
 * @file BugsTab.jsx
 * @description Bugs tab - bug tracking and management
 */

import React, { useState, useMemo } from 'react'
import { Card, CardHeader, CardBody, Badge, Button } from '../../../components/TailAdminComponents'
import { Table, Select } from '../../../components/FormComponents'
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react'
import { getStatusGradient, getSeverityGradient, formatDateDisplay } from '../utils/formatters'
import { BUG_STATUSES, BUG_SEVERITIES } from '../utils/constants'

export function BugsTab({
    bugs = [],
    onAdd,
    onEdit,
    onDelete,
    onUpdateStatus,
    isLoading = false
}) {
    const [statusFilter, setStatusFilter] = useState('')
    const [severityFilter, setSeverityFilter] = useState('')

    const filteredBugs = useMemo(() => {
        return bugs.filter(b => {
            if (statusFilter && b.status !== statusFilter) return false
            if (severityFilter && b.severity !== severityFilter) return false
            return true
        })
    }, [bugs, statusFilter, severityFilter])

    const bugStats = useMemo(() => {
        return {
            total: bugs.length,
            open: bugs.filter(b => b.status === 'Open' || b.status === 'In Progress').length,
            resolved: bugs.filter(b => b.status === 'Resolved').length,
            closed: bugs.filter(b => b.status === 'Closed').length,
            critical: bugs.filter(b => b.severity === 'critical').length
        }
    }, [bugs])

    const columns = useMemo(
        () => [
            {
                key: 'bugNumber',
                label: '#',
                sortable: true,
                render: (val) => <span className="font-bold text-slate-700">#{val}</span>
            },
            {
                key: 'description',
                label: 'Description',
                sortable: true,
                render: (val, row) => (
                    <div>
                        <h6 className="mb-0 text-sm font-bold text-slate-700 truncate">{val}</h6>
                        <p className="mb-0 text-xs text-slate-500">{row.screenTitle}</p>
                    </div>
                )
            },
            {
                key: 'severity',
                label: 'Severity',
                sortable: true,
                render: (severity) => (
                    <Badge gradient={getSeverityGradient(severity)} size="sm">
                        {severity}
                    </Badge>
                )
            },
            {
                key: 'status',
                label: 'Status',
                sortable: true,
                render: (status) => (
                    <Badge gradient={getStatusGradient(status)} size="sm">
                        {status}
                    </Badge>
                )
            },
            {
                key: 'assignedDeveloperName',
                label: 'Assigned To',
                render: (val) => <span className="text-sm text-slate-600">{val || 'Unassigned'}</span>
            },
            {
                key: 'deadline',
                label: 'Deadline',
                render: (val) => <span className="text-sm text-slate-600">{val ? formatDateDisplay(val) : '—'}</span>
            },
            {
                key: 'actions',
                label: 'Actions',
                render: (_, row) => (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onEdit(row)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit Bug"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={() => onDelete(row.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Bug"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )
            }
        ],
        [onEdit, onDelete]
    )

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <Card className="text-center">
                    <CardBody className="py-3">
                        <p className="text-2xl font-bold text-slate-900">{bugStats.total}</p>
                        <p className="text-xs text-slate-500 mt-1">Total</p>
                    </CardBody>
                </Card>
                <Card className="text-center border-red-200">
                    <CardBody className="py-3">
                        <p className="text-2xl font-bold text-red-600">{bugStats.open}</p>
                        <p className="text-xs text-slate-500 mt-1">Open</p>
                    </CardBody>
                </Card>
                <Card className="text-center border-emerald-200">
                    <CardBody className="py-3">
                        <p className="text-2xl font-bold text-emerald-600">{bugStats.resolved}</p>
                        <p className="text-xs text-slate-500 mt-1">Resolved</p>
                    </CardBody>
                </Card>
                <Card className="text-center border-slate-200">
                    <CardBody className="py-3">
                        <p className="text-2xl font-bold text-slate-600">{bugStats.closed}</p>
                        <p className="text-xs text-slate-500 mt-1">Closed</p>
                    </CardBody>
                </Card>
                <Card className="text-center border-red-500">
                    <CardBody className="py-3">
                        <p className="text-2xl font-bold text-red-700">{bugStats.critical}</p>
                        <p className="text-xs text-slate-500 mt-1">Critical</p>
                    </CardBody>
                </Card>
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-4 flex-1 flex-wrap">
                    <div className="max-w-xs">
                        <Select
                            label="Status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={[
                                { value: '', label: 'All Statuses' },
                                ...BUG_STATUSES.map(s => ({ value: s, label: s }))
                            ]}
                            className="mb-0"
                        />
                    </div>
                    <div className="max-w-xs">
                        <Select
                            label="Severity"
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            options={[
                                { value: '', label: 'All Severities' },
                                ...BUG_SEVERITIES
                            ]}
                            className="mb-0"
                        />
                    </div>
                </div>
                <Button variant="primary" size="sm" onClick={onAdd}>
                    <Plus size={14} className="mr-2" /> Report Bug
                </Button>
            </div>

            {/* Bugs Table */}
            <Card>
                <CardBody className="px-0 pt-0 pb-2">
                    <Table
                        columns={columns}
                        data={filteredBugs}
                        loading={isLoading}
                        pagination={true}
                        pageSize={10}
                    />
                </CardBody>
            </Card>
        </div>
    )
}
