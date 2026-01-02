import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getUser, clearToken, clearUser } from '../auth'
import { 
  X, 
  LayoutDashboard, 
  BarChart3, 
  Users,
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
  const navigate = useNavigate()

  const handleLogout = () => {
    clearToken()
    clearUser()
    navigate('/login', { replace: true })
  }

  // Effective collapsed state: true if collapsed AND not hovered
  const isActuallyCollapsed = collapsed && !isHovered

  const mainMenuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['admin', 'tester', 'developer', 'hr', 'ecommerce', 'management', 'accountant'] },
    { label: 'Projects', icon: BarChart3, path: '/projects', roles: ['admin', 'tester', 'developer', 'hr', 'ecommerce', 'management', 'accountant'] },
    { label: 'Attendance', icon: Calendar, path: '/attendance', roles: ['admin', 'hr', 'management'] },
    { label: 'User Management', icon: Users, path: '/users', roles: ['admin'] },
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
        className={`group relative flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 ${
          active 
            ? 'bg-white shadow-soft-xl text-slate-700' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        }`}
      >
        <div className="flex items-center gap-3">
          {isProject ? (
            <div className={`w-2 h-2 rounded-full ${item.color}`} />
          ) : (
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${active ? 'bg-gradient-to-tl from-purple-700 to-pink-500 shadow-soft-2xl text-white' : 'bg-white shadow-soft-sm text-slate-700 group-hover:shadow-soft-md'}`}>
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
            </div>
          )}
          {!isActuallyCollapsed && <span className={`text-sm ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>}
        </div>
        {!isActuallyCollapsed && item.shortcut && (
          <span className="text-[10px] font-medium text-slate-300 group-hover:text-slate-400 transition-colors">
            {item.shortcut}
          </span>
        )}
        
        {isActuallyCollapsed && (
          <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50 shadow-soft-2xl translate-x-[-10px] group-hover:translate-x-0">
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
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        onMouseEnter={() => collapsed && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed left-0 top-0 z-40 h-screen transition-all duration-400 ease-soft-in-out bg-slate-50/50 backdrop-blur-md border-r border-slate-100 ${
          isActuallyCollapsed ? 'w-24' : 'w-72'
        } ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full px-4 py-8">
          {/* Workspace Switcher */}
          <div className={`flex items-center justify-between mb-8 ${isActuallyCollapsed ? 'justify-center px-0' : 'px-2'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-tl from-purple-700 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-soft-2xl">
                MM
              </div>
              {!isActuallyCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700 leading-tight">Project Tracker</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Soft UI Dashboard</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar px-2">
            {filteredMenuItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>

          {/* Bottom Section */}
          <div className="mt-auto pt-6 space-y-4 px-2">
            <div className="space-y-2 border-t border-slate-100 pt-6">
              <NavItem item={{ label: 'Settings', icon: Settings, path: '/settings' }} />
              <button
                onClick={handleLogout}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 text-slate-500 hover:bg-red-50 hover:text-red-600 w-full ${isActuallyCollapsed ? 'justify-center' : ''}`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-soft-sm transition-all group-hover:shadow-soft-md group-hover:bg-red-100`}>
                  <LogOut size={16} className="flex-shrink-0" />
                </div>
                {!isActuallyCollapsed && <span className="text-sm font-bold">Sign Out</span>}
                {isActuallyCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50 shadow-soft-2xl translate-x-[-10px] group-hover:translate-x-0">
                    Sign Out
                  </div>
                )}
              </button>
            </div>

            {/* User Profile */}
            <div className={`p-3 rounded-2xl bg-white shadow-soft-lg border border-slate-100 flex items-center gap-3 ${isActuallyCollapsed ? 'justify-center p-2' : ''}`}>
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-soft-sm flex-shrink-0 border-2 border-white">
                <img 
                  src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name || user?.username || 'User'}&background=7c3aed&color=fff`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              {!isActuallyCollapsed && (
                <div className="flex flex-1 items-center justify-between overflow-hidden">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold text-slate-700 truncate">{user?.name || user?.username || 'User Name'}</span>
                    <span className="text-[10px] font-bold text-slate-400 truncate uppercase">{user?.role || 'Member'}</span>
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
          className="hidden lg:flex absolute -right-3 top-10 w-8 h-8 bg-white border border-slate-100 rounded-xl items-center justify-center text-slate-400 hover:text-purple-600 shadow-soft-md transition-all z-50 hover:scale-110 active:scale-95"
        >
          {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
        </button>
      </aside>
    </>
  )
}
