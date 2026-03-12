/**
 * @file DocumentDialog.jsx
 * @description Modal for uploading documents
 */

import React, { useState, useEffect } from 'react'
import { Modal, InputGroup } from '../../../components/FormComponents'
import { Button } from '../../../components/TailAdminComponents'
import { Upload } from 'lucide-react'

export function DocumentDialog({
    isOpen,
    onClose,
    onSubmit,
    isUploading = false,
    uploadProgress = 0
}) {
    const [form, setForm] = useState({
        title: '',
        description: '',
        file: null
    })

    useEffect(() => {
        if (!isOpen) {
            setForm({ title: '', description: '', file: null })
        }
    }, [isOpen])

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            setForm({ ...form, file })
        }
    }

    const handleSubmit = () => {
        if (!form.title.trim()) {
            alert('Please enter document title')
            return
        }
        if (!form.file) {
            alert('Please select a file')
            return
        }
        onSubmit(form)
    }

    return (
        <Modal
            isOpen={isOpen}
            title="Upload Document"
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" size="sm" onClick={onClose} disabled={isUploading}>
                        Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isUploading}>
                        {isUploading ? `Uploading (${uploadProgress}%)` : 'Upload'}
                    </Button>
                </>
            }
        >
            <InputGroup
                label="Document Title"
                icon={<Upload size={16} />}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., API Documentation, Design Mockup"
                disabled={isUploading}
            />
            <InputGroup
                label="Description (Optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Additional details about this document..."
                as="textarea"
                rows={2}
                disabled={isUploading}
            />
            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select File
                </label>
                <input
                    type="file"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-600
            hover:file:bg-indigo-100
            disabled:opacity-50 disabled:cursor-not-allowed"
                    accept=".pdf,.png,.jpg,.jpeg"
                />
                <p className="text-xs text-slate-500 mt-1">
                    Supported: PDF, PNG, JPG (Max 10MB)
                </p>
            </div>

            {isUploading && (
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">Uploading...</span>
                        <span className="text-sm font-bold text-slate-900">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {form.file && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-slate-700">
                        <strong>File:</strong> {form.file.name} ({(form.file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                </div>
            )}
        </Modal>
    )
}
