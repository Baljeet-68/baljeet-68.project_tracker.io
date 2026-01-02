import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveToken, getToken, saveUser } from '../auth'
import { API_BASE_URL } from '../apiConfig';
import { Eye, EyeOff, Lock, LayoutDashboard, Mail } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
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
      
      nav('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
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

            <form onSubmit={submit} className="space-y-6" name="loginForm">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 uppercase tracking-wider">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-500 transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl text-base placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all bg-gray-50/50"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 uppercase tracking-wider">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-500 transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPwd ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    className="block w-full pl-12 pr-12 py-4 border border-gray-200 rounded-2xl text-base placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all bg-gray-50/50"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-purple-500 transition-colors"
                  >
                    {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
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
                className="w-full py-4 px-6 bg-gradient-to-tl from-purple-700 to-pink-500 text-white text-lg font-bold rounded-2xl shadow-soft-lg hover:shadow-soft-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            <div className="mt-12 text-center">
              <p className="text-slate-400 text-sm font-medium">
                &copy;2026 MMF Infotech Tool. All rights reserved.
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