import React, { useState, useEffect } from 'react'
import { authFetch, getUser, saveUser } from '../auth'
import { API_BASE_URL } from '../apiConfig'
import { Card, CardHeader, CardBody, Button } from '../components/TailAdminComponents'
import { InputGroup } from '../components/FormComponents'
import { User, Lock, Camera, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react'

export default function Settings() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    profilePicture: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/me`)
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setFormData(prev => ({
          ...prev,
          name: data.name || '',
          profilePicture: data.profilePicture || ''
        }))
      }
    } catch (e) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: formData.name,
        profilePicture: formData.profilePicture
      }
      if (formData.password) {
        payload.password = formData.password
      }

      const res = await authFetch(`${API_BASE_URL}/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      const updatedUser = await res.json()
      
      // Update local storage and current user state
      const currentUser = getUser()
      const newUser = { ...currentUser, ...updatedUser }
      saveUser(newUser)
      setUser(updatedUser)
      
      setSuccess('Profile updated successfully')
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }))
      
      // Refresh page after a delay to update sidebar etc
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should be less than 10MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePicture: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeleteImage = () => {
    setFormData(prev => ({ ...prev, profilePicture: '' }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h4 className="font-bold text-slate-700">Account Settings</h4>
        <p className="text-slate-500 text-sm">Update your profile information and security settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Sidebar */}
        <div className="md:col-span-1">
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
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
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
              <div className="mt-4 w-full border-t border-slate-100 pt-4 px-4 text-center">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Upload a new profile picture. Max size 10MB.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Settings Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleUpdateProfile}>
            <Card>
              <CardHeader className="border-b border-slate-50">
                <h6 className="font-bold text-slate-700">Profile Information</h6>
              </CardHeader>
              <CardBody className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-sm animate-shake">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
                    <CheckCircle2 size={18} />
                    {success}
                  </div>
                )}

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
                    <p className="mt-2 text-[11px] text-slate-400 italic">
                      Leave blank if you don't want to change your password
                    </p>
                  </div>
                </div>
              </CardBody>
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={saving}
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : 'Save Changes'}
                </Button>
              </div>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
}
