import React from 'react'
import { Card, CardHeader, CardBody, Button } from './TailAdminComponents'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Loader } from './Loader'

/**
 * A reusable data table with pagination and sorting
 * 
 * @param {Object[]} columns - Column definitions { key, label, render, sortable }
 * @param {Object[]} data - The data to display
 * @param {boolean} loading - Loading state
 * @param {boolean} pagination - Enable/disable pagination
 * @param {number} pageSize - Number of items per page
 * @param {string} emptyMessage - Message to show when no data is available
 */
export const Table = ({
  columns,
  data = [],
  loading = false,
  pagination = false,
  pageSize = 10,
  emptyMessage = "No data available"
}) => {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [sortConfig, setSortConfig] = React.useState({ key: null, direction: 'asc' })

  // Reset page when data changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [data.length])

  // Sorting Logic
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }

  // Pagination Logic
  const totalItems = sortedData.length
  const totalPages = Math.ceil(totalItems / pageSize)

  const paginatedData = React.useMemo(() => {
    return pagination
      ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
      : sortedData
  }, [sortedData, pagination, currentPage, pageSize])

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
    return <Loader message="Loading data..." />
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 mx-4 my-2">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          </div>
          <p className="text-slate-500 font-medium">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-auto px-0 pt-0 pb-2">
      <div className="p-0 overflow-x-auto">
        <table className="items-center w-full mb-0 align-top border-gray-200 text-slate-500">
          <thead className="align-bottom">
            <tr className="bg-gradient-to-r from-gray-50 via-slate-50 to-gray-100/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && requestSort(col.key)}
                  className={`sticky top-0 z-10 bg-white px-6 py-5 font-bold text-left uppercase align-middle border-b border-gray-200 shadow-none text-xxs border-b-solid tracking-tight-soft text-slate-500 ${col.sortable ? 'cursor-pointer hover:bg-slate-100/80 transition-colors group' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && (
                      <span className={`transition-opacity ${sortConfig.key === col.key ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                        {sortConfig.key === col.key && sortConfig.direction === 'desc' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                {columns.map((col) => (
                  <td key={`${idx}-${col.key}`} className="py-5 align-middle bg-transparent border-b whitespace-nowrap shadow-transparent px-6 text-sm">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="mt-4 mb-4 px-4">
          <div className="flex flex-wrap items-center justify-between bg-white rounded-full border border-gray-100 shadow-sm px-6 py-3 gap-4">
            {/* Left & Center: Navigation */}
            <div className="flex items-center gap-4 md:gap-8">
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 text-sm font-medium transition-all ${currentPage === 1
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
                        className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-full transition-all ${currentPage === page
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
                className={`flex items-center gap-2 text-sm font-medium transition-all ${currentPage === totalPages
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

/**
 * A responsive modal dialog component with keyboard support and backdrop
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {string} title - The title displayed in the header
 * @param {React.ReactNode} children - The content of the modal
 * @param {function} onClose - Callback when the modal should close
 * @param {React.ReactNode} footer - Optional footer elements
 * @param {string} size - Modal width: 'sm', 'md', 'lg', 'xl', '2xl'
 */
export const Modal = ({ isOpen, title, children, onClose, footer, size = 'md' }) => {
  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleEsc)

    // Prevent scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div
          className={`bg-white rounded-2xl shadow-soft-2xl ${sizes[size] || sizes.md} w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto transform transition-all animate-slide-up`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-none bg-white">
            <h6 id="modal-title" className="mb-0 font-bold text-slate-700">{title}</h6>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-50"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto flex-auto">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end flex-none bg-gray-50/50">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/**
 * A specialized confirmation dialog
 */
export const ConfirmDialog = ({
  isOpen,
  title = 'Confirmation',
  message,
  onConfirm,
  onCancel,
  confirmText = 'Yes, Proceed',
  cancelText = 'Cancel',
  type = 'primary'
}) => {
  // Use the same keyboard and body lock logic as Modal
  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onCancel()
    }
    window.addEventListener('keydown', handleEsc)
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] transition-opacity animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-3xl shadow-soft-2xl max-w-sm w-full p-8 pointer-events-auto transform transition-all animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'
              }`}>
              {type === 'danger' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
              )}
            </div>
            <h6 className="mb-2 font-bold text-slate-700 text-xl">{title}</h6>
            <p className="mb-8 text-slate-500 text-sm font-medium leading-relaxed">{message}</p>

            <div className="flex flex-col gap-3">
              <Button
                variant={type === 'danger' ? 'danger' : 'success'}
                fullWidth
                onClick={onConfirm}
                className="py-3"
              >
                {confirmText}
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={onCancel}
                className="py-3 border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {cancelText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Self-closing notification toast
 */
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
    <div className={`fixed top-4 right-4 max-w-sm p-4 rounded-xl bg-gradient-to-tl ${gradient[type]} text-white shadow-soft-2xl z-[100] animate-slide-in-right flex items-center gap-3`}>
      <div className="flex-auto font-medium text-sm">{message}</div>
      <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity">✕</button>
    </div>
  )
}

/**
 * Standardized input group with label, icon, and error handling
 */
export const InputGroup = ({ label, type = 'text', error, icon, rightElement, as: Component = 'input', ...props }) => (
  <div className="mb-4">
    {label && (
      <label className="mb-2 ml-1 font-bold text-xs text-slate-700 block">
        {label}
      </label>
    )}
    <div className={`relative flex ${Component === 'textarea' ? 'items-start pt-0' : 'items-center'}`}>
      {icon && (
        <div className={`absolute left-3.5 flex items-center pointer-events-none text-slate-400 ${Component === 'textarea' ? 'mt-3' : ''}`}>
          {icon}
        </div>
      )}
      <Component
        {...(Component === 'input' ? { type } : {})}
        className={`focus:shadow-soft-primary-outline text-sm leading-5.6 block w-full appearance-none rounded-lg border border-solid bg-white bg-clip-padding py-2.5 font-normal text-gray-700 transition-all focus:border-indigo-300 focus:outline-none focus:transition-shadow ${error ? 'border-red-400 ring-1 ring-red-100' : 'border-gray-200 hover:border-gray-300'
          } ${icon ? 'pl-11' : 'px-4'} ${rightElement ? 'pr-12' : ''}`}
        {...props}
      />
      {rightElement && (
        <div className="absolute right-3.5 flex items-center">
          {rightElement}
        </div>
      )}
    </div>
    {error && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{error}</p>}
  </div>
)

/**
 * Reusable alert/callout component
 */
export const Alert = ({ children, variant = 'info', className = '' }) => {
  const variants = {
    info: 'from-blue-600 to-cyan-400',
    success: 'from-green-600 to-lime-400',
    danger: 'from-red-600 to-rose-400',
    warning: 'from-orange-500 to-yellow-400',
  }

  return (
    <div className={`p-4 text-white bg-gradient-to-tl ${variants[variant]} rounded-xl text-sm shadow-soft-md animate-fade-in ${className}`}>
      {children}
    </div>
  )
}

/**
 * Standardized select dropdown
 */
export const Select = ({ label, options = [], error, icon, containerClassName = "mb-4", ...props }) => (
  <div className={containerClassName}>
    {label && (
      <label className="mb-2 ml-1 font-bold text-xs text-slate-700 block">
        {label}
      </label>
    )}
    <div className="relative flex items-center">
      {icon && (
        <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
          {icon}
        </div>
      )}
      <select
        className={`focus:shadow-soft-primary-outline text-sm leading-5.6 block w-full appearance-none rounded-lg border border-solid bg-white bg-clip-padding py-2.5 font-normal text-gray-700 transition-all focus:border-indigo-300 focus:outline-none focus:transition-shadow ${error ? 'border-red-400 ring-1 ring-red-100' : 'border-gray-200 hover:border-gray-300'
          } ${icon ? 'pl-11' : 'px-4'} pr-10 cursor-pointer`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3.5 pointer-events-none text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </div>
    </div>
    {error && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{error}</p>}
  </div>
)

/**
 * Visual progress indicator
 */
export const ProgressBar = ({ value, max = 100, label, showLabel = true, gradient = 'from-blue-600 to-cyan-400' }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className="w-full mb-4">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5 px-1">
          <span className="text-xs font-bold text-slate-600">{label}</span>
          <span className="text-xs font-bold text-slate-700">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500 ease-out shadow-sm`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

/**
 * User avatar with fallback to initials
 */
export const Avatar = ({ src, alt, initials, size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  const baseClasses = "rounded-full flex items-center justify-center font-bold shadow-soft-sm ring-2 ring-white overflow-hidden shrink-0"

  if (src) {
    return (
      <div className={`${sizes[size]} ${baseClasses}`}>
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.classList.add('bg-gradient-to-br', 'from-slate-100', 'to-slate-200', 'text-slate-500');
            e.target.parentElement.innerHTML = initials || '?';
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={`${sizes[size]} ${baseClasses} bg-gradient-to-br from-indigo-500 to-purple-600 text-white`}
    >
      {initials}
    </div>
  )
}
