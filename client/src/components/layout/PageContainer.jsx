import React from 'react'

export default function PageContainer({ children, className = '' }) {
  return (
    <div className={`w-full min-w-0 overflow-x-hidden px-4 sm:px-6 lg:px-8 py-4 ${className}`}>
      {children}
    </div>
  )
}

