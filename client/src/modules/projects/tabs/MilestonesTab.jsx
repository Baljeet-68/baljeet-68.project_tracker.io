/**
 * @file MilestonesTab.jsx
 * @description Milestones tab - manage project milestones
 */

import React, { useState } from 'react'
import { Card, CardHeader, CardBody, Badge, Button } from '../../../components/TailAdminComponents'
import { Table, Select } from '../../../components/FormComponents'
import { Plus, Edit, Trash2, Flag } from 'lucide-react'
import { getStatusGradient, formatDateDisplay } from '../utils/formatters'
import { MILESTONE_STATUSES } from '../utils/constants'

export function MilestonesTab({
    milestones = [],
    onAdd,
    onEdit,
    onDelete,
    isLoading = false
}) {
    const [statusFilter, setStatusFilter] = useState('')

    const filteredMilestones = React.useMemo(
        () => milestones.filter(m => !statusFilter || m.status === statusFilter),
        [milestones, statusFilter]
    )

    const columns = React.useMemo(
        () => [
            {
                key: 'milestoneNumber',
                label: 'Milestone',
                sortable: true,
                render: (val, row) => (
                    <div>
                        <h6 className="mb-0 text-sm font-bold text-slate-700">{val}</h6>
                        {row.module && <p className="mb-0 text-xs text-slate-500">{row.module}</p>}
                    </div>
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
                key: 'timeline',
                label: 'Timeline',
                sortable: true,
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
                            title="Edit Milestone"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={() => onDelete(row.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Milestone"
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
            <div className="flex justify-between items-center gap-4">
                <div className="max-w-xs">
                    <Select
                        label="Filter by Status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        options={[
                            { value: '', label: 'All Statuses' },
                            ...MILESTONE_STATUSES.map(s => ({ value: s, label: s }))
                        ]}
                        className="mb-0"
                    />
                </div>
                <Button variant="primary" size="sm" onClick={onAdd}>
                    <Plus size={14} className="mr-2" /> Add Milestone
                </Button>
            </div>

            <Card>
                <CardBody className="px-0 pt-0 pb-2">
                    {milestones.length === 0 ? (
                        <div className="p-6 text-center">
                            <Flag size={32} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-sm text-slate-500">No milestones yet. Create one to get started.</p>
                        </div>
                    ) : (
                        <Table
                            columns={columns}
                            data={filteredMilestones}
                            loading={isLoading}
                            pagination={true}
                            pageSize={10}
                        />
                    )}
                </CardBody>
            </Card>
        </div>
    )
}
