// TailAdmin Card Component
export const Card = ({ children, className = '', shadow = true }) => {
  const shadowClass = shadow ? 'shadow-soft' : ''
  return (
    <div className={`bg-white rounded-sm border border-gray-200 ${shadowClass} ${className}`}>
      {children}
    </div>
  )
}

// Card Header
export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-4 py-6 border-b border-gray-200 ${className}`}>
    {children}
  </div>
)

// Card Body
export const CardBody = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
)

// Stat Card
export const StatCard = ({ icon: Icon, title, value, change, changeType = 'positive', color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-warning text-warning',
    danger: 'bg-danger text-danger',
    info: 'bg-info text-info',
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <h4 className="text-2xl font-bold text-dark-900">{value}</h4>
          {change && (
            <p className={`text-xs font-medium ${changeType === 'positive' ? 'text-success' : 'text-danger'}`}>
              <span>{changeType === 'positive' ? '▲' : '▼'}</span> {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-4 rounded-full ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card>
  )
}

// Badge Component
export const Badge = ({ children, variant = 'primary', size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-warning/20 text-warning',
    danger: 'bg-danger/20 text-danger',
    gray: 'bg-gray-100 text-gray-800',
  }

  return (
    <span className={`inline-block rounded-full font-medium ${sizeClasses[size]} ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}

// Button Component
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 transition',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 transition',
    danger: 'bg-danger text-white hover:bg-red-700 transition',
    outline: 'border border-gray-300 text-gray-900 hover:bg-gray-50 transition',
  }

  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button 
      className={`rounded-md font-medium transition-colors ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// Loading Skeleton
export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
)
