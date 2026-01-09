import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch, getUser, clearToken, clearUser } from '../auth'
import { LineChart, BarChart, PieChart, AreaChart, ParetoChart } from '../components/ChartComponents'
import { StatCard, Card, CardHeader, CardBody, Badge, PageHeader } from '../components/TailAdminComponents'
import { TrendingUp, AlertCircle, CheckCircle, Users, Activity, ChevronDown } from 'lucide-react'
import { API_BASE_URL } from '../apiConfig'
import { Loader } from '../components/Loader'

/**
 * Dashboard Component
 * @description Provides a high-level overview of projects, bugs, and performance metrics.
 */
export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [allBugs, setAllBugs] = useState([])
  const [allScreens, setAllScreens] = useState([])
  const [bugTrend, setBugTrend] = useState([])
  const [selectedYear, setSelectedYear] = useState(() => {
    const saved = localStorage.getItem('dashboardSelectedYear')
    return saved ? parseInt(saved, 10) : new Date().getFullYear()
  })

  // Persist selected year
  useEffect(() => {
    localStorage.setItem('dashboardSelectedYear', selectedYear.toString())
  }, [selectedYear])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [trendLoading, setTrendLoading] = useState(false)
  
  const user = getUser()
  const nav = useNavigate()

  // Generate the last 5 years for the filter dropdown
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => currentYear - i)
  }, [])

  /**
   * Error handler for authentication failures
   */
  const handleAuthError = useCallback((e) => {
    if (e.message?.includes('Unauthorized') || e.message?.includes('Token expired')) {
      clearToken()
      clearUser()
      nav('/login', { replace: true })
    } else {
      setError(e.message)
    }
  }, [nav])

  /**
   * Fetches initial data including projects, bugs, and screens
   */
  const loadInitialData = useCallback(async () => {
    setLoading(true)
    try {
      const [projRes, bugsRes, screensRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/projects`),
        authFetch(`${API_BASE_URL}/bugs`),
        authFetch(`${API_BASE_URL}/screens`)
      ])

      if (!projRes.ok) throw new Error('Failed to fetch projects')
      
      const projData = await projRes.json()
      const bugsData = bugsRes.ok ? await bugsRes.json() : []
      const screensData = screensRes.ok ? await screensRes.json() : []

      setProjects(projData)
      setAllBugs(bugsData)
      setAllScreens(screensData)
    } catch (e) {
      handleAuthError(e)
    } finally {
      setLoading(false)
    }
  }, [handleAuthError])

  /**
   * Fetches monthly bug trend data for the selected year
   */
  const loadBugTrend = useCallback(async (year) => {
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
  }, [handleAuthError])

  // Load data on mount and when selectedYear changes
  useEffect(() => {
    if (user?.role?.toLowerCase() === 'hr') {
      nav('/notifications', { replace: true })
      return
    }
    loadInitialData()
    loadBugTrend(selectedYear)
  }, [selectedYear, loadInitialData, loadBugTrend, nav, user?.role])

  // --- Memoized Derived Data ---

  // Filtered projects for the selected year
  const filteredProjects = useMemo(() => {
    return projects.filter(p => new Date(p.createdAt).getFullYear() === selectedYear)
  }, [projects, selectedYear])

  // Filtered bugs for the selected year
  const filteredBugs = useMemo(() => {
    return allBugs.filter(b => new Date(b.createdAt).getFullYear() === selectedYear)
  }, [allBugs, selectedYear])

  // Filtered screens for the selected year
  const filteredScreens = useMemo(() => {
    return allScreens.filter(s => new Date(s.createdAt).getFullYear() === selectedYear)
  }, [allScreens, selectedYear])

  // Pareto Chart Data (Module-wise Issues)
  const projectIssuesData = useMemo(() => {
    const moduleMap = {}
    const now = new Date()

    // Count open/in-progress bugs per module
    filteredBugs.forEach(bug => {
      if (bug.status === 'Open' || bug.status === 'In Progress') {
        const moduleName = bug.module || 'General'
        moduleMap[moduleName] = (moduleMap[moduleName] || 0) + 1
      }
    })

    // Count blocked/overdue screens per module
    filteredScreens.forEach(screen => {
      const isOverdue = screen.plannedDeadline && new Date(screen.plannedDeadline) < now && screen.status !== 'Done'
      if (screen.status === 'Blocked' || isOverdue) {
        const moduleName = screen.module || 'General'
        moduleMap[moduleName] = (moduleMap[moduleName] || 0) + 1
      }
    })

    return Object.entries(moduleMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value) // Sort for Pareto
  }, [filteredBugs, filteredScreens])

  // Dashboard summary metrics
  const summary = useMemo(() => ({
    total: filteredProjects.length,
    running: filteredProjects.filter(p => ['Active', 'Running'].includes(p.status)).length,
    completed: filteredProjects.filter(p => ['Completed', 'Done'].includes(p.status)).length,
    onHold: filteredProjects.filter(p => p.status === 'On Hold').length,
    maintenance: filteredProjects.filter(p => p.status === 'Maintenance').length,
    openBugs: filteredProjects.reduce((acc, p) => {
      if (user.role === 'admin') return acc + (p.openBugsCount || 0)
      if (user.role === 'developer') return acc + (p.userOpenBugsCount ?? (p.openBugsCount || 0))
      if (user.role === 'tester') return acc + (p.userCreatedBugsCount ?? (p.openBugsCount || 0))
      return acc + (p.openBugsCount || 0)
    }, 0),
    upcomingDeadlines: filteredProjects.reduce((acc, p) => acc + (p.upcomingDeadlines || 0), 0)
  }), [filteredProjects, user.role])

  // Status Chart Data
  const statusChartData = useMemo(() => {
    const statusMap = {}
    filteredProjects.forEach(p => {
      let mappedStatus = p.status || 'Unknown'
      if (['Active', 'Running'].includes(p.status)) mappedStatus = 'Running'
      if (['Planning', 'Under Planning'].includes(p.status)) mappedStatus = 'Planning'
      statusMap[mappedStatus] = (statusMap[mappedStatus] || 0) + 1
    })
    
    const entries = Object.entries(statusMap)
    return {
      labels: entries.map(([status]) => status),
      values: entries.map(([, count]) => count),
      hasData: entries.length > 0 && entries.some(([, count]) => count > 0)
    }
  }, [filteredProjects])

  // Bug Trend Chart Formatting
  const bugTrendData = useMemo(() => {
    const categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const series = [{
      name: 'Open Bugs',
      data: categories.map((_, index) => {
        const monthData = bugTrend.find(d => d.month === index + 1)
        return monthData ? monthData.count : 0
      })
    }]
    const hasData = series[0].data.some(val => val > 0);
    const totalBugs = series[0].data.reduce((a, b) => a + b, 0);
    return { categories, series, hasData, totalBugs }
  }, [bugTrend])

  // Project Progress Data for charts
  const projectProgressData = useMemo(() => {
    const counts = {
      Planning: filteredProjects.filter(p => ['Planning', 'Under Planning'].includes(p.status)).length,
      Running: filteredProjects.filter(p => ['Active', 'Running'].includes(p.status)).length,
      OnHold: filteredProjects.filter(p => p.status === 'On Hold').length,
      Critical: filteredProjects.filter(p => p.status === 'Critical').length
    }

    return Object.entries(counts).map(([name, count]) => ({
      name,
      data: [count, count, count, count] // Dummy data for visualization if needed
    }))
  }, [filteredProjects])
  const projectProgressCategories = ['Q1', 'Q2', 'Q3', 'Q4']
  const hasProgressData = projects.length > 0

  const hasIssuesData = projectIssuesData.length > 0 && projectIssuesData.some(d => d.value > 0)

  const currentYear = new Date().getFullYear();

  if (loading) {
    return <Loader message="Loading dashboard data..." />
  }

  const { categories: bugTrendCategories, series: bugTrendSeries, hasData: hasTrendData, totalBugs: currentTotalBugs } = bugTrendData;
  const { labels: statusLabels, values: statusValues, hasData: hasStatusData } = statusChartData;
  const displayYear = selectedYear;

  return (
    <div className="flex flex-col gap-6">
      {/* Dashboard Header & Year Selector */}
      <PageHeader
        title="Dashboard Overview"
        subtitle={<>Tracking projects and performance for {selectedYear}</>}
        actions={(
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
        )}
      />

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
