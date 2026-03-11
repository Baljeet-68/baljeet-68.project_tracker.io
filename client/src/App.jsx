import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProjectPage from './pages/ProjectPage'
import Projects from './pages/Projects'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Attendance from './pages/Attendance'
import ECommerceProjects from './pages/ECommerceProjects'
import Notifications from './pages/Notifications'
import Announcements from './pages/Announcements'
import Careers from './pages/Careers'
import MyTasks from './pages/MyTasks'
import { getToken, getUser } from './auth'
import Layout from './Layout'
import { Toaster, ToastBar, toast } from 'react-hot-toast'
import { X } from 'lucide-react'

function PrivateRoute({ children, roles }) {
  const token = getToken()
  const user = getUser()
  
  if (!token) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role?.toLowerCase())) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export default function App() {
  const basename = '/Project_Tracker_Tool';
  
  return (
    <BrowserRouter 
      basename={basename}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Toaster position="top-right" reverseOrder={false}>
        {(t) => (
          <ToastBar 
            toast={t}
            style={{
              ...t.style,
              position: 'relative',
              overflow: 'hidden',
              paddingBottom: '8px', // Make space for the progress bar
            }}
          >
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                {t.type !== 'loading' && (
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="ml-2 p-1 rounded-full hover:bg-black/5 transition-colors flex items-center justify-center"
                    aria-label="Close"
                  >
                    <X size={14} />
                  </button>
                )}
                {/* Timer Slider / Progress Bar */}
                {t.visible && t.type !== 'loading' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      height: '4px',
                      width: '0%',
                      backgroundColor: t.type === 'error' ? '#ef4444' : '#10b981',
                      animation: `toast-progress ${t.duration || 4000}ms linear forwards`,
                    }}
                  />
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/tasks" element={<PrivateRoute><MyTasks /></PrivateRoute>} />
          <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
          <Route path="/projects/:id" element={<PrivateRoute><ProjectPage /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute roles={['admin']}><Users /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/attendance" element={<PrivateRoute><Attendance /></PrivateRoute>} />
          <Route path="/ecommerce-projects" element={<PrivateRoute roles={['admin', 'ecommerce', 'management']}><ECommerceProjects /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          <Route path="/announcements" element={<PrivateRoute><Announcements /></PrivateRoute>} />
          <Route path="/careers" element={<PrivateRoute roles={['admin', 'hr']}><Careers /></PrivateRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
