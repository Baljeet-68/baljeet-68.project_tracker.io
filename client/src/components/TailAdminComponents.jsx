// Soft UI Card Component
export const Card = ({ children, className = '', shadow = true }) => {
  const shadowClass = shadow ? 'shadow-soft-2xl' : ''
  return (
    <div className={`relative flex flex-col min-w-0 break-words bg-white border-0 ${shadowClass} rounded-3xl bg-clip-border overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

export const PageHeader = ({ title, subtitle, actions, className = '' }) => (
  <Card className={`p-6 mb-6 ${className}`}>
    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
      <div>
        <h4 className="font-bold text-slate-700 mb-1">{title}</h4>
        <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
      </div>
      <div className="flex gap-3">
        {actions}
      </div>
    </div>
  </Card>
)

// Card Header
export const CardHeader = ({ children, className = '' }) => (
  <div className={`p-6 pb-0 mb-0 bg-white border-b-0 rounded-t-3xl ${className}`}>
    {children}
  </div>
)

// Card Body
export const CardBody = ({ children, className = '' }) => (
  <div className={`flex-auto p-6 ${className}`}>
    {children}
  </div>
)

// Stat Card
export const StatCard = ({ icon: Icon, title, value, change, changeType = 'positive', gradient = 'from-purple-700 to-pink-500', children, className = '' }) => {
  return (
    <Card className={`p-4 h-full ${className}`}>
      <div className="flex flex-row -mx-3 items-center">
        <div className="flex-none w-2/3 max-w-full px-3">
          <div>
            <p className="mb-0 font-sans font-semibold leading-normal text-sm text-slate-400 uppercase">{title}</p>
            <h5 className="mb-0 font-bold text-slate-700">
              {value}
              {change && (
                <span className={`leading-normal text-sm font-weight-bolder ${changeType === 'positive' ? 'text-lime-500' : 'text-red-600'}`}>
                  {' '}{changeType === 'positive' ? '+' : '-'}{change}
                </span>
              )}
            </h5>
          </div>
        </div>
        <div className="px-3 text-right basis-1/3">
          <div className={`inline-block w-12 h-12 text-center rounded-xl bg-gradient-to-tl ${gradient} shadow-soft-2xl`}>
            {Icon && <Icon className="text-white h-full w-full p-3" />}
          </div>
        </div>
      </div>
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </Card>
  )
}

// Badge Component
export const Badge = ({ children, gradient = 'from-slate-600 to-slate-300', size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xxs',
    md: 'px-4 py-2 text-xs',
    lg: 'px-5 py-2.5 text-sm',
  }

  return (
    <span className={`bg-gradient-to-tl ${gradient} ${sizeClasses[size]} rounded-lg inline-block whitespace-nowrap text-center align-baseline font-bold uppercase leading-none text-white shadow-soft-sm`}>
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
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-xs',
    lg: 'px-8 py-4 text-sm',
  }

  const variantClasses = {
    primary: 'bg-gradient-to-tl from-purple-700 to-pink-500 text-white hover:scale-102 active:opacity-85',
    secondary: 'bg-gradient-to-tl from-slate-600 to-slate-300 text-white hover:scale-102 active:opacity-85',
    danger: 'bg-gradient-to-tl from-red-600 to-rose-400 text-white hover:scale-102 active:opacity-85',
    success: 'bg-gradient-to-tl from-green-600 to-lime-400 text-white hover:scale-102 active:opacity-85',
    info: 'bg-gradient-to-tl from-blue-600 to-cyan-400 text-white hover:scale-102 active:opacity-85',
    outline: 'border border-fuchsia-300 text-fuchsia-300 bg-transparent hover:bg-fuchsia-300 hover:text-white',
  }

  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button 
      className={`inline-flex items-center justify-center font-bold text-center uppercase align-middle transition-all border-0 rounded-lg cursor-pointer shadow-soft-md bg-x-25 bg-150 leading-pro ease-soft-in tracking-tight-soft ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// Loading Skeleton
export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded-2xl ${className}`} />
)
