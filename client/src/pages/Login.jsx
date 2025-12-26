import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveToken, getToken, saveUser } from '../auth'
import { API_BASE_URL } from '../apiConfig';
import { Eye, EyeOff, Lock } from 'lucide-react'

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

      if (!res.ok) throw new Error('Invalid credentials')
      const data = await res.json()
      saveToken(data.token)
      saveUser(data.user)
      if (remember) localStorage.setItem('username', email)
      nav('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed..')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mt-0 transition-all duration-200 ease-soft-in-out">
      <section>
        <div className="relative flex items-center p-0 overflow-hidden bg-center bg-cover min-h-75-screen">
          <div className="container z-10">
            <div className="flex flex-wrap mt-16 -mx-3">
              <div className="flex flex-col w-full max-w-full px-3 mx-auto md:flex-0 shrink-0 md:w-6/12 lg:w-5/12 xl:w-4/12">
                <div className="relative flex flex-col min-w-0 mt-32 break-words bg-transparent border-0 shadow-none rounded-2xl bg-clip-border">
                  <div className="p-6 pb-0 mb-0 bg-transparent border-b-0 rounded-t-2xl">
                    <h3 className="relative z-10 font-bold text-transparent bg-gradient-to-tl from-blue-600 to-cyan-400 bg-clip-text">Welcome back</h3>
                    <p className="mb-0">Enter your email and password to sign in</p>
                  </div>
                  <div className="flex-auto p-6">
                    <form role="form" onSubmit={submit}>
                      <label className="mb-2 ml-1 font-bold text-xs text-slate-700">Email</label>
                      <div className="mb-4">
                        <input
                          type="email"
                          className="focus:shadow-soft-primary-outline text-sm leading-5.6 block w-full appearance-none rounded-lg border border-solid border-gray-300 bg-white bg-clip-padding px-3 py-2 font-normal text-gray-700 transition-all focus:border-fuchsia-300 focus:outline-none focus:transition-shadow"
                          placeholder="Email"
                          aria-label="Email"
                          aria-describedby="email-addon"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <label className="mb-2 ml-1 font-bold text-xs text-slate-700">Password</label>
                      <div className="mb-4 relative">
                        <input
                          type={showPwd ? "text" : "password"}
                          className="focus:shadow-soft-primary-outline text-sm leading-5.6 block w-full appearance-none rounded-lg border border-solid border-gray-300 bg-white bg-clip-padding px-3 py-2 font-normal text-gray-700 transition-all focus:border-fuchsia-300 focus:outline-none focus:transition-shadow"
                          placeholder="Password"
                          aria-label="Password"
                          aria-describedby="password-addon"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <div className="min-h-6 mb-0.5 block pl-12">
                        <input
                          id="rememberMe"
                          className="mt-0.54 rounded-10 duration-250 ease-soft-in-out after:rounded-circle after:shadow-soft-2xl after:duration-250 checked:after:translate-x-5.25 h-5 w-10 cursor-pointer appearance-none border border-solid border-gray-200 bg-slate-800/10 bg-none bg-contain bg-left bg-no-repeat align-top transition-all after:absolute after:top-px after:h-4 after:w-4 after:bg-white after:content-[''] checked:border-slate-800/95 checked:bg-slate-800/95 checked:bg-none checked:bg-right"
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                        />
                        <label className="mb-2 ml-1 font-normal cursor-pointer select-none text-sm text-slate-700" htmlFor="rememberMe">Remember me</label>
                      </div>

                      {error && (
                        <div className="p-3 mb-4 text-white bg-gradient-to-tl from-red-600 to-rose-400 rounded-lg text-sm">
                          {error}
                        </div>
                      )}

                      <div className="text-center">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-block w-full px-6 py-3 mt-6 mb-0 font-bold text-center text-white uppercase align-middle transition-all bg-transparent border-0 rounded-lg cursor-pointer shadow-soft-md bg-x-25 bg-150 leading-pro text-xs ease-soft-in tracking-tight-soft bg-gradient-to-tl from-blue-600 to-cyan-400 hover:scale-102 hover:shadow-soft-xs active:opacity-85"
                        >
                          {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="w-full max-w-full px-3 lg:flex-0 shrink-0 md:w-6/12">
                <div className="absolute top-0 hidden w-3/5 h-full -mr-32 overflow-hidden border-0 rounded-bl-xl md:block right-0 bg-cover bg-center" style={{ backgroundImage: "url('/Project_Tracker_Tool/assets/img/curved-images/curved6.jpg')" }}>
                  <div className="absolute top-0 w-full h-full bg-gradient-to-tl from-blue-600 to-cyan-400 opacity-60"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer className="py-12">
        <div className="container">
          <div className="flex flex-wrap -mx-3">
            <div className="w-8/12 mx-auto text-center">
              <p className="mb-0 text-slate-400">
                Copyright © {new Date().getFullYear()} Project Tracker Tool.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
////check CICD