'use client'
import dynamic from 'next/dynamic'
const Page = dynamic(() => import('../../../src/screens/portal/SuperAdminDash'), { ssr: false })
export default Page
