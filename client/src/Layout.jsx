import React, { useState } from 'react'
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { getUser, clearToken, clearUser, authFetch } from './auth'
import Sidebar from './components/Sidebar'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1200)
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
    if (path === '/' || path === '/Project_Tracker_Tool' || path === '/Project_Tracker_Tool/') return 'Dashboard'
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
      clearToken();
      clearUser();
      nav('/login', { replace: true });
    }
    // You might want to handle other errors here as well, e.g., display a toast
    console.error("Auth Fetch Error:", error);
  }

  return (
    <div className="m-0 font-sans text-base antialiased font-normal leading-default bg-gray-50 text-slate-500 min-h-screen">
      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Content */}
      <main className={`relative h-full max-h-screen transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      } rounded-xl`}>
        {/* Page Content */}
        <div className="w-full px-0 sm:px-2 lg:px-4 py-6">
          <Outlet />
        </div>
      </main>
      <ToastContainer position="bottom-right" />
    </div>
  )
}
