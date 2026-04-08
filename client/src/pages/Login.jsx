import React, { useState, useEffect } from 'react'
import { saveToken, getToken, saveUser } from '../auth'
import { API_BASE_URL } from '../apiConfig';
import { Eye, EyeOff, Lock, LayoutDashboard, Mail } from 'lucide-react'
import { InputGroup } from '../components/FormComponents'
import { Button } from '../components/TailAdminComponents'
import { Loader } from '../components/Loader'
import { handleError, handleApiResponse, validateField } from '../utils/errorHandler'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const APP_URL = 'https://project-tracker-tool.vercel.app/'

  useEffect(() => {
    const token = getToken()
    if (token) window.location.href = APP_URL
  }, [APP_URL])

  const validate = () => {
    const errors = {}
    const emailError = validateField('email', email)
    const passwordError = validateField('password', password)
    
    if (emailError) errors.email = emailError
    if (passwordError) errors.password = passwordError
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)
    // Clear error as user types
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: '' }))
    }
  }

  const handlePasswordChange = (e) => {
    const value = e.target.value
    setPassword(value)
    // Clear error as user types
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: '' }))
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await handleApiResponse(res)
      saveToken(data.token)
      saveUser(data.user)
      
      window.location.href = APP_URL
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mt-0 transition-all duration-200 ease-soft-in-out bg-white min-h-screen flex flex-col">
      <section className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-screen">
        {/* Left Side: Login Form */}
        <div className="w-full md:w-1/2 lg:w-5/12 p-8 md:p-16 lg:p-24 flex flex-col justify-center bg-white relative z-20">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-purple-700 to-pink-500 flex items-center justify-center shadow-soft-lg">
                  <LayoutDashboard className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">MMF Infotech Tool</h2>
              </div>
              <h3 className="text-4xl font-extrabold text-transparent bg-gradient-to-tl from-purple-700 to-pink-500 bg-clip-text mb-3">
                Welcome!
              </h3>
              <p className="text-slate-500 text-lg font-medium">Enter your credentials to access your workspace</p>
            </div>

            <form onSubmit={submit} className="space-y-6" name="loginForm" noValidate>
              {loading && <Loader message="Authenticating..." />}
              <InputGroup
                label="Email Address"
                type="email"
                icon={<Mail size={18} className="text-slate-400" />}
                placeholder="Enter your email address"
                value={email}
                onChange={handleEmailChange}
                error={fieldErrors.email}
                required
              />

              <InputGroup
                label="Password"
                type={showPwd ? "text" : "password"}
                icon={<Lock size={18} className="text-slate-400" />}
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                error={fieldErrors.password}
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="text-slate-400 hover:text-purple-500 transition-colors"
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              <Button
                type="submit"
                disabled={loading || isLocked}
                className="w-full py-4 text-lg font-bold rounded-2xl flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </Button>
            </form>

            <div className="mt-12 text-center">
              <p className="text-slate-400 text-sm font-medium">
                &copy;{new Date().getFullYear()} MMF Infotech Tool. All rights reserved.
              </p>
              <p className="text-slate-400 text-sm font-medium">
                version 1.0.0
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Visual/Branding - Full Page */}
        <div className="hidden md:block md:w-1/2 lg:w-7/12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-700/80 via-pink-500/80 to-orange-400/80 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80" 
            className="absolute inset-0 w-full h-full object-cover scale-105"
            alt="Workspace"
          />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-16 text-center text-white">
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center mb-10 shadow-soft-2xl border border-white/30">
              <LayoutDashboard className="text-white" size={48} />
            </div>
            <h4 className="text-5xl font-extrabold mb-6 tracking-tight">Master Your Projects</h4>
            <p className="text-white/90 text-xl max-w-lg leading-relaxed font-medium">
              Streamline your workflow, track bugs in real-time, and deliver exceptional results with our all-in-one project management tool.
            </p>
            
            <div className="mt-16 grid grid-cols-3 gap-8 w-full max-w-md">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">99%</div>
                <div className="text-white/60 text-sm uppercase tracking-widest font-bold">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">24/7</div>
                <div className="text-white/60 text-sm uppercase tracking-widest font-bold">Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">10k+</div>
                <div className="text-white/60 text-sm uppercase tracking-widest font-bold">Users</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

////check CICD
