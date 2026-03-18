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
    screens = [],
    title = 'Create Milestone'
}) {
    const [form, setForm] = useState({
        milestoneNumber: '',
        module: '',
        timeline: '',
        status: 'Pending'
    })

    const handleToggleModule = (screenTitle) => {
        const currentModules = form.module ? form.module.split(',').map(m => m.trim()).filter(m => m !== '') : []
        const newModules = currentModules.includes(screenTitle)
            ? currentModules.filter(m => m !== screenTitle)
            : [...currentModules, screenTitle]
        setForm({ ...form, module: newModules.join(', ') })
    }

    const isModuleSelected = (screenTitle) => {
        return form.module.split(',').map(m => m.trim()).includes(screenTitle)
    }

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
            <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Related Screens
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 border border-slate-200 rounded-lg bg-slate-50">
                    {screens.length === 0 ? (
                        <p className="text-xs text-slate-500 col-span-2 italic">No screens found in project</p>
                    ) : (
                        screens.map(s => (
                            <label key={s.id} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={isModuleSelected(s.title)}
                                    onChange={() => handleToggleModule(s.title)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                                />
                                <span className={`text-xs transition-colors ${isModuleSelected(s.title) ? 'text-indigo-600 font-medium' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                    {s.title}
                                </span>
                            </label>
                        ))
                    )}
                </div>
                <p className="mt-2 text-[10px] text-slate-500 italic">
                    Selected: {form.module || 'None'}
                </p>
            </div>
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
