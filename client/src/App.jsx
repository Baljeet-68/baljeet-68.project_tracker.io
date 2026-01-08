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
import { getToken, getUser } from './auth'
import Layout from './Layout'

function PrivateRoute({ children, roles }) {
  const token = getToken()
  const user = getUser()
  
  if (!token) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role?.toLowerCase())) {
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter 
      basename={import.meta.env.VITE_BASE_URL || '/'}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<Layout />}>
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
