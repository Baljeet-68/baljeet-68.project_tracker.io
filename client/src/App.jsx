import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProjectPage from './pages/ProjectPage'
import Projects from './pages/Projects'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Attendance from './pages/Attendance'
import ECommerceProjects from './pages/ECommerceProjects'
import Notifications from './pages/Notifications'
import { getToken, getUser } from './auth'
import Layout from './Layout'

function ProtectedRoute({ children }) {
  const token = getToken()
  if (!token) {
    // relative path -> resolves to /Project_Tracker_Tool/client/login
    return <Navigate to="/login" replace />
  }
  return children
}
function AdminRoute({ children }) {
  const token = getToken()
  const user = getUser()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    // relative “/” goes to the root of the app, not domain root
    return <Navigate to="/" replace />
  }
  return children
}
export default function App() {
  return (
    <BrowserRouter basename="/Project_Tracker_Tool">
      <Routes>
        {/* Public login route */}
        <Route path="login" element={<Login />} />

        {/* Dashboard (home) */}
        <Route
          index
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Projects list */}
        <Route
          path="projects"
          element={
            <ProtectedRoute>
              <Layout>
                <Projects />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Single project */}
        <Route
          path="projects/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ProjectPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* User Management only */}
        <Route
          path="users"
          element={
            <AdminRoute>
              <Layout>
                <Users />
              </Layout>
            </AdminRoute>
          }
        />

        {/* Attendance Management */}
        <Route
          path="attendance"
          element={
            <ProtectedRoute>
              <Layout>
                <Attendance />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* E-Commerce Projects Management */}
        <Route
          path="ECommerceProjects"
          element={
            <ProtectedRoute>
              <Layout>
                <ECommerceProjects />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Notifications */}
        <Route
          path="notifications"
          element={
            <ProtectedRoute>
              <Layout>
                <Notifications />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Settings page */}
        <Route
          path="settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>

  )
}
