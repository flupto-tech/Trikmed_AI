'use client'
import dynamic from 'next/dynamic'
const Page = dynamic(() => import('../../../src/screens/portal/ZoneManagerDash'), { ssr: false })
export default Page
