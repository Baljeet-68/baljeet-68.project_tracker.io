import React, { useState } from 'react'
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { getUser, clearToken, clearUser, authFetch } from './auth'
import Sidebar from './components/Sidebar'
import { handleError } from './utils/errorHandler'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved !== null) return JSON.parse(saved)
    return window.innerWidth < 1200
  })

  // Save collapsed state to localStorage
  React.useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  const user = getUser()
  const nav = useNavigate()
  const location = useLocation()

  // Update collapsed state on resize
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200) {
        setSidebarCollapsed(true)
      } else {
        setSidebarCollapsed(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/dashboard' || path === '/' || path === '/Project_Tracker_Tool' || path === '/Project_Tracker_Tool/') return 'Dashboard'
    if (path.includes('projects/')) return 'Project Details'
    if (path.includes('projects')) return 'Projects'
    if (path.includes('users')) return 'User Management'
    return 'Dashboard'
  }

  const pageTitle = getPageTitle()

  // Automatically close sidebar on mobile when navigating
  React.useEffect(() => {
    if (window.innerWidth < 1024 && sidebarOpen) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  const doLogout = async () => {
    clearToken(); clearUser(); nav('/login', { replace: true })
  }

  // Centralized error handling for authFetch
  const handleAuthError = (error) => {
    if (error.message === 'Unauthorized: Token expired or invalid') {
      clearToken()
      clearUser()
      nav('/login', { replace: true })
      handleError(error)
    }
  }

  return (
    <div className="m-0 font-sans text-base antialiased font-normal leading-default bg-gray-50 text-slate-500 min-h-screen lg:flex">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Content */}
      <main
        className={`relative flex-1 min-w-0 h-full max-h-screen transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        }`}
      >
        {/* Mobile Header with Hamburger */}
        <header className="flex items-center justify-between px-4 py-3 bg-white shadow-sm lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-sm font-bold text-slate-800 truncate">{pageTitle}</h1>
          <div className="w-10 h-10" />
        </header>

        {/* Page Content (no horizontal padding here; PageContainer controls it) */}
        <div className="w-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
