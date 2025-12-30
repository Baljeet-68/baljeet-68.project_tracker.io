import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getUser } from '../auth'
import { 
  X, 
  LayoutDashboard, 
  BarChart3, 
  Settings, 
  Search, 
  Inbox, 
  Bell, 
  Calendar, 
  Zap, 
  Files, 
  Hash, 
  Plus, 
  HelpCircle,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react'

export default function Sidebar({ open, onClose, collapsed, setCollapsed }) {
  const [isHovered, setIsHovered] = React.useState(false)
  const user = getUser()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/Project_Tracker_Tool/login'
  }

  // Effective collapsed state: true if collapsed AND not hovered
  const isActuallyCollapsed = collapsed && !isHovered

  const mainMenuItems = [
    // { label: 'Inbox', icon: Inbox, path: '/inbox', roles: ['admin', 'tester', 'developer'] },
    // { label: 'Activity', icon: Bell, path: '/activity', roles: ['admin', 'tester', 'developer'], hasNotification: true },
    // { label: 'Schedule', icon: Calendar, path: '/schedule', roles: ['admin', 'tester', 'developer'] },
    { label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['admin', 'tester', 'developer'] },
    { label: 'Projects', icon: BarChart3, path: '/projects', roles: ['admin', 'tester', 'developer'] },
    { label: 'Admin Console', icon: Settings, path: '/admin', roles: ['admin'] },
  ]

  const sharedItems = [
    { label: 'Boosts', icon: Zap, path: '/boosts' },
    { label: 'Documents', icon: Files, path: '/documents' },
  ]

  const projectItems = [
    { label: 'Personal', color: 'bg-emerald-400', path: '/projects/personal' },
    { label: 'Business', color: 'bg-indigo-400', path: '/projects/business' },
    { label: 'Travel', color: 'bg-purple-400', path: '/projects/travel' },
  ]

  const filteredMenuItems = mainMenuItems.filter(item => item.roles.includes(user?.role))

  const isActive = (path) => location.pathname === path

  const NavItem = ({ item, isProject = false }) => {
    const Icon = item.icon
    const active = isActive(item.path)
    
    return (
      <Link
        to={item.path}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 ${
          active 
            ? 'bg-slate-100 text-slate-900 font-medium' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        }`}
      >
        <div className="flex items-center gap-3">
          {isProject ? (
            <div className={`w-2 h-2 rounded-full ${item.color}`} />
          ) : (
            <Icon size={18} className={active ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'} />
          )}
          {!isActuallyCollapsed && <span className="text-sm">{item.label}</span>}
        </div>
        {!isActuallyCollapsed && item.shortcut && (
          <span className="text-[10px] font-medium text-slate-300 group-hover:text-slate-400 transition-colors">
            {item.shortcut}
          </span>
        )}
        {!isActuallyCollapsed && item.hasNotification && (
          <div className="absolute left-6 top-3 w-1.5 h-1.5 bg-orange-500 rounded-full border border-white" />
        )}
        
        {isActuallyCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            {item.label}
          </div>
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        onMouseEnter={() => collapsed && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out bg-white border-r border-slate-100 ${
          isActuallyCollapsed ? 'w-20' : 'w-72'
        } ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full px-4 py-6">
          {/* Workspace Switcher */}
          <div className={`flex items-center justify-between mb-6 ${isActuallyCollapsed ? 'justify-center px-0' : 'px-2'}`}>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-100">
                MMF
              </div>
              {!isActuallyCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">MMF Project Tracker</span>
                  <span className="text-xs text-slate-400">Version 1.0.0</span>
                </div>
              )}
            </div>
            {!isActuallyCollapsed && <ChevronsUpDown size={16} className="text-slate-300" />}
          </div>

          {/* Search Bar */}
          {/* <div className={`relative mb-6 ${collapsed ? 'px-0' : 'px-2'}`}>
            <div className={`flex items-center bg-slate-50 rounded-xl border border-slate-100 transition-all focus-within:border-indigo-200 focus-within:bg-white ${collapsed ? 'justify-center p-2' : 'px-3 py-2'}`}>
              <Search size={18} className="text-slate-400" />
              {!collapsed && (
                <>
                  <input 
                    type="text" 
                    placeholder="Search" 
                    className="ml-2 bg-transparent border-none text-sm focus:outline-none w-full text-slate-600 placeholder:text-slate-400"
                  />
                  <span className="text-[10px] font-medium text-slate-300">⌘1</span>
                </>
              )}
            </div>
          </div> */}

          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar">
            {/* Main Section */}
            <div className="space-y-1">
              {filteredMenuItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>

            {/* Shared Section */}
            {/* <div className="space-y-1">
              {!collapsed && (
                <div className="flex items-center justify-between px-3 mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Shared</span>
                  <Plus size={14} className="text-slate-300 cursor-pointer hover:text-slate-500" />
                </div>
              )}
              {sharedItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div> */}

            {/* Projects Section */}
            {/* <div className="space-y-1">
              {!collapsed && (
                <div className="flex items-center justify-between px-3 mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Projects</span>
                </div>
              )}
              {projectItems.map((item) => (
                <NavItem key={item.path} item={item} isProject={true} />
              ))}
              <button className={`flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-slate-600 transition-colors w-full ${collapsed ? 'justify-center' : ''}`}>
                <Plus size={18} />
                {!collapsed && <span className="text-sm">Add New Project</span>}
              </button>
            </div> */}
          </div>

          {/* Bottom Section */}
          <div className="mt-auto pt-6 space-y-4">
            <div className="space-y-1">
              <NavItem item={{ label: 'Settings', icon: Settings, path: '/settings' }} />
              <button
                onClick={handleLogout}
                className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-50 w-full ${isActuallyCollapsed ? 'justify-center' : ''}`}
              >
                <LogOut size={18} className="flex-shrink-0" />
                {!isActuallyCollapsed && <span className="text-sm font-medium">Sign Out</span>}
                {isActuallyCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    Sign Out
                  </div>
                )}
              </button>
            </div>

            {/* User Profile */}
            <div className={`p-2 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 ${isActuallyCollapsed ? 'justify-center p-1' : ''}`}>
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex-shrink-0 border-2 border-white">
                <img 
                  src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name || user?.username || 'User'}&background=random&color=fff`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              {!isActuallyCollapsed && (
                <div className="flex flex-1 items-center justify-between overflow-hidden">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold text-slate-900 truncate">{user?.name || user?.username || 'User Name'}</span>
                    <span className="text-xs text-slate-400 truncate">{user?.email || 'user@email.com'}</span>
                  </div>
                  <ChevronsUpDown size={14} className="text-slate-300 ml-2 flex-shrink-0" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Collapse Toggle Button (Desktop Only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-10 w-6 h-6 bg-white border border-slate-100 rounded-full items-center justify-center text-slate-400 hover:text-indigo-600 shadow-sm transition-all"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
    </>
  )
}
