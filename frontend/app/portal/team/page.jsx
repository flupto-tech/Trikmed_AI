'use client'
import dynamic from 'next/dynamic'
const Page = dynamic(() => import('../../../src/screens/portal/TeamManagement'), { ssr: false })
export default Page
