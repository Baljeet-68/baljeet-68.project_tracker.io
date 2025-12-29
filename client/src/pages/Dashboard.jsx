import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch, getUser, clearToken, clearUser } from '../auth'
import { LineChart, BarChart, PieChart, AreaChart } from '../components/ChartComponents'
import { StatCard, Card, CardHeader, CardBody, Badge } from '../components/TailAdminComponents'
import { TrendingUp, AlertCircle, CheckCircle, Users, Activity, ChevronDown } from 'lucide-react'
import { API_BASE_URL } from '../apiConfig'

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [bugTrend, setBugTrend] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [trendLoading, setTrendLoading] = useState(false)
  const user = getUser()

  const nav = useNavigate()

  // Generate last 5 years
  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadBugTrend(selectedYear)
  }, [selectedYear])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const projRes = await authFetch(`${API_BASE_URL}/projects`)
      if (!projRes.ok) throw new Error('Failed to fetch projects')
      const projData = await projRes.json()
      setProjects(projData)
    } catch (e) {
      handleAuthError(e)
    } finally {
      setLoading(false)
    }
  }

  const loadBugTrend = async (year) => {
    setTrendLoading(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/bugs/stats/${year}`)
      if (!res.ok) throw new Error('Failed to fetch bug trend')
      const data = await res.json()
      setBugTrend(data)
    } catch (e) {
      handleAuthError(e)
    } finally {
      setTrendLoading(false)
    }
  }

  const handleAuthError = (e) => {
    if (e.message === 'Unauthorized: Token expired or invalid') {
      clearToken()
      clearUser()
      nav('/login', { replace: true })
    } else {
      setError(e.message)
    }
  }

  const loadProjects = async () => {
    // This function is now part of loadInitialData but kept for compatibility if needed elsewhere
    loadInitialData()
  }

  const summary = {
    total: projects.length,
    openBugs: projects.reduce((acc, p) => acc + (p.openBugsCount || 0), 0),
    completedScreens: projects.reduce((acc, p) => acc + (p.completedScreensCount || 0), 0),
    upcomingDeadlines: projects.reduce((acc, p) => acc + (p.upcomingDeadlines || 0), 0)
  }

  // Prepare chart data - group similar statuses together
  const statusMap = {}
  projects.forEach(p => {
    let mappedStatus = p.status || 'Unknown'
    if (p.status === 'Active' || p.status === 'Running') mappedStatus = 'Running'
    if (p.status === 'Planning' || p.status === 'Under Planning') mappedStatus = 'Planning'
    statusMap[mappedStatus] = (statusMap[mappedStatus] || 0) + 1
  })
  const statusData = Object.entries(statusMap)

  const statusLabels = statusData.map(([status]) => status)
  const statusValues = statusData.map(([, count]) => count)

  // Format bug trend data for chart
  const bugTrendCategories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const bugTrendSeries = [
    {
      name: 'Open Bugs',
      data: bugTrendCategories.map((_, index) => {
        const monthData = bugTrend.find(d => d.month === index + 1)
        return monthData ? monthData.count : 0
      })
    }
  ]

  const hasTrendData = bugTrendSeries[0].data.some(val => val > 0)

  // Calculate year-over-year comparison (mock for now as we only fetch one year)
  const currentTotalBugs = bugTrendSeries[0].data.reduce((a, b) => a + b, 0)
  const displayYear = selectedYear

  // Dynamic project progress data - handle both old and new status names
  const planningCount = projects.filter(p => p.status === 'Planning' || p.status === 'Under Planning').length
  const runningCount = projects.filter(p => p.status === 'Active' || p.status === 'Running').length
  const onHoldCount = projects.filter(p => p.status === 'On Hold').length
  const criticalCount = projects.filter(p => p.status === 'Critical').length

  const projectProgressData = [
    { name: 'Planning', data: [planningCount, planningCount, planningCount, planningCount] },
    { name: 'Running', data: [runningCount, runningCount, runningCount, runningCount] },
    { name: 'On Hold', data: [onHoldCount, onHoldCount, onHoldCount, onHoldCount] },
    { name: 'Critical', data: [criticalCount, criticalCount, criticalCount, criticalCount] }
  ]
  const projectProgressCategories = ['Q1', 'Q2', 'Q3', 'Q4']

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg" />
          <div className="h-96 bg-gray-200 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="relative flex flex-col min-w-0 break-words bg-white shadow-soft-xl rounded-2xl bg-clip-border">
          <div className="flex-auto p-4">
            <div className="flex flex-row items-center justify-between">
              <div className="flex-none w-2/3">
                <div>
                  <p className="mb-0 font-sans font-semibold leading-normal text-sm">Total Projects</p>
                  <h5 className="mb-0 font-bold">
                    {summary.total}
                    <span className="leading-normal text-sm font-weight-bolder text-lime-500"> +5%</span>
                  </h5>
                </div>
              </div>
              <div className="flex-none">
                <div className="inline-block w-12 h-12 text-center rounded-lg bg-gradient-to-tl from-purple-700 to-pink-500 shadow-soft-2xl">
                  <Activity className="text-white h-full w-full p-3" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col min-w-0 break-words bg-white shadow-soft-xl rounded-2xl bg-clip-border">
          <div className="flex-auto p-4">
            <div className="flex flex-row items-center justify-between">
              <div className="flex-none w-2/3">
                <div>
                  <p className="mb-0 font-sans font-semibold leading-normal text-sm">Open Bugs</p>
                  <h5 className="mb-0 font-bold">
                    {summary.openBugs}
                    <span className="leading-normal text-sm font-weight-bolder text-red-600"> +3%</span>
                  </h5>
                </div>
              </div>
              <div className="flex-none">
                <div className="inline-block w-12 h-12 text-center rounded-lg bg-gradient-to-tl from-red-600 to-rose-400 shadow-soft-2xl">
                  <AlertCircle className="text-white h-full w-full p-3" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col min-w-0 break-words bg-white shadow-soft-xl rounded-2xl bg-clip-border">
          <div className="flex-auto p-4">
            <div className="flex flex-row items-center justify-between">
              <div className="flex-none w-2/3">
                <div>
                  <p className="mb-0 font-sans font-semibold leading-normal text-sm">Completed Screens</p>
                  <h5 className="mb-0 font-bold">
                    {summary.completedScreens}
                  </h5>
                </div>
              </div>
              <div className="flex-none">
                <div className="inline-block w-12 h-12 text-center rounded-lg bg-gradient-to-tl from-green-600 to-lime-400 shadow-soft-2xl">
                  <CheckCircle className="text-white h-full w-full p-3" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col min-w-0 break-words bg-white shadow-soft-xl rounded-2xl bg-clip-border">
          <div className="flex-auto p-4">
            <div className="flex flex-row items-center justify-between">
              <div className="flex-none w-2/3">
                <div>
                  <p className="mb-0 font-sans font-semibold leading-normal text-sm">Upcoming Deadlines</p>
                  <h5 className="mb-0 font-bold">
                    {summary.upcomingDeadlines}
                  </h5>
                </div>
              </div>
              <div className="flex-none">
                <div className="inline-block w-12 h-12 text-center rounded-lg bg-gradient-to-tl from-blue-600 to-cyan-400 shadow-soft-2xl">
                  <TrendingUp className="text-white h-full w-full p-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <div className="border-black/12.5 shadow-soft-xl relative z-20 flex min-w-0 flex-col break-words rounded-2xl border-0 border-solid bg-white bg-clip-border h-full">
            <div className="border-black/12.5 mb-0 rounded-t-2xl border-b-0 border-solid bg-white p-6 pb-0 flex justify-between items-center">
              <div>
                <h6 className="font-bold">Bugs Trend</h6>
                <p className="leading-normal text-sm">
                  <span className="font-semibold">{currentTotalBugs} bugs</span> in {displayYear}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="appearance-none bg-white border-2 border-fuchsia-100 text-slate-700 text-[13px] font-bold rounded-full focus:outline-none focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-50/50 px-5 py-2 pr-10 shadow-sm cursor-pointer transition-all hover:border-fuchsia-300 hover:bg-fuchsia-50/30 min-w-[110px]"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-fuchsia-500 group-hover:text-fuchsia-600 transition-colors">
                    <ChevronDown size={16} strokeWidth={3} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-auto p-4 relative min-h-[300px]">
              {trendLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
                </div>
              ) : null}
              
              {!hasTrendData && !trendLoading ? (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <p className="text-gray-500 font-medium">No data available for this year</p>
                </div>
              ) : null}

              <div className={!hasTrendData ? 'opacity-20' : ''}>
                <LineChart 
                  series={bugTrendSeries} 
                  categories={bugTrendCategories} 
                  height={300}
                  colors={['#cb0c9f']}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="border-black/12.5 shadow-soft-xl relative z-20 flex min-w-0 flex-col break-words rounded-2xl border-0 border-solid bg-white bg-clip-border h-full">
            <div className="border-black/12.5 mb-0 rounded-t-2xl border-b-0 border-solid bg-white p-6 pb-0">
              <h6 className="font-bold">Projects by Status</h6>
            </div>
            <div className="flex-auto p-4">
              <PieChart 
                labels={statusLabels} 
                series={statusValues} 
                height={350}
                colors={['#FF5733', '#FFC300', '#FF33FF', '#8B5CF6', '#0EA5E9', '#10B981']}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="w-full">
          <div className="border-black/12.5 shadow-soft-xl relative z-20 flex min-w-0 flex-col break-words rounded-2xl border-0 border-solid bg-white bg-clip-border">
            <div className="border-black/12.5 mb-0 rounded-t-2xl border-b-0 border-solid bg-white p-6 pb-0">
              <h6 className="font-bold">Project Status Progress</h6>
            </div>
            <div className="flex-auto p-4">
              <BarChart 
                series={projectProgressData} 
                categories={projectProgressCategories} 
                height={300}
                colors={['#cb0c9f', '#17c1e8', '#3a416f', '#f53939']}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
