'use client'
import dynamic from 'next/dynamic'
const Page = dynamic(() => import('../../../src/screens/dashboard/QueueScreen'), { ssr: false })
export default Page
