import React from 'react'

/**
 * Standard page-level container to apply consistent
 * horizontal padding across all authenticated pages.
 *
 * Padding:
 * - Mobile: px-4
 * - Tablet: md:px-6
 * - Desktop: lg:px-8
 * - Large desktop: xl:px-10
 */
export default function PageContainer({ children, className = '' }) {
  return (
    <div className={`w-full px-4 md:px-6 lg:px-8 xl:px-10 py-6 ${className}`}>
      {children}
    </div>
  )
}

