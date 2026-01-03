import React from 'react'
import Lottie from 'lottie-react'
import underDevData from '../../public/assets/img/illustrations/under_dev.json'
import { Card, CardBody } from '../components/TailAdminComponents'

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
            <div className="mb-6 w-full max-w-[400px]">
              <Lottie animationData={underDevData} loop={true} />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-slate-800 dark:text-white">
              Under Development
            </h3>
            <p className="max-w-md text-lg text-slate-500 dark:text-slate-400">
              The E-Commerce Projects management module is currently being built. 
              Please check back soon for updates.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
