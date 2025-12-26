import React from 'react'
import { Card, CardHeader, CardBody, Button } from './TailAdminComponents'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const Table = ({ columns, data, loading = false, pagination = false, pageSize = 10 }) => {
  const [currentPage, setCurrentPage] = React.useState(1)

  // Pagination Logic
  const totalItems = data.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedData = pagination 
    ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : data

  const getPageNumbers = () => {
    const pages = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-slate-500">
        <div className="inline-block w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p>Loading data...</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500">
        <p>No data available</p>
      </div>
    )
  }

  return (
    <div className="flex-auto px-0 pt-0 pb-2">
      <div className="p-0 overflow-x-auto">
        <table className="items-center w-full mb-0 align-top border-gray-200 text-slate-500">
          <thead className="align-bottom">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 font-bold text-left uppercase align-middle bg-transparent border-b border-gray-200 shadow-none text-xxs border-b-solid tracking-tight-soft opacity-70"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={`${idx}-${col.key}`} className="p-2 align-middle bg-transparent border-b whitespace-nowrap shadow-transparent px-6 text-sm">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {pagination && (
        <div className="mt-8 mb-4 px-4">
          <div className="flex flex-wrap items-center justify-between bg-white rounded-full border border-gray-100 shadow-sm px-6 py-3 gap-4">
            {/* Left & Center: Navigation */}
            <div className="flex items-center gap-4 md:gap-8">
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 text-sm font-medium transition-all ${
                  currentPage === 1 
                    ? 'text-slate-300 cursor-not-allowed' 
                    : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                <ChevronLeft size={18} />
                <span>Previous</span>
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, idx) => (
                  <React.Fragment key={idx}>
                    {page === '...' ? (
                      <span className="px-2 text-slate-400">...</span>
                    ) : (
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-full transition-all ${
                          currentPage === page 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                        }`}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-2 text-sm font-medium transition-all ${
                  currentPage === totalPages 
                    ? 'text-slate-300 cursor-not-allowed' 
                    : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                <span>Next</span>
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Right: Results Info */}
            <div className="text-sm text-slate-500 whitespace-nowrap">
              Showing <span className="font-medium text-slate-700">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-medium text-slate-700">{totalItems.toLocaleString()}</span> results
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Modal Component
export const Modal = ({ isOpen, title, children, onClose, footer }) => {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-soft-2xl max-w-md w-full max-h-[90vh] overflow-y-auto pointer-events-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h6 className="mb-0 font-bold text-slate-700">{title}</h6>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Toast/Alert Component
export const Toast = ({ message, type = 'info', onClose }) => {
  const gradient = {
    success: 'from-green-600 to-lime-400',
    error: 'from-red-600 to-rose-400',
    warning: 'from-orange-500 to-yellow-400',
    info: 'from-blue-600 to-cyan-400',
  }

  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed top-4 right-4 max-w-sm p-4 rounded-lg bg-gradient-to-tl ${gradient[type]} text-white shadow-soft-2xl z-100`}>
      {message}
    </div>
  )
}

// Input Group Component
export const InputGroup = ({ label, type = 'text', error, ...props }) => (
  <div className="mb-4">
    {label && (
      <label className="mb-2 ml-1 font-bold text-xs text-slate-700">
        {label}
      </label>
    )}
    <input
      type={type}
      className={`focus:shadow-soft-primary-outline text-sm leading-5.6 block w-full appearance-none rounded-lg border border-solid bg-white bg-clip-padding px-3 py-2 font-normal text-gray-700 transition-all focus:border-fuchsia-300 focus:outline-none focus:transition-shadow ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
      {...props}
    />
    {error && <p className="text-red-600 text-xs mt-1 ml-1">{error}</p>}
  </div>
)

// Select Component
export const Select = ({ label, options, error, ...props }) => (
  <div className="mb-4">
    {label && (
      <label className="mb-2 ml-1 font-bold text-xs text-slate-700">
        {label}
      </label>
    )}
    <select
      className={`focus:shadow-soft-primary-outline text-sm leading-5.6 block w-full appearance-none rounded-lg border border-solid bg-white bg-clip-padding px-3 py-2 font-normal text-gray-700 transition-all focus:border-fuchsia-300 focus:outline-none focus:transition-shadow ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-red-600 text-xs mt-1 ml-1">{error}</p>}
  </div>
)

// Progress Bar Component
export const ProgressBar = ({ value, max = 100, label, showLabel = true, gradient = 'from-blue-600 to-cyan-400' }) => {
  const percentage = (value / max) * 100

  return (
    <div className="w-full max-w-full px-3 mb-6 flex-none">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold leading-tight">{label}</span>
          <span className="text-xs font-semibold leading-tight">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className="text-xs h-0.75 w-full bg-gray-200 rounded-lg overflow-hidden">
        <div
          className={`h-full bg-gradient-to-tl ${gradient} rounded-lg transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Avatar Component
export const Avatar = ({ src, alt, initials, size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizes[size]} rounded-full object-cover`}
      />
    )
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold`}
    >
      {initials}
    </div>
  )
}
