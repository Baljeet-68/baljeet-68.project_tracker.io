/**
 * @file DocumentsTab.jsx
 * @description Documents tab - upload and manage project documents
 */

import React, { useState } from 'react'
import { Card, CardHeader, CardBody, Button } from '../../../components/TailAdminComponents'
import { Table, InputGroup } from '../../../components/FormComponents'
import { Plus, Download, Trash2, Eye, FileText } from 'lucide-react'
import { formatDateDisplay, formatFileSize } from '../utils/formatters'

export function DocumentsTab({
    documents = [],
    onAdd,
    onDelete,
    onDownload,
    onPreview,
    isLoading = false,
    searchQuery,
    onSearchChange
}) {
    const [sortColumn, setSortColumn] = useState('createdAt')
    const [sortDirection, setSortDirection] = useState('desc')

    const sortedDocuments = React.useMemo(() => {
        const sorted = [...documents].sort((a, b) => {
            let valA = a[sortColumn]
            let valB = b[sortColumn]

            if (sortColumn === 'createdAt') {
                valA = new Date(valA)
                valB = new Date(valB)
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase()
                valB = valB.toLowerCase()
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1
            return 0
        })
        return sorted
    }, [documents, sortColumn, sortDirection])

    const filteredDocuments = React.useMemo(() => {
        if (!searchQuery) return sortedDocuments
        return sortedDocuments.filter(doc =>
            doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [sortedDocuments, searchQuery])

    const columns = React.useMemo(
        () => [
            {
                key: 'title',
                label: 'Document',
                sortable: true,
                render: (val, row) => (
                    <div>
                        <h6 className="mb-0 text-sm font-bold text-slate-700">{val}</h6>
                        <p className="mb-0 text-xs text-slate-500 truncate">{row.description || row.fileName}</p>
                    </div>
                )
            },
            {
                key: 'fileType',
                label: 'Type',
                sortable: true,
                render: (val) => <span className="text-sm text-slate-600">{val || 'Unknown'}</span>
            },
            {
                key: 'fileSize',
                label: 'Size',
                sortable: true,
                render: (val) => <span className="text-sm text-slate-600">{formatFileSize(val || 0)}</span>
            },
            {
                key: 'createdByName',
                label: 'Uploaded By',
                render: (val) => <span className="text-sm text-slate-600">{val || '—'}</span>
            },
            {
                key: 'createdAt',
                label: 'Date',
                sortable: true,
                render: (val) => <span className="text-sm text-slate-600">{formatDateDisplay(val)}</span>
            },
            {
                key: 'actions',
                label: 'Actions',
                render: (_, row) => (
                    <div className="flex gap-2">
                        {row.fileType?.startsWith('image/') && (
                            <button
                                onClick={() => onPreview(row)}
                                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                title="Preview"
                            >
                                <Eye size={16} />
                            </button>
                        )}
                        <button
                            onClick={() => onDownload(row)}
                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            title="Download"
                        >
                            <Download size={16} />
                        </button>
                        <button
                            onClick={() => onDelete(row.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )
            }
        ],
        [onPreview, onDownload, onDelete]
    )

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end gap-4">
                <div className="flex-1 max-w-xs">
                    <InputGroup
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
                <Button variant="primary" size="sm" onClick={onAdd}>
                    <Plus size={14} className="mr-2" /> Upload Document
                </Button>
            </div>

            <Card>
                <CardBody className="px-0 pt-0 pb-2">
                    {documents.length === 0 ? (
                        <div className="p-6 text-center">
                            <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-sm text-slate-500">No documents yet. Upload one to get started.</p>
                        </div>
                    ) : (
                        <Table
                            columns={columns}
                            data={filteredDocuments}
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
