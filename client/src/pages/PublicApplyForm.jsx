import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { Card, CardBody, Button, Badge } from '../components/TailAdminComponents'
import { InputGroup } from '../components/FormComponents'
import { ArrowLeft, Send, User, Mail, FileText, CheckCircle2 } from 'lucide-react'
import { handleApiResponse } from '../utils/errorHandler'
import toast from 'react-hot-toast'

export default function PublicApplyForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    resumeUrl: '' // In a real app, this would be a file upload
  })

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/jobs/${id}/public`)
        const data = await handleApiResponse(res)
        setJob(data)
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch job:', e)
        }
        toast.error('Job post not found')
        navigate('/careers/jobs')
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [id, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/applications/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          jobId: id
        })
      })
      await handleApiResponse(res)
      setSubmitted(true)
      toast.success('Application submitted successfully!')
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error('Submission failed:', e)
      }
      toast.error('Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12 border-none shadow-xl ring-1 ring-slate-200">
          <CardBody>
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Application Received!</h2>
            <p className="text-slate-600 mb-8">
              Thank you for applying for the <strong>{job?.title}</strong> position. 
              Our team will review your application and get back to you soon.
            </p>
            <Link to="/careers/jobs">
              <Button variant="primary" className="w-full">
                Back to Job Board
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/careers/jobs" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to all jobs
        </Link>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="indigo" size="sm">{job?.type}</Badge>
            <span className="text-slate-400 text-sm font-medium">{job?.location}</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Apply for {job?.title}</h1>
        </div>

        <Card className="shadow-xl border-none ring-1 ring-slate-200">
          <CardBody className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <InputGroup
                label="Full Name"
                placeholder="John Doe"
                icon={<User size={18} />}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
              <InputGroup
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                icon={<Mail size={18} />}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <InputGroup
                label="Resume URL"
                placeholder="https://dropbox.com/my-resume.pdf"
                icon={<FileText size={18} />}
                value={form.resumeUrl}
                onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })}
                required
                subtitle="Please provide a link to your resume (Google Drive, Dropbox, etc.)"
              />
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-bold shadow-lg shadow-indigo-100 group"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : (
                    <>
                      Submit Application <Send size={18} className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
              <p className="text-center text-xs text-slate-400">
                By submitting this form, you agree to our privacy policy and terms of service.
              </p>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
