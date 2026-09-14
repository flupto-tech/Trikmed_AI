'use client'
import dynamic from 'next/dynamic'
const Page = dynamic(() => import('../../src/screens/dashboard/DashboardHome'), { ssr: false })
export default Page
