import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch, getUser, clearToken, clearUser } from '../auth'
import { LineChart, BarChart, PieChart, AreaChart, ParetoChart } from '../components/ChartComponents'
import { StatCard, Card, CardHeader, CardBody, Badge } from '../components/TailAdminComponents'
import { TrendingUp, AlertCircle, CheckCircle, Users, Activity, ChevronDown } from 'lucide-react'
import { API_BASE_URL } from '../apiConfig'

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [projectIssuesData, setProjectIssuesData] = useState([])
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
    loadBugTrend(selectedYear)
  }, [selectedYear])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [projRes, bugsRes, screensRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/projects`),
        authFetch(`${API_BASE_URL}/bugs`),
        authFetch(`${API_BASE_URL}/screens`)
      ])

      if (!projRes.ok) throw new Error('Failed to fetch projects')
      let projData = await projRes.json()

      // Filter projects by year
      projData = projData.filter(p => {
        const createdAt = new Date(p.createdAt)
        return createdAt.getFullYear() === selectedYear
      })
      setProjects(projData)

      // Calculate Pareto Chart Data (Module-wise Issues)
      let allBugs = []
      let allScreens = []

      if (bugsRes.ok) {
        allBugs = await bugsRes.json()
        // Filter bugs by year
        allBugs = allBugs.filter(b => {
          const createdAt = new Date(b.createdAt)
          return createdAt.getFullYear() === selectedYear
        })
      }

      if (screensRes.ok) {
        allScreens = await screensRes.json()
        // Filter screens by year
        allScreens = allScreens.filter(s => {
          const createdAt = new Date(s.createdAt)
          return createdAt.getFullYear() === selectedYear
        })
      }

      const moduleMap = {}

      // Count open/in-progress bugs per module
      allBugs.forEach(bug => {
        if (bug.status === 'Open' || bug.status === 'In Progress') {
          const moduleName = bug.module || 'General'
          moduleMap[moduleName] = (moduleMap[moduleName] || 0) + 1
        }
      })

      // Count blocked/overdue screens per module
      allScreens.forEach(screen => {
        if (screen.status === 'Blocked' || (screen.plannedDeadline && new Date(screen.plannedDeadline) < new Date() && screen.status !== 'Done')) {
          const moduleName = screen.module || 'General'
          moduleMap[moduleName] = (moduleMap[moduleName] || 0) + 1
        }
      })

      const paretoData = Object.entries(moduleMap).map(([label, value]) => ({
        label,
        value
      }))

      setProjectIssuesData(paretoData)
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
    running: projects.filter(p => p.status === 'Active' || p.status === 'Running').length,
    completed: projects.filter(p => p.status === 'Completed' || p.status === 'Done').length,
    onHold: projects.filter(p => p.status === 'On Hold').length,
    maintenance: projects.filter(p => p.status === 'Maintenance').length,
    openBugs: projects.reduce((acc, p) => {
      // If user is admin, show all bugs for the project
      // If user is developer, show only bugs assigned to them or bugs in their projects?
      // User request: "as an users developer or tester show only logged in user data"
      // So for bugs, we should only count bugs assigned to this developer or created by this tester
      if (user.role === 'admin') {
        return acc + (p.openBugsCount || 0)
      } else if (user.role === 'developer') {
        // We need to ensure openBugsCount on project object reflects the user's role if filtered by API
        // But for dashboard summary, let's be explicit if the project object has this info
        return acc + (p.userOpenBugsCount !== undefined ? p.userOpenBugsCount : (p.openBugsCount || 0))
      } else if (user.role === 'tester') {
        return acc + (p.userCreatedBugsCount !== undefined ? p.userCreatedBugsCount : (p.openBugsCount || 0))
      }
      return acc + (p.openBugsCount || 0)
    }, 0),
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
  const hasStatusData = statusValues.length > 0 && statusValues.some(v => v > 0)

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
  const hasProgressData = projects.length > 0

  const hasIssuesData = projectIssuesData.length > 0 && projectIssuesData.some(d => d.value > 0)

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
      {/* Dashboard Header & Year Selector */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h4 className="font-bold text-slate-700 mb-1">Dashboard Overview</h4>
            <p className="text-sm text-slate-500 font-medium">Tracking projects and performance for {selectedYear}</p>
          </div>
          <div className="relative w-full md:w-auto">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="appearance-none bg-white border-2 border-fuchsia-400/30 text-slate-700 text-sm font-bold rounded-xl focus:outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 px-6 py-3 pr-12 shadow-soft-xl cursor-pointer transition-all hover:border-fuchsia-500 hover:shadow-fuchsia-500/5 w-full md:min-w-[200px]"
            >
              {availableYears.map(year => (
                <option key={year} value={year} className="py-2">
                  {year === currentYear ? `${year} (Current Year)` : year}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-fuchsia-500">
              <ChevronDown size={20} strokeWidth={3} />
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard 
          title="Total Projects" 
          value={summary.total} 
          icon={Activity} 
          gradient="from-purple-700 to-pink-500"
        />
        <StatCard 
          title="Running Projects" 
          value={summary.running} 
          icon={TrendingUp} 
          gradient="from-blue-600 to-cyan-400"
        />
        <StatCard 
          title="Completed Projects" 
          value={summary.completed} 
          icon={CheckCircle} 
          gradient="from-green-600 to-lime-400"
        />
        <StatCard 
          title="On Hold Projects" 
          value={summary.onHold} 
          icon={Activity} 
          gradient="from-orange-500 to-yellow-400"
        />
        <StatCard 
          title="Maintenance Projects" 
          value={summary.maintenance} 
          icon={Activity} 
          gradient="from-slate-600 to-slate-300"
        />
        <StatCard 
          title="Open Bugs" 
          value={summary.openBugs} 
          icon={AlertCircle} 
          gradient="from-red-600 to-rose-400"
        />
        <StatCard 
          title="Upcoming Deadlines" 
          value={summary.upcomingDeadlines} 
          icon={TrendingUp} 
          gradient="from-blue-600 to-cyan-400"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <Card className="h-full">
            <CardHeader className="flex justify-between items-center">
              <div>
                <h6 className="font-bold">Bugs Trend</h6>
                <p className="leading-normal text-sm">
                  <span className="font-semibold">{currentTotalBugs} bugs</span> in {displayYear}
                </p>
              </div>
            </CardHeader>
            <CardBody className="relative min-h-[300px]">
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
                <AreaChart
                  series={bugTrendSeries}
                  categories={bugTrendCategories}
                  height={300}
                  colors={['#cb0c9f']}
                />
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="h-full">
            <CardHeader>
              <h6 className="font-bold">Projects by Status</h6>
            </CardHeader>
            <CardBody className="relative min-h-[350px]">
              {!hasStatusData ? (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <p className="text-gray-500 font-medium">No data available for this year</p>
                </div>
              ) : null}

              <div className={!hasStatusData ? 'opacity-0' : ''}>
                <PieChart
                  labels={statusLabels}
                  series={statusValues}
                  height={350}
                  colors={['#FF5733', '#FFC300', '#FF33FF', '#8B5CF6', '#0EA5E9', '#10B981']}
                />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12">
          <Card className="h-full overflow-hidden">
            <CardBody className="relative min-h-[350px]">
              {!hasIssuesData ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white p-6">
                  <h6 className="font-bold text-slate-700 mb-2">Module-wise Issue Analysis (Pareto)</h6>
                  <p className="text-gray-500 font-medium">No data available for this year</p>
                </div>
              ) : (
                <ParetoChart
                  title="Module-wise Issue Analysis (Pareto)"
                  data={projectIssuesData}
                  height={350}
                />
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="w-full">
          <Card className="h-full">
            <CardHeader>
              <h6 className="font-bold">Project Status Progress</h6>
            </CardHeader>
            <CardBody className="relative min-h-[300px]">
              {!hasProgressData ? (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <p className="text-gray-500 font-medium">No data available for this year</p>
                </div>
              ) : null}

              <div className={!hasProgressData ? 'opacity-0' : ''}>
                <BarChart
                  series={projectProgressData}
                  categories={projectProgressCategories}
                  height={300}
                  colors={['#cb0c9f', '#17c1e8', '#3a416f', '#f53939']}
                />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
