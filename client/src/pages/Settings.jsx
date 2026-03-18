import React, { useState, useEffect } from 'react'
import { authFetch, getUser, saveUser } from '../auth'
import { API_BASE_URL } from '../apiConfig'
import { Card, CardHeader, CardBody, Button, PageHeader } from '../components/TailAdminComponents'
import { InputGroup, Alert } from '../components/FormComponents'
import { User, Lock, Camera, CheckCircle2, AlertCircle, Trash2, Mail, Loader2, Bell, Moon, Sun } from 'lucide-react'
import { Loader } from '../components/Loader'
import { handleError, handleApiResponse } from '../utils/errorHandler'
import { noChangesToastConfig } from '../utils/changeDetection'
import toast from 'react-hot-toast'
import PageContainer from '../components/layout/PageContainer'
import HolidaySettings from './settings/HolidaySettings'

export default function Settings() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark')
  const [notificationPrefs, setNotificationPrefs] = useState([])

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    profilePicture: ''
  })
  const [imageFile, setImageFile] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    loadProfile(controller.signal)
    loadNotificationPrefs(controller.signal)
    return () => controller.abort()
  }, [])

  const loadNotificationPrefs = async (signal) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/notifications/preferences`, { signal })
      const data = await handleApiResponse(res)
      setNotificationPrefs(data || [])
    } catch (e) {
      if (e.name !== 'AbortError') handleError(e)
    }
  }

  const handleSaveNotificationPrefs = async () => {
    try {
      setSaving(true)
      const res = await authFetch(`${API_BASE_URL}/notifications/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: notificationPrefs })
      })
      await handleApiResponse(res)
      toast.success('Notification preferences saved')
    } catch (e) {
      handleError(e)
    } finally {
      setSaving(false)
    }
  }

  const updatePref = (type, field, value) => {
    setNotificationPrefs(prev => {
      const existing = prev.find(p => p.type === type)
      if (existing) {
        return prev.map(p => p.type === type ? { ...p, [field]: value } : p)
      } else {
        return [...prev, { type, [field]: value, [field === 'email_enabled' ? 'inapp_enabled' : 'email_enabled']: true }]
      }
    })
  }

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode(!darkMode)

  const loadProfile = async (signal) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/me`, { signal })
      const data = await handleApiResponse(res)
      setUser(data)
      setFormData(prev => ({
        ...prev,
        name: data.name || '',
        profilePicture: data.profilePicture || ''
      }))
    } catch (e) {
      if (e.name !== 'AbortError') {
        handleError(e)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    // Check if any changes were made
    const hasNameChanged = formData.name !== (user?.name || '')
    const hasImageChanged = formData.profilePicture !== (user?.profilePicture || '')
    const hasPasswordChanged = !!formData.password

    if (!hasNameChanged && !hasImageChanged && !hasPasswordChanged) {
      if (import.meta.env.DEV) {
        console.info('[Settings] No changes detected, skipping update');
      }
      toast('No changes detected', noChangesToastConfig)
      return
    }

    setSaving(true)
    try {
      // 1. Handle Avatar Upload if changed
      if (imageFile) {
        const avatarFormData = new FormData()
        avatarFormData.append('avatar', imageFile)
        
        const avatarRes = await authFetch(`${API_BASE_URL}/me/avatar`, {
          method: 'POST',
          body: avatarFormData
        })
        await handleApiResponse(avatarRes)
      } else if (!formData.profilePicture && user?.profilePicture) {
          // If image was explicitly deleted
          await authFetch(`${API_BASE_URL}/me/avatar`, { method: 'DELETE' })
      }

      // 2. Update profile name and password
      const payload = {
        name: formData.name
      }
      if (formData.password) {
        payload.password = formData.password
      }

      const res = await authFetch(`${API_BASE_URL}/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const updatedUser = await handleApiResponse(res)
      
      // Update local storage and current user state
      const currentUser = getUser()
      const newUser = { ...currentUser, ...updatedUser }
      saveUser(newUser)
      setUser(updatedUser)
      
      toast.success('Profile updated successfully')
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }))
      setImageFile(null)
      
      // Refresh page after a delay to update sidebar etc
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (e) {
      handleError(e)
    } finally {
      setSaving(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPG, JPEG, or PNG)')
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB')
        return
      }
      
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePicture: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeleteImage = () => {
    setFormData(prev => ({ ...prev, profilePicture: '' }))
    setImageFile(null)
  }

  if (loading) {
    return <Loader message="Loading settings..." />
  }

  return (
    <PageContainer>
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Account Settings"
        subtitle="Update your profile information and security settings"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Profile Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardBody className="flex flex-col items-center py-8">
              <div className="relative group mb-4">
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-slate-50 shadow-sm">
                  <img 
                    src={formData.profilePicture || `https://ui-avatars.com/api/?name=${formData.name || 'User'}&background=6366f1&color=fff&size=128`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity rounded-2xl">
                  <Camera size={24} />
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png" onChange={handleImageChange} />
                </label>
                {formData.profilePicture && (
                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                    title="Remove Image"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <h6 className="font-bold text-slate-800">{user?.name}</h6>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">{user?.role}</span>
            </CardBody>
          </Card>

          <Card className="p-2 space-y-1">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-indigo-500 text-white shadow-soft-md' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Profile Settings
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'notifications' ? 'bg-indigo-500 text-white shadow-soft-md' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Notifications
            </button>
            {user?.role === 'admin' && (
              <button 
                onClick={() => setActiveTab('holidays')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'holidays' ? 'bg-indigo-500 text-white shadow-soft-md' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Holiday Calendar
              </button>
            )}
          </Card>
        </div>

        {/* Settings Form */}
        <div className="md:col-span-3">
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile}>
              <Card>
                <CardHeader className="border-b border-slate-50">
                  <h6 className="font-bold text-slate-700">Profile Information</h6>
                </CardHeader>
                <CardBody className="space-y-6">

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <InputGroup
                        label="Full Name"
                        icon={<User size={18} className="text-slate-400" />}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your full name"
                        required
                      />
                      <InputGroup
                        label="Email Address"
                        icon={<Mail size={18} className="text-slate-400" />}
                        value={user?.email}
                        disabled
                        className="bg-slate-50 cursor-not-allowed opacity-75"
                      />
                    </div>

                    <div className="pt-4 border-t border-slate-50">
                      <h6 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Security</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup
                          label="New Password"
                          type="password"
                          icon={<Lock size={18} className="text-slate-400" />}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="••••••••"
                        />
                        <InputGroup
                          label="Confirm New Password"
                          type="password"
                          icon={<Lock size={18} className="text-slate-400" />}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50">
                      <h6 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Preferences</h6>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500 text-white' : 'bg-amber-500 text-white'}`}>
                            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">Dark Mode</p>
                            <p className="text-xs text-slate-500">Toggle dark/light theme</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={toggleDarkMode}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${darkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardBody>
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </Card>
            </form>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader className="border-b border-slate-50">
                <h6 className="font-bold text-slate-700">Notification Preferences</h6>
              </CardHeader>
              <CardBody className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {['Project Assignment', 'Bug Reported', 'Leave Request Status', 'Task Overdue', 'Announcements'].map(type => {
                    const pref = notificationPrefs.find(p => p.type === type) || { email_enabled: true, inapp_enabled: true };
                    return (
                      <div key={type} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 gap-4">
                        <div>
                          <p className="text-sm font-bold text-slate-700">{type}</p>
                          <p className="text-xs text-slate-500">Manage how you receive {type.toLowerCase()} updates</p>
                        </div>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={pref.email_enabled} 
                              onChange={(e) => updatePref(type, 'email_enabled', e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600"
                            />
                            <span className="text-xs font-medium text-slate-600">Email</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={pref.inapp_enabled} 
                              onChange={(e) => updatePref(type, 'inapp_enabled', e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600"
                            />
                            <span className="text-xs font-medium text-slate-600">In-App</span>
                          </label>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardBody>
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                <Button onClick={handleSaveNotificationPrefs} variant="primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'holidays' && user?.role === 'admin' && (
            <HolidaySettings />
          )}
        </div>
      </div>
    </div>
    </PageContainer>
  )
}
