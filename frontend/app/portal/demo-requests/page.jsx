'use client'
import dynamic from 'next/dynamic'
const Page = dynamic(() => import('../../../src/screens/portal/DemoRequestsList'), { ssr: false })
export default Page
