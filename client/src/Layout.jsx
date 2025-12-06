import React, { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { getUser, clearToken, clearUser, authFetch } from './auth'
import Sidebar from './components/Sidebar'
import { Menu, X } from 'lucide-react'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = getUser()
  const nav = useNavigate()

  const doLogout = async () => {
    try {
      await authFetch(`${API_BASE_URL}logout`, { method: 'POST' })
    } catch (e) {
      // ignore
    }
    clearToken(); clearUser(); nav('/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <nav className="bg-white shadow-soft border-b border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <h1 className="text-xl font-semibold text-gray-900 hidden sm:block">Dashboard</h1>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">{user?.email}</span>
              <button
                onClick={doLogout}
                className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
