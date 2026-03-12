/**
 * @file constants.js
 * @description Constants and lookups for project page
 */

export const PROJECT_STATUSES = [
    { value: 'Under Planning', label: 'Under Planning' },
    { value: 'Running', label: 'Running' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Critical', label: 'Critical' }
]

export const BUG_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed']

export const BUG_SEVERITIES = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
]

export const SCREEN_STATUSES = ['Planned', 'In Progress', 'Blocked', 'Done']

export const MILESTONE_STATUSES = ['Pending', 'In Progress', 'Completed', 'On Hold']

export const TABS = {
    OVERVIEW: 'overview',
    SCREENS: 'screens',
    MILESTONES: 'milestones',
    TASKS: 'tasks',
    BUGS: 'bugs',
    DOCUMENTS: 'documents',
    ACTIVITY: 'activity'
}

export const TAB_LIST = [
    { key: TABS.OVERVIEW, label: 'Overview', icon: 'BarChart3' },
    { key: TABS.SCREENS, label: 'Screens', icon: 'Layout' },
    { key: TABS.MILESTONES, label: 'Milestones', icon: 'Flag' },
    { key: TABS.TASKS, label: 'Tasks', icon: 'CheckSquare' },
    { key: TABS.BUGS, label: 'Bugs', icon: 'Bug' },
    { key: TABS.DOCUMENTS, label: 'Documents', icon: 'FileText' },
    { key: TABS.ACTIVITY, label: 'Activity', icon: 'Activity' }
]
