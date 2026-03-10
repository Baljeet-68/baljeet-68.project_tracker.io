import React from 'react'
import { PageHeader } from '../TailAdminComponents'

/**
 * Standard page layout wrapper to ensure consistent
 * page padding, max-width, spacing, and header structure.
 *
 * Props:
 * - title, subtitle, actions: forwarded to PageHeader
 * - maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
 * - children: page content
 */
export default function PageLayout({
  title,
  subtitle,
  actions,
  maxWidth = '2xl',
  className = '',
  children,
}) {
  const widthMap = {
    sm: 'max-w-xl',
    md: 'max-w-3xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-none',
  }

  const widthClass = widthMap[maxWidth] || widthMap['2xl']

  return (
    <div className="w-full">
      <div
        className={`mx-auto ${widthClass} flex flex-col gap-6 px-2 sm:px-4 lg:px-6`}
      >
        {title && (
          <PageHeader
            title={title}
            subtitle={subtitle}
            actions={actions}
            className="mb-0"
          />
        )}
        {children}
      </div>
    </div>
  )
}

