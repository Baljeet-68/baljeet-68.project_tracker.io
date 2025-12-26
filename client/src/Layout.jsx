import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { getUser, clearToken, clearUser, authFetch } from './auth'
import Sidebar from './components/Sidebar'
import { Menu, X, User, LogOut } from 'lucide-react'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const user = getUser()
  const nav = useNavigate()
  const location = useLocation()

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/' || path === '/Project_Tracker_Tool' || path === '/Project_Tracker_Tool/') return 'Dashboard'
    if (path.includes('projects/')) return 'Project Details'
    if (path.includes('projects')) return 'Projects'
    if (path.includes('admin')) return 'Admin Console'
    return 'Dashboard'
  }

  const pageTitle = getPageTitle()

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
        sidebarCollapsed ? 'xl:ml-20' : 'xl:ml-72'
      } rounded-xl`}>
        {/* Top Navigation Bar */}
        <nav
          className="relative flex flex-wrap items-center justify-between px-0 py-2 mx-6 transition-all shadow-none duration-250 ease-soft-in rounded-2xl lg:flex-nowrap lg:justify-start"
          data-navbar-main
          data-navbar-scroll="true"
        >
          <div className="flex items-center justify-between w-full px-4 py-1 mx-auto flex-wrap-inherit">
            <nav>
              {/* Breadcrumbs */}
              <ol className="flex flex-wrap pt-1 mr-12 bg-transparent rounded-lg sm:mr-16">
                <li className="leading-normal text-sm">
                  <Link className="opacity-50 text-slate-700" to="/">Pages</Link>
                </li>
                <li
                  className="text-sm pl-2 capitalize leading-normal text-slate-700 before:float-left before:pr-2 before:text-gray-600 before:content-['/']"
                  aria-current="page"
                >
                  {pageTitle}
                </li>
              </ol>
              <h6 className="mb-0 font-bold capitalize text-slate-700">{pageTitle}</h6>
            </nav>

            <div className="flex items-center mt-2 grow sm:mt-0 sm:mr-6 md:mr-0 lg:flex lg:basis-auto">
              <div className="flex items-center md:ml-auto md:pr-4">
                {/* Search bar removed from here as it is now in the sidebar */}
              </div>
              <ul className="flex flex-row justify-end pl-0 mb-0 list-none md-max:w-full">
                <li className="flex items-center">
                  <button
                    onClick={doLogout}
                    className="flex items-center px-0 py-2 text-sm font-semibold transition-all ease-nav-brand text-slate-500"
                  >
                    <LogOut size={16} className="sm:mr-1" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </li>
                <li className="flex items-center pl-4 xl:hidden">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="block p-0 text-sm transition-all ease-nav-brand text-slate-500"
                    data-sidenav-trigger
                  >
                    <div className="w-4.5 overflow-hidden">
                      <i className="ease-soft mb-0.75 relative block h-0.5 rounded-sm bg-slate-500 transition-all"></i>
                      <i className="ease-soft mb-0.75 relative block h-0.5 rounded-sm bg-slate-500 transition-all"></i>
                      <i className="ease-soft relative block h-0.5 rounded-sm bg-slate-500 transition-all"></i>
                    </div>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className="w-full px-6 py-6 mx-auto">
          {children}
        </div>
      </main>
      <ToastContainer position="bottom-right" />
    </div>
  )
}
