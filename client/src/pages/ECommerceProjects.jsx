import React from 'react'
import { Card, CardBody } from '../components/TailAdminComponents'
import { BarChart3 } from 'lucide-react'

export default function ECommerceProjects() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          E-Commerce Projects
        </h2>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20">
              <BarChart3 size={40} />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-800 dark:text-white">
              Under Development
            </h3>
            <p className="max-w-md text-slate-500 dark:text-slate-400">
              The E-Commerce Projects management module is currently being built. 
              Please check back soon for updates.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
