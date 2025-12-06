import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProjectPage from './pages/ProjectPage'
import ProjectsList from './pages/ProjectsList'
import Admin from './pages/Admin'
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
    <BrowserRouter basename="/bugtracker/">
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
                <ProjectsList />
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

        {/* Admin only */}
        <Route
          path="admin"
          element={
            <AdminRoute>
              <Layout>
                <Admin />
              </Layout>
            </AdminRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>

  )
}
