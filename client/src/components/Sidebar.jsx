import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getUser } from '../auth'
import { X, LayoutDashboard, BarChart3, Settings } from 'lucide-react'

export default function Sidebar({ open, onClose }) {
  const user = getUser()
  const location = useLocation()

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/',
      roles: ['admin', 'tester', 'developer'],
    },
    {
      label: 'Projects',
      icon: BarChart3,
      path: '/projects',
      roles: ['admin', 'tester', 'developer'],
    },
    {
      label: 'Admin Console',
      icon: Settings,
      path: '/admin',
      roles: ['admin'],
    },
  ]

  // Filter menu items based on user role
  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role))

  const isActive = (path) => location.pathname === path

  // Get role badge color
  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'tester':
        return 'bg-yellow-100 text-yellow-800'
      case 'developer':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 overflow-y-auto transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Section */}
        <div className="px-6 py-8 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
             
              <h1 className="text-lg font-bold text-gray-900">Project Tracker</h1>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-100 rounded-md"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* User Info Section */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.email}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor()}`}>
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 py-6">
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                    active
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-white">
          <p className="text-xs text-gray-500 mb-3">Project Tracker MMF Infotech</p>
          <p className="text-xs text-gray-400">v1.0.0</p>
        </div>
      </div>
    </>
  )
}
