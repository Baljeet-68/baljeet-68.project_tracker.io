// Soft UI Card Component - Enhanced with animations
export const Card = ({ children, className = '', shadow = true }) => {
  const shadowClass = shadow ? 'shadow-lg hover:shadow-2xl transition-all duration-300' : ''
  return (
    <div className={`relative flex flex-col min-w-0 break-words bg-white border-0 ${shadowClass} rounded-3xl bg-clip-border overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

export const PageHeader = ({ title, subtitle, actions, className = '' }) => (
  <Card className={`p-6 mb-6 bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 ${className}`}>
    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
      <div>
        <h4 className="font-bold text-slate-800 mb-1">{title}</h4>
        <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
      </div>
      <div className="flex gap-3">
        {actions}
      </div>
    </div>
  </Card>
)

// Card Header - Enhanced with better styling
export const CardHeader = ({ children, className = '' }) => (
  <div className={`p-6 pb-3 mb-0 bg-white border-b-0 rounded-t-3xl font-medium text-slate-700 ${className}`}>
    {children}
  </div>
)

// Card Body - Enhanced with better spacing
export const CardBody = ({ children, className = '' }) => (
  <div className={`flex-auto p-6 ${className}`}>
    {children}
  </div>
)

// Stat Card - Enhanced with gradient backgrounds and animations
export const StatCard = ({ icon: Icon, title, value, change, changeType = 'positive', gradient = 'from-purple-700 to-pink-500', children, className = '' }) => {
  return (
    <Card className={`p-5 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-default ${className}`}>
      <div className="flex flex-row items-center gap-4">
        <div className="flex-1">
          <p className="mb-2 font-sans font-semibold leading-normal text-xs text-slate-500 uppercase tracking-wide">{title}</p>
          <div className="flex items-end gap-2">
            <h5 className="mb-0 font-bold text-2xl text-slate-800">
              {value}
            </h5>
            {change && (
              <span className={`leading-normal text-sm font-semibold flex items-center gap-1 ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                {changeType === 'positive' ? '+' : '-'}{change}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <div className={`inline-flex items-center justify-center w-14 h-14 text-center rounded-2xl bg-gradient-to-tl ${gradient} shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110`}>
            {Icon && <Icon className="text-white h-7 w-7" strokeWidth={2} />}
          </div>
        </div>
      </div>
      {children && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          {children}
        </div>
      )}
    </Card>
  )
}

// Badge Component - Enhanced
export const Badge = ({ children, gradient = 'from-slate-600 to-slate-300', size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-semibold',
    md: 'px-4 py-2 text-sm font-semibold',
    lg: 'px-5 py-2.5 text-base font-bold',
  }

  return (
    <span className={`bg-gradient-to-r ${gradient} ${sizeClasses[size]} rounded-full inline-block whitespace-nowrap text-center align-baseline leading-none text-white shadow-md hover:shadow-lg transition-all duration-200`}>
      {children}
    </span>
  )
}

// Button Component - Enhanced with better animations
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs font-semibold',
    md: 'px-6 py-3 text-sm font-semibold',
    lg: 'px-8 py-4 text-base font-bold',
  }

  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:from-purple-700 hover:to-pink-600 active:scale-95',
    secondary: 'bg-gradient-to-r from-slate-600 to-slate-400 text-white hover:shadow-lg active:scale-95',
    danger: 'bg-gradient-to-r from-red-600 to-rose-500 text-white hover:shadow-lg active:scale-95',
    success: 'bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:shadow-lg active:scale-95',
    info: 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg active:scale-95',
    outline: 'border-2 border-fuchsia-300 text-fuchsia-600 bg-white hover:bg-fuchsia-50 hover:border-fuchsia-400 active:scale-95',
  }

  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl border-0 cursor-pointer transition-all duration-200 ease-in-out ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// Loading Skeleton - Enhanced
export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gradient-to-r from-slate-200 to-slate-100 rounded-2xl ${className}`} />
)
