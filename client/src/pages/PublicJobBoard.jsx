import React, { useEffect, useState } from 'react'
import { API_BASE_URL } from '../apiConfig'
import { Card, CardBody, Badge, Button } from '../components/TailAdminComponents'
import { Briefcase, MapPin, Clock, DollarSign, ArrowRight } from 'lucide-react'
import { handleApiResponse } from '../utils/errorHandler'
import DOMPurify from 'dompurify'
import { Link } from 'react-router-dom'

export default function PublicJobBoard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPublicJobs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/jobs/public`)
        const data = await handleApiResponse(res)
        setJobs(data.filter(j => j.status === 'active'))
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch public jobs:', e)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchPublicJobs()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Join Our Team</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Explore our current job openings and find your next career opportunity with us.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : jobs.length === 0 ? (
          <Card className="text-center py-20">
            <CardBody>
              <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">No active openings</h3>
              <p className="text-slate-500">Check back later for new opportunities!</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-6">
            {jobs.map(job => (
              <Card key={job.id} className="hover:shadow-lg transition-all duration-300 border-none ring-1 ring-slate-200">
                <CardBody className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="indigo" size="sm">{job.type}</Badge>
                        <span className="text-slate-300">|</span>
                        <div className="flex items-center text-slate-500 text-xs font-medium uppercase tracking-wider">
                          <MapPin size={14} className="mr-1" /> {job.location || 'Remote'}
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-4">{job.title}</h2>
                      <div 
                        className="text-slate-600 text-sm line-clamp-3 mb-6 prose prose-slate max-w-none"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.description) }}
                      />
                      <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-medium">
                        <div className="flex items-center">
                          <DollarSign size={16} className="mr-1.5 text-slate-400" />
                          {job.salary || 'Competitive Pay'}
                        </div>
                        <div className="flex items-center">
                          <Clock size={16} className="mr-1.5 text-slate-400" />
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Link to={`/careers/apply/${job.id}`}>
                        <Button className="w-full md:w-auto group shadow-md shadow-indigo-100">
                          Apply Now <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
