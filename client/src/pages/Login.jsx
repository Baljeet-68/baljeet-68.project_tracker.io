import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveToken, getToken, saveUser } from '../auth'
import { API_BASE_URL } from '../apiConfig';
import { Eye, EyeOff, Lock, LayoutDashboard, Mail } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [remember, setRemember] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    const token = getToken()
    if (token) nav('/', { replace: true })
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) throw new Error('Invalid email or password')
      const data = await res.json()
      saveToken(data.token)
      saveUser(data.user)
      if (remember) localStorage.setItem('username', email)
      nav('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mt-0 transition-all duration-200 ease-soft-in-out bg-gray-50 min-h-screen flex flex-col">
      <section className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl w-full flex flex-col md:flex-row bg-white rounded-3xl shadow-soft-2xl overflow-hidden min-h-[600px]">
          {/* Left Side: Login Form */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tl from-purple-700 to-pink-500 flex items-center justify-center shadow-soft-lg">
                  <LayoutDashboard className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Project Tracker</h2>
              </div>
              <h3 className="text-3xl font-bold text-transparent bg-gradient-to-tl from-purple-700 to-pink-500 bg-clip-text mb-2">
                Welcome back
              </h3>
              <p className="text-slate-500 font-medium">Enter your credentials to access your workspace</p>
            </div>

            <form onSubmit={submit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all bg-gray-50/50"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPwd ? "text" : "password"}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all bg-gray-50/50"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-purple-500 transition-colors"
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <div className={`w-10 h-5 rounded-full shadow-inner transition-colors ${remember ? 'bg-purple-500' : 'bg-gray-200'}`}></div>
                    <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full shadow transition-transform ${remember ? 'translate-x-5' : ''}`}></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">Remember me</span>
                </label>
               </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium animate-shake">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold">!</span>
                  </div>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-tl from-purple-700 to-pink-500 text-white font-bold rounded-2xl shadow-soft-lg hover:shadow-soft-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          </div>

          {/* Right Side: Visual/Branding */}
          <div className="hidden md:block md:w-1/2 relative">
            <div className="absolute inset-0 bg-gradient-to-tl from-purple-700/90 to-pink-500/90 z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80" 
              className="absolute inset-0 w-full h-full object-cover"
              alt="Workspace"
            />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-8 shadow-soft-2xl border border-white/30">
                <LayoutDashboard className="text-white" size={40} />
              </div>
              <h4 className="text-3xl font-bold text-white mb-4">Master Your Projects</h4>
              <p className="text-white/80 text-lg max-w-sm leading-relaxed">
                Streamline your workflow, track bugs in real-time, and deliver exceptional results with our all-in-one project management tool.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm font-medium">
            &copy; {new Date().getFullYear()} Project Tracker Tool. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  )
}

////check CICD