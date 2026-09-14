'use client'
import dynamic from 'next/dynamic'
const Page = dynamic(() => import('../../../src/screens/dashboard/MissedCalls'), { ssr: false })
export default Page
