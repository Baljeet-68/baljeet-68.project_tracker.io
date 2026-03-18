import React, { useState, useEffect } from 'react'
import PageContainer from '../components/layout/PageContainer'
import { Card, CardHeader, CardBody } from '../components/TailAdminComponents'
import { BarChart, LineChart, PieChart } from '../components/ChartComponents'
import { authFetch } from '../auth'
import { API_BASE_URL } from '../apiConfig'
import { handleError, handleApiResponse } from '../utils/errorHandler'
import { Loader } from '../components/Loader'

export default function Reports() {
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/reports`)
        const data = await handleApiResponse(res)
        setReportData(data)
      } catch (e) {
        handleError(e)
      } finally {
        setLoading(false)
      }
    }
    fetchReportData()
  }, [])

  if (loading) {
    return <Loader message="Generating reports..." />
  }

  if (!reportData) {
    return (
      <PageContainer title="Reports & Analytics">
        <div className="text-center py-20">
          <p className="text-slate-500">Could not load report data.</p>
        </div>
      </PageContainer>
    )
  }

  const { completionRate, bugTrend, leaveUtilization, developerWorkload } = reportData

  return (
    <PageContainer title="Reports & Analytics">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>Project Completion Rate Over Time</CardHeader>
          <CardBody>
            <LineChart 
              series={completionRate.series}
              categories={completionRate.categories}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Bug Trend</CardHeader>
          <CardBody>
            <BarChart 
              series={bugTrend.series}
              categories={bugTrend.categories}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Leave Utilization by Department</CardHeader>
          <CardBody>
            <PieChart 
              series={leaveUtilization.series}
              labels={leaveUtilization.labels}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Developer Workload Heatmap</CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <div className="min-w-[400px]">
                <div className="flex mb-2">
                  <div className="w-24"></div>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                    <div key={day} className="flex-1 text-center text-[10px] font-bold text-slate-400 uppercase">{day}</div>
                  ))}
                </div>
                {developerWorkload.data.reduce((acc, curr) => {
                  if (!acc[curr.y]) acc[curr.y] = []
                  acc[curr.y].push(curr)
                  return acc
                }, Object.create(null)) && Object.entries(developerWorkload.data.reduce((acc, curr) => {
                  if (!acc[curr.y]) acc[curr.y] = []
                  acc[curr.y].push(curr)
                  return acc
                }, Object.create(null))).map(([devName, days]) => (
                  <div key={devName} className="flex items-center mb-1">
                    <div className="w-24 text-xs font-bold text-slate-600 truncate pr-2">{devName}</div>
                    <div className="flex-1 flex gap-1">
                      {days.map((day, idx) => {
                        const intensity = Math.min(day.v * 10, 100)
                        const bgColor = intensity === 0 ? 'bg-slate-100' : 
                                      intensity < 30 ? 'bg-indigo-100' :
                                      intensity < 60 ? 'bg-indigo-300' :
                                      intensity < 90 ? 'bg-indigo-500' : 'bg-indigo-700'
                        return (
                          <div 
                            key={idx} 
                            className={`flex-1 h-8 rounded-md ${bgColor} transition-all hover:scale-105 cursor-pointer`}
                            title={`${devName} on ${day.x}: ${day.v} units`}
                          ></div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </PageContainer>
  )
}
