/**
 * @file ScreensTab.jsx
 * @description Screens tab - list and manage project screens
 */

import React, { useState } from 'react'
import { Card, CardHeader, CardBody, Badge, Button } from '../../../components/TailAdminComponents'
import { Table, Select } from '../../../components/FormComponents'
import { Plus, Edit, Trash2, Calendar, User } from 'lucide-react'
import { getStatusGradient, formatDateDisplay } from '../utils/formatters'
import { SCREEN_STATUSES } from '../utils/constants'

export function ScreensTab({
    screens = [],
    onAdd,
    onEdit,
    onDelete,
    onUpdateStatus,
    isLoading = false
}) {
    const [statusFilter, setStatusFilter] = useState('')

    const filteredScreens = React.useMemo(
        () => screens.filter(s => !statusFilter || s.status === statusFilter),
        [screens, statusFilter]
    )

    const columns = React.useMemo(
        () => [
            {
                key: 'title',
                label: 'Screen Title',
                sortable: true,
                render: (val, row) => (
                    <div>
                        <h6 className="mb-0 text-sm font-bold text-slate-700">{val}</h6>
                        <p className="mb-0 text-xs text-slate-500">{row.module}</p>
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
                key: 'assigneeName',
                label: 'Assigned To',
                render: (val) => <span className="text-sm text-slate-600">{val || '—'}</span>
            },
            {
                key: 'plannedDeadline',
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
                            title="Edit Screen"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={() => onDelete(row.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Screen"
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
                            ...SCREEN_STATUSES.map(s => ({ value: s, label: s }))
                        ]}
                        className="mb-0"
                    />
                </div>
                <Button variant="primary" size="sm" onClick={onAdd}>
                    <Plus size={14} className="mr-2" /> Add Screen
                </Button>
            </div>

            <Card>
                <CardBody className="px-0 pt-0 pb-2">
                    <Table
                        columns={columns}
                        data={filteredScreens}
                        loading={isLoading}
                        pagination={true}
                        pageSize={10}
                    />
                </CardBody>
            </Card>
        </div>
    )
}
