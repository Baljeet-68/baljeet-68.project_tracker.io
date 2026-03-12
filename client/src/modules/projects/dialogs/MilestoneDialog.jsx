/**
 * @file MilestoneDialog.jsx
 * @description Modal for creating/editing milestones
 */

import React, { useState, useEffect } from 'react'
import { Modal, InputGroup, Select } from '../../../components/FormComponents'
import { Button } from '../../../components/TailAdminComponents'
import { Flag } from 'lucide-react'
import { MILESTONE_STATUSES } from '../utils/constants'

export function MilestoneDialog({
    isOpen,
    onClose,
    onSubmit,
    editingMilestone = null,
    title = 'Create Milestone'
}) {
    const [form, setForm] = useState({
        milestoneNumber: '',
        module: '',
        timeline: '',
        status: 'Pending'
    })

    useEffect(() => {
        if (editingMilestone) {
            setForm({
                milestoneNumber: editingMilestone.milestoneNumber || '',
                module: editingMilestone.module || '',
                timeline: editingMilestone.timeline
                    ? new Date(editingMilestone.timeline).toISOString().split('T')[0]
                    : '',
                status: editingMilestone.status || 'Pending'
            })
        } else {
            setForm({
                milestoneNumber: '',
                module: '',
                timeline: '',
                status: 'Pending'
            })
        }
    }, [editingMilestone, isOpen])

    const handleSubmit = () => {
        if (!String(form.milestoneNumber).trim()) {
            alert('Please enter milestone number')
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
                        {editingMilestone ? 'Update Milestone' : 'Create Milestone'}
                    </Button>
                </>
            }
        >
            <InputGroup
                label="Milestone Number/Name"
                icon={<Flag size={16} />}
                value={form.milestoneNumber}
                onChange={(e) => setForm({ ...form, milestoneNumber: e.target.value })}
                placeholder="e.g., Phase 1, MVP, Release 1.0"
            />
            <InputGroup
                label="Related Module/Screens"
                value={form.module}
                onChange={(e) => setForm({ ...form, module: e.target.value })}
                placeholder="e.g., Authentication, User Dashboard"
            />
            <InputGroup
                label="Timeline/Deadline"
                type="date"
                value={form.timeline}
                onChange={(e) => setForm({ ...form, timeline: e.target.value })}
            />
            <Select
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                options={MILESTONE_STATUSES.map(s => ({ label: s, value: s }))}
            />
        </Modal>
    )
}
