import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, User, Calendar, AlertTriangle, CheckCircle2, MessageSquare, Clock, ArrowRight, RefreshCw } from 'lucide-react'
import { Card, CardBody, Badge, Button } from '../components/TailAdminComponents'
import { authFetch } from '../auth'
import { API_BASE_URL } from '../apiConfig'

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await authFetch(`${API_BASE_URL}/notifications`)
      if (!res.ok) throw new Error('Failed to fetch notifications')
      const data = await res.json()
      setNotifications(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAllRead = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'POST'
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })))
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const markAsRead = async (id) => {
    const notification = notifications.find(n => n.id === id)
    if (!notification || notification.status === 'read') return

    try {
      const res = await authFetch(`${API_BASE_URL}/notifications/${id}/mark-read`, {
        method: 'POST'
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n))
      }
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const getIcon = (type, title) => {
    if (type === 'leave_request') return Calendar
    if (type === 'leave_cancelled') return AlertTriangle
    if (type === 'leave_status') {
      if (title.includes('Approved')) return CheckCircle2
      if (title.includes('Rejected')) return AlertTriangle
      return Bell
    }
    if (type === 'project_assignment') return CheckCircle2
    if (type === 'task_overdue') return AlertTriangle
    if (type === 'daily_report') return Clock
    if (type === 'comment') return MessageSquare
    return Bell
  }

  const getGradient = (type, title) => {
    if (type === 'leave_request') return 'from-blue-600 to-cyan-400'
    if (type === 'leave_cancelled') return 'from-amber-500 to-orange-400'
    if (type === 'leave_status') {
      if (title.includes('Approved')) return 'from-green-600 to-lime-400'
      if (title.includes('Rejected')) return 'from-red-600 to-rose-400'
      return 'from-slate-600 to-slate-300'
    }
    if (type === 'project_assignment') return 'from-green-600 to-lime-400'
    if (type === 'task_overdue') return 'from-red-600 to-rose-400'
    if (type === 'daily_report') return 'from-orange-500 to-yellow-400'
    if (type === 'comment') return 'from-purple-600 to-fuchsia-400'
    return 'from-indigo-600 to-purple-400'
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now - date
    const diffInMins = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMins < 1) return 'Just now'
    if (diffInMins < 60) return `${diffInMins}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-')
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
            Notifications
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Stay updated with the latest activities and alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchNotifications}
            disabled={loading}
          >
            <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={markAllRead}
            disabled={!notifications.some(n => n.status === 'unread') || loading}
          >
            Mark all as read
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-medium">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {loading && notifications.length === 0 ? (
          <div className="flex justify-center py-20">
            <RefreshCw size={40} className="animate-spin text-slate-300" />
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = getIcon(notification.type, notification.title)
            const gradient = getGradient(notification.type, notification.title)
            return (
              <Card 
                key={notification.id} 
                onClick={() => markAsRead(notification.id)}
                className={`transition-all duration-300 hover:shadow-soft-xl border-l-4 cursor-pointer ${
                  notification.status === 'unread' ? 'border-l-blue-500 bg-blue-50/30' : 'border-l-transparent'
                }`}
              >
                <CardBody className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-tl ${gradient} flex items-center justify-center text-white shadow-soft-2xl`}>
                      <Icon size={24} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-base font-bold ${notification.status === 'unread' ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                            {notification.title}
                          </h3>
                          {notification.status === 'unread' && (
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <Badge gradient={gradient} size="sm">
                          {notification.category || 'System'}
                        </Badge>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (notification.type.startsWith('leave_')) {
                              navigate('/attendance');
                            }
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider"
                        >
                          View Details
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )
          })
        )}
      </div>

      {!loading && notifications.length === 0 && (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-400 dark:bg-slate-900/20">
                <Bell size={40} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-800 dark:text-white">
                No notifications yet
              </h3>
              <p className="max-w-md text-slate-500 dark:text-slate-400">
                We'll notify you when something important happens.
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
