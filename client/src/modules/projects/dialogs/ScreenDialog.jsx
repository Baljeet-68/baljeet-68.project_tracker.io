/**
 * @file ScreenDialog.jsx
 * @description Modal for creating/editing screens
 */

import React, { useState, useEffect } from 'react'
import { Modal, InputGroup, Select } from '../../../components/FormComponents'
import { Button } from '../../../components/TailAdminComponents'
import { Layout } from 'lucide-react'
import { SCREEN_STATUSES } from '../utils/constants'

export function ScreenDialog({
    isOpen,
    onClose,
    onSubmit,
    developers,
    editingScreen = null,
    title = 'Create Screen'
}) {
    const [form, setForm] = useState({
        title: '',
        module: '',
        assigneeId: '',
        plannedDeadline: '',
        notes: ''
    })

    useEffect(() => {
        if (editingScreen) {
            setForm({
                title: editingScreen.title || '',
                module: editingScreen.module || '',
                assigneeId: editingScreen.assigneeId || '',
                plannedDeadline: editingScreen.plannedDeadline
                    ? new Date(editingScreen.plannedDeadline).toISOString().split('T')[0]
                    : '',
                notes: editingScreen.notes || ''
            })
        } else {
            setForm({
                title: '',
                module: '',
                assigneeId: '',
                plannedDeadline: '',
                notes: ''
            })
        }
    }, [editingScreen, isOpen])

    const handleSubmit = () => {
        if (!form.title.trim()) {
            alert('Please enter screen title')
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
                        {editingScreen ? 'Update Screen' : 'Create Screen'}
                    </Button>
                </>
            }
        >
            <InputGroup
                label="Screen Title"
                icon={<Layout size={16} />}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Dashboard, Login Screen, Settings Page"
            />
            <InputGroup
                label="Module"
                value={form.module}
                onChange={(e) => setForm({ ...form, module: e.target.value })}
                placeholder="e.g., Frontend, Backend"
            />
            <Select
                label="Assign Developer"
                value={form.assigneeId}
                onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                options={[
                    { label: 'Select Developer', value: '' },
                    ...(developers?.map(d => ({ label: d.name, value: d.id })) || [])
                ]}
            />
            <InputGroup
                label="Planned Deadline"
                type="date"
                value={form.plannedDeadline}
                onChange={(e) => setForm({ ...form, plannedDeadline: e.target.value })}
            />
            <InputGroup
                label="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes or requirements..."
                as="textarea"
                rows={3}
            />
        </Modal>
    )
}
