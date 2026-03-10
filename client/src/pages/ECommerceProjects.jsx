import React from 'react'
import Lottie from 'lottie-react'
import underDevData from '../../public/assets/img/illustrations/under_dev.json'
import { Card, CardBody, PageHeader } from '../components/TailAdminComponents'
import PageContainer from '../components/layout/PageContainer'

export default function ECommerceProjects() {
  return (
    <PageContainer>
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="E-Commerce Projects"
        subtitle="Manage and track e-commerce projects"
      />
      

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
    </PageContainer>
  )
}
