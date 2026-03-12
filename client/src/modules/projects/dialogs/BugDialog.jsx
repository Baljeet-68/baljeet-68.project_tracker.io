/**
 * @file BugDialog.jsx
 * @description Modal for creating/editing bugs
 */

import React, { useState, useEffect } from 'react'
import { Modal, InputGroup, Select } from '../../../components/FormComponents'
import { Button } from '../../../components/TailAdminComponents'
import { AlertCircle } from 'lucide-react'
import { BUG_SEVERITIES } from '../utils/constants'

export function BugDialog({
    isOpen,
    onClose,
    onSubmit,
    screens,
    developers,
    editingBug = null,
    title = 'Create Bug'
}) {
    const [form, setForm] = useState({
        description: '',
        severity: 'medium',
        screenId: '',
        module: '',
        assignedDeveloperId: '',
        deadline: ''
    })

    useEffect(() => {
        if (editingBug) {
            setForm({
                description: editingBug.description || '',
                severity: editingBug.severity || 'medium',
                screenId: editingBug.screenId || '',
                module: editingBug.module || '',
                assignedDeveloperId: editingBug.assignedDeveloperId || '',
                deadline: editingBug.deadline ? new Date(editingBug.deadline).toISOString().split('T')[0] : ''
            })
        } else {
            setForm({
                description: '',
                severity: 'medium',
                screenId: '',
                module: '',
                assignedDeveloperId: '',
                deadline: ''
            })
        }
    }, [editingBug, isOpen])

    const handleSubmit = () => {
        if (!form.description.trim()) {
            alert('Please enter a bug description')
            return
        }
        onSubmit(form)
    }

    return (
        <Modal
            isOpen={isOpen}
            title={title}
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" size="sm" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSubmit}>
                        {editingBug ? 'Update Bug' : 'Create Bug'}
                    </Button>
                </>
            }
        >
            <InputGroup
                label="Description"
                icon={<AlertCircle size={16} />}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the bug..."
                as="textarea"
                rows={3}
            />
            <Select
                label="Severity"
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                options={BUG_SEVERITIES}
            />
            <Select
                label="Screen (Optional)"
                value={form.screenId}
                onChange={(e) => setForm({ ...form, screenId: e.target.value })}
                options={[
                    { label: 'Select Screen', value: '' },
                    ...(screens?.map(s => ({ label: s.title, value: s.id })) || [])
                ]}
            />
            <InputGroup
                label="Module"
                value={form.module}
                onChange={(e) => setForm({ ...form, module: e.target.value })}
                placeholder="e.g., Frontend, Backend, Database"
            />
            <Select
                label="Assign Developer"
                value={form.assignedDeveloperId}
                onChange={(e) => setForm({ ...form, assignedDeveloperId: e.target.value })}
                options={[
                    { label: 'Select Developer', value: '' },
                    ...(developers?.map(d => ({ label: d.name, value: d.id })) || [])
                ]}
            />
            <InputGroup
                label="Deadline (Optional)"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
        </Modal>
    )
}
