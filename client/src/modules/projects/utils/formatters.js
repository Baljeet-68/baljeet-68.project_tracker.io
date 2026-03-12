/**
 * @file formatters.js
 * @description Centralized formatting utilities for project page
 */

export const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '—'
    const cleanDateStr = typeof dateStr === 'string' && dateStr.includes('T')
        ? dateStr.split('T')[0]
        : typeof dateStr === 'string'
            ? dateStr
            : new Date(dateStr).toISOString().split('T')[0]
    const parts = cleanDateStr.split('-')
    if (parts.length !== 3) return cleanDateStr

    const [year, month, day] = parts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthIndex = parseInt(month, 10) - 1
    return `${day}-${months[monthIndex]}-${year}`
}

export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export const getStatusGradient = (status) => {
    if (!status) return 'from-slate-600 to-slate-300'
    const s = status.toLowerCase()

    const gradientMap = {
        'open': 'from-red-600 to-rose-400',
        'in progress': 'from-orange-500 to-yellow-400',
        'resolved': 'from-green-600 to-lime-400',
        'donr': 'from-green-600 to-lime-400',
        'done': 'from-green-600 to-lime-400',
        'completed': 'from-green-600 to-lime-400',
        'closed': 'from-slate-600 to-slate-300',
        'blocked': 'from-red-600 to-rose-400',
        'apporved': 'from-purple-700 to-pink-500',
        'approved': 'from-purple-700 to-pink-500',
        'aproval pending': 'from-blue-600 to-cyan-400',
        'approval pending': 'from-blue-600 to-cyan-400',
        'pending': 'from-slate-400 to-slate-300',
        'planning': 'from-blue-600 to-cyan-400',
        'under planning': 'from-blue-600 to-cyan-400',
        'planned': 'from-blue-600 to-cyan-400',
        'active': 'from-purple-700 to-pink-500',
        'running': 'from-purple-700 to-pink-500',
        'on hold': 'from-orange-500 to-yellow-400',
        'maintenance': 'from-slate-600 to-slate-300',
        'critical': 'from-red-600 to-rose-400'
    }

    return gradientMap[s] || 'from-slate-600 to-slate-300'
}

export const getSeverityGradient = (severity) => {
    const severityMap = {
        'low': 'from-blue-600 to-cyan-400',
        'medium': 'from-orange-500 to-yellow-400',
        'high': 'from-red-600 to-rose-400',
        'critical': 'from-red-900 to-slate-800'
    }
    return severityMap[severity] || 'from-slate-600 to-slate-300'
}

export const calculateProjectProgress = (screensList) => {
    if (!screensList || screensList.length === 0) return 0
    const completed = screensList.filter(s => s.status === 'Done').length
    return Math.round((completed / screensList.length) * 100)
}
